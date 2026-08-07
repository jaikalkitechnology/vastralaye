import random
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from passlib.hash import bcrypt
from fastapi import APIRouter, HTTPException, Depends, Form
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from app.crud import user
from app.email_config import send_otp_email
from app.utils.mail import send_email_otp
from pydantic import BaseModel

from app.models.models import AstrologerDetail, User, AstrologerForgotPassword, CustomerDetail,LoginOTP
from app.utils.database import get_db
from app.utils.authenticate import (
    create_access_token,
    authenticate_user,
    authenticate_astro,
    get_user,
    send_otp_sms, pwd_context, get_astro, verify_password, save_otp,
)

router = APIRouter()

# OTP memory store (replace with Redis or DB in production)
otp_store = {}
OTP_EXPIRY_MINUTES = 5
MAX_OTP_ATTEMPTS = 3

# ------------------------
# Normal user login
# ------------------------
@router.post("/login")
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role
        }
    }



# ------------------------
# Send OTP (user)
# ------------------------
class SendOTPRequest(BaseModel):
    contact_no: str
    country_code: str
    send_whatsapp: bool = Form(False)
    send_sms: bool = True


import logging

logger = logging.getLogger(__name__)


@router.post("/send-otp")
def send_otp(
    contactNo: str = Form(...),
    countryCode: str = Form(...),
    send_whatsapp: bool = Form(True),
    send_sms: bool = Form(True),
    db: Session = Depends(get_db)
):
    logger.info(f"OTP request received for {countryCode}{contactNo}")

    clean_country = countryCode.replace("+", "")
    full_mobile = clean_country + contactNo

    # 1️⃣ Check user
    user = db.query(User).filter(
        User.contactNo == contactNo,
        User.countryCode == countryCode
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found. Please sign up first."
        )

    # 2️⃣ Generate OTP
    otp = str(random.randint(100000, 999999))

    # 3️⃣ Save OTP
    try:
        db.query(LoginOTP).filter(
            LoginOTP.mobile == full_mobile
        ).delete()

        record = LoginOTP(
            mobile=full_mobile,
            otp=otp,
            is_verified=False,
            expires_at=datetime.utcnow() + timedelta(minutes=5)
        )

        db.add(record)
        db.commit()

    except Exception as e:
        db.rollback()
        logger.error("DB error while saving OTP", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate OTP")

    # 4️⃣ Send OTP (SYNC — IMPORTANT)
    sms_ok = True

    if send_sms:
        sms_ok = send_otp_sms(full_mobile, otp)


    if not sms_ok and not whatsapp_ok:
        raise HTTPException(
            status_code=500,
            detail="Failed to send OTP. Please try again."
        )

    return {
        "message": "OTP sent successfully"
    }








# ------------------------
# Verify OTP (user)
# ------------------------
@router.post("/verify-otp")
def verify_otp(
    contactNo: str = Form(...),
    countryCode: str = Form(...),
    otp: str = Form(...),
    db: Session = Depends(get_db)
):
    clean_country = countryCode.replace("+", "")
    full_mobile = clean_country + contactNo  # SAME as send-otp

    # 1️⃣ Find OTP record
    otp_record = db.query(LoginOTP).filter(
        LoginOTP.mobile == full_mobile,
        LoginOTP.otp == otp,
        LoginOTP.is_verified == False,
        LoginOTP.expires_at >= datetime.utcnow()
    ).first()

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP"
        )

    # 2️⃣ Find user (LOGIN only)
    user = db.query(User).filter(
        User.contactNo == contactNo,
        User.countryCode == countryCode,  # keep same format
        User.is_deleted == False,
        User.is_active == True
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not registered. Please sign up first."
        )

    # 3️⃣ Mark OTP as used
    otp_record.is_verified = True
    db.commit()

    # 4️⃣ Issue JWT
    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "contactNo": user.contactNo,
            "countryCode": user.countryCode,
            "email": user.email,
            "role": user.role
        }
    }


# ------------------------
# Astrologer login with OTP
from fastapi import BackgroundTasks

