import json
from typing import Optional, Any, Dict

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import firebase_admin
from firebase_admin import credentials, messaging
import os
import traceback
from datetime import datetime

from app.models.notification import Notification
from app.utils.database import get_db
from app.models.models import User,CustomerDetail

router = APIRouter()

# 🔥 Firebase Initialization (Single App)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIREBASE_PATH = os.path.join(BASE_DIR, "config", "firebase_customer.json")

if not os.path.exists(FIREBASE_PATH):
    raise FileNotFoundError(f"Firebase credentials file not found at {FIREBASE_PATH}")

if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(FIREBASE_PATH)
        firebase_admin.initialize_app(cred)   # ← no name (single app)
    except Exception as e:
        raise RuntimeError(f"Failed to initialize Firebase app: {str(e)}")


# 📍 Request Models
class RegisterCustomerToken(BaseModel):
    user_id: str
    fcm_token: str


class SendCustomerNotification(BaseModel):
    user_id: str
    title: Optional[str] = None
    body: Optional[str] = None
    type: Optional[str] = None
    screen: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


# 🔀 Default Screen Map
DEFAULT_SCREEN_MAP = {
    "NEW_CHAT_MESSAGE": "chat_screen",
    "ORDER_STATUS": "home",
    "WALLET_UPDATE": "wallet_screen",
    "WALLET_DEBIT": "wallet_screen",
    "WALLET_CREDIT": "wallet_screen",
    "PROMO": "offer_screen",
    "GENERAL": "home"
}


# ✅ API 1: Register FCM Token (both tables)
@router.post("/register-token")
def register_customer_token(payload: RegisterCustomerToken, db: Session = Depends(get_db)):

    if not payload.fcm_token:
        raise HTTPException(status_code=400, detail="fcm_token is required")

    # Update User table
    user = db.query(User).filter(User.id == payload.user_id).first()
    if user:
        user.fcm_token = payload.fcm_token
    else:
        raise HTTPException(status_code=404, detail="User not found")

    # Update CustomerDetails table
    customer = db.query(CustomerDetail).filter(CustomerDetail.user_id == payload.user_id).first()
    if customer:
        customer.fcm_token = payload.fcm_token
    else:
        # Optionally create a customer record if it doesn't exist
        customer = CustomerDetail(user_id=payload.user_id, fcm_token=payload.fcm_token)
        db.add(customer)

    try:
        db.commit()
        return {"success": True, "message": "FCM token saved in both User and CustomerDetails"}
    except Exception:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to save token")


# 🚀 API 2: Send Notification (check both tables)
@router.post("/send-notification")
def send_customer_notification(payload: SendCustomerNotification, db: Session = Depends(get_db)):

    # Try User table first
    user = db.query(User).filter(User.id == payload.user_id).first()
    fcm_token = user.fcm_token if user and user.fcm_token else None
    # print(f"[DEBUG] User table token: {fcm_token}")

    # If not found, try CustomerDetails table
    if not fcm_token:
        customer = db.query(CustomerDetail).filter(CustomerDetail.user_id == payload.user_id).first()
        fcm_token = customer.fcm_token if customer and customer.fcm_token else None
        # print(f"[DEBUG] CustomerDetails table token: {fcm_token}")

    if not fcm_token:
        # print("[ERROR] FCM token not found in User or CustomerDetails")
        raise HTTPException(status_code=404, detail="FCM token not found in User or CustomerDetails")

    # Decide which screen to open
    screen = payload.screen or DEFAULT_SCREEN_MAP.get(payload.type, "home")
    # print(f"[DEBUG] Notification screen: {screen}")
    # print("Firebase path:", FIREBASE_PATH)
    # print("Exists:", os.path.exists(FIREBASE_PATH))
    # Save notification to DB
    try:
        notif = Notification(
            recipient_id=payload.user_id,
            recipient_role="user",
            title=payload.title or "",
            body=payload.body or "",
            screen=screen,
            data=payload.data,
            fcm_token=fcm_token,
            is_sent=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        # print(f"[DEBUG] Notification stored with ID: {notif.id}")
    except Exception:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to store notification")

    # Prepare FCM Data
    data_map = {
        "type": payload.type or "GENERAL",
        "screen": screen,
        "notification_id": str(notif.id)
    }

    if payload.data:
        for k, v in payload.data.items():
            data_map[k] = json.dumps(v) if isinstance(v, (dict, list)) else str(v)
    # print(f"[DEBUG] FCM Data payload: {data_map}")

    # Build FCM Message
    message = messaging.Message(
        notification=messaging.Notification(
            title=payload.title or "",
            body=payload.body or ""
        ),
        data=data_map,
        token=fcm_token
    )

    try:
        response = messaging.send(message)
        notif.is_sent = True
        notif.sent_at = datetime.utcnow()
        db.commit()
        # print(f"[DEBUG] FCM sent successfully, response ID: {response}")

        return {
            "success": True,
            "notification_id": notif.id,
            "fcm_message_id": response
        }

    except Exception as e:
        db.rollback()
        # print(f"[ERROR] Failed to send FCM: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to send FCM: {str(e)}")
