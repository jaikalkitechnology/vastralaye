import hashlib

from agora_token_builder.RtcTokenBuilder import RtcTokenBuilder, Role_Attendee



from datetime import datetime, timedelta
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status,Body,Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models import models
from app.models.models import User, AgoraConfig, ChatRoom, AstrologerDetail, LiveChatMessage, LiveViewer
from app.utils import database, config
from app.utils.authenticate import get_current_user
from app.utils.database import get_db


router = APIRouter(prefix="/Admin", tags=["Admin Dashboard"])




@router.put("/verify/kyc/{astro_id}")
def verify_kyc(
    astro_id: str,
    aadhaarVerified: bool = Form(False),
    panVerified: bool = Form(False),
    bankVerified: bool = Form(False),
    db: Session = Depends(get_db)
):
    astro = db.query(AstrologerDetail).filter_by(astro_id=astro_id).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    astro.aadhaarVerified = aadhaarVerified
    astro.panVerified = panVerified
    astro.bankVerified = bankVerified
    astro.updated_at = datetime.utcnow()

    if aadhaarVerified: astro.aadhaarVerifiedAt = datetime.utcnow()
    if panVerified: astro.panVerifiedAt = datetime.utcnow()
    if bankVerified: astro.bankVerifiedAt = datetime.utcnow()

    db.commit()
    return {"message": "KYC verification updated successfully"}