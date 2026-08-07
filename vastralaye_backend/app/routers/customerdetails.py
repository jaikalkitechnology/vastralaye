import re
import secrets
import uuid
import os
from decimal import Decimal
from datetime import datetime, date, timedelta
import random
from typing import Optional, List
from sqlalchemy.exc import IntegrityError

from fastapi import (
    APIRouter, Depends, HTTPException,
    Form, UploadFile, File, Request, Body
)
from firebase_admin.app_check import verify_token
from firebase_admin.auth import get_user_by_email
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.email_config import send_otp_email
from app.models.models import CustomerDetail, User, UserWallet, Coupon, CouponUsage, PasswordResetToken, \
    SignupOTP

from app.schemas.customerdetails import CustomerDetailResponse, ApplyCouponRequest, VerifyOtpRequest
from app.utils.database import get_db
from app.utils.authenticate import get_current_user, pwd_context, send_otp_sms, create_access_token
from app.models.models import india_tz
from app.utils.mail import send_email_otp

router = APIRouter()

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# =====================================================
# Utils
# =====================================================

import uuid
import os
from decimal import Decimal
from datetime import datetime
from typing import Optional
from fastapi import Query
from sqlalchemy import or_, asc, desc
from typing import List, Optional, Dict
from fastapi import (
    APIRouter, Depends, HTTPException,
    Form, UploadFile, File, Request
)
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.models import (
    CustomerDetail,
    User,
    UserWallet,
    india_tz
)
from app.schemas.customerdetails import CustomerDetailResponse
from app.utils.database import get_db
from app.utils.authenticate import pwd_context

router = APIRouter()

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# =====================================================
# HELPERS
# =====================================================

def build_image_url(request: Request, filename: Optional[str]):
    if not filename:
        return None
    return f"{str(request.base_url).rstrip('/')}/static/uploads/{filename}"


def save_upload(file: Optional[UploadFile]) -> Optional[str]:
    if not file or not file.filename:
        return None
    filename = f"{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(file.file.read())
    return filename


def safe_date(value: Optional[str]):
    if not value or value.lower() in ("null", "none", "string", ""):
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "Date must be YYYY-MM-DD")


def make_user_id():
    return f"user_{uuid.uuid4().hex}"


# =====================================================
# CREATE CUSTOMER (FINAL)
# =====================================================

