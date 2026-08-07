import asyncio
import os
import aiofiles
import re
from dataclasses import Field
from datetime import datetime
from typing import List, Optional, Dict
from venv import logger

from email_validator import EmailNotValidError, validate_email
from pymysql import IntegrityError
from sqlalchemy import func, desc, asc, literal_column

from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile,Request
from sqlalchemy.orm import Session
from pydantic import BaseModel,condecimal
from typing import Literal
from pathlib import Path
import shutil
import time
import uuid
import json

from app.email_config import send_otp_email
from app.routers.authenticate import OTP_EXPIRY_MINUTES
from app.schemas.wallettransaction import AdminCredentialResponse
from app.utils.authenticate import get_current_user, verify_otp, generate_otp, save_otp
from fastapi import Query
from sqlalchemy import asc, desc, or_, func, literal_column
from typing import List, Optional
from app.models.models import AstrologerDetail, User, AstrologerAvailability, AstrologerUnlockRequest, AstrologerWallet, \
    WithdrawalRequest, Banner1, UserReview, AdminCredential, WalletTransaction, AppVersion
from app.routers.admin_dashboard import save_file
from app.schemas.astrologer import AstrologerDetailResponse, WithdrawRequest, Banner1Out, WithdrawSchema
from app.utils.authenticate import get_current_user, get_current_astrologer
from app.utils.database import get_db
from app.models.models import BlockedAstrologer,AstrologerPendingChanges
from fastapi.responses import JSONResponse
router = APIRouter()

UPLOAD_DIR = Path("static/uploads/astrologers")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def save_upload_file(upload_file: UploadFile, dest_dir: Path) -> str:
    ext = Path(upload_file.filename).suffix or ""
    filename = f"{int(time.time()*1000)}_{uuid.uuid4().hex}{ext}"
    out_path = dest_dir / filename
    with out_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    try:
        upload_file.file.close()
    except:
        pass
    return str(out_path.resolve())


# ---------------- GET ALL ASTROLOGERS ----------------


