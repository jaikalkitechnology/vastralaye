from http.client import HTTPException

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from datetime import timedelta

from app.models.models import WalletTransaction, AstrologerDetail, User
from app.utils.database import get_db

router = APIRouter()


def format_duration(seconds: float) -> str:
    if not seconds or seconds < 0:
        return "00:00:00"
    seconds = int(seconds)
    h, r = divmod(seconds, 3600)
    m, s = divmod(r, 60)
    return f"{h:02}:{m:02}:{s:02}"


# ======================================================
# ✅ 1️⃣ Astrologer Transactions
# ======================================================
@router.get("/wallet/transactions/astrologer/{astro_id}")
def get_astrologer_transactions(
    astro_id: str,
    db: Session = Depends(get_db)
):
    # 🔹 Resolve astrologer → user_id
    astro = db.query(AstrologerDetail).filter(
        AstrologerDetail.astro_id == astro_id
    ).first()

    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    astrologer_user_id = astro.user_id  # ✅ IMPORTANT

    transactions = (
        db.query(WalletTransaction)
        .filter(WalletTransaction.to_user_id == astrologer_user_id)
        .order_by(WalletTransaction.created_at.desc())
        .all()
    )

    result = []

    for txn in transactions:
        # 🔹 Resolve sender name
        sender_name = "Unknown"

        user = db.query(User).filter(User.id == txn.from_user_id).first()
        if user:
            sender_name = user.name
        else:
            sender_astro = db.query(AstrologerDetail).filter(
                AstrologerDetail.user_id == txn.from_user_id
            ).first()
            if sender_astro:
                sender_name = sender_astro.name

        # 🔹 Duration (only for call/chat)
        if txn.transaction_type in ("chat", "audio_call", "video_call"):
            duration_seconds = (
                (txn.updated_at - txn.created_at).total_seconds()
                if txn.updated_at else 0
            )
            duration = format_duration(duration_seconds)
        else:
            duration = "00:00:00"

        result.append({
            "id": txn.id,
            "amount": txn.amount,
            "transactionType": txn.transaction_type,
            "status": txn.status,
            "isCredit": txn.is_credit,
            "created_at": txn.created_at,
            "userName": sender_name,
            "duration": duration
        })

    return result



# ======================================================
# ✅ 2️⃣ User Transactions
# ======================================================
@router.get("/wallet/transactions/user/{user_id}")
def get_wallet_transactions(
    user_id: str,
    db: Session = Depends(get_db)
):
    transactions = (
        db.query(WalletTransaction)
        .filter(
            or_(
                WalletTransaction.from_user_id == user_id,
                WalletTransaction.to_user_id == user_id
            )
        )
        .order_by(WalletTransaction.created_at.desc())
        .all()
    )

    result = []

    for txn in transactions:
        # 🔹 Find the OTHER party
        other_user_id = (
            txn.to_user_id if txn.from_user_id == user_id else txn.from_user_id
        )

        other_name = "Unknown"

        user = db.query(User).filter(User.id == other_user_id).first()
        if user:
            other_name = user.name
        else:
            astro = db.query(AstrologerDetail).filter(
                AstrologerDetail.user_id == other_user_id
            ).first()
            if astro:
                other_name = astro.name

        # 🔹 Duration
        if txn.transaction_type in ("chat", "audio_call", "video_call"):
            duration_seconds = (
                (txn.updated_at - txn.created_at).total_seconds()
                if txn.updated_at else 0
            )
            duration = format_duration(duration_seconds)
        else:
            duration = "00:00:00"

        result.append({
            "id": txn.id,
            "amount": txn.amount,
            "transactionType": txn.transaction_type,
            "status": txn.status,
            "isCredit": txn.is_credit,
            "created_at": txn.created_at,
            "userName": other_name,
            "duration": duration
        })

    return result



