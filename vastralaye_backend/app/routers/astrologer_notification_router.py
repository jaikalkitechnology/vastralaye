from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Dict, Any
import traceback, json

from firebase_admin import messaging, exceptions as firebase_exceptions

from app.models.models import AstrologerDetail
from app.models.notification import Notification
from app.utils.database import get_db
from app.utils.firebase import get_astrologer_app   # ✅ correct import

router = APIRouter()


# -------------------- Request Models --------------------
class RegisterAstroToken(BaseModel):
    astrologer_id: str
    fcm_token: str

class SendAstroNotification(BaseModel):
    astrologer_id: str
    title: Optional[str] = None
    body: Optional[str] = None
    screen: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


# -------------------- Helpers --------------------
def _clean_token(token: Optional[str]) -> str:
    return token.strip().replace("\n", "").replace("\r", "") if token else ""

def _validate_token_format(token: str) -> bool:
    return bool(token and len(token) > 20 and " " not in token)

def _build_data_map(notif: Notification, extra: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
    data_map = {
        "notification_id": str(notif.id)
    }

    if notif.screen:
        data_map["screen"] = str(notif.screen)

    if notif.data:
        try:
            parsed = notif.data if isinstance(notif.data, dict) else json.loads(str(notif.data))
            if isinstance(parsed, dict):
                for k, v in parsed.items():
                    data_map[k] = json.dumps(v) if isinstance(v, (dict, list)) else str(v)
            else:
                data_map["data"] = str(notif.data)
        except:
            data_map["data"] = str(notif.data)

    if extra:
        for k, v in extra.items():
            data_map[k] = json.dumps(v) if isinstance(v, (dict, list)) else str(v)

    return data_map


# -------------------- Save Token --------------------
@router.post("/register-token", status_code=status.HTTP_201_CREATED)
def register_astrologer_token(payload: RegisterAstroToken, db: Session = Depends(get_db)):
    clean = _clean_token(payload.fcm_token)

    if not _validate_token_format(clean):
        raise HTTPException(status_code=400, detail="Invalid FCM token format")

    astro = db.query(AstrologerDetail).filter(
        AstrologerDetail.astro_id == payload.astrologer_id,
        AstrologerDetail.isActive == True,
        AstrologerDetail.isDelete == False
    ).first()

    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    try:
        astro.fcm_token = clean
        db.commit()
        return {"success": True, "message": "FCM token saved successfully"}

    except Exception as e:
        db.rollback()
        # traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")


# -------------------- Send Notification --------------------
@router.post("/send-notification", status_code=status.HTTP_200_OK)
def send_notification(payload: SendAstroNotification, db: Session = Depends(get_db)):
    if not (payload.title or payload.body or payload.data):
        raise HTTPException(status_code=400, detail="Provide title/body or data")

    astro = db.query(AstrologerDetail).filter(
        AstrologerDetail.astro_id == payload.astrologer_id,
        AstrologerDetail.isActive == True,
        AstrologerDetail.isDelete == False
    ).first()

    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    token = _clean_token(astro.fcm_token)
    if not _validate_token_format(token):
        raise HTTPException(status_code=400, detail="Stored FCM token invalid. Re-register token.")

    # Save notification first
    try:
        notif = Notification(
            recipient_id=payload.astrologer_id,
            recipient_role="astrologer",
            title=payload.title or "",
            body=payload.body or "",
            screen=payload.screen,
            data=payload.data,
            fcm_token=token,
            is_sent=False,
            sent_at=None
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"DB save error: {str(e)}")

    # Build FCM payload
    data_map = _build_data_map(notif, extra=payload.data or {})
    message = messaging.Message(
        notification=messaging.Notification(
            title=payload.title or "",
            body=payload.body or ""
        ),
        data={k: str(v) for k, v in data_map.items()},
        token=token
    )

    # Send via Firebase
    try:
        app = get_astrologer_app()
        fcm_id = messaging.send(message, app=app)

        notif.is_sent = True
        notif.sent_at = datetime.utcnow()
        db.commit()

        return {"success": True, "fcm_message_id": fcm_id, "notification_id": notif.id}

    except firebase_exceptions.FirebaseError as fe:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Firebase error: {str(fe)}")

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Send error: {str(e)}")