@router.get("/astrologers")
def get_all_astrologers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),

    # -------- Pagination --------
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),

    # -------- Search --------
    search: Optional[str] = Query(None),

    # -------- Ordering --------
    order_by: str = Query("rating", description="rating | name | created_at | experience"),
    order_dir: str = Query("desc"),

    # -------- Filters --------
    isVerified: Optional[bool] = Query(None),
    isActive: Optional[bool] = Query(None),
    country: Optional[str] = Query(None),
    primarySkill: Optional[str] = Query(None),
):
    # ------------------------------------------------
    # Blocked astrologers
    # ------------------------------------------------
    blocked_ids = db.query(BlockedAstrologer.astrologerId).filter(
        BlockedAstrologer.customerId == current_user.id,
        BlockedAstrologer.isBlocked == True
    ).subquery()

    # ------------------------------------------------
    # Base query
    # ------------------------------------------------
    query = db.query(AstrologerDetail).filter(
        AstrologerDetail.isDelete == False,
        AstrologerDetail.astro_id.not_in(blocked_ids)
    )

    # ------------------------------------------------
    # Search
    # ------------------------------------------------
    if search:
        query = query.filter(
            or_(
                AstrologerDetail.name.ilike(f"%{search}%"),
                AstrologerDetail.email.ilike(f"%{search}%")
            )
        )

    # ------------------------------------------------
    # Filters
    # ------------------------------------------------
    if isVerified is not None:
        query = query.filter(AstrologerDetail.isVerified == isVerified)

    if isActive is not None:
        query = query.filter(AstrologerDetail.isActive == isActive)

    if country:
        query = query.filter(AstrologerDetail.country.ilike(f"%{country}%"))

    if primarySkill:
        query = query.filter(AstrologerDetail.primarySkill.ilike(f"%{primarySkill}%"))

    # ------------------------------------------------
    # Fetch ALL matching astrologers (NO pagination yet)
    # ------------------------------------------------
    astrologers = query.all()

    # ------------------------------------------------
    # Compute rating (Python)
    # ------------------------------------------------
    data = []
    for astro in astrologers:
        rating = get_overall_rating(db, astro.astro_id)

        data.append({
            "astro": astro,
            "overallRating": rating["overallRating"],
            "totalReviews": rating["totalReviews"],
        })

    # ------------------------------------------------
    # Sorting (rating supported)
    # ------------------------------------------------
    if order_by == "rating":
        data.sort(
            key=lambda x: x["overallRating"],
            reverse=(order_dir.lower() == "desc")
        )
    elif order_by == "experience":
        data.sort(
            key=lambda x: x["astro"].experienceInYears,
            reverse=(order_dir.lower() == "desc")
        )
    elif order_by == "name":
        data.sort(
            key=lambda x: x["astro"].name.lower(),
            reverse=(order_dir.lower() == "desc")
        )
    else:  # created_at
        data.sort(
            key=lambda x: x["astro"].created_at,
            reverse=(order_dir.lower() == "desc")
        )

    # ------------------------------------------------
    # Pagination AFTER sorting
    # ------------------------------------------------
    total = len(data)
    start = (page - 1) * size
    end = start + size
    paginated = data[start:end]

    # ------------------------------------------------
    # Response
    # ------------------------------------------------
    response = []
    for item in paginated:
        astro = item["astro"]
        response.append({
            "astro_id": astro.astro_id,
            "user_id": astro.user_id,
            "name": astro.name,
            "email": astro.email,
            "contactNo": astro.contactNo,

            # ⭐ Rating
            "overallRating": item["overallRating"],
            "totalReviews": item["totalReviews"],

            # INR Charges
            "chatCharge": astro.chatCharge,
            "audioCallCharge": astro.audioCallCharge,
            "videoCallCharge": astro.videoCallCharge,

            # USD Charges
            "chatChargeUSD": astro.chatChargeUSD,
            "audioCallChargeUSD": astro.audioCallChargeUSD,
            "videoCallChargeUSD": astro.videoCallChargeUSD,

            "isVerified": astro.isVerified,
            "isActive": astro.isActive,
            "experienceInYears": astro.experienceInYears,
            "primarySkill": astro.primarySkill,
            "languageKnown": astro.languageKnown,
            "country": astro.country,
            "profileImage": astro.profileImage,
            "created_at": astro.created_at,
        })
    return {
        "page": page,
        "size": size,
        "total": total,
        "total_pages": (total + size - 1) // size,
        "data": response
    }



# ---------------- GET ASTROLOGER BY ID ----------------
@router.get("/astrologers/{astro_id}")
def get_public_astrologer_profile(
    astro_id: str,
    db: Session = Depends(get_db)
):
    astro = (
        db.query(AstrologerDetail)
        .filter(AstrologerDetail.astro_id == astro_id)
        .first()
    )

    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    return astro






# ---------------- CREATE NEW ASTROLOGER ----------------



# ---------------- UPDATE ASTROLOGER ----------------


import uuid
class ChargesUpdateRequest(BaseModel):
    chatCharge: Optional[condecimal(ge=0)] = None
    audioCallCharge: Optional[condecimal(ge=0)] = None
    videoCallCharge: Optional[condecimal(ge=0)] = None

    chatChargeUSD: Optional[condecimal(ge=0)] = None
    audioCallChargeUSD: Optional[condecimal(ge=0)] = None
    videoCallChargeUSD: Optional[condecimal(ge=0)] = None

