"""Admin › Payment Integration.

Gateway credentials, the webhook endpoint the gateway should call, and a
read-only view of recent online payment activity.

Secrets are never returned in full: `token_id` and `secret_key` come back
masked, and an empty string on save means "leave the stored value alone".
"""

import os
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.authentication import get_current_admin_user
from app.database import get_db
from app.models import Order, User
from app.models.payment_gateway import PaymentGatewayCredential, PaymentLog

router = APIRouter(prefix="/api/v1/admin", tags=["Payment Integration"])

# One row per gateway; the storefront only talks to this one today.
DEFAULT_GATEWAY = "mizorpay"


def _mask(value: Optional[str]) -> str:
    """'abcd1234efgh' → '••••••••efgh' — enough to recognise, not to reuse."""
    if not value:
        return ""
    tail = value[-4:] if len(value) > 4 else ""
    return "•" * max(8, len(value) - len(tail)) + tail


def _credential_out(cred: Optional[PaymentGatewayCredential]) -> dict:
    if not cred:
        return {
            "configured": False,
            "gateway_name": DEFAULT_GATEWAY,
            "token_id_masked": "",
            "secret_key_masked": "",
            "base_url": os.getenv("PAYMENT_BASE_URL", "https://payin.mizorpay.in"),
            "endpoint_path": "/api/collection-v9-payment",
            "is_active": False,
            "has_webhook_secret": False,
            "verify_amount": False,
            "updated_at": None,
        }
    return {
        "configured": True,
        "id": cred.id,
        "gateway_name": cred.gateway_name,
        "token_id_masked": _mask(cred.token_id),
        "secret_key_masked": _mask(cred.secret_key),
        "base_url": cred.base_url,
        "endpoint_path": cred.endpoint_path,
        "is_active": bool(cred.is_active),
        "has_webhook_secret": bool(cred.webhook_secret),
        "verify_amount": bool(cred.verify_amount),
        "updated_at": cred.updated_at.isoformat() if cred.updated_at else None,
    }


def _env_fallback() -> dict:
    """What the storefront would use if no credential row exists."""
    return {
        "token_id": bool(os.getenv("PAYMENT_TOKEN_ID")),
        "secret_key": bool(os.getenv("PAYMENT_SECRET_KEY")),
        "base_url": os.getenv("PAYMENT_BASE_URL", "https://payin.mizorpay.in"),
    }


@router.get("/payment-gateway")
def get_payment_gateway(
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    cred = (
        db.query(PaymentGatewayCredential)
        .filter(PaymentGatewayCredential.gateway_name == DEFAULT_GATEWAY)
        .first()
    )
    base = str(request.base_url).rstrip("/")
    return {
        "credential": _credential_out(cred),
        "env_fallback": _env_fallback(),
        # Paste this into the gateway dashboard's webhook/callback field.
        "webhook_url": f"{base}/api/v1/webhook",
    }


@router.put("/payment-gateway")
def upsert_payment_gateway(
    token_id: Optional[str] = Form(None),
    secret_key: Optional[str] = Form(None),
    base_url: Optional[str] = Form(None),
    endpoint_path: Optional[str] = Form(None),
    webhook_secret: Optional[str] = Form(None),
    is_active: bool = Form(True),
    verify_amount: bool = Form(False),
    clear_webhook_secret: bool = Form(False),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    cred = (
        db.query(PaymentGatewayCredential)
        .filter(PaymentGatewayCredential.gateway_name == DEFAULT_GATEWAY)
        .first()
    )
    creating = cred is None
    if creating:
        cred = PaymentGatewayCredential(
            gateway_name=DEFAULT_GATEWAY,
            token_id="",
            secret_key="",
            base_url="https://payin.mizorpay.in",
            endpoint_path="/api/collection-v9-payment",
            created_by=admin.id,
        )
        db.add(cred)

    # Blank means "keep what's stored" so the masked values can be submitted back.
    if (token_id or "").strip():
        cred.token_id = token_id.strip()
    if (secret_key or "").strip():
        cred.secret_key = secret_key.strip()
    if (base_url or "").strip():
        cred.base_url = base_url.strip().rstrip("/")
    if (endpoint_path or "").strip():
        path = endpoint_path.strip()
        cred.endpoint_path = path if path.startswith("/") else f"/{path}"

    if clear_webhook_secret:
        cred.webhook_secret = None
    elif (webhook_secret or "").strip():
        cred.webhook_secret = webhook_secret.strip()

    cred.is_active = is_active
    cred.verify_amount = verify_amount
    cred.updated_by = admin.id

    if creating and not (cred.token_id and cred.secret_key):
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Token ID and Secret Key are required the first time you save.",
        )

    db.commit()
    db.refresh(cred)
    return _credential_out(cred)


@router.get("/payment-logs")
def list_payment_logs(
    limit: int = 25,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Recent online payment attempts, newest first.

    Read from `orders` rather than `payment_logs` because orders are the
    record that actually matters — and the log table only starts filling
    from the webhook going forward.
    """
    limit = max(1, min(100, limit))
    orders = (
        db.query(Order)
        .filter(Order.payment_method != "cod")
        .order_by(desc(Order.created_at))
        .limit(limit)
        .all()
    )
    rows = [
        {
            "order_id": o.id,
            "merchant_ref": o.merchant_ref,
            "txn_id": o.mizor_pay_txn_id or o.transaction_id,
            "rrn_no": o.rrn_no,
            "payment_status": o.payment_status,
            "order_status": o.status,
            "total_amount": o.total_amount,
            "paid_amount": o.paid_amount,
            "payment_date": o.payment_date.isoformat() if o.payment_date else None,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]

    unlinked = (
        db.query(Order)
        .filter(Order.payment_method != "cod", Order.merchant_ref.is_(None))
        .count()
    )
    hooks = db.query(PaymentLog).count()

    return {
        "rows": rows,
        # Online orders with no merchant_ref can never be matched by the
        # webhook — surfaced so the gap is visible rather than silent.
        "unlinked_online_orders": unlinked,
        "webhook_events_recorded": hooks,
    }
