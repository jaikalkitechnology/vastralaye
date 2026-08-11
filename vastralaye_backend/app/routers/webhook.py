from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.authentication import get_current_admin_user
from app.database import get_db
from app.models import Order, User
from app.models.payment_gateway import PaymentGatewayCredential, PaymentLog
import hmac
import json
import logging
from datetime import datetime

router = APIRouter(
    prefix="/api/v1",
    tags=["Payment Webhook"],
)

logger = logging.getLogger(__name__)

# Headers a gateway might carry the shared secret in. Whichever one Mizorpay
# is configured to send, one of these (or ?secret=) will match.
SECRET_HEADERS = ("x-webhook-secret", "x-webhook-token", "x-api-key")


def _gateway_settings(db: Session) -> PaymentGatewayCredential | None:
    return (
        db.query(PaymentGatewayCredential)
        .filter(PaymentGatewayCredential.gateway_name == "mizorpay")
        .first()
    )


def _presented_secret(request: Request) -> str:
    for header in SECRET_HEADERS:
        value = request.headers.get(header)
        if value:
            return value.strip()
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return (request.query_params.get("secret") or "").strip()


def _record_event(db: Session, merchant_ref: str, status: str, payload: dict) -> None:
    """Append-only audit row. Never allowed to break webhook handling."""
    try:
        entry = (
            db.query(PaymentLog).filter(PaymentLog.merchant_ref == merchant_ref).first()
        )
        if entry:
            entry.status = status
            entry.gateway_response = payload
        else:
            db.add(
                PaymentLog(
                    merchant_ref=merchant_ref,
                    status=status,
                    amount=payload.get("converted_amount"),
                    request_payload=payload,
                )
            )
        db.commit()
    except Exception as exc:  # pragma: no cover - audit must never be fatal
        db.rollback()
        logger.error("Could not record payment log for %s: %s", merchant_ref, exc)