@router.patch("/astrologers/{astrologer_id}/charges")
def update_charges(
    astrologer_id: str,
    payload: ChargesUpdateRequest,
    db: Session = Depends(get_db)
):
    astro = db.query(AstrologerDetail).filter_by(astro_id=astrologer_id).first()
    if not astro:
        raise HTTPException(404, "Astrologer not found")

    updated = False

    # INR charges
    if payload.chatCharge is not None:
        astro.chatCharge = payload.chatCharge
        updated = True

    if payload.audioCallCharge is not None:
        astro.audioCallCharge = payload.audioCallCharge
        updated = True

    if payload.videoCallCharge is not None:
        astro.videoCallCharge = payload.videoCallCharge
        updated = True

    # USD charges
    if payload.chatChargeUSD is not None:
        astro.chatChargeUSD = payload.chatChargeUSD
        updated = True

    if payload.audioCallChargeUSD is not None:
        astro.audioCallChargeUSD = payload.audioCallChargeUSD
        updated = True

    if payload.videoCallChargeUSD is not None:
        astro.videoCallChargeUSD = payload.videoCallChargeUSD
        updated = True

    if not updated:
        raise HTTPException(400, "No charge fields provided")

    db.commit()
    db.refresh(astro)

    return {
        "message": "Charges updated successfully",
        "data": {
            "astro_id": astro.astro_id,
            "chatCharge": astro.chatCharge,
            "audioCallCharge": astro.audioCallCharge,
            "videoCallCharge": astro.videoCallCharge,
            "chatChargeUSD": astro.chatChargeUSD,
            "audioCallChargeUSD": astro.audioCallChargeUSD,
            "videoCallChargeUSD": astro.videoCallChargeUSD,
        }
    }