@router.post("/customerdetails", response_model=CustomerDetailResponse)
def create_customer(
    request: Request,

    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    contact_no: str = Form(...),
    country_code: str = Form(...),

    birth_date: Optional[str] = Form(None),
    birth_time: Optional[str] = Form(None),
    birth_place: Optional[str] = Form(None),

    address_line1: Optional[str] = Form(None),
    address_line2: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    pincode: Optional[int] = Form(None),
    gender: Optional[str] = Form(None),
    profile: Optional[str] = Form(None),

    profile_pic: Optional[UploadFile] = File(None),
    fcm_token: Optional[str] = Form(None),

    db: Session = Depends(get_db),
):
    # -------------------------------------------------
    # NORMALIZE INPUT
    # -------------------------------------------------
    email = email.strip().lower()
    contact_no = contact_no.strip()

    if len(password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    # -------------------------------------------------
    # UNIQUE CHECKS (MATCH DB)
    # -------------------------------------------------

    # Email must be unique in USERS
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "Email already registered")

    # Phone must be unique among ACTIVE customers
    if db.query(CustomerDetail).filter(
        CustomerDetail.contact_no == contact_no,
        CustomerDetail.is_delete == False
    ).first():
        raise HTTPException(409, "Phone number already registered")

    # -------------------------------------------------
    # PREPARE DATA
    # -------------------------------------------------
    birth_date_parsed = safe_date(birth_date)
    profile_image = save_upload(profile_pic)
    user_id = make_user_id()

    user = User(
        id=user_id,
        name=name,
        email=email,
        password=pwd_context.hash(password),
        contactNo=contact_no,
        countryCode=country_code,
        gender=gender,
        role="customer",
        is_active=True,
        is_deleted=False,
    )

    customer = CustomerDetail(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name=name,
        email=email,
        contact_no=contact_no,
        birth_date=birth_date_parsed,
        birth_time=birth_time,
        profile=profile,
        birth_place=birth_place,
        address_line1=address_line1,
        address_line2=address_line2,
        location=location,
        pincode=pincode,
        gender=gender,
        country_code=country_code,
        profile_image=profile_image,
        fcm_token=fcm_token,
        is_active=True,
        is_delete=False,
        created_at=datetime.now(india_tz),
        updated_at=datetime.now(india_tz),
    )
    existing_wallet = db.query(UserWallet).filter(
        UserWallet.user_id == user_id
    ).first()

    wallet = UserWallet(
        id=str(uuid.uuid4()),
        user_id=user_id,
        wallet_id=f"WALLET_{uuid.uuid4().hex}",  # ✅ REQUIRED
        amount=Decimal("0.00"),
        is_active=True,
        is_delete=False,
        created_at=datetime.now(india_tz),
        updated_at=datetime.now(india_tz),
    )
    db.add(wallet)

    # -------------------------------------------------
    # TRANSACTION (SAFE)
    # -------------------------------------------------
    try:
        db.add(user)
        db.flush()        # ensures FK exists

        db.add(customer)
        db.add(wallet)

        db.commit()
        db.refresh(customer)

    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Duplicate customer data")

    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))

    # -------------------------------------------------
    # RESPONSE
    # -------------------------------------------------
    resp = CustomerDetailResponse.from_orm(customer).model_dump(by_alias=True)
    resp["profileImageUrl"] = build_image_url(request, customer.profile_image)
    resp["user_id"] = user_id

    return resp







# =====================================================
# UPDATE CUSTOMER
# =====================================================