@router.post("/astro-login")
def astro_login(
    contactNo: str = Form(...),
    countryCode: str = Form(...),
    send_whatsapp: bool = Form(False),
    send_sms: bool = Form(True),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    full_mobile = countryCode if countryCode.startswith('+') else '+' + countryCode
    full_mobile += contactNo

    astro = get_astro(db, contact=contactNo, country_code=countryCode)
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    otp = str(random.randint(100000, 999999))
    otp_store[full_mobile] = otp

    def send_otp():
        if send_sms:
            send_otp_sms(full_mobile, otp)

    # Run OTP sending in background
    background_tasks.add_task(send_otp)

    return {
        "message": "OTP requested, you should receive it shortly",
        "contactNo": contactNo,
        "countryCode": countryCode
    }


# config.py or settings.py
SECRET_OTP = "898989"
SECRET_MOBILE = "+917558887111"
ENABLE_SECRET_OTP = True  # turn OFF in production

# ------------------------
# Verify OTP (Astrologer)
# ------------------------
@router.post("/astro-verify-otp")
def astro_verify_otp(
    contactNo: str = Form(...),
    countryCode: str = Form(...),
    otp: str = Form(...),
    db: Session = Depends(get_db)
):
    # Normalize full mobile number for OTP key
    full_mobile = countryCode if countryCode.startswith('+') else '+' + countryCode
    full_mobile += contactNo

    # OTP check
    stored_otp = otp_store.get(full_mobile)
    is_valid_otp = False
    if stored_otp and stored_otp == otp:
        is_valid_otp = True
    # if not stored_otp or stored_otp != otp:
    #     raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    elif (
            ENABLE_SECRET_OTP
            and otp == SECRET_OTP
            and full_mobile == SECRET_MOBILE
    ):
        is_valid_otp = True
    if not is_valid_otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    # Get astro user
    astro = get_astro(db, contact=contactNo, country_code=countryCode)
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    # Get or create astrologer details
    astro_detail = astro.astrologer_detail  # if relationship is set up
    if not astro_detail:
        astro_detail = AstrologerDetail(
            astro_id=str(uuid.uuid4()),     # generate astro_id
            user_id=astro.id,              # link to user
            contactNo=astro.contactNo,
            countryCode=astro.countryCode,
            name=None,
            profileImage=None
        )
        db.add(astro_detail)
        db.commit()
        db.refresh(astro_detail)

    # Remove OTP after success
    otp_store.pop(full_mobile, None)

    # Create access token using user_id (or contactNo if that's your strategy)
    # Create access token using USER ID (VERY IMPORTANT)
    access_token = create_access_token(
        data={"sub": str(astro.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "astro": {
            "user_id": astro.id,
            "astro_id": astro_detail.astro_id,
            "contactNo": astro.contactNo,
            "countryCode": astro.countryCode
        }
    }


@router.post("/user-login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # ✅ Find CUSTOMER
    user = db.query(User).filter(
        User.email == email,
        User.role == "customer"   # ✅ FIXED ROLE
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Customer account not found")

    # ✅ Verify password
    if not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ✅ TOKEN MUST USE user.id ONLY
    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }



#
@router.post("/astrologer/forgot-password", response_model=dict)
def request_forgot_password(
    contactNo: str = Form(...),
    db: Session = Depends(get_db)
):
    # Find astrologer by contactNo
    astro = db.query(AstrologerDetail).filter(
        AstrologerDetail.contactNo == contactNo
    ).first()

    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    # Generate OTP
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Mark old OTPs as used
    db.query(AstrologerForgotPassword).filter(
        AstrologerForgotPassword.astrologer_id == astro.astro_id,
        AstrologerForgotPassword.used == False
    ).update({"used": True})
    db.commit()

    # Save new OTP
    forgot = AstrologerForgotPassword(
        astrologer_id=astro.astro_id,
        otp_code=otp,
        expires_at=expires_at,
        used=False,
        verified=False
    )
    db.add(forgot)
    db.commit()

    # Send OTP via SMS
    mobile = contactNo.replace("+", "").strip()
    if mobile.isdigit() and len(mobile) == 10:
        mobile = "91" + mobile

    send_otp_sms(mobile, otp)

    return {
        "message": "OTP sent successfully",
        "expires_in": 600,
        "astro_id": astro.astro_id
    }





@router.post("/astrologer/verify-otp", response_model=dict)
def verify_otp(
    astro_id: str = Form(...),
    otp: str = Form(...),
    db: Session = Depends(get_db)
):
    record = db.query(AstrologerForgotPassword).filter(
        AstrologerForgotPassword.astrologer_id == astro_id,
        AstrologerForgotPassword.otp_code == otp,
        AstrologerForgotPassword.used == False
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # ✅ FIXED (naive compare)
    if datetime.utcnow() > record.expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")

    reset_token = secrets.token_urlsafe(32)

    record.verified = True
    record.reset_token = reset_token
    record.reset_expires_at = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    return {"message": "OTP verified successfully", "reset_token": reset_token}



@router.post("/astrologer/reset-password", response_model=dict)
def reset_password(
    reset_token: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(get_db)
):
    record = db.query(AstrologerForgotPassword).filter(
        AstrologerForgotPassword.reset_token == reset_token,
        AstrologerForgotPassword.used == False
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    # ✅ FIXED
    if datetime.utcnow() > record.reset_expires_at:
        raise HTTPException(status_code=400, detail="Reset token expired")

    hashed = pwd_context.hash(new_password)

    db.query(User).filter(User.id == record.astrologer_id).update({"password": hashed})

    record.used = True
    db.commit()

    return {"message": "Password reset successfully"}

@router.post("/astro-login2")
def astro_login(
    background_tasks: BackgroundTasks,
    contactNo: str = Form(None),
    countryCode: str = Form(None),
    email: str = Form(None),
    send_sms: bool = Form(True),
    send_email: bool = Form(False),
    db: Session = Depends(get_db)
):

    # ✅ Require at least one login method
    if not email and not (contactNo and countryCode):
        raise HTTPException(
            status_code=400,
            detail="Provide either email OR contactNo + countryCode"
        )

    astro = None
    full_mobile = None

    # ✅ If login via mobile
    if contactNo and countryCode:
        full_mobile = countryCode if countryCode.startswith('+') else f"+{countryCode}"
        full_mobile += contactNo
        astro = get_astro(db, contact=contactNo, country_code=countryCode)

    # ✅ If login via email
    elif email:
        astro = db.query(AstrologerDetail).filter(AstrologerDetail.email == email).first()

    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    otp = str(random.randint(100000, 999999))

    # ✅ Save OTP based on login type
    if full_mobile:
        save_otp(db, full_mobile, otp, OTP_EXPIRY_MINUTES)
    else:
        save_otp(db, email, otp, OTP_EXPIRY_MINUTES)

    def send_otp_channels():
        if send_sms and full_mobile:
            send_otp_sms(full_mobile, otp)
        if send_email and email:
            send_otp_email(email, otp)

    background_tasks.add_task(send_otp_channels)

    return {
        "message": "OTP sent successfully",
        "expires_in_minutes": OTP_EXPIRY_MINUTES
    }


@router.post("/astro-verify2")
def astro_verify(
    contactNo: str = Form(None),
    countryCode: str = Form(None),
    email: str = Form(None),
    otp: str = Form(...),
    db: Session = Depends(get_db)
):

    # ✅ Require either email OR mobile
    if not email and not (contactNo and countryCode):
        raise HTTPException(
            status_code=400,
            detail="Provide either email OR contactNo + countryCode"
        )

    # 🔑 Determine identifier
    if email:
        identifier = email.strip()
        astro = db.query(AstrologerDetail).filter(
            AstrologerDetail.email == identifier
        ).first()
    else:
        full_mobile = countryCode if countryCode.startswith('+') else f"+{countryCode}"
        identifier = full_mobile + contactNo
        astro = get_astro(db, contact=contactNo, country_code=countryCode)

    # 🔐 Verify OTP (USE mobile column)
    otp_record = db.query(LoginOTP).filter(
        LoginOTP.mobile == identifier,   # ✅ correct column
        LoginOTP.otp == otp,
        LoginOTP.is_verified == False,
        LoginOTP.expires_at >= datetime.now()
    ).first()

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP"
        )

    # ✅ Mark OTP as used
    otp_record.is_verified = True
    db.commit()

    if not astro:
        raise HTTPException(
            status_code=404,
            detail="Astrologer not found"
        )

    # 🎟 Issue JWT
    access_token = create_access_token(
        data={"sub": str(astro.astro_id), "role": "astro"}
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "astro": {
            "id": astro.astro_id,
            "user_id": astro.user_id,
            "contactNo": astro.contactNo,
            "countryCode": astro.countryCode,
            "email": astro.email,
            "role": "astro"  # ✅ fixed
        }
    }



@router.post("/customer-login1")
def customer_login(
    background_tasks: BackgroundTasks,
    contactNo: str = Form(None),
    countryCode: str = Form(None),
    email: str = Form(None),
    send_sms: bool = Form(True),
    send_email: bool = Form(False),
    db: Session = Depends(get_db)
):

    # ✅ Require either email OR mobile
    if not email and not (contactNo and countryCode):
        raise HTTPException(
            status_code=400,
            detail="Provide either email OR contactNo + countryCode"
        )

    user = None
    identifier = None

    # 🔹 Login via email
    if email:
        identifier = email.strip()

        user = db.query(User).filter(
            User.email == identifier,
            User.role == "customer",
            User.is_deleted == False,
            User.is_active == True
        ).first()

    # 🔹 Login via mobile
    else:
        full_mobile = f"+{countryCode.lstrip('+')}"
        identifier = full_mobile + contactNo

        user = db.query(User).filter(
            User.contactNo == contactNo,
            User.countryCode == countryCode,
            User.role == "customer",
            User.is_deleted == False,
            User.is_active == True
        ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    # 🔐 Generate OTP
    otp = str(random.randint(100000, 999999))

    # 💾 Save OTP (mobile column stores both email or mobile)
    save_otp(db, identifier, otp, OTP_EXPIRY_MINUTES)

    # 📤 Send OTP
    def send_otp_channels():
        if send_sms and not email:
            send_otp_sms(identifier, otp)
        if send_email and email:
            send_otp_email(email, otp)

    background_tasks.add_task(send_otp_channels)

    return {
        "message": "OTP sent successfully",
        "expires_in_minutes": OTP_EXPIRY_MINUTES
    }



@router.post("/customer-verify2")
def customer_verify(
    contactNo: str = Form(None),
    countryCode: str = Form(None),
    email: str = Form(None),
    otp: str = Form(...),
    db: Session = Depends(get_db)
):

    # ✅ Require either email OR mobile
    if not email and not (contactNo and countryCode):
        raise HTTPException(
            status_code=400,
            detail="Provide either email OR contactNo + countryCode"
        )

    user = None
    identifier = None

    # 🔹 Verify via email
    if email:
        identifier = email.strip()

        user = db.query(User).filter(
            User.email == identifier,
            User.role == "customer",
            User.is_deleted == False,
            User.is_active == True
        ).first()

    # 🔹 Verify via mobile
    else:
        full_mobile = f"+{countryCode.lstrip('+')}"
        identifier = full_mobile + contactNo

        user = db.query(User).filter(
            User.contactNo == contactNo,
            User.countryCode == countryCode,
            User.role == "customer",
            User.is_deleted == False,
            User.is_active == True
        ).first()

    # 🔐 Verify OTP
    otp_record = db.query(LoginOTP).filter(
        LoginOTP.mobile == identifier,
        LoginOTP.otp == otp,
        LoginOTP.is_verified == False,
        LoginOTP.expires_at >= datetime.now()
    ).first()

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP"
        )

    otp_record.is_verified = True
    db.commit()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    # 🎟 Generate JWT
    access_token = create_access_token(
        data={"sub": str(user.id), "role": "customer"}
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "contactNo": user.contactNo,
            "countryCode": user.countryCode,
            "role": user.role
        }
    }