@router.put("/astrologers/{astrologer_id}/update")
async def astrologer_update(
    astrologer_id: str,

    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    contactNo: Optional[str] = Form(None),
    countryCode: Optional[str] = Form(None),
    primarySkill: Optional[str] = Form(None),
    astrologerCategoryId: Optional[str] = Form(None),
    languageKnown: Optional[str] = Form(None),
    experienceInYears: Optional[int] = Form(None),
    currentCity: Optional[str] = Form(None),
    highestQualification: Optional[str] = Form(None),
    learnAstrology: Optional[str] = Form(None),
    instaProfileLink: Optional[str] = Form(None),
    facebookProfileLink: Optional[str] = Form(None),
    linkedInProfileLink: Optional[str] = Form(None),
    youtubeChannelLink: Optional[str] = Form(None),
    websiteProfileLink: Optional[str] = Form(None),
    loginBio: Optional[str] = Form(None),
    aadhaarNumber: Optional[str] = Form(None),
    panNumber: Optional[str] = Form(None),
    bankName: Optional[str] = Form(None),
    accountNumber: Optional[str] = Form(None),
    ifscCode: Optional[str] = Form(None),
    upiId: Optional[str] = Form(None),

    aadhaarFrontImage: UploadFile | None = File(None),
    aadhaarBackImage: UploadFile | None = File(None),
    panCardImage: UploadFile | None = File(None),
    bankPassbookImage: UploadFile | None = File(None),
    cancelledChequeImage: UploadFile | None = File(None),
    bankStatementImage: UploadFile | None = File(None),
    profileImage: UploadFile | None = File(None),

    db: Session = Depends(get_db)
):
    # verify astrologer exists
    astro = db.query(AstrologerDetail).filter_by(astro_id=astrologer_id).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    # Build text and image maps from inputs (only include fields actually provided)
    text_fields = {
        "name": name, "email": email, "contactNo": contactNo, "countryCode": countryCode,
        "primarySkill": primarySkill, "astrologerCategoryId": astrologerCategoryId,
        "languageKnown": languageKnown, "experienceInYears": experienceInYears,
        "currentCity": currentCity, "highestQualification": highestQualification,
        "learnAstrology": learnAstrology, "instaProfileLink": instaProfileLink,
        "facebookProfileLink": facebookProfileLink, "linkedInProfileLink": linkedInProfileLink,
        "youtubeChannelLink": youtubeChannelLink, "websiteProfileLink": websiteProfileLink,
        "loginBio": loginBio, "aadhaarNumber": aadhaarNumber, "panNumber": panNumber,
        "bankName": bankName, "accountNumber": accountNumber, "ifscCode": ifscCode, "upiId": upiId
    }

    def is_real_change(old, new):
        if new is None:
            return False
        if isinstance(new, str) and new.strip() == "":
            return False
        return str(old) != str(new)

    provided_text_values = {}

    for field, new_value in text_fields.items():
        if new_value is None:
            continue

        old_value = getattr(astro, field, None)

        if not is_real_change(old_value, new_value):
            continue  # 🔥 skip unchanged / default values

        provided_text_values[field] = new_value

    image_inputs = {
        "aadhaarFrontImage": aadhaarFrontImage,
        "aadhaarBackImage": aadhaarBackImage,
        "panCardImage": panCardImage,
        "bankPassbookImage": bankPassbookImage,
        "cancelledChequeImage": cancelledChequeImage,
        "bankStatementImage": bankStatementImage,
        "profileImage": profileImage
    }

    # nothing provided? return 400
    if not provided_text_values and not any(image_inputs.values()):
        raise HTTPException(status_code=400, detail="No fields provided to update")

    # get/create pending row (we'll still create an unlock request)
    pending = db.query(AstrologerPendingChanges).filter_by(astrologer_id=astrologer_id).first()
    if not pending:
        pending = AstrologerPendingChanges(astrologer_id=astrologer_id)
        db.add(pending)
        db.commit()
        db.refresh(pending)

    # Save images to disk in worker thread (so we don't depend on aiofiles)
    UPLOAD_FOLDER = "static/uploads"
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    async def save_file_threadsafe(upload: UploadFile, prefix: str) -> str:
        # Basic validation: limit size and allowed content types if you want
        filename = os.path.basename(upload.filename or "upload")
        # add timestamp to reduce collisions
        safe_filename = f"{prefix}_{int(time.time())}_{filename}"
        path = os.path.join(UPLOAD_FOLDER, safe_filename)
        content = await upload.read()  # careful: reads into memory; for very large files stream in chunks
        def _write():
            with open(path, "wb") as fh:
                fh.write(content)
        await asyncio.to_thread(_write)
        return path

    provided_image_paths: Dict[str, str] = {}
    for key, file_obj in image_inputs.items():
        if file_obj is not None and file_obj.filename:

            saved = await save_file_threadsafe(file_obj, astro.astro_id)
            provided_image_paths[key] = saved
            # set into pending row (store path)
            if hasattr(pending, key):
                setattr(pending, key, saved)

    # Store provided text values into pending row (overwrite only provided fields)
    for k, v in provided_text_values.items():
        if hasattr(pending, k):
            setattr(pending, k, v)

    # Create an unlock request record that stores the proposed values (so admin can approve/deny)
    # --- prepare new_values and requested fields (you already build these) ---
    new_values = {}
    new_values.update(provided_text_values)
    new_values.update(provided_image_paths)

    # Defensive: must have something to request
    if not new_values:
        raise HTTPException(status_code=400, detail="No fields provided to create unlock request")

    requested_fields_list = list(new_values.keys())
    approved_fields_list = []  # initially empty

    # Prepare payloads for DB. If your model columns are JSON types you can pass
    # Python lists/dicts directly. If they are TEXT/VARCHAR, store JSON strings.
    # To be safe if you don't know the column types, serialize to JSON strings:
    new_values_payload = json.dumps(new_values)
    requested_fields_payload = json.dumps(requested_fields_list)
    approved_fields_payload = json.dumps(approved_fields_list)

    # Build unlock request row: include id and requested_by if you have current user
    request_id = str(uuid.uuid4())
    unlock_request = AstrologerUnlockRequest(
        id=request_id,
        astrologer_id=astrologer_id,
        requested_fields=requested_fields_payload,
        approved_fields=approved_fields_payload,
        status="pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        requested_by=None,  # set to current user id if you have auth
        new_values=new_values_payload
    )

    # Commit inside try/except so we rollback on failure
    try:
        db.add(unlock_request)
        db.commit()
        db.refresh(unlock_request)
    except Exception as e:
        db.rollback()
        # log e if you have logging
        raise HTTPException(status_code=500, detail=f"Could not create unlock request: {e}")

    # return success
    return {
        "success": True,
        "message": "Changes submitted for admin approval",
        "pending_fields": list(new_values.keys()),
        "pending_text_values": provided_text_values,
        "pending_images": list(provided_image_paths.keys()),
        "request_id": request_id
    }


