import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, case, func
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.models import SessionRequest, AstrologerDetail, UserWallet, AstrologerWallet, User, ChatRoom, india_tz
from app.schemas.astrologer import OnlineStatusUpdate
from app.utils.database import get_db
from app.utils.authenticate import get_current_user
from app.models.enums import SessionType, SessionStatus

router = APIRouter()
@router.post("/start")
def start_session(
    astrologer_id: str,
    session_type: SessionType,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "customer":
        raise HTTPException(403, "Only customers can start session")

    astrologer = db.query(AstrologerDetail).filter(
        AstrologerDetail.astro_id == astrologer_id,
        AstrologerDetail.isActive == True,
        AstrologerDetail.isDelete == False
    ).first()

    if not astrologer:
        raise HTTPException(404, "Astrologer not found")

    # 🚫 Busy check (ACTIVE only)
    busy = db.query(SessionRequest).filter(
        SessionRequest.astrologer_id == astrologer_id,
        SessionRequest.status == SessionStatus.active
    ).first()

    if busy:
        raise HTTPException(400, "Astrologer is busy")

    wallet = db.query(UserWallet).filter(
        UserWallet.user_id == current_user.id
    ).first()

    if not wallet or wallet.amount <= 0:
        raise HTTPException(400, "Insufficient wallet balance")

    # ✅ Get or create room
    room = db.query(ChatRoom).filter(
        ChatRoom.customer_user_id == current_user.id,
        ChatRoom.astrologer_user_id == astrologer.user_id
    ).first()

    if not room:
        room = ChatRoom(
            id=f"room_{uuid.uuid4().hex}",
            customer_user_id=current_user.id,
            astrologer_user_id=astrologer.user_id,
            astrologer_id=astrologer.astro_id,
            created_at=datetime.now(india_tz)
        )
        db.add(room)
        db.flush()

    # ✅ Update CURRENT room state
    room.current_session_type = session_type
    room.current_session_status = SessionStatus.active

    # ✅ Create session
    session = SessionRequest(
        room_id=room.id,
        user_id=current_user.id,
        astrologer_id=astrologer.astro_id,
        session_type=session_type,
        status=SessionStatus.active
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "message": "Session started",
        "session_id": session.id,
        "room_id": room.id,
        "session_type": session_type,
        "status": session.status
    }



@router.post("/end/{session_id}")
def end_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(SessionRequest).filter(
        SessionRequest.id == session_id
    ).first()

    if not session:
        raise HTTPException(404, "Session not found")

    # ✅ FIXED ENUM CHECK
    if session.status != SessionStatus.active:
        raise HTTPException(400, "Session already ended or invalid")

    # Fetch related room
    room = db.query(ChatRoom).filter(
        ChatRoom.id == session.room_id
    ).first()

    # End session
    session.status = SessionStatus.ended
    session.updated_at = datetime.now(india_tz)

    # Update room state
    if room:
        room.current_session_status = SessionStatus.ended
        room.current_session_type = None

    db.commit()

    return {
        "message": "Session ended successfully",
        "session_id": session.id
    }



@router.get("/astrologers/online")
def get_online_astrologers(db: Session = Depends(get_db)):

    astrologers = (
        db.query(AstrologerDetail)
        .filter(
            AstrologerDetail.isActive == True,
            AstrologerDetail.isDelete == False
        )
        .order_by(
            desc(AstrologerDetail.isOnline),  # online first
            case(
                (AstrologerDetail.isOnline == False, func.random())
            )
        )
        .all()
    )

    result = []
    for astro in astrologers:
        result.append({
            "id": astro.astro_id,
            "name": astro.name,
            "profileImage": astro.profileImage,
            "chatCharge": astro.chatCharge,
            "audioCallCharge": astro.audioCallCharge,
            "videoCallCharge": astro.videoCallCharge,
            "isOnline": astro.isOnline,
            "waitTime": astro.chatWaitTime or "15 min"
        })

    return result

@router.post("/astrologer/online-status")
def update_online_status(
    astro_id: str,
    isOnline: bool,
    db: Session = Depends(get_db)
):
    astro = db.query(AstrologerDetail).filter(AstrologerDetail.astro_id == astro_id).first()

    if not astro:
        raise HTTPException(404, "Astrologer not found")

    astro.isOnline = isOnline
    db.commit()

    return {
        "success": True,
        "astro_id": astro_id,
        "isOnline": isOnline
    }