@router.patch("/customerdetails/{user_id}", response_model=CustomerDetailResponse)
def update_customer(
    request: Request,
    user_id: str,
    name: Optional[str] = Form(None),
    contact_no: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    profile_pic: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    # Fetch customer
    customer = db.query(CustomerDetail).filter(
        CustomerDetail.user_id == user_id,
        CustomerDetail.is_delete == False
    ).first()
    if not customer:
        raise HTTPException(404, "Customer not found")

    # Fetch user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # ---------- NAME ----------
    if name:
        customer.name = name
        user.name = name   # ✅ REQUIRED

    # ---------- EMAIL ----------
    if email and email != user.email:
        if db.query(User).filter(User.email == email, User.id != user_id).first():
            raise HTTPException(409, "Email already in use")
        customer.email = email
        user.email = email   # ✅ REQUIRED

    # ---------- CONTACT ----------
    if contact_no and contact_no != customer.contact_no:
        if db.query(CustomerDetail).filter(
            CustomerDetail.contact_no == contact_no,
            CustomerDetail.is_delete == False,
            CustomerDetail.user_id != user_id
        ).first():
            raise HTTPException(409, "Phone already in use")

        customer.contact_no = contact_no
        user.contactNo = contact_no   # ✅ REQUIRED

    # ---------- PROFILE PIC ----------
    if profile_pic:
        customer.profile_image = save_upload(profile_pic)

    customer.updated_at = datetime.now(india_tz)

    db.commit()
    db.refresh(customer)

    return CustomerDetailResponse.from_orm(customer)



# =====================================================
# GET CUSTOMER (ME)
# =====================================================

@router.get("/customerdetails/me", response_model=CustomerDetailResponse)
def get_my_customer(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(CustomerDetail).filter(
        CustomerDetail.user_id == current_user.id,
        CustomerDetail.is_delete == False
    ).first()

    if not customer:
        raise HTTPException(404, "Customer not found")

    resp = CustomerDetailResponse.from_orm(customer).model_dump(by_alias=True)
    resp["profileImageUrl"] = build_image_url(request, customer.profile_image)
    resp["user_id"] = customer.user_id
    return resp


@router.get("/customerdetails/all")
def get_all_customers(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),

    # Pagination
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),

    # Search / Filter
    search: Optional[str] = Query(None, description="Search by name, email, phone"),
    is_active: Optional[bool] = Query(None),
    gender: Optional[str] = Query(None),
    country_code: Optional[str] = Query(None),

    # Order by
    order_by: str = Query("created_at", description="created_at | name | email"),
    order_dir: str = Query("desc", description="asc | desc"),
):
    # -------- Admin check --------
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view all customers")

    # -------- Base query --------
    query = db.query(CustomerDetail).filter(
        CustomerDetail.is_delete == False
    )

    # -------- Search --------
    if search:
        query = query.filter(
            or_(
                CustomerDetail.name.ilike(f"%{search}%"),
                CustomerDetail.email.ilike(f"%{search}%"),
                CustomerDetail.contact_no.ilike(f"%{search}%"),
            )
        )

    # -------- Filters --------
    if is_active is not None:
        query = query.filter(CustomerDetail.is_active == is_active)

    if gender:
        query = query.filter(CustomerDetail.gender.ilike(gender))

    if country_code:
        query = query.filter(CustomerDetail.country_code == country_code)

    # -------- Order by --------
    order_map = {
        "created_at": CustomerDetail.created_at,
        "name": CustomerDetail.name,
        "email": CustomerDetail.email,
    }

    order_column = order_map.get(order_by, CustomerDetail.created_at)

    if order_dir.lower() == "asc":
        query = query.order_by(asc(order_column))
    else:
        query = query.order_by(desc(order_column))

    # -------- Pagination --------
    total = query.count()

    customers = (
        query
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    # -------- Response --------
    data = []
    for c in customers:
        item = CustomerDetailResponse.from_orm(c).model_dump(by_alias=True)
        item["profileImageUrl"] = build_image_url(request, c.profile_image)
        item["user_id"] = c.user_id
        data.append(item)

    return {
        "page": page,
        "size": size,
        "total": total,
        "total_pages": (total + size - 1) // size,
        "data": data,
    }

@router.get("/customerdetails/get-by-userid/{user_id}", response_model=CustomerDetailResponse)
def get_customer_by_userid(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(CustomerDetail).filter(
        CustomerDetail.user_id == user_id,
        CustomerDetail.is_delete == False
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    resp = CustomerDetailResponse.from_orm(customer).model_dump(by_alias=True)
    resp["profileImageUrl"] = build_image_url(request, customer.profile_image)
    resp["user_id"] = customer.user_id
    return resp


def _make_user_id() -> str:
    return f"user_{uuid.uuid4().hex}"


def _save_upload(file: UploadFile) -> Optional[str]:
    if not file or not getattr(file, "filename", None):
        return None
    safe_name = f"{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
    path = os.path.join(UPLOAD_DIR, safe_name)
    with open(path, "wb") as f:
        f.write(file.file.read())
    return safe_name


def hash_password(password: str):
    return pwd_context.hash(password)


# @router.post("/user-signup-with-details")
# def signup_with_details(
#     request: Request,
#     name: str = Form(...),
#     contactNo: str = Form(...),
#     countryCode: str = Form(...),
#     email: str = Form(...),
#     password: str = Form(...),
#     pincode: int = Form(...),
#     birthDate: Optional[str] = Form(None),
#     birthTime: Optional[str] = Form(None),
#     birthPlace: Optional[str] = Form(None),
#     addressLine1: Optional[str] = Form(None),
#     addressLine2: Optional[str] = Form(None),
#     location: Optional[str] = Form(None),
#     gender: Optional[str] = Form(None),
#     profile: Optional[str] = Form(None),
#     profile_pic: Optional[UploadFile] = File(None),
#     fcm_token: Optional[str] = Form(None),
#     token: Optional[str] = Form(None),
#     db: Session = Depends(get_db),
# ):
#     # -------- Validate Phone --------
#     contact_norm = (contactNo or "").strip()
#     if not contact_norm:
#         raise HTTPException(status_code=400, detail="contactNo is required")
#
#     if db.query(User).filter(User.contactNo == contact_norm).first():
#         raise HTTPException(status_code=409, detail="Phone already registered")
#     if db.query(User).filter(User.email == email).first():
#         raise HTTPException(status_code=409, detail="Email already registered")
#
#     # -------- Save Image --------
#     profile_image_filename = _save_upload(profile_pic)
#
#     # -------- Create User --------
#     new_user_id = _make_user_id()
#     user = User(
#         id=new_user_id,
#         name=name,
#         email=email,
#         password=hash_password(password),
#         contactNo=contact_norm,
#         countryCode=countryCode,
#         role="user",
#         is_active=True,
#         is_deleted=False,
#     )
#     db.add(user)
#
#     # -------- Create Customer --------
#     customer = CustomerDetail(
#         id=str(uuid.uuid4()),
#         user_id=new_user_id,
#         name=name,
#         contact_no=contact_norm,
#         birth_date=birthDate,
#         birth_time=birthTime,
#         profile=profile,
#         birth_place=birthPlace,
#         address_line1=addressLine1,
#         address_line2=addressLine2,
#         location=location,
#         pincode=pincode,
#         gender=gender,
#         fcm_token=fcm_token,
#         token=token,
#         country_code=countryCode,
#         profile_image=profile_image_filename,
#         is_active=True,
#         is_delete=False,
#     )
#     db.add(customer)
#
#     # -------- Create Wallet --------
#     wallet = UserWallet(
#         id=str(uuid.uuid4()),
#         user_id=new_user_id,
#         amount=Decimal(0),
#         is_active=True,
#     )
#     db.add(wallet)
#
#     # -------- Commit --------
#     try:
#         db.commit()
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"Failed to create user: {e}")
#
#     # -------- Response --------
#     base_url = str(request.base_url).rstrip("/")
#     profile_image_url = f"{base_url}/static/uploads/{profile_image_filename}" if profile_image_filename else None
#
#     return {
#         "user": {
#             "id": new_user_id,
#             "name": name,
#             "email": email,
#             "contactNo": contact_norm,
#             "countryCode": countryCode,
#             "role": "user",
#             "isActive": True,
#         },
#         "customer": {
#             "id": customer.id,
#             "name": customer.name,
#             "birthDate": customer.birth_date,
#             "birthTime": customer.birth_time,
#             "birthPlace": customer.birth_place,
#             "addressLine1": customer.address_line1,
#             "addressLine2": customer.address_line2,
#             "location": customer.location,
#             "pincode": customer.pincode,
#             "gender": customer.gender,
#             "profileImageUrl": profile_image_url,
#         },
#         "wallet": {
#             "id": wallet.id,
#             "user_id": wallet.user_id,
#             "balance": float(wallet.amount),
#         }
#     }



@router.post("/apply")
def apply_coupon(payload: ApplyCouponRequest, db: Session = Depends(get_db)):

    # 1️⃣ Fetch customer by backend UUID or Firebase UID
    customer = db.query(CustomerDetail).filter(
        CustomerDetail.user_id == payload.user_id,
        CustomerDetail.is_delete == False
    ).first()

    if not customer:
        # try by Firebase UID
        customer = db.query(CustomerDetail).filter(
            CustomerDetail.firebase_uid == payload.user_id,
            CustomerDetail.is_delete == False
        ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # 2️⃣ Fetch coupon
    coupon = db.query(Coupon).filter(
        Coupon.code == payload.coupon_code,
        Coupon.is_active == True
    ).first()

    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid or inactive coupon code")

    # 3️⃣ Check if this customer already used this coupon
    usage = db.query(CouponUsage).filter(
        CouponUsage.user_id == customer.id,
        CouponUsage.coupon_id == coupon.id
    ).first()

    if usage:
        raise HTTPException(status_code=400, detail="Coupon already used by this customer")

    # 4️⃣ Apply coupon: record usage
    new_usage = CouponUsage(user_id=customer.id, coupon_id=coupon.id)
    db.add(new_usage)

    # Increment coupon usage count
    coupon.used_count += 1

    # Disable coupon if max usage reached
    if coupon.used_count >= coupon.max_usage:
        coupon.is_active = False

    db.commit()

    return {
        "status": "success",
        "message": "Coupon applied successfully! Free horoscope unlocked.",
        "total_used": coupon.used_count
    }


@router.get("/customer/coupons")
def get_customer_coupons(db: Session = Depends(get_db)):

    coupons = (
        db.query(Coupon)
        .filter(
            Coupon.is_active == True,
            Coupon.used_count < Coupon.max_usage
        )
        .all()
    )

    return [
        {
            "code": c.code,
            "discount_type": getattr(c, "discount_type", None),
            "discount_value": getattr(c, "discount_value", None),
            "max_usage": c.max_usage,
            "used_count": c.used_count,
            "is_active": c.is_active,
        }
        for c in coupons
    ]


@router.get("/cosmic-services")
def get_cosmic_services():
    services = [
        {"id": 1, "name": "Daily Horoscope", "price": 100, "gst": "18%", "final_price": 118, "icon": "calendar"},
        {"id": 2, "name": "Detailed Kundli", "price": 599, "gst": "18%", "final_price": 707, "icon": "book"},
        {"id": 3, "name": "Daily Prediction", "price": 100, "gst": "18%", "final_price": 118, "icon": "sun"},
        {"id": 4, "name": "Planet Position", "price": 599, "gst": "18%", "final_price": 707, "icon": "star"},
        {"id": 5, "name": "Love Compatibility", "price": 599, "gst": "18%", "final_price": 707, "icon": "heart"},
        {"id": 6, "name": "Birthday Number", "price": 100, "gst": "18%", "final_price": 118, "icon": "hashtag"}
    ]

    return {"status": True, "services": services}


@router.post("/forgot-password")
def forgot_password(contact_no: str, db: Session = Depends(get_db)):

    contact_no = contact_no.strip()

    customer = db.query(CustomerDetail).filter(CustomerDetail.contact_no == contact_no).first()
    if not customer:
        raise HTTPException(status_code=404, detail="User not found")

    otp = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    existing = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == customer.id,
        PasswordResetToken.is_used == False
    ).order_by(PasswordResetToken.id.desc()).first()

    if existing:
        existing.token = otp
        existing.expires_at = expires_at
    else:
        db.add(
            PasswordResetToken(
                user_id=customer.id,
                token=otp,
                expires_at=expires_at,
                is_used=False
            )
        )

    db.commit()

    # ✅ Send OTP to customer mobile
    sent = send_otp_sms(customer.contact_no, otp)

    if not sent:
        raise HTTPException(status_code=500, detail="OTP sending failed")

    return {"message": "OTP sent successfully"}


@router.post("/verify-otp")
def verify_otp(contact_no: str, otp: str, db: Session = Depends(get_db)):

    contact_no = contact_no.strip()

    customer = db.query(CustomerDetail).filter(CustomerDetail.contact_no == contact_no).first()
    if not customer:
        raise HTTPException(status_code=404, detail="User not found")

    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == customer.id,
        PasswordResetToken.is_used == False
    ).order_by(PasswordResetToken.id.desc()).first()

    if not record:
        raise HTTPException(status_code=400, detail="OTP not found")

    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    if record.token != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # ✅ generate reset_token
    reset_token = secrets.token_urlsafe(32)

    record.reset_token = reset_token
    record.reset_expires_at = datetime.utcnow() + timedelta(minutes=10)

    db.commit()

    return {
        "message": "OTP verified successfully",
        "reset_token": reset_token
    }

@router.post("/reset-password", response_model=dict)
def customer_reset_password(
    reset_token: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(get_db)
):
    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.reset_token == reset_token,
        PasswordResetToken.is_used == False
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    if datetime.utcnow() > record.reset_expires_at:
        raise HTTPException(status_code=400, detail="Reset token expired")

    # ✅ Find customer using record.user_id (CustomerDetail.id)
    customer = db.query(CustomerDetail).filter(CustomerDetail.id == record.user_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    hashed = pwd_context.hash(new_password)

    # ✅ Update password in User table
    db.query(User).filter(User.id == ...).update({"password": hashed})

    record.is_used = True
    db.commit()

    return {"message": "Password reset successfully"}

# @router.post("/customer/forgot-password")
# def customer_forgot_password(
#     email: str = Body(..., embed=True),
#     db: Session = Depends(get_db)
# ):
#     user = db.query(User).filter(
#         User.email == email,
#         User.role == "customer",
#         User.is_active == True,
#         User.is_deleted == False
#     ).first()
#
#     # SECURITY: same response even if user not found
#     if not user:
#         return {"message": "If email exists, reset link will be sent"}
#
#     token = str(uuid.uuid4())
#     expiry = datetime.utcnow() + timedelta(minutes=15)
#
#     user.reset_token = token
#     user.reset_token_expiry = expiry
#     db.commit()
#
#     reset_link = f"https://jyotishionline.com/reset-password?token={token}"
#
#     send_email(
#         to=email,
#         subject="Reset Your Password",
#         html=f"""
#         <p>Hello {user.name or 'User'},</p>
#         <p>Click the button below to reset your password:</p>
#         <p><a href="{reset_link}" style="padding:10px 20px;background:#6B46C1;color:#fff;text-decoration:none;">
#             Reset Password
#         </a></p>
#         <p>This link will expire in 15 minutes.</p>
#         """
#     )
#
#     return {"message": "If email exists, reset link will be sent"}



# new signup

EMAIL_REGEX = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

@router.post("/customer/send-otp")
def send_customer_otp(
    contact_no: Optional[str] = Form(None),
    country_code: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    # -------------------------------------------------
    # NORMALIZE
    # -------------------------------------------------
    contact_no = contact_no.strip() if contact_no else None
    email = email.strip().lower() if email else None
    username = username.strip() if username else None

    # -------------------------------------------------
    # 1️⃣ AT LEAST ONE REQUIRED
    # -------------------------------------------------
    if not contact_no and not email:
        raise HTTPException(
            status_code=400,
            detail="Email or phone number required"
        )

    # -------------------------------------------------
    # 2️⃣ PHONE VALIDATION (ONLY IF PROVIDED)
    # -------------------------------------------------
    if contact_no:
        if not contact_no.isdigit() or len(contact_no) != 10:
            raise HTTPException(400, "Invalid phone number")

        existing_phone = db.query(User).filter(
            User.contactNo == contact_no,
            User.is_deleted == False
        ).first()

        if existing_phone:
            raise HTTPException(
                status_code=409,
                detail="Phone number already exists. Please login."
            )

    # -------------------------------------------------
    # 3️⃣ EMAIL VALIDATION (ONLY IF PROVIDED)
    # -------------------------------------------------
    if email:
        email_exists = db.query(User).filter(
            User.email == email,
            User.is_deleted == False
        ).first()

        if email_exists:
            raise HTTPException(
                status_code=409,
                detail="Email already exists. Please login."
            )

    # -------------------------------------------------
    # 4️⃣ ACTIVE OTP CHECK (PHONE OR EMAIL)
    # -------------------------------------------------
    otp_query = db.query(SignupOTP).filter(
        SignupOTP.is_verified == False,
        SignupOTP.expires_at > datetime.utcnow()
    )

    if contact_no:
        otp_query = otp_query.filter(SignupOTP.contact_no == contact_no)
    else:
        otp_query = otp_query.filter(SignupOTP.email == email)

    active_otp = otp_query.order_by(SignupOTP.created_at.desc()).first()

    if active_otp:
        remaining = int(
            (active_otp.expires_at - datetime.utcnow()).total_seconds()
        )
        raise HTTPException(
            status_code=429,
            detail=f"OTP already sent. Try again in {remaining} seconds."
        )

    # -------------------------------------------------
    # 5️⃣ GENERATE & SAVE OTP
    # -------------------------------------------------
    otp = str(random.randint(100000, 999999))

    record = SignupOTP(
        contact_no=contact_no,
        country_code=country_code,
        email=email,
        username=username,
        otp=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    )

    db.add(record)
    db.commit()

    # -------------------------------------------------
    # 6️⃣ SEND OTP (EMAIL OR SMS)
    # -------------------------------------------------
    sent = False

    if contact_no:
        sent = send_otp_sms(contact_no, otp)
    elif email:
        sent = send_otp_email(email, otp)

    if sent is False:
        raise HTTPException(500, "Failed to send OTP")

    return {
        "message": "OTP sent successfully",
        "sent_via": "phone" if contact_no else "email"
    }





@router.post("/customer/verify-otp")
def verify_customer_otp(
    otp: str = Form(...),
    contact_no: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    # -----------------------------
    # NORMALIZE
    # -----------------------------
    contact_no = contact_no.strip() if contact_no else None
    email = email.strip().lower() if email else None

    # -----------------------------
    # EXACTLY ONE IDENTIFIER
    # -----------------------------
    if bool(contact_no) == bool(email):
        raise HTTPException(
            400, "Provide either email or phone (not both)"
        )

    # -----------------------------
    # FETCH OTP
    # -----------------------------
    otp_q = db.query(SignupOTP).filter(
        SignupOTP.is_verified == False,
        SignupOTP.expires_at > datetime.utcnow()
    )

    otp_q = (
        otp_q.filter(SignupOTP.contact_no == contact_no)
        if contact_no
        else otp_q.filter(SignupOTP.email == email)
    )

    record = (
        otp_q.order_by(SignupOTP.created_at.desc())
        .with_for_update()
        .first()
    )

    if not record or record.otp != otp:
        raise HTTPException(400, "Invalid or expired OTP")

    record.is_verified = True

    # -----------------------------
    # FIND USER FIRST (KEY FIX)
    # -----------------------------
    if record.contact_no:
        user = db.query(User).filter(
            User.contactNo == record.contact_no
        ).with_for_update().first()
    else:
        user = db.query(User).filter(
            User.email == record.email
        ).with_for_update().first()

    is_new_user = False
    wallet_created = False

    # -----------------------------
    # CREATE ONLY IF NOT EXISTS
    # -----------------------------
    if not user:
        is_new_user = True

        user = User(
            id=make_user_id(),
            name=record.username,
            email=record.email,
            contactNo=record.contact_no,
            countryCode=record.country_code,
            role="customer",
            is_active=True,
            is_deleted=False,
        )
        db.add(user)
        db.flush()

        # CustomerDetail (safe)
        existing_customer = db.query(CustomerDetail).filter(
            CustomerDetail.user_id == user.id
        ).first()

        if not existing_customer:
            db.add(CustomerDetail(
                id=str(uuid.uuid4()),
                user_id=user.id,
                name=record.username,
                email=record.email,
                contact_no=record.contact_no,
                country_code=record.country_code,
                is_active=True,
                is_delete=False,
            ))

        # Wallet (safe)
        existing_wallet = db.query(UserWallet).filter(
            UserWallet.user_id == user.id
        ).first()

        if not existing_wallet:
            db.add(UserWallet(
                id=str(uuid.uuid4()),
                user_id=user.id,
                wallet_id=f"WALLET_{uuid.uuid4().hex}",
                amount=Decimal("0.00"),
                is_active=True,
                is_delete=False,
            ))
            wallet_created = True

    db.commit()

    return {
        "message": "OTP verified successfully",
        "user_id": user.id,
        "is_new_user": is_new_user,
        "wallet_created": wallet_created,
    }