#
# class UnlockRequestSchema(BaseModel):
#     fields: list[str]
#
# @router.post("/astrologers/{astro_id}/request-unlock", response_model=dict)
# def request_unlock(
#     astro_id: str,
#     payload: UnlockRequestSchema,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     user_id = current_user.id
#
#     # Check astrologer exists
#     astro = db.query(AstrologerDetail).filter(AstrologerDetail.astro_id == astro_id).first()
#     if not astro:
#         raise HTTPException(status_code=404, detail="Astrologer not found")
#
#     # Check already pending request
#     asked = db.query(AstrologerUnlockRequest).filter(
#         AstrologerUnlockRequest.astrologer_id == astro_id,
#         AstrologerUnlockRequest.status == "pending"
#     ).first()
#
#     if asked:
#         return {
#             "message": "Request already sent to Admin for approval.",
#             "requested_fields": asked.requested_fields.split(","),
#             "status": asked.status,
#             "request_id": asked.id
#         }
#
#     # Create new request with ID
#     unlock = AstrologerUnlockRequest(
#         id=str(uuid.uuid4()),  # <-- ADD request ID
#         astrologer_id=astro_id,
#         requested_fields=",".join(payload.fields),
#         requested_by=user_id,
#         status="pending"
#     )
#     db.add(unlock)
#     db.commit()
#     db.refresh(unlock)
#
#     return {
#         "message": "Request sent to Admin for approval.",
#         "requested_fields": payload.fields,
#         "status": "pending",
#         "request_id": unlock.id  # <-- return request ID
#     }




@router.get("/get_active_credentials", response_model=List[AdminCredentialResponse])
def get_active_credentials(db: Session = Depends(get_db)):
    return (
        db.query(AdminCredential)
        .filter(AdminCredential.is_active == True)
        .all()
    )



