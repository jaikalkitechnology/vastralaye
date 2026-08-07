# admin_dashboard.py
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from pydantic import BaseModel, constr, conint
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.models.order import Order
from app.models import User
from app.models.user import SupportMessage
from app.database import get_db
from app.mail import send_email
from app.authentication import get_current_admin_user
from app.schemas.order import OrderOut

router = APIRouter(
    prefix="/api/v1/admin/dashboard",
    tags=["Admin Dashboard"]
)

# Allowed statuses for orders (adjust as your system defines)
ALLOWED_ORDER_STATUSES = {"pending", "processing", "shipped", "delivered", "cancelled", "refunded"}

# Pagination defaults / limits
DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 200

# -------------------------
# Request models
# -------------------------
class UpdateOrderStatusRequest(BaseModel):
    status: constr(strip_whitespace=True, min_length=1, max_length=50)

class ReplySupportRequest(BaseModel):
    reply: constr(strip_whitespace=True, min_length=1, max_length=2000)

# -------------------------
# Helpers
# -------------------------
def validate_page_params(page: int, page_size: int):
    if page < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="page must be >= 1")
    if page_size < 1 or page_size > MAX_PAGE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"page_size must be between 1 and {MAX_PAGE_SIZE}")

# -----------------------------------------------------
# 📊 DASHBOARD METRICS
# -----------------------------------------------------
@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), admin=Depends(get_current_admin_user)):
    """Return key business metrics for the admin dashboard"""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    # coalesce sum to 0.0 when there are no orders or nulls
    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar() or 0.0
    avg_order_value = (total_revenue / total_orders) if total_orders > 0 else 0.0

    return {
        "total_users": int(total_users),
        "total_orders": int(total_orders),
        "total_revenue": round(float(total_revenue), 2),
        "average_order_value": round(float(avg_order_value), 2)
    }

# -----------------------------------------------------
# 🧾 ORDER MANAGEMENT
# -----------------------------------------------------
@router.get("/orders", response_model=List[OrderOut])
def list_all_orders(
    page: int = Query(DEFAULT_PAGE, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """Admin can view all orders (paginated)."""
    validate_page_params(page, page_size)
    offset = (page - 1) * page_size
    orders = db.query(Order).order_by(Order.created_at.desc()).offset(offset).limit(page_size).all()
    return orders

@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    payload: UpdateOrderStatusRequest = Body(...),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """Admin can update order status (validated)."""
    # validate order exists
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    new_status = payload.status.strip().lower()
    if new_status not in ALLOWED_ORDER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed values: {', '.join(sorted(ALLOWED_ORDER_STATUSES))}"
        )

    # Optional: Add rules preventing certain transitions (example)
    # e.g., if order already delivered/refunded/cancelled, don't change
    if order.status in {"delivered", "refunded", "cancelled"} and new_status != order.status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot change status from '{order.status}' to '{new_status}'."
        )

    order.status = new_status
    # optional: record last updated timestamp if model supports it
    if hasattr(order, "updated_at"):
        try:
            order.updated_at = datetime.utcnow()
        except Exception:
            pass

    db.commit()

    # Attempt to notify the customer by email (best-effort)
    notified = False
    if getattr(order, "user", None) and getattr(order.user, "email", None):
        try:
            send_email(
                to_email=order.user.email,
                subject=f"Order #{order.id} Status Update",
                body=f"Your order status has been updated to '{new_status.upper()}'."
            )
            notified = True
        except Exception:
            # Swallow email errors to avoid failing the API call
            notified = False

    return {
        "message": f"Order #{order.id} status updated to '{new_status}'.",
        "notified": bool(notified),
        "order_id": order.id,
        "status": new_status
    }

# -----------------------------------------------------
# 💬 CUSTOMER SUPPORT MANAGEMENT
# -----------------------------------------------------
@router.get("/support")
def list_support_messages(
    page: int = Query(DEFAULT_PAGE, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """List all support messages (paginated)."""
    validate_page_params(page, page_size)
    offset = (page - 1) * page_size
    messages = db.query(SupportMessage).order_by(SupportMessage.created_at.desc()).offset(offset).limit(page_size).all()
    return [
        {
            "id": msg.id,
            "user_id": msg.user_id,
            "subject": msg.subject,
            "message": msg.message,
            "created_at": msg.created_at.isoformat() if getattr(msg, "created_at", None) else None
        }
        for msg in messages
    ]

@router.post("/support/reply/{message_id}")
def reply_support_message(
    message_id: int,
    payload: ReplySupportRequest = Body(...),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """Reply to a user support message (validated)."""
    # validate length was already done by Pydantic; enforce message exists
    msg = db.query(SupportMessage).filter(SupportMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support message not found")

    # find user and email
    user = db.query(User).filter(User.id == msg.user_id).first()
    if not user or not getattr(user, "email", None):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Associated user not found or email missing")

    reply_text = payload.reply.strip()
    if not reply_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reply cannot be empty")

    # Send email (best-effort). If sending fails, return a warning but do not crash.
    try:
        send_email(
            to_email=user.email,
            subject=f"Reply to your support ticket #{msg.id}",
            body=reply_text
        )
    except Exception as exc:
        # log exception if you have logging, here we return informative message
        return {
            "message": f"Failed to send reply email to {user.email}. Error: {str(exc)}",
            "sent": False
        }

    # Optionally: record admin reply in DB if SupportMessage model has reply fields
    if hasattr(msg, "admin_reply") and hasattr(msg, "replied_at"):
        try:
            msg.admin_reply = reply_text
            msg.replied_at = datetime.utcnow()
            db.commit()
        except Exception:
            db.rollback()

    return {"message": f"Reply sent to {user.email}", "sent": True}