@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Vastralaye payment webhook.

    Called by the Mizorpay gateway when a payin settles; the gateway's own
    field names (`mizor_pay_txn_id`, `merchant_ref`) are kept verbatim.
    """

    try:
        logger.info("=" * 80)
        logger.info("🔔 WEBHOOK RECEIVED")
        logger.info("=" * 80)

        # ---------------------------
        # 📋 Log Full Request Details
        # ---------------------------
        logger.info("📌 %s from %s (%s bytes)", request.url.path, request.client,
                    request.headers.get("content-length"))
        # Headers carry the gateway's auth token and the body carries customer
        # details, so neither is written at INFO. Turn on DEBUG to see them.
        logger.debug("📋 HEADERS: %s", dict(request.headers))

        body = await request.body()
        logger.debug("📦 RAW BODY: %s", body)

        # ---------------------------
        # 🔐 Shared secret (only enforced once one is configured)
        # ---------------------------
        settings = _gateway_settings(db)
        expected = (settings.webhook_secret or "") if settings else ""
        if expected and not hmac.compare_digest(_presented_secret(request), expected):
            logger.error("❌ Webhook rejected: shared secret missing or wrong")
            raise HTTPException(status_code=401, detail="Invalid webhook secret")

        # Check if body is empty
        if not body:
            logger.error("❌ EMPTY BODY RECEIVED!")
            logger.error("   This means Mizorpay sent an empty request")
            logger.error("   Check your webhook URL in Mizorpay dashboard")
            raise HTTPException(
                status_code=400,
                detail="Empty body received. Check your Mizorpay webhook configuration."
            )

        # ---------------------------
        # 📦 Parse JSON
        # ---------------------------
        try:
            data = json.loads(body)
            logger.info(f"✅ JSON PARSED SUCCESSFULLY")
            logger.info(f"📥 WEBHOOK DATA:\n{json.dumps(data, indent=2)}")
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON format: {e}")
            logger.error(f"   Raw body was: {body}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")

        # ---------------------------
        # 🔍 Extract Payment Data
        # ---------------------------
        payin = data.get("payin")
        if not payin:
            logger.error("❌ Missing 'payin' object")
            logger.error(f"   Available keys: {data.keys()}")
            raise HTTPException(status_code=400, detail="Missing payin object")

        # Extract fields
        merchant_ref = payin.get("merchant_ref")
        txn_status = payin.get("txn_status", "").lower().strip()
        mizor_pay_txn_id = payin.get("mizor_pay_txn_id")
        converted_amount = payin.get("converted_amount")
        rrn_no = payin.get("rrn_no")

        logger.info(f"📊 Extracted Data:")
        logger.info(f"   merchant_ref: {merchant_ref}")
        logger.info(f"   txn_status: {txn_status}")
        logger.info(f"   mizor_pay_txn_id: {mizor_pay_txn_id}")
        logger.info(f"   converted_amount: {converted_amount}")
        logger.info(f"   rrn_no: {rrn_no}")

        # ---------------------------
        # ✅ Validate Fields
        # ---------------------------
        if not merchant_ref:
            logger.error("❌ Missing merchant_ref in webhook")
            raise HTTPException(status_code=400, detail="Missing merchant_ref")

        if not mizor_pay_txn_id:
            logger.error("❌ Missing mizor_pay_txn_id in webhook")
            raise HTTPException(status_code=400, detail="Missing mizor_pay_txn_id")

        if txn_status not in ["success", "failed", "pending"]:
            # Acknowledge it — a retry would deliver the same unknown status.
            logger.error(f"❌ Unhandled txn_status: {txn_status}")
            _record_event(db, merchant_ref, f"IGNORED_{txn_status or 'BLANK'}", payin)
            return {
                "status": "ignored",
                "message": f"Unhandled txn_status: {txn_status}",
                "merchant_ref": merchant_ref,
            }

        # ---------------------------
        # 🔎 Find Order
        # ---------------------------
        logger.info(f"🔍 Looking for order with merchant_ref: {merchant_ref}")

        order = db.query(Order).filter(
            Order.merchant_ref == merchant_ref
        ).first()

        if not order:
            logger.error(f"❌ Order not found for merchant_ref: {merchant_ref}")
            raise HTTPException(status_code=404, detail="Order not found")

        logger.info(f"✅ Order found: {order.id}")

        # ---------------------------
        # 🔁 Duplicate Check
        # ---------------------------
        if order.payment_status == "paid":
            logger.warning(f"⚠️ Order already paid - Ignoring duplicate webhook")
            return {
                "status": "ignored",
                "message": "Already processed",
                "order_id": order.id
            }

        # ---------------------------
        # 💾 Update Order
        # ---------------------------
        try:
            expected_total = float(order.total_amount or 0)
            settled = float(converted_amount or 0)
            mismatch = abs(settled - expected_total) > 1.0

            if txn_status == "success" and mismatch:
                logger.error(
                    "⚠️ Amount mismatch on order %s: settled %s vs total %s",
                    order.id, settled, expected_total,
                )

            if txn_status == "success" and mismatch and settings and settings.verify_amount:
                # Held for a human rather than confirmed on a wrong amount.
                order.payment_status = "pending"
                order.is_paid = False
                logger.error("⛔ Order %s held — amount verification is on", order.id)
            elif txn_status == "success":
                order.payment_status = "paid"
                order.is_paid = True
                order.status = "confirmed"
                logger.info(f"✅ Order {order.id} marked as PAID")
            elif txn_status == "failed":
                order.payment_status = "failed"
                order.is_paid = False
                logger.warning(f"❌ Order {order.id} marked as FAILED")
            elif txn_status == "pending":
                order.payment_status = "pending"
                order.is_paid = False
                logger.info(f"⏳ Order {order.id} marked as PENDING")

            # Update transaction fields
            order.mizor_pay_txn_id = mizor_pay_txn_id
            order.merchant_ref = merchant_ref
            order.rrn_no = rrn_no
            order.paid_amount = converted_amount
            order.transaction_id = mizor_pay_txn_id
            order.payment_date = datetime.utcnow()

            db.commit()
            logger.info(f"✅ Database updated successfully")

        except Exception as db_error:
            db.rollback()
            logger.error(f"❌ Database error: {str(db_error)}")
            logger.exception(db_error)
            raise HTTPException(status_code=500, detail=str(db_error))

        # ---------------------------
        # 📤 Return Response
        # ---------------------------
        response = {
            "status": "success",
            "message": "Webhook processed",
            "order_id": order.id,
            "merchant_ref": merchant_ref,
            "payment_status": order.payment_status,
            "processed_at": datetime.utcnow().isoformat()
        }

        _record_event(db, merchant_ref, txn_status.upper(), payin)
        logger.info(f"✅ WEBHOOK PROCESSED SUCCESSFULLY")
        logger.info(f"📤 RESPONSE: {json.dumps(response, indent=2)}")
        logger.info("=" * 80)

        return response

    except HTTPException as http_exc:
        logger.error(f"❌ HTTP Error: {http_exc.detail}")
        raise http_exc

    except Exception as unexpected_error:
        logger.error(f"❌ Unexpected Error: {str(unexpected_error)}")
        logger.exception(unexpected_error)
        raise HTTPException(status_code=500, detail=str(unexpected_error))


@router.post("/webhook/test")
async def test_webhook(
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """
    🧪 Replay a webhook payload by hand. **Admin only** — it runs the real
    handler, so leaving it open would be a second way to mark orders paid.

    Send this data:
    {
        "payin": {
            "mizor_pay_txn_id": "CMZP2XXXXXXXX27h",
            "merchant_ref": "MIZORPAVZ9FZ1ACIJ",
            "txn_status": "success",
            "converted_amount": 1000,
            "rrn_no": 955111444
        }
    }
    """
    logger.info("🧪 TEST WEBHOOK CALLED")
    return await payment_webhook(request, db)