@router.post("/wallet/request")
def request_withdraw(
    payload: WithdrawSchema,
    astro_id: str = Depends(get_current_astrologer),
    db: Session = Depends(get_db)
):
    try:
        # 🔒 Lock Wallet Row
        wallet = (
            db.query(AstrologerWallet)
            .filter(AstrologerWallet.astrologer_id == astro_id)
            .with_for_update()
            .first()
        )

        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")

        if wallet.amount < payload.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        # 🚫 Check Pending Request
        existing = db.query(WithdrawalRequest).filter(
            WithdrawalRequest.astrologer_id == astro_id,
            WithdrawalRequest.status == "pending"
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Pending withdrawal already exists")

        # 🧮 CALCULATION
        platform_percent = 30
        platform_amount = payload.amount * 0.30

        remaining = payload.amount - platform_amount

        tds_percent = 10
        tds_amount = remaining * 0.10

        payable_amount = remaining - tds_amount

        # 💰 Move to blocked amount
        wallet.amount -= payload.amount
        wallet.blocked_amount += payload.amount

        withdrawal = WithdrawalRequest(
            astrologer_id=astro_id,
            amount=payload.amount,
            platform_percent=platform_percent,
            platform_amount=platform_amount,
            tds_percent=tds_percent,
            tds_amount=tds_amount,
            payable_amount=payable_amount,
            status="pending"
        )

        db.add(withdrawal)

        # 🧾 Ledger entry
        db.add(WalletTransaction(
            amount=payload.amount,
            astrologer_amount=payable_amount,
            transaction_type="withdraw_request",
            is_credit=False,
            status="pending",
            reason="Withdrawal Request",
            to_user_id=None,
            from_user_id=None
        ))

        db.commit()
        db.refresh(withdrawal)

        return {
            "message": "Withdrawal request submitted",
            "withdrawal_id": withdrawal.id,
            "payable_amount": payable_amount
        }

    except:
        db.rollback()
        raise

@router.get("/withdrawals", response_model=Dict)
def get_withdrawal_list(
    astrologer_id: str = Depends(get_current_astrologer),
    db: Session = Depends(get_db),

    # Pagination
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),

    # Filtering
    status: Optional[str] = Query(None, description="pending | approved | rejected"),

    # Ordering
    order_by: str = Query("created_at", description="created_at | amount | status"),
    order_dir: str = Query("desc", description="asc | desc"),
):
    query = db.query(WithdrawalRequest).filter(
        WithdrawalRequest.astrologer_id == astrologer_id
    )

    # -------- Filter ----------`
    if status:
        query = query.filter(WithdrawalRequest.status == status)

    # -------- Order By --------
    order_map = {
        "created_at": WithdrawalRequest.created_at,
        "amount": WithdrawalRequest.amount,
        "status": WithdrawalRequest.status,
    }

    column = order_map.get(order_by, WithdrawalRequest.created_at)

    if order_dir.lower() == "asc":
        query = query.order_by(asc(column))
    else:
        query = query.order_by(desc(column))

    # -------- Pagination --------
    total = query.count()

    withdrawals = (
        query
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    data = [
        {
            "id": w.id,
            "amount": w.amount,
            "tds_percent": w.tds_percent,
            "payable_amount": w.payable_amount,
            "status": w.status,
            "created_at": w.created_at,
        }
        for w in withdrawals
    ]

    return {
        "page": page,
        "size": size,
        "total": total,
        "total_pages": (total + size - 1) // size,
        "data": data,
    }

def get_overall_rating(db: Session, astro_id: str):
    avg_rating, total = db.query(
        func.avg(UserReview.rating),
        func.count(UserReview.id)
    ).filter(
        UserReview.astrologerId == astro_id,
        UserReview.isDelete == False,
        UserReview.isActive == True
    ).first()

    return {
        "overallRating": round(avg_rating, 1) if avg_rating else 0,
        "totalReviews": total
    }

@router.get("/astrologers/{astro_id}/reviews")
def get_astrologer_reviews(
    astro_id: str,
    db: Session = Depends(get_db)
):
    reviews = db.query(UserReview).filter(
        UserReview.astrologerId == astro_id,
        UserReview.isDelete == False,
        UserReview.isActive == True
    ).order_by(UserReview.created_at.desc()).all()

    return reviews









class ChoosePayout(BaseModel):
    payout_method: Literal["bank", "upi"]

@router.put("/withdraw/{withdraw_id}/method", dependencies=[Depends(get_current_astrologer)])
def choose_method(
    withdraw_id: str,
    payload: ChoosePayout,
    astro_id: str = Depends(get_current_astrologer),
    db: Session = Depends(get_db)
):
    withdrawal = db.query(WithdrawalRequest).filter(
        WithdrawalRequest.id == withdraw_id,
        WithdrawalRequest.astrologer_id == astro_id
    ).first()

    if not withdrawal or withdrawal.status != "approved":
        raise HTTPException(400, "Cannot choose method now")

    withdrawal.payout_method = payload.payout_method

    # Deduct balance from wallet
    wallet = db.query(AstrologerWallet).filter(AstrologerWallet.astrologer_id == astro_id).first()
    if not wallet or wallet.amount < withdrawal.payable_amount:
        raise HTTPException(400, "Not enough balance in wallet")

    wallet.amount -= withdrawal.payable_amount

    db.commit()
    db.refresh(withdrawal)
    db.refresh(wallet)

    return {
        "message": "Withdrawal successful. Payout method set.",
        "withdrawal_id": withdrawal.id,
        "amount": withdrawal.amount,
        "payable_amount": withdrawal.payable_amount,
        "status": withdrawal.status,
        "payout_method": withdrawal.payout_method,
        "remaining_wallet_balance": wallet.amount
    }


@router.get("/home-banner", response_model=List[Banner1Out])
def list_banners(db: Session = Depends(get_db)):
    return db.query(Banner1).order_by(Banner1.created_at.desc()).all()



@router.get("/app-version")
def get_app_version(db: Session = Depends(get_db)):

    version = db.query(AppVersion).first()

    if not version:
        raise HTTPException(status_code=404, detail="App version not set")

    return {
        "android_min_build": version.android_min_build,
        "ios_min_build": version.ios_min_build,
        "force_update": version.force_update,
        "update_message": version.update_message,
        "play_store_url": version.play_store_url,
        "app_store_url": version.app_store_url,
    }