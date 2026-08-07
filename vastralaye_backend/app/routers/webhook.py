from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Order
import json
import logging
from datetime import datetime

router = APIRouter(
    prefix="/api/v1",
    tags=["Payment Webhook"],
)

logger = logging.getLogger(__name__)


@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Payment Webhook Handler for Mizorpay Payments
    """

    try:
        logger.info("=" * 80)
        logger.info("🔔 WEBHOOK RECEIVED")
        logger.info("=" * 80)

        # ---------------------------
        # 📋 Log Full Request Details
        # ---------------------------
        logger.info(f"📌 REQUEST DETAILS:")
        logger.info(f"   URL: {request.url}")
        logger.info(f"   Method: {request.method}")
        logger.info(f"   Client: {request.client}")
        logger.info(f"   Content-Type: {request.headers.get('content-type')}")
        logger.info(f"   Content-Length: {request.headers.get('content-length')}")

        # Log all headers
        logger.info(f"📋 HEADERS:")
        for key, value in request.headers.items():
            logger.info(f"   {key}: {value}")

        # ---------------------------
        # 📦 Try to Get Body
        # ---------------------------
        body = await request.body()
        logger.info(f"📦 RAW BODY SIZE: {len(body)} bytes")
        logger.info(f"📦 RAW BODY: {body}")

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
            logger.error(f"❌ Invalid txn_status: {txn_status}")
            raise HTTPException(status_code=400, detail=f"Invalid txn_status: {txn_status}")

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
            if txn_status == "success":
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
async def test_webhook(request: Request, db: Session = Depends(get_db)):
    """
    🧪 TEST YOUR WEBHOOK - Use this to test

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