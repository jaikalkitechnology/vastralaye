from datetime import datetime, timedelta, timezone, date
from typing import List, Optional, Tuple
import os, shutil, re, json

import pytz
from fastapi import (
    APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request,Query
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session,joinedload
from sqlalchemy import func
from sqlalchemy.testing import db
from starlette.responses import StreamingResponse
from starlette.websockets import WebSocket

from app.crud import wishlist as wishlist_crud
from app import models
from app.mail import send_reset_email, send_welcome_email, logger
from pydantic import BaseModel,EmailStr,Field
from app.models.order import Order, OrderItem, OrderTracking
from app.models import User, CartItem, Product, order
from app.models.product import ProductReview
from app.models.user import SupportMessage
from app.models.coupon import Coupon
from app.models.invoice import Invoice, InvoiceItem

from app.database import get_db
from app.schemas.order_system import OrderResponse
from app.security import get_password_hash, verify_password, create_reset_token, verify_reset_token
from app.services.password_policy import PasswordPolicyError, validate_password
from app.routers.contact import resolve_email_config
from app.services.account_email import (
    consume_reset_token,
    consume_verification_token,
    peek_reset_token,
    send_password_reset_email,
    send_verification_email,
)
from app.authentication import (
    get_current_user, create_access_token,
    get_user_by_email
)
from app.mail import send_email
from app.crud import cart as cart_crud
from app.crud import user as crud_user
from app.schemas.order import OrderOut, OrderCreate
from app.schemas.user import (
    UserOut, Token, ChangePasswordRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    SuccessMessage, UserUpdate
)
from app.schemas.cart import CartItemCreate, CartItemOut, CartItemUpdate
from app.schemas.wishlist import WishlistCreate, WishlistItemOut
from fastapi.responses import JSONResponse,HTMLResponse
from fastapi.encoders import jsonable_encoder
import json
import string
from app.utilis.invoice_pdf import generate_invoice_pdf
from app.utilis.send_email import send_order_email


import requests
import time
import random
import logging
import re
import uuid
import httpx
from dotenv import load_dotenv


from typing import List, Dict, Any

load_dotenv()

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

# -------------------------
# Configuration / helpers
# -------------------------
AVATAR_DIR = "static/avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)

ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/jpg"}
MAX_AVATAR_BYTES = 2 * 1024 * 1024  # 2 MB
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_REGEX = re.compile(r"^\+?[0-9]{7,15}$")  # basic international phone


def validate_email(email: str) -> str:
    if not email or not isinstance(email, str) or not email.strip():
        raise HTTPException(status_code=400, detail="Email is required.")
    email = email.strip().lower()
    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Invalid email format.")
    return email


def validate_password_strength(password: str) -> None:
    """Same rule the admin dashboard applies — see app/services/password_policy.py."""
    try:
        validate_password(password)
    except PasswordPolicyError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


def validate_phone(phone: Optional[str]) -> Optional[str]:
    if phone is None:
        return None
    phone = phone.strip()
    if not PHONE_REGEX.match(phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format.")
    return phone


def save_avatar_file(upload: UploadFile, user_id: int) -> str:
    """Validate avatar content type/size and save into AVATAR_DIR. Returns URL path stored in DB."""
    if upload.content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported avatar file type. Use PNG or JPG.")
    # read content to check size
    content = upload.file.read()
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=400, detail="Avatar exceeds maximum size of 2MB.")
    # sanitize filename
    ext = os.path.splitext(upload.filename)[1] or ".jpg"
    filename = f"user_{user_id}_{int(datetime.utcnow().timestamp())}{ext}"
    path = os.path.join(AVATAR_DIR, filename)
    try:
        with open(path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save avatar file.")
    # return URL path used in other endpoints (consistent with your app)
    return f"/static/avatars/{filename}"


def parse_coupon(db: Session, code: str, total: float) -> Tuple[Optional[Coupon], float]:
    """Validate coupon and compute discount; returns (coupon_obj, discount_amount)."""
    if not code:
        return None, 0.0
    coupon = db.query(Coupon).filter(func.lower(Coupon.code) == code.lower(), Coupon.active == True).first()
    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid or expired coupon.")
    if coupon.valid_to and coupon.valid_to < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Coupon has expired.")
    if coupon.minimum_purchase and coupon.minimum_purchase > total:
        raise HTTPException(status_code=400, detail="Minimum purchase not met for this coupon.")
    if coupon.discount_type == "fixed":
        discount = float(min(coupon.discount_value, total))
    else:  # percentage
        discount = float(total * (coupon.discount_value / 100.0))
    return coupon, discount


def validate_rating(rating: float) -> float:
    """Validate rating is between 1 and 5"""
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5.")
    return rating


def _recalculate_product_rating(db: Session, product: Product):
    """Recalculate average rating for a product"""
    avg = db.query(func.avg(ProductReview.rating)).filter(ProductReview.product_id == product.id).scalar()
    product.rating = float(avg) if avg is not None else 0.0
    db.commit()


# -------------------------
# AUTHENTICATION ROUTES
# -------------------------

@router.post("/signUp", response_model=SuccessMessage)
def create_user(
        first_name: str = Form(...),
        last_name: str = Form(...),
        email: str = Form(...),
        password: str = Form(...),
        phone: str = Form(None),
        address_line1: str = Form(None),
        address_line2: str = Form(None),
        city: str = Form(None),
        region: str = Form(None),
        postal_code: str = Form(None),
        country: str = Form(None),
        avatar: UploadFile = File(None),
        db: Session = Depends(get_db),
):
    """Register a new user with validation"""
    email = validate_email(email)
    validate_password_strength(password)
    phone = validate_phone(phone)

    # Prevent duplicate email
    if db.query(User).filter(func.lower(User.email) == email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    hashed_password = get_password_hash(password)
    new_user = User(
        first_name=(first_name or "").strip(),
        last_name=(last_name or "").strip(),
        email=email,
        password=hashed_password,
        phone=phone,
        address_line1=(address_line1 or "").strip(),
        address_line2=(address_line2 or "").strip(),
        city=(city or "").strip(),
        region=(region or "").strip(),
        postal_code=(postal_code or "").strip(),
        country=(country or "").strip(),
        created_at=datetime.utcnow(),
        # Explicitly False, not NULL: NULL means "predates verification" and is
        # grandfathered through login, which must never apply to a new signup.
        is_verified=False,
    )
    db.add(new_user)
    db.flush()  # get id

    # handle avatar upload if provided
    if avatar:
        avatar_url = save_avatar_file(avatar, new_user.id)
        new_user.avatar = avatar_url

    # create default user settings if you have such a model (defensive)
    try:
        settings = getattr(__import__("app.models", fromlist=["models"]), "UserSettings")
        db.add(settings(user_id=new_user.id))
    except Exception:
        # if UserSettings doesn't exist or fails, continue silently - not critical
        pass

    db.commit()
    db.refresh(new_user)

    # Send welcome email
    try:
        send_welcome_email(new_user.email, new_user.first_name or "there")
    except Exception:
        # Don't fail registration if email fails
        pass

    # Activation link.
    sent = False
    try:
        config = resolve_email_config(db)
        if config["sender_email"] and config["app_password"]:
            sent = bool(send_verification_email(db, config, new_user))
        else:
            logger.warning("No mail account configured — %s cannot be sent a "
                           "verification link", new_user.email)
    except Exception as exc:  # noqa: BLE001
        logger.error("Verification email for %s failed: %s", new_user.email, exc)

    if not sent:
        # A gate we can't open is just a locked door. If the link didn't go out
        # — no SMTP configured, or the server refused — leave the account in the
        # grandfathered state (NULL) so they can sign in, rather than stranding
        # them behind a confirmation they will never receive and can't resend.
        new_user.is_verified = None
        db.commit()
        logger.warning("Account %s created WITHOUT verification — no link could "
                       "be delivered", new_user.email)

    return {
        "message": (
            "Registration successful. Check your email for the activation link."
            if sent else "Registration successful. You can sign in now."
        ),
        "verification_required": sent,
    }


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    if not form_data.username or not form_data.password:
        raise HTTPException(status_code=400, detail="Username and password are required.")

    user = get_user_by_email(db, form_data.username)

    # Google-only accounts have no password hash to compare against.
    if user and not user.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses Google sign-in. Use the Continue with Google button.",
        )

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if user.deleted_at is not None:
        raise HTTPException(
            status_code=403,
            detail="Your account is deactivated. Contact support to reactivate."
        )

    # `is False` on purpose, not `not user.is_verified`: NULL means the account
    # predates verification and must still be able to log in.
    if user.is_verified is False:
        raise HTTPException(
            status_code=403,
            detail="Please confirm your email address first — check your inbox "
                   "for the activation link, or ask for a new one.",
        )

    # Add role in token
    token = create_access_token({"sub": user.email, "role": user.role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role      # ← add this
    }


# -------------------------
# PASSWORD MANAGEMENT ROUTES
# -------------------------
# ⚠️ CHANGE THIS FOR PRODUCTION
FRONTEND_URL = "http://192.168.29.216:8082"
@router.post("/forgot-password", response_model=SuccessMessage)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = request.email
    user = crud_user.get_user_by_email(db, email)

    # Always return success for security
    response = {"message": "If this email exists, a reset link has been sent."}

    if not user:
        return response

    # Google-only accounts have no password to reset.
    if not user.password:
        return response

    try:
        config = resolve_email_config(db)
        if config["sender_email"] and config["app_password"]:
            send_password_reset_email(db, config, user)
        else:
            logger.warning("No mail account configured — cannot send a reset link")
    except Exception as exc:  # noqa: BLE001 - never confirm an address by erroring
        logger.error("Reset email for %s failed: %s", user.email, exc)

    return response



@router.post("/reset-password", response_model=SuccessMessage)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Resets user password using valid reset token.
    """

    # Optional but recommended
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match"
        )

    validate_password_strength(request.new_password)

    # Single-use: spending the token here is what stops the same emailed link
    # being replayed. The old code called verify_reset_token(db, token) against
    # a one-argument function, so this endpoint raised TypeError every time.
    email = consume_reset_token(db, request.token)
    if not email:
        raise HTTPException(
            status_code=400,
            detail="This reset link has expired or has already been used. "
                   "Request a new one.",
        )

    user = crud_user.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = get_password_hash(request.new_password)
    # Choosing a password from a link sent to that address proves they can read
    # it, which is exactly what verification asks for.
    if user.is_verified is not True:
        user.is_verified = True
        user.verified_at = datetime.utcnow()
    db.commit()

    return {"message": "Password reset successful"}


class VerifyEmailRequest(BaseModel):
    token: str


@router.post("/verify-email", response_model=SuccessMessage)
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Activate an account from the link in the welcome email."""
    email = consume_verification_token(db, request.token)
    if not email:
        raise HTTPException(
            status_code=400,
            detail="This activation link has expired or has already been used. "
                   "Ask for a new one from the sign-in page.",
        )

    user = db.query(User).filter(func.lower(User.email) == email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    # Clicking twice should read as success, not as an error — the second click
    # is usually the same person wondering whether the first one worked.
    if user.is_verified is not True:
        user.is_verified = True
        user.verified_at = datetime.utcnow()
        db.commit()

    return {"message": "Your email is confirmed — you can sign in now."}


class ResendVerificationRequest(BaseModel):
    email: str


@router.post("/resend-verification", response_model=SuccessMessage)
def resend_verification(request: ResendVerificationRequest, db: Session = Depends(get_db)):
    """Send another activation link.

    Answers the same way whichever address is given: telling a stranger that an
    address does or doesn't have an account is exactly the leak the
    forgot-password endpoint already avoids.
    """
    response = {"message": "If that account needs confirming, a new link is on its way."}

    email = (request.email or "").strip().lower()
    if not EMAIL_REGEX.match(email):
        return response

    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user or user.is_verified is not False or user.deleted_at is not None:
        return response

    try:
        config = resolve_email_config(db)
        if config["sender_email"] and config["app_password"]:
            send_verification_email(db, config, user)
    except Exception as exc:  # noqa: BLE001
        logger.error("Resend verification for %s failed: %s", email, exc)

    return response


@router.get("/verify-reset-token/{token}")
def verify_reset_token_endpoint(token: str, db: Session = Depends(get_db)):
    """Is this reset link still good? Read-only — it does NOT spend the token."""
    row = peek_reset_token(db, token)
    if not row:
        return {"valid": False, "error": "This link has expired or has already been used."}
    user = db.query(User).filter(func.lower(User.email) == row.lower()).first()
    if not user:
        return {"valid": False, "error": "User not found"}
    return {"valid": True, "email": row}


@router.post("/change-password", response_model=SuccessMessage)
def change_password(data: ChangePasswordRequest, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    """Change user password"""
    if not verify_password(data.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    validate_password_strength(data.new_password)
    current_user.password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


# -------------------------
# PROFILE MANAGEMENT ROUTES
# -------------------------

@router.get("/me", response_model=UserOut)
def get_user_me(user: User = Depends(get_current_user)):
    """Get current user details"""
    if user.role.lower() != "user":
        raise HTTPException(403, "User access only")
    return user




@router.get("/get_profile", response_model=UserOut)
def get_profile(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Fetch full user profile with avatar absolute URL"""

    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    base_url = str(request.base_url).rstrip("/")

    # Detach before touching the avatar. This object is live in the session,
    # so assigning to it could be flushed back and permanently rewrite the
    # stored path into an absolute URL — which would then get prefixed again
    # on the next read.
    db.expunge(user)

    stored = (user.avatar or "").strip()
    if not stored:
        user.avatar = f"{base_url}/static/defaults/user.png"
    elif stored.startswith(("http://", "https://")):
        # Already absolute — a Google profile picture, for instance. Prefixing
        # it produced "<api>/https://lh3.googleusercontent.com/..." and a 404.
        user.avatar = stored
    else:
        user.avatar = f"{base_url}/{stored.lstrip('/')}"

    return user


@router.put("/update_profile", response_model=UserOut)
def update_profile(
        first_name: str = Form(None),
        last_name: str = Form(None),
        email: str = Form(None),
        phone: str = Form(None),
        address_line1: str = Form(None),
        address_line2: str = Form(None),
        city: str = Form(None),
        postal_code: str = Form(None),
        country: str = Form(None),
        avatar: UploadFile = File(None),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """Update user profile with validation"""

    # Validate email
    if email is not None:
        email = email.strip()
        if "@" not in email or "." not in email:
            raise HTTPException(status_code=400, detail="Invalid email format")

        # Check if email already exists for another user
        existing_email = db.query(User).filter(User.email == email, User.id != current_user.id).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already taken")

        current_user.email = email

    # Validate and update phone
    if phone is not None:
        phone = phone.strip()
        if not phone.isdigit() or len(phone) < 8:
            raise HTTPException(status_code=400, detail="Invalid phone number")
        current_user.phone = phone

    # Apply profile fields
    if first_name: current_user.first_name = first_name.strip()
    if last_name: current_user.last_name = last_name.strip()
    if address_line1: current_user.address_line1 = address_line1.strip()
    if address_line2: current_user.address_line2 = address_line2.strip()
    if city: current_user.city = city.strip()
    if postal_code: current_user.postal_code = postal_code.strip()
    if country: current_user.country = country.strip()

    # Handle avatar upload
    if avatar:
        # Validate file size
        if avatar.size and avatar.size > 2 * 1024 * 1024:  # 2MB limit
            raise HTTPException(status_code=400, detail="Image must be less than 2MB")

        try:
            avatar_url = save_avatar_file(avatar, current_user.id)

            # Remove old avatar
            old = current_user.avatar
            if old and "/static/avatars/" in old:
                old_path = old.replace("/static/", "")
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                    except Exception:
                        pass

            current_user.avatar = avatar_url

        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to upload avatar")

    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/delete", status_code=204)
def delete_account(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user.id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"detail": "Account deleted successfully"}


# -------------------------
# WISHLIST ROUTES
# -------------------------

@router.get("/wishlist")
def get_wishlist(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = wishlist_crud.get_user_wishlist(db, user.id)
    return JSONResponse(content=jsonable_encoder(data))


@router.post("/wishlist", response_model=WishlistItemOut)
def add_wishlist_item(
    wishlist: WishlistCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not wishlist.product_id:
        raise HTTPException(status_code=400, detail="product_id required")
    return wishlist_crud.add_to_wishlist(db, user.id, wishlist)


@router.delete("/wishlist/{product_id}", response_model=SuccessMessage)
def delete_wishlist_item(product_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    success = wishlist_crud.remove_from_wishlist(db, user.id, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found in wishlist")
    return {"message": "Item removed"}


# -------------------------
# CART ROUTES
# -------------------------

@router.post("/add_cart", response_model=CartItemOut)
def add_to_cart(
        data: CartItemCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == data.product_id
    ).first()

    if existing:
        existing.quantity += data.quantity
        db.commit()
        db.refresh(existing)
        item = existing
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=data.product_id,
            quantity=data.quantity
        )
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)
        item = cart_item

    # Return response matching CartItemOut schema
    return {
        "id": item.id,
        "user_id": item.user_id,
        "product_id": item.product_id,
        "quantity": item.quantity,
        "product_name": product.name,
    }


@router.get("/get-cart", response_model=List[CartItemOut])
def get_cart_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .options(joinedload(CartItem.product))
        .all()
    )

    result = []
    for item in items:
        product = item.product

        # ✅ Convert images to list for consistent frontend use
        images = []
        if product and product.images:
            images = [img.strip() for img in product.images.split(",") if img.strip()]

        result.append({
            "id": item.id,
            "user_id": item.user_id,                 # ✅ required by schema
            "product_id": item.product_id,
            "quantity": item.quantity,
            "product_name": product.name if product else None,
            "price": product.price if product else None,
            "discount_price": product.discount_price if product else None,
            "images": images
        })

    return jsonable_encoder(result)  # ✅ handles datetime serialization safely



@router.put("/cart/{cart_item_id}", response_model=CartItemOut)
def update_cart_item(
        cart_item_id: int,
        data: CartItemUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    item = db.query(CartItem).filter(
        CartItem.id == cart_item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    item.quantity = data.quantity
    db.commit()
    db.refresh(item)
    return item


@router.delete("/cart/{cart_item_id}")
def remove_cart_item(
        cart_item_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    item = db.query(CartItem).filter(
        CartItem.id == cart_item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()
    return {"message": "Item removed from cart"}


@router.delete("/clear/all")
def clear_cart(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Cart cleared successfully"}


# -------------------------
# ORDER ROUTES
# -------------------------

@router.post("/checkout", response_model=SuccessMessage)
def checkout_from_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user),
                       coupon_code: Optional[str] = None):
    """Convert cart to order with validations"""
    cart_items = db.query(CartItem).filter(CartItem.user_id == user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # ensure product availability & compute total
    total = 0.0
    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product (id={item.product_id}) not found.")
        # optional stock check if product has `stock` attribute
        stock = getattr(product, "stock", None)
        if stock is not None and item.quantity > stock:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product id={product.id}.")
        total += item.quantity * item.price

    discount = 0.0
    coupon = None
    if coupon_code:
        coupon, discount = parse_coupon(db, coupon_code, total)
        # increment usage (best-effort)
        try:
            coupon.used_count = getattr(coupon, "used_count", 0) + 1
            db.commit()
        except Exception:
            db.rollback()

    order = Order(user_id=user.id, total_amount=total - discount, created_at=datetime.utcnow(), status="pending")
    db.add(order)
    db.commit()
    db.refresh(order)

    for item in cart_items:
        db.add(OrderItem(order_id=order.id, product_id=item.product_id, quantity=item.quantity, price=item.price))
        db.delete(item)
    db.commit()

    try:
        send_email(user.email, "Order Placed", f"Your order #{order.id} has been placed successfully.")
    except Exception:
        # don't fail the request if email fails
        pass

    return {"message": f"Order placed successfully (ID: {order.id})"}

@router.get("/user/orders/history")
def get_my_orders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    result = []
    for order in orders:
        # Calculate total items
        total_items = sum(item.quantity for item in order.items)

        # Get items with product names
        items_data = []
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()

            items_data.append({
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.price,

                "product_name": product.name if product else f"Product #{item.product_id}",
                "product_image": product.images if product else None,

                # ✅ ADD THIS LINE
                "hsn_code": product.hsn_code if product and product.hsn_code else None,
            })

        # Get latest tracking
        latest_tracking = (
            db.query(OrderTracking)
            .filter(OrderTracking.order_id == order.id)
            .order_by(OrderTracking.timestamp.desc())
            .first()
        )

        # Payment method label
        payment_method = order.payment_method or "cod"
        payment_labels = {
            "cod": "Cash on Delivery",
            "card": "Credit/Debit Card",
            "upi": "UPI Payment",
            "netbanking": "Net Banking",
        }

        result.append({
            "id": order.id,
            "status": order.status,
            "total_amount": order.total_amount,
            "total_items": total_items,
            "created_at": order.created_at.isoformat() if order.created_at else None,

            # ✅ Payment info
            "payment_method": payment_method,
            "payment_method_label": payment_labels.get(payment_method, payment_method),
            "payment_status": order.payment_status or "unpaid",

            # ✅ Shipping
            "shipping_address": order.shipping_address,

            # ✅ Items
            "items": items_data,

            # ✅ Latest tracking
            "latest_tracking": {
                "status": latest_tracking.status,
                "message": latest_tracking.message,
                "timestamp": latest_tracking.timestamp.isoformat()
                if latest_tracking and latest_tracking.timestamp
                else None,
            } if latest_tracking else None,
        })

    return result


# Payment method display labels
PAYMENT_METHOD_LABELS = {
    "cod": "Cash on Delivery",
    "card": "Card",
    "upi": "UPI",
    "netbanking": "Net Banking",
}


@router.post("/orders/create", response_model=OrderOut)
async def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not data.items:
        raise HTTPException(status_code=400, detail="No order items provided")

    subtotal = 0
    order_items_data = []

    # 1️⃣ Validate products & calculate total
    for item in data.items:
        if item.quantity <= 0:
            raise HTTPException(
                status_code=400, detail="Quantity must be greater than 0"
            )

        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product ID {item.product_id} not found",
            )

        mrp = product.price
        selling_price = product.discount_price or product.price

        subtotal += selling_price * item.quantity

        order_items_data.append({
            "product": product,
            "product_id": product.id,
            "quantity": item.quantity,
            "price": product.price,  # MRP ✅
        })
    coupon_discount = 0

    if data.coupon_code:
        coupon = db.query(Coupon).filter(
            Coupon.code == data.coupon_code,
            Coupon.active == True
        ).first()

        if not coupon:
            raise HTTPException(status_code=400, detail="Invalid or expired coupon code")

        if coupon.discount_type == "percentage":
            coupon_discount = (coupon.discount_value / 100) * subtotal
        else:
            coupon_discount = coupon.discount_value

        coupon_discount = min(coupon_discount, subtotal)

    # ✅ FINAL AMOUNT
    final_amount = subtotal - coupon_discount

    base_amount = final_amount / 1.18
    gst_amount = final_amount - base_amount

    subtotal = round(subtotal, 2)
    coupon_discount = round(coupon_discount, 2)
    final_amount = round(final_amount, 2)

    base_amount = round(final_amount / 1.18, 2)
    gst_amount = round(final_amount - base_amount, 2)
    # 2️⃣ Determine payment status based on payment method
    payment_method = data.payment_method if data.payment_method else "cod"
    if payment_method == "cod":
        payment_status = "unpaid"
        order_status = "processing"
    elif payment_method in ("card", "upi", "netbanking"):
        payment_status = "pending"
        order_status = "processing"
    else:
        payment_status = "unpaid"
        order_status = "pending"

    # 3️⃣ Create Order
    order = Order(
        user_id=current_user.id,
        status=order_status,
        total_amount=final_amount,
        payment_method=payment_method,
        payment_status=payment_status,

        customer_name=current_user.first_name or "Customer",
        phone_number=current_user.phone or "0000000000",

        shipping_address=data.shipping_address or current_user.address_line1 or "N/A",
        city=current_user.city or "N/A",
        pincode=current_user.postal_code or "000000",

        created_at=datetime.utcnow(),
    )

    db.add(order)
    db.commit()
    db.refresh(order)
    from datetime import timezone
    import pytz

    ist = pytz.timezone("Asia/Kolkata")

    order_date = order.created_at.replace(
        tzinfo=timezone.utc
    ).astimezone(
        ist
    )

    formatted_date = order_date.strftime("%d %B %Y %I:%M %p IST")
    email_items = []

    for item in order_items_data:
        product = item["product"]

        email_items.append({
            "name": product.name,
            "price": product.discount_price or product.price,  # selling price ✅
            # ,  # MRP
            "quantity": item["quantity"],  # use same key
            "image": product.images[0] if product.images else "",
            "product_id": product.id,
            "hsn_code": product.hsn_code
        })
    # 4️⃣ Create Order Items
    for item in order_items_data:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item["product_id"],
                quantity=item["quantity"],
                price=item["price"],  # MRP# ADD THIS FIELD
            )
        )

    # 5️⃣ Initial Tracking
    payment_label = PAYMENT_METHOD_LABELS.get(payment_method, payment_method)
    tracking_message = f"Order placed successfully. Payment: {payment_label}."

    if payment_method == "cod":
        tracking_message += " Amount ₹{:.2f} will be collected on delivery.".format(
        final_amount)

    db.add(
        OrderTracking(
            order_id=order.id,
            status="Order Placed",
            message=tracking_message,
            timestamp=datetime.utcnow(),
        )
    )

    db.commit()
    db.refresh(order)

    # 6️⃣ Send email only for COD
    if payment_method == "cod" and current_user.email:
        try:
            await send_order_email(
                customer_email=current_user.email,
                order_id=order.id,
                amount=final_amount,
                items=email_items,
                customer_name=current_user.first_name,
                address_line1=current_user.address_line1,
                city=current_user.city,
                postal_code=current_user.postal_code,
                country=current_user.country,
                phone=current_user.phone,
                order_date=formatted_date
            )
        except Exception as e:
            logger.error(f"Order email failed: {e}")

    # 7️⃣ Return response
    return {
        "id": order.id,
        "user_id": order.user_id,  # ✅ ADD THIS
        "status": order.status,
        "created_at": order.created_at,  # ✅ ADD THIS

        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "shipping_address": order.shipping_address,

        # pricing
        "subtotal": subtotal,
        "discount": coupon_discount,
        "base_amount": base_amount,
        "gst": gst_amount,
        "total_amount": final_amount,

        # relations
        "user": current_user,
        "items": order.items,
        "tracking_updates": order.tracking if hasattr(order, "tracking") else []
    }


# ─── Get Live Order Status ───
@router.get("/user/orders/{order_id}/live")
def get_live_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == user.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "status": order.status,
        "payment_method": order.payment_method or "cod",
        "payment_status": order.payment_status or "unpaid",
        "lat": order.current_lat,
        "lng": order.current_lng,
        "last_update": order.last_location_update,
    }


# ─── Get Single Order Detail (UPDATED) ───
@router.get("/user/orders/{order_id}")
def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == user.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Build items with product names AND images
    items_data = []

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()

        product_image = None

        if product and product.images:
            try:
                import json

                images = json.loads(product.images) if isinstance(product.images, str) else product.images

                if isinstance(images, list) and len(images) > 0:
                    product_image = images[0]
                elif isinstance(images, str):
                    product_image = images

            except Exception:
                product_image = product.images if isinstance(product.images, str) else None

        items_data.append(
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.price,
                "subtotal": item.price * item.quantity,

                "product_name": product.name if product else f"Product #{item.product_id}",
                "product_image": product_image,
                "product_images": product.images if product else None,
                "product_description": product.description if product else None,
                "product_category": product.category if product and hasattr(product, "category") else None,

                # ✅ ADD THIS LINE
                "hsn_code": product.hsn_code if product and hasattr(product, "hsn_code") else None,
            }
        )

    # Tracking history
    tracking_data = []

    for track in order.tracking:
        tracking_data.append(
            {
                "id": track.id,
                "status": track.status,
                "message": track.message,
                "timestamp": track.timestamp.isoformat() if track.timestamp else None,
            }
        )

    # Total items
    total_items = sum(item["quantity"] for item in items_data)

    # GST calculation
    subtotal = order.total_amount
    gst = subtotal * 0.18
    grand_total = subtotal + gst

    # Invoice URL
    invoice_url = f"https://api.mizorpaymart.com/orders/{order.id}/invoice"

    return {
        "id": order.id,
        "user_id": order.user_id,

        # ✅ ADD THESE (NEW FIELDS)
        "customer_name": order.customer_name,
        "phone_number": order.phone_number,
        "transaction_id": order.transaction_id,
        "utr_number": order.utr_number,

        "shipping_address": order.shipping_address,
        "city": order.city,
        "state": order.state,
        "pincode": order.pincode,

        "status": order.status,
        "payment_method": order.payment_method or "cod",
        "payment_status": order.payment_status or "unpaid",

        "subtotal": subtotal,
        "gst": gst,
        "total_amount": grand_total,

        "invoice_url": invoice_url,

        "created_at": order.created_at.isoformat() if order.created_at else None,
        "total_items": total_items,

        "items": items_data,
        "tracking": tracking_data,
    }


# ─── Get All User Orders (UPDATED) ───
@router.get("/user/orders")
def get_user_orders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    result = []
    for order in orders:
        total_items = sum(item.quantity for item in order.items)

        # Get latest tracking status
        latest_tracking = (
            db.query(OrderTracking)
            .filter(OrderTracking.order_id == order.id)
            .order_by(OrderTracking.timestamp.desc())
            .first()
        )

        result.append(
            {
                "id": order.id,
                "status": order.status,
                "total_amount": order.total_amount,
                "payment_method": order.payment_method or "cod",
                "payment_status": order.payment_status or "unpaid",
                "total_items": total_items,
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "latest_tracking": {
                    "status": latest_tracking.status,
                    "message": latest_tracking.message,
                    "timestamp": latest_tracking.timestamp.isoformat()
                    if latest_tracking and latest_tracking.timestamp
                    else None,
                }
                if latest_tracking
                else None,
            }
        )

    return result


# ─── WebSocket for Live Order Updates ───
def verify_jwt(token):
    pass


@router.websocket("/ws/orders/{order_id}")
async def order_ws(websocket: WebSocket, order_id: int):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    user = verify_jwt(token)

    order = db.query(Order).filter(
        Order.id == order_id, Order.user_id == user.id
    ).first()

    if not order:
        await websocket.close(code=1008)
        return

    await order_manager.connect(order_id, websocket)


# ─── Get Order Tracking (UPDATED) ───
@router.get("/user/orders/{order_id}/tracking")
def get_order_tracking(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == user.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    tracking = (
        db.query(OrderTracking)
        .filter(OrderTracking.order_id == order.id)
        .order_by(OrderTracking.timestamp.asc())
        .all()
    )

    # Include payment info in tracking response
    return {
        "order_id": order.id,
        "status": order.status,
        "payment_method": order.payment_method or "cod",
        "payment_status": order.payment_status or "unpaid",
        "payment_method_label": PAYMENT_METHOD_LABELS.get(
            order.payment_method or "cod", "Unknown"
        ),
        "tracking_updates": [
            {
                "id": t.id,
                "status": t.status,
                "message": t.message,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            }
            for t in tracking
        ],
    }


# ─── Cancel Order (UPDATED with payment info) ───
@router.put("/user/orders/{order_id}/cancel")
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == user.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status not in ["pending", "processing"]:
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")

    # Update order status
    order.status = "cancelled"

    # Update payment status based on current payment status
    payment_method = order.payment_method or "cod"
    payment_label = PAYMENT_METHOD_LABELS.get(payment_method, payment_method)

    if order.payment_status == "paid":
        order.payment_status = "refunded"
        cancel_message = (
            f"Order cancelled by user. "
            f"Payment method: {payment_label}. "
            f"Refund initiated for ₹{order.total_amount:.2f}."
        )
    else:
        order.payment_status = "unpaid"
        if payment_method == "cod":
            cancel_message = (
                f"Order cancelled by user. "
                f"Payment method: {payment_label}. "
                f"No payment was collected."
            )
        else:
            cancel_message = (
                f"Order cancelled by user. "
                f"Payment method: {payment_label}. "
                f"No charges applied."
            )

    db.commit()

    # Add tracking entry
    db.add(
        OrderTracking(
            order_id=order.id,
            status="Cancelled",
            message=cancel_message,
            timestamp=datetime.utcnow(),
        )
    )
    db.commit()

    return {
        "message": "Order cancelled successfully",
        "order_id": order.id,
        "payment_method": payment_method,
        "payment_status": order.payment_status,
        "refund_info": {
            "refund_initiated": order.payment_status == "refunded",
            "refund_amount": order.total_amount if order.payment_status == "refunded" else 0,
            "payment_method_label": payment_label,
        },
    }


# -------------------------
# REVIEW ROUTES
# -------------------------

@router.post("/product/{product_id}/review", status_code=201)
def create_review(
        product_id: int,
        name: str = Form(...),
        rating: float = Form(...),
        comment: Optional[str] = Form(None),
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
):
    if product_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid product_id")

    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    rating = validate_rating(rating)

    new_rev = ProductReview(
        product_id=product_id,
        user_id=current_user.id,
        name=name.strip(),
        rating=rating,
        comment=(comment or "").strip()
    )

    db.add(new_rev)
    db.commit()
    db.refresh(new_rev)

    _recalculate_product_rating(db, prod)

    return {
        "status": True,
        "message": "Review added",
        "review_id": new_rev.id,
        "name": new_rev.name,
        "rating": new_rev.rating,
        "comment": new_rev.comment,
        "created_at": new_rev.created_at
    }




@router.get("/reviews")
def list_all_reviews(
        db: Session = Depends(get_db),
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(10, ge=1, le=100, description="Items per page")
):
    # Calculate offset
    offset = (page - 1) * page_size

    # Get total count
    total_count = (
        db.query(ProductReview)
        .join(models.User, models.User.id == ProductReview.user_id, isouter=True)
        .count()
    )

    # Get paginated reviews
    reviews = (
        db.query(ProductReview, models.User)
        .join(models.User, models.User.id == ProductReview.user_id, isouter=True)
        .order_by(ProductReview.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    # Calculate total pages
    total_pages = (total_count + page_size - 1) // page_size

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "results": [
            {
                "id": r.ProductReview.id,
                "product_id": r.ProductReview.product_id,
                "user_id": r.ProductReview.user_id,
                "user_name": (
                    f"{r.User.first_name} {r.User.last_name}"
                    if r.User else None
                ),
                "rating": r.ProductReview.rating,
                "comment": r.ProductReview.comment,
                "created_at": (
                    r.ProductReview.created_at.isoformat()
                    if r.ProductReview.created_at else None
                ),
            }
            for r in reviews
        ]
    }


@router.get("/product/{product_id}/reviews")
def list_reviews(
        product_id: int,
        db: Session = Depends(get_db),
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(3, ge=1, le=100, description="Items per page")  # Changed default to 3
):
    if product_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid product_id")

    # Calculate offset
    offset = (page - 1) * page_size

    # Get total count for this product
    total_count = (
        db.query(ProductReview)
        .filter(ProductReview.product_id == product_id)
        .count()
    )

    # Fetch reviews with joined user data and pagination
    reviews = (
        db.query(ProductReview, models.User)
        .join(models.User, models.User.id == ProductReview.user_id, isouter=True)
        .filter(ProductReview.product_id == product_id)
        .order_by(ProductReview.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    # Calculate total pages
    total_pages = (total_count + page_size - 1) // page_size

    # Prepare output
    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "reviews": [
            {
                "id": r.ProductReview.id,
                "product_id": r.ProductReview.product_id,
                "user_id": r.ProductReview.user_id,
                "user_name": (
                    f"{r.User.first_name} {r.User.last_name}"
                    if r.User else None
                ),
                "rating": r.ProductReview.rating,
                "comment": r.ProductReview.comment,
                "created_at": (
                    r.ProductReview.created_at.isoformat()
                    if r.ProductReview.created_at else None
                ),
            }
            for r in reviews
        ]
    }


@router.put("/product/review/{review_id}")
def update_review(
        review_id: int,
        rating: Optional[float] = Form(None),
        comment: Optional[str] = Form(None),
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
):
    r = db.query(ProductReview).filter(ProductReview.id == review_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Review not found")

    if r.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can update only your own review")

    if rating is not None:
        r.rating = validate_rating(rating)
    if comment is not None:
        r.comment = comment.strip()

    db.commit()
    db.refresh(r)

    prod = db.query(Product).filter(Product.id == r.product_id).first()
    if prod:
        _recalculate_product_rating(db, prod)

    return {"status": True, "message": "Review updated", "review_id": r.id}



@router.put("/product/review/edit/{review_id}")
def admin_edit_review(
        review_id: int,
        rating: Optional[float] = Form(None),
        comment: Optional[str] = Form(None),
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
):
    # ✅ Allow only admin by role
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can edit reviews")

    r = db.query(ProductReview).filter(ProductReview.id == review_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Review not found")

    if rating is not None:
        r.rating = validate_rating(rating)

    if comment is not None:
        r.comment = comment.strip()

    db.commit()
    db.refresh(r)

    prod = db.query(Product).filter(Product.id == r.product_id).first()
    if prod:
        _recalculate_product_rating(db, prod)

    user = db.query(models.User).filter(models.User.id == r.user_id).first()

    return {
        "status": True,
        "message": "Review updated by admin",
        "data": {
            "id": r.id,
            "product_id": r.product_id,
            "user_id": r.user_id,
            "user_name": f"{user.first_name} {user.last_name}" if user else None,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
    }





@router.delete("/product/review/delete/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # ✅ Check admin role
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete reviews")

    # ✅ Find the review
    review = db.query(ProductReview).filter(ProductReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # ✅ Delete review
    product = db.query(Product).filter(Product.id == review.product_id).first()
    db.delete(review)
    db.commit()

    # ✅ Recalculate rating if product exists
    if product:
        _recalculate_product_rating(db, product)

    return {"status": True, "message": "Review deleted by admin"}

class ReplyCreate(BaseModel):
    comment: str
    parent_id: Optional[int] = None

# 🟢 POST — Create Reply (Admin Only)
@router.post("/{review_id}/reply")
def create_reply(
    review_id: int,
    reply_text: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # ✅ Only admins can reply
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can reply to reviews")

    review = db.query(models.ProductReview).filter(models.ProductReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    reply = models.ProductReviewReply(
        review_id=review_id,
        admin_id=current_user.id,
        reply_text=reply_text,
    )

    db.add(reply)
    db.commit()
    db.refresh(reply)

    return {"status": True, "message": "Reply created successfully", "reply": reply}


# 🟡 PUT — Edit Reply (Admin Only)
@router.put("/{review_id}/reply/{reply_id}")
def edit_reply(
    review_id: int,
    reply_id: int,
    reply_text: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # ✅ Only admins can edit
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can edit replies")

    reply = (
        db.query(models.ProductReviewReply)
        .filter(
            models.ProductReviewReply.id == reply_id,
            models.ProductReviewReply.review_id == review_id,
        )
        .first()
    )

    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    reply.reply_text = reply_text
    db.commit()
    db.refresh(reply)

    return {"status": True, "message": "Reply updated successfully", "reply": reply}


# 🔴 DELETE — Remove Reply (Admin Only)
@router.delete("/{review_id}/reply/{reply_id}")
def delete_reply(
    review_id: int,
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # ✅ Only admins can delete
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete replies")

    reply = (
        db.query(models.ProductReviewReply)
        .filter(
            models.ProductReviewReply.id == reply_id,
            models.ProductReviewReply.review_id == review_id,
        )
        .first()
    )

    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    db.delete(reply)
    db.commit()

    return {"status": True, "message": "Reply deleted successfully"}


# 🟣 GET — List all replies for a specific review (Admin Only)
@router.get("/{review_id}/replies")
def get_replies(
    review_id: int,
    db: Session = Depends(get_db),
):
    replies = (
        db.query(models.ProductReviewReply)
        .filter(models.ProductReviewReply.review_id == review_id)
        .all()
    )

    return {
        "status": True,
        "review_id": review_id,
        "replies": [
            {
                "id": r.id,
                "reply_text": r.reply_text,
                "created_at": r.created_at,
                "admin_name": "Admin",
            }
            for r in replies
        ],
    }







# -------------------------
# SUPPORT ROUTES
# -------------------------

@router.post("/support", response_model=SuccessMessage)
def submit_support(subject: str = Form(...), message: str = Form(...), db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    """Submit support message with validation"""
    if not subject or not subject.strip():
        raise HTTPException(status_code=400, detail="Subject is required.")
    if not message or not message.strip():
        raise HTTPException(status_code=400, detail="Message is required.")
    if len(subject.strip()) > 200:
        raise HTTPException(status_code=400, detail="Subject too long (max 200 chars).")
    if len(message.strip()) > 2000:
        raise HTTPException(status_code=400, detail="Message too long (max 2000 chars).")

    msg = SupportMessage(user_id=user.id, subject=subject.strip(), message=message.strip(),
                         created_at=datetime.utcnow())
    db.add(msg)
    db.commit()
    return {"message": "Support request submitted successfully"}



# ═══════════════════════════════════════════════════════════
#              CONSTANTS
# ═══════════════════════════════════════════════════════════

PAYMENT_METHOD_LABELS = {
    "cod": "Cash on Delivery",
    "card": "Credit/Debit Card",
    "upi": "UPI Payment",
    "netbanking": "Net Banking",
}


# ═══════════════════════════════════════════════════════════
#              HELPER: Get product image
# ═══════════════════════════════════════════════════════════

def get_first_product_image(product) -> Optional[str]:
    """Extract first image from product images field."""
    if not product or not product.images:
        return None
    try:
        images = (
            json.loads(product.images)
            if isinstance(product.images, str)
            else product.images
        )
        if isinstance(images, list) and len(images) > 0:
            return images[0]
        elif isinstance(images, str):
            return images
    except (json.JSONDecodeError, TypeError):
        return product.images if isinstance(product.images, str) else None
    return None


# ═══════════════════════════════════════════════════════════
#      HELPER: Create invoice from order
# ═══════════════════════════════════════════════════════════

def create_invoice_from_order(
    order: Order,
    user: User,
    db: Session,
    tax_rate: float = 18,
    shipping_amount: float = 0,
    discount_amount: float = 0,
    notes: Optional[str] = None,
) -> Invoice:
    """Create an invoice from an existing order."""

    # Check if invoice already exists
    existing = db.query(Invoice).filter(Invoice.order_id == order.id).first()
    if existing:
        return existing

    # ── Generate unique invoice number ──
    invoice_number = Invoice.generate_invoice_number()

    # Make sure it's unique in DB
    while db.query(Invoice).filter(
        Invoice.invoice_number == invoice_number
    ).first():
        invoice_number = Invoice.generate_invoice_number()

    # ── Calculate amounts ──
    subtotal = 0
    invoice_items_data = []

    for item in order.items:
        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        item_subtotal = item.price * item.quantity
        item_tax = (item_subtotal * tax_rate) / 100
        item_total = item_subtotal + item_tax
        subtotal += item_subtotal

        product_image = get_first_product_image(product)

        invoice_items_data.append({
            "product_id": item.product_id,
            "product_name": (
                product.name if product else f"Product #{item.product_id}"
            ),
            "product_image": product_image,
            "product_description": product.description if product else None,
            "product_sku": getattr(product, 'sku', None) if product else None,
            "unit_price": item.price,
            "quantity": item.quantity,
            "discount": 0,
            "tax_rate": tax_rate,
            "tax_amount": round(item_tax, 2),
            "subtotal": round(item_subtotal, 2),
            "total": round(item_total, 2),
        })

    # ── Calculate totals ──
    tax_amount = (subtotal * tax_rate) / 100

    if shipping_amount == 0:
        shipping_amount = 0 if subtotal > 999 else 150

    total_amount = subtotal + tax_amount + shipping_amount - discount_amount

    # ── Build customer name ──
    customer_name = ""
    if hasattr(user, 'first_name') and user.first_name:
        customer_name = user.first_name
        if hasattr(user, 'last_name') and user.last_name:
            customer_name += f" {user.last_name}"
    elif hasattr(user, 'name') and user.name:
        customer_name = user.name
    elif hasattr(user, 'email'):
        customer_name = user.email

    # ── Create Invoice ──
    invoice = Invoice(
        invoice_number=invoice_number,
        order_id=order.id,
        user_id=user.id,
        customer_name=customer_name,
        customer_email=getattr(user, 'email', None),
        customer_phone=getattr(user, 'phone', None),
        billing_address=order.shipping_address,
        shipping_address=order.shipping_address,
        subtotal=round(subtotal, 2),
        discount_amount=round(discount_amount, 2),
        shipping_amount=round(shipping_amount, 2),
        tax_rate=tax_rate,
        tax_amount=round(tax_amount, 2),
        total_amount=round(total_amount, 2),
        payment_method=order.payment_method or "cod",
        payment_status=order.payment_status or "unpaid",
        status="generated",
        notes=notes,
        invoice_date=datetime.utcnow(),
        due_date=datetime.utcnow() + timedelta(days=30),
        paid_at=datetime.utcnow() if order.payment_status == "paid" else None,
        created_at=datetime.utcnow(),
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # ── Create Invoice Items ──
    for item_data in invoice_items_data:
        db.add(InvoiceItem(
            invoice_id=invoice.id,
            **item_data,
        ))

    # ── Add tracking ──
    db.add(OrderTracking(
        order_id=order.id,
        status="Invoice Generated",
        message=f"Invoice {invoice.invoice_number} generated",
        timestamp=datetime.utcnow(),
    ))

    db.commit()
    db.refresh(invoice)

    return invoice


# ═══════════════════════════════════════════════════════════
#    HELPER: Build invoice response dict
# ═══════════════════════════════════════════════════════════

def build_invoice_response(invoice: Invoice) -> dict:
    """Build a complete invoice response dict."""
    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "order_id": invoice.order_id,
        "user_id": invoice.user_id,

        # Customer
        "customer_name": invoice.customer_name,
        "customer_email": invoice.customer_email,
        "customer_phone": invoice.customer_phone,
        "billing_address": invoice.billing_address,
        "shipping_address": invoice.shipping_address,

        # Amounts
        "subtotal": invoice.subtotal,
        "discount_amount": invoice.discount_amount,
        "shipping_amount": invoice.shipping_amount,
        "tax_rate": invoice.tax_rate,
        "tax_amount": invoice.tax_amount,
        "total_amount": invoice.total_amount,

        # Payment
        "payment_method": invoice.payment_method or "cod",
        "payment_method_label": PAYMENT_METHOD_LABELS.get(
            invoice.payment_method or "cod", "Unknown"
        ),
        "payment_status": invoice.payment_status or "unpaid",

        # Status
        "status": invoice.status,
        "notes": invoice.notes,

        # Dates ── FIXED: paid_date → paid_at ──
        "invoice_date": (
            invoice.invoice_date.isoformat() if invoice.invoice_date else None
        ),
        "due_date": (
            invoice.due_date.isoformat() if invoice.due_date else None
        ),
        "paid_at": (
            invoice.paid_at.isoformat() if invoice.paid_at else None
        ),
        "created_at": (
            invoice.created_at.isoformat() if invoice.created_at else None
        ),

        # Items
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "product_image": item.product_image,
                "product_description": item.product_description,
                "product_sku": item.product_sku,
                "unit_price": item.unit_price,
                "quantity": item.quantity,
                "discount": item.discount,
                "tax_rate": item.tax_rate,
                "tax_amount": item.tax_amount,
                "subtotal": item.subtotal,
                "total": item.total,
            }
            for item in invoice.items
        ],

        # Summary
        "total_items": sum(item.quantity for item in invoice.items),
        "total_products": len(invoice.items),
    }


# ═══════════════════════════════════════════════════════════
#   ROUTES (Order matters! Static routes BEFORE dynamic)
# ═══════════════════════════════════════════════════════════


# ── 1. GET ALL USER INVOICES ──
@router.get("/invoices")
def get_user_invoices(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    status: Optional[str] = Query(
        None, description="Filter: generated, sent, paid, cancelled"
    ),
    payment_status: Optional[str] = Query(
        None, description="Filter: unpaid, pending, paid, refunded"
    ),
    payment_method: Optional[str] = Query(
        None, description="Filter: cod, upi, card, netbanking"
    ),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
):
    """Get all invoices for the current user."""
    query = db.query(Invoice).filter(Invoice.user_id == user.id)

    if status:
        query = query.filter(Invoice.status == status)
    if payment_status:
        query = query.filter(Invoice.payment_status == payment_status)
    if payment_method:
        query = query.filter(Invoice.payment_method == payment_method)

    total = query.count()

    invoices = (
        query
        .order_by(Invoice.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    result = []
    for invoice in invoices:
        result.append({
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "order_id": invoice.order_id,
            "customer_name": invoice.customer_name,
            "subtotal": invoice.subtotal,
            "tax_amount": invoice.tax_amount,
            "shipping_amount": invoice.shipping_amount,
            "discount_amount": invoice.discount_amount,
            "total_amount": invoice.total_amount,
            "payment_method": invoice.payment_method or "cod",
            "payment_method_label": PAYMENT_METHOD_LABELS.get(
                invoice.payment_method or "cod", "Unknown"
            ),
            "payment_status": invoice.payment_status or "unpaid",
            "status": invoice.status,
            "invoice_date": (
                invoice.invoice_date.isoformat()
                if invoice.invoice_date else None
            ),
            "total_items": sum(item.quantity for item in invoice.items),
            "total_products": len(invoice.items),
            "items_preview": [
                {
                    "product_name": item.product_name,
                    "product_image": item.product_image,
                    "quantity": item.quantity,
                    "total": item.total,
                }
                for item in invoice.items[:3]
            ],
        })

    return {
        "invoices": result,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


# ── 2. GET INVOICE SUMMARY / STATS ──
@router.get("/invoices-summary")
def get_invoice_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get invoice statistics for the current user."""
    all_invoices = db.query(Invoice).filter(
        Invoice.user_id == user.id
    ).all()

    total_invoices = len(all_invoices)
    total_paid = sum(1 for i in all_invoices if i.payment_status == "paid")
    total_unpaid = sum(
        1 for i in all_invoices if i.payment_status in ("unpaid", "pending")
    )
    total_refunded = sum(
        1 for i in all_invoices if i.payment_status == "refunded"
    )

    total_amount = sum(i.total_amount for i in all_invoices)
    paid_amount = sum(
        i.total_amount for i in all_invoices if i.payment_status == "paid"
    )
    unpaid_amount = sum(
        i.total_amount for i in all_invoices
        if i.payment_status in ("unpaid", "pending")
    )

    return {
        "total_invoices": total_invoices,
        "total_paid": total_paid,
        "total_unpaid": total_unpaid,
        "total_refunded": total_refunded,
        "total_amount": round(total_amount, 2),
        "paid_amount": round(paid_amount, 2),
        "unpaid_amount": round(unpaid_amount, 2),
    }


# ── 3. GET INVOICE BY INVOICE NUMBER (Dynamic route AFTER static) ──
@router.get("/invoices/{invoice_number}")
def get_invoice_by_number(
    invoice_number: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get invoice by invoice number."""
    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.invoice_number == invoice_number,
            Invoice.user_id == user.id,
        )
        .first()
    )

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return build_invoice_response(invoice)



# @router.get("/list")
# def list_coupons(
#
#         db: Session = Depends(get_db)
# # current_user=Depends(get_current_user)
#
#                  ): # current_user=Depends(get_current_admin_user)
#     """List all coupons (auto-deactivates expired ones)."""
#     now = datetime.utcnow()
#
#     # Auto-disable expired coupons
#     expired = (
#         db.query(Coupon)
#         .filter(Coupon.valid_to < now, Coupon.active == True)
#         .update({"active": False})
#     )
#     if expired:
#         db.commit()
#
#     coupons = db.query(Coupon).order_by(Coupon.created_at.desc()).all() if hasattr(Coupon, "created_at") else db.query(Coupon).all()
#
#     return [
#         {
#             "id": c.id,
#             "code": c.code,
#             "description": c.description,
#             "discount_type": c.discount_type,
#             "discount_value": c.discount_value,
#             "minimum_purchase": c.minimum_purchase,
#             "valid_from": c.valid_from,
#             "valid_to": c.valid_to,
#             "max_uses": c.max_uses,
#             "used_count": getattr(c, "used_count", 0),
#             "active": c.active,
#         }
#         for c in coupons
#     ]


@router.get("/apply")
def apply_coupon(
    code: str,
    db: Session = Depends(get_db)
    # current_user=Depends(get_current_user)  # ✅ allow both users & admins
):
    today = date.today()

    coupon = (
        db.query(Coupon)
        .filter(
            Coupon.code == code,
            Coupon.active == True,
            Coupon.valid_from <= today,
            Coupon.valid_to >= today,
            Coupon.used_count < Coupon.max_uses
        )
        .with_for_update()
        .first()
    )

    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid or expired coupon")

    coupon.used_count += 1
    db.commit()
    db.refresh(coupon)

    # ✅ dynamic message
    role = getattr(current_user, "role", "user")
    name = getattr(current_user, "username", current_user.email)

    return {
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "minimum_purchase": coupon.minimum_purchase,
        "used_count": coupon.used_count,
        "max_uses": coupon.max_uses,
        "message": f"Coupon '{coupon.code}' applied successfully by {role} {name}"

    }

@router.get("/coupons/active")
def get_active_coupons(db: Session = Depends(get_db)):
    today = date.today()

    # Auto deactivate expired or fully used coupons
    expired_or_used = (
        db.query(Coupon)
        .filter(
            Coupon.active == True,
            (
                (Coupon.valid_to < today) |
                (Coupon.used_count >= Coupon.max_uses)
            )
        )
        .all()
    )

    for coupon in expired_or_used:
        coupon.active = False

    db.commit()

    # Fetch only active coupons
    coupons = (
        db.query(Coupon)
        .filter(
            Coupon.active == True,
            Coupon.valid_from <= today,
            Coupon.valid_to >= today,
            Coupon.used_count < Coupon.max_uses
        )
        .all()
    )

    if not coupons:
        return {
            "status": False,
            "count": 0,
            "coupons": [],
            "message": "No active coupons available"
        }

    coupon_list = []
    for c in coupons:
        coupon_list.append({
            "id": c.id,
            "code": c.code,
            "discount_type": c.discount_type,
            "discount_value": c.discount_value,
            "minimum_purchase": c.minimum_purchase,
            "expiry_date": c.valid_to.isoformat(),
            "used_count": c.used_count,
            "max_uses": c.max_uses,
            "remaining_uses": max(0, c.max_uses - c.used_count),
            "locked": c.used_count >= c.max_uses
        })

    return {
        "status": True,
        "count": len(coupon_list),
        "coupons": coupon_list,
        "message": "Active coupons fetched successfully"
    }



# ── 4. GET INVOICE BY ORDER ID ──
@router.get("/orders/{order_id}/invoice")
def download_invoice(order_id: int, db: Session = Depends(get_db)):

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items = []
    subtotal = 0

    for item in order.items:
        subtotal += item.price * item.quantity

        items.append({
            "name": item.product.name,
            "qty": item.quantity,
            "price": item.price
        })

    order_date = order.created_at.strftime("%d %B %Y %I:%M %p")

    pdf = generate_professional_invoice(
        order_id=order.id,
        order_date=order_date,
        customer_name=order.user.first_name,
        address_line1=order.user.address_line1,
        city=order.user.city,
        postal_code=order.user.postal_code,
        country=order.user.country,
        phone=order.user.phone,
        items=items,
        subtotal=subtotal,
        payment_method=order.payment_method
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=invoice_{order_id}.pdf"
        }
    )

from fastapi.responses import HTMLResponse


# ── 5. GET INVOICE HTML (Printable) ──
@router.get("/orders/{order_id}/invoice/html", response_class=HTMLResponse)
def get_invoice_html(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get printable HTML invoice."""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == user.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    invoice = db.query(Invoice).filter(
        Invoice.order_id == order_id
    ).first()

    if not invoice:
        invoice = create_invoice_from_order(order, user, db)

    payment_label = PAYMENT_METHOD_LABELS.get(
        invoice.payment_method or "cod", "Unknown"
    )

    # ── Status colors & watermark ──
    status_text = invoice.payment_status.upper()
    status_bg = "#dcfce7"
    status_color = "#166534"
    watermark = ""

    if invoice.status == "cancelled":
        status_text = "CANCELLED"
        status_bg = "#f3f4f6"
        status_color = "#374151"
        watermark = '<div class="watermark cancelled">CANCELLED</div>'
    elif invoice.payment_status == "unpaid":
        status_bg = "#fef2f2"
        status_color = "#991b1b"
        watermark = '<div class="watermark unpaid">UNPAID</div>'
    elif invoice.payment_status == "refunded":
        status_bg = "#eff6ff"
        status_color = "#1e40af"
        watermark = '<div class="watermark refunded">REFUNDED</div>'

    # ── Build items HTML ──
    items_html = ""
    for i, item in enumerate(invoice.items, 1):
        if item.product_image:
            image_html = (
                f'<img src="{item.product_image}" alt="" '
                f'style="width:40px;height:40px;object-fit:cover;'
                f'border-radius:6px;border:1px solid #e5e7eb;" />'
            )
        else:
            image_html = (
                '<div style="width:40px;height:40px;background:#f3f4f6;'
                'border-radius:6px;display:flex;align-items:center;'
                'justify-content:center;font-size:12px;color:#9ca3af;">'
                '📦</div>'
            )

        sku_html = ""
        if item.product_sku:
            sku_html = (
                f'<div style="font-size:12px;color:#6b7280;">'
                f'SKU: {item.product_sku}</div>'
            )

        items_html += f"""
        <tr>
            <td style="padding:12px;border-bottom:1px solid #f3f4f6;">
                {i}
            </td>
            <td style="padding:12px;border-bottom:1px solid #f3f4f6;">
                <div style="display:flex;align-items:center;gap:10px;">
                    {image_html}
                    <div>
                        <div style="font-weight:600;color:#111827;">
                            {item.product_name}
                        </div>
                        {sku_html}
                    </div>
                </div>
            </td>
            <td style="padding:12px;border-bottom:1px solid #f3f4f6;
                text-align:right;">₹{item.unit_price:,.2f}</td>
            <td style="padding:12px;border-bottom:1px solid #f3f4f6;
                text-align:center;">{item.quantity}</td>
            <td style="padding:12px;border-bottom:1px solid #f3f4f6;
                text-align:right;">₹{item.tax_amount:,.2f}</td>
            <td style="padding:12px;border-bottom:1px solid #f3f4f6;
                text-align:right;font-weight:600;">₹{item.total:,.2f}</td>
        </tr>
        """

    invoice_date = (
        invoice.invoice_date.strftime("%B %d, %Y")
        if invoice.invoice_date else "N/A"
    )
    due_date = (
        invoice.due_date.strftime("%B %d, %Y")
        if invoice.due_date else "N/A"
    )

    # ── Discount row ──
    discount_html = ""
    if invoice.discount_amount and invoice.discount_amount > 0:
        discount_html = (
            f'<div class="totals-row">'
            f'<span>Discount</span>'
            f'<span style="color:#559F4B;">-₹{invoice.discount_amount:,.2f}</span>'
            f'</div>'
        )

    # ── Notes ──
    notes_html = ""
    if invoice.notes:
        notes_html = (
            f'<div style="background:#f9fafb;border:1px solid #e5e7eb;'
            f'border-radius:8px;padding:16px;margin-bottom:20px;">'
            f'<p style="font-size:13px;color:#6b7280;">'
            f'<strong>Notes:</strong> {invoice.notes}</p></div>'
        )

    # ── Shipping address ──
    shipping_html = ""
    if invoice.shipping_address:
        shipping_html = (
            f'<div class="info-box" style="margin-bottom:20px;">'
            f'<h4>Ship To</h4>'
            f'<p>{invoice.shipping_address}</p></div>'
        )

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Invoice {invoice.invoice_number}</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #374151; background: #fff;
            }}
            .invoice {{
                max-width: 800px; margin: 0 auto; padding: 40px;
                position: relative; overflow: hidden;
            }}
            .watermark {{
                position: absolute; top: 50%; left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 100px; font-weight: 900;
                border: 10px solid; padding: 20px 40px;
                border-radius: 20px; opacity: 0.1;
                pointer-events: none; z-index: 0; white-space: nowrap;
            }}
            .watermark.unpaid {{ color: #ef4444; border-color: #ef4444; }}
            .watermark.cancelled {{ color: #6b7280; border-color: #6b7280; }}
            .watermark.refunded {{ color: #3b82f6; border-color: #3b82f6; }}
            .header {{
                display: flex; justify-content: space-between;
                align-items: flex-start; margin-bottom: 40px;
                padding-bottom: 20px; border-bottom: 3px solid #559F4B;
                position: relative; z-index: 1;
            }}
            .logo {{
                font-size: 28px; font-weight: 800;
                background: linear-gradient(135deg, #559F4B, #E1783E);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }}
            .invoice-title {{ text-align: right; }}
            .invoice-title h2 {{
                font-size: 24px; color: #559F4B; margin-bottom: 4px;
            }}
            .invoice-title p {{ color: #6b7280; font-size: 14px; }}
            .info-grid {{
                display: grid; grid-template-columns: 1fr 1fr;
                gap: 30px; margin-bottom: 30px;
                position: relative; z-index: 1;
            }}
            .info-box h4 {{
                font-size: 12px; text-transform: uppercase;
                letter-spacing: 1px; color: #559F4B;
                margin-bottom: 8px; font-weight: 700;
            }}
            .info-box p {{ font-size: 14px; color: #374151; line-height: 1.6; }}
            .info-box .value {{ font-weight: 600; color: #111827; }}
            .status-badge {{
                display: inline-block; padding: 6px 16px;
                border-radius: 20px; font-size: 14px;
                font-weight: 700; margin-top: 8px;
                background-color: {status_bg}; color: {status_color};
            }}
            table {{
                width: 100%; border-collapse: collapse;
                margin-bottom: 30px; position: relative; z-index: 1;
            }}
            thead th {{
                background: linear-gradient(135deg, #559F4B, #4a8f42);
                color: white; padding: 12px; text-align: left;
                font-size: 13px; text-transform: uppercase;
                letter-spacing: 0.5px;
            }}
            thead th:first-child {{ border-radius: 8px 0 0 0; }}
            thead th:last-child {{
                border-radius: 0 8px 0 0; text-align: right;
            }}
            .totals {{
                display: flex; justify-content: flex-end;
                margin-bottom: 30px; position: relative; z-index: 1;
            }}
            .totals-box {{ width: 300px; }}
            .totals-row {{
                display: flex; justify-content: space-between;
                padding: 8px 0; font-size: 14px;
            }}
            .totals-row.total {{
                border-top: 2px solid #559F4B; padding-top: 12px;
                margin-top: 8px; font-size: 18px;
                font-weight: 700; color: #111827;
            }}
            .payment-box {{
                background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
                border: 1px solid #bbf7d0; border-radius: 12px;
                padding: 20px; margin-bottom: 30px;
                position: relative; z-index: 1;
            }}
            .payment-box h4 {{
                color: #166534; margin-bottom: 10px; font-size: 14px;
            }}
            .payment-row {{
                display: flex; justify-content: space-between;
                font-size: 13px; margin-bottom: 4px;
            }}
            .footer {{
                text-align: center; padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #9ca3af; font-size: 12px;
                position: relative; z-index: 1;
            }}
            @media print {{
                body {{
                    print-color-adjust: exact;
                    -webkit-print-color-adjust: exact;
                }}
                .no-print {{ display: none !important; }}
                .invoice {{ padding: 20px; }}
            }}
        </style>
    </head>
    <body>
        <div class="invoice">
            {watermark}

            <div class="no-print" style="text-align:right;margin-bottom:20px;">
                <button onclick="window.print()"
                    style="background:linear-gradient(135deg,#559F4B,#E1783E);
                    color:white;border:none;padding:10px 24px;
                    border-radius:8px;cursor:pointer;font-weight:600;">
                    🖨️ Print Invoice
                </button>
                <button onclick="window.close()"
                    style="background:#f3f4f6;color:#374151;
                    border:1px solid #d1d5db;padding:10px 24px;
                    border-radius:8px;cursor:pointer;font-weight:600;
                    margin-left:8px;">
                    ✕ Close
                </button>
            </div>

            <div class="header">
                <div>
                    <div class="logo">Your Store</div>
                    <p style="color:#6b7280;font-size:13px;margin-top:4px;">
                        Tax Invoice / Bill of Supply
                    </p>
                </div>
                <div class="invoice-title">
                    <h2>INVOICE</h2>
                    <p><strong>{invoice.invoice_number}</strong></p>
                    <p>Date: {invoice_date}</p>
                    <p>Due: {due_date}</p>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <h4>Bill To</h4>
                    <p class="value">{invoice.customer_name or 'Customer'}</p>
                    <p>{invoice.customer_email or ''}</p>
                    <p>{invoice.customer_phone or ''}</p>
                    <p>{invoice.billing_address or 'N/A'}</p>
                </div>
                <div class="info-box" style="text-align:right;">
                    <h4>Order Details</h4>
                    <p>Order #: <span class="value">{invoice.order_id}</span></p>
                    <p>Payment: <span class="value">{payment_label}</span></p>
                    <span class="status-badge">{status_text}</span>
                </div>
            </div>

            {shipping_html}

            <table>
                <thead>
                    <tr>
                        <th style="width:40px;">#</th>
                        <th>Product</th>
                        <th style="text-align:right;">Price</th>
                        <th style="text-align:center;">Qty</th>
                        <th style="text-align:right;">Tax</th>
                        <th style="text-align:right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>

            <div class="totals">
                <div class="totals-box">
                    <div class="totals-row">
                        <span>Subtotal</span>
                        <span>₹{invoice.subtotal:,.2f}</span>
                    </div>
                    <div class="totals-row">
                        <span>Shipping</span>
                        <span>{'Free' if invoice.shipping_amount == 0 else f'₹{invoice.shipping_amount:,.2f}'}</span>
                    </div>
                    <div class="totals-row">
                        <span>GST ({invoice.tax_rate}%)</span>
                        <span>₹{invoice.tax_amount:,.2f}</span>
                    </div>
                    {discount_html}
                    <div class="totals-row total">
                        <span>Total Amount</span>
                        <span>₹{invoice.total_amount:,.2f}</span>
                    </div>
                </div>
            </div>

            <div class="payment-box">
                <h4>💳 Payment Information</h4>
                <div class="payment-row">
                    <span>Method</span>
                    <span style="font-weight:600;">{payment_label}</span>
                </div>
                <div class="payment-row">
                    <span>Status</span>
                    <span style="font-weight:600;color:{status_color};">
                        {status_text}
                    </span>
                </div>
                <div class="payment-row">
                    <span>Amount Due</span>
                    <span style="font-weight:700;font-size:16px;color:#166534;">
                        ₹{invoice.total_amount:,.2f}
                    </span>
                </div>
            </div>

            {notes_html}

            <div class="footer">
                <p>Thank you for your purchase! 🌿</p>
                <p style="margin-top:4px;">
                    Computer-generated invoice - no signature required.
                </p>
                <p style="margin-top:8px;color:#559F4B;font-weight:600;">
                    Your Store • support@yourstore.com
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    return HTMLResponse(content=html)

# ─────────────────────────────────────────────
#  CONFIG FROM .env (Never hardcode!)
# ─────────────────────────────────────────────
TOKEN_ID   = os.getenv("PAYMENT_TOKEN_ID")
SECRET_KEY = os.getenv("PAYMENT_SECRET_KEY")
BASE_URL   = os.getenv("PAYMENT_BASE_URL", "https://payin.mizorpay.in")
ENDPOINT   = f"{BASE_URL}/api/collection-v9-payment"


# Credentials may live in the database instead (Admin → Payment Integration),
# so a missing .env is a warning, not a boot failure — raising here took the
# whole API down rather than just the payment endpoint.
if not TOKEN_ID or not SECRET_KEY:
    print(
        "⚠️  PAYMENT_TOKEN_ID / PAYMENT_SECRET_KEY not set in .env — "
        "falling back to the credentials stored in Admin → Payment Integration."
    )


HEADERS = {
    "Token-Id": TOKEN_ID or "",
    "Secret-Key": SECRET_KEY or "",
    "Content-Type": "application/json",
}


def resolve_gateway(db: Session):
    """(endpoint, headers) for the live gateway.

    An active credential row wins; .env is the fallback so existing
    deployments keep working untouched.
    """
    from app.models.payment_gateway import PaymentGatewayCredential

    cred = (
        db.query(PaymentGatewayCredential)
        .filter(
            PaymentGatewayCredential.gateway_name == "mizorpay",
            PaymentGatewayCredential.is_active.is_(True),
        )
        .first()
    )
    if cred and cred.token_id and cred.secret_key:
        return (
            f"{(cred.base_url or '').rstrip('/')}{cred.endpoint_path or ''}",
            {
                "Token-Id": cred.token_id,
                "Secret-Key": cred.secret_key,
                "Content-Type": "application/json",
            },
        )
    if not TOKEN_ID or not SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway is not configured. Add credentials in Admin → Payment Integration.",
        )
    return ENDPOINT, HEADERS


# ─────────────────────────────────────────────
#  PYDANTIC REQUEST MODEL
# ─────────────────────────────────────────────
class PaymentRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone_no: str
    address: str
    zip: str
    amount: float

    # ✅ Add validation
    class Config:
        str_strip_whitespace = True  # Auto strip whitespace


# ─────────────────────────────────────────────
#  HELPER FUNCTIONS
# ─────────────────────────────────────────────
def generate_merchant_ref(prefix: str = "MIZORPA") -> str:
    """Generates a unique merchant reference ID."""
    random_part = "".join(
        random.choices(string.ascii_uppercase + string.digits, k=12)
    )
    return f"{prefix}{random_part}"


def log_payment_attempt(merchant_ref: str, status: str, details: dict = None):
    """
    Log payment attempts.
    TODO: Replace print with proper logging or DB write.
    """
    print(f"--- LOG --- Ref: {merchant_ref}, Status: {status}")
    if details:
        # ✅ Don't log sensitive data like card numbers
        safe_details = {
            k: v for k, v in details.items()
            if k not in ["secret_key", "token_id", "card_number"]
        }
        print(f"           Details: {safe_details}")


# ─────────────────────────────────────────────
#  HEALTH CHECK ENDPOINT
# ─────────────────────────────────────────────
@router.get("/")
async def home():
    return {"message": "Vastraliya API is running"}


# ─────────────────────────────────────────────
#  INITIATE PAYMENT ENDPOINT
# ─────────────────────────────────────────────
@router.post("/initiate-payment")
async def initiate_payment(data: PaymentRequest, db: Session = Depends(get_db)):
    """
    Initiates a payment, determines the payment flow
    (Redirect vs. QR Code), and returns a structured
    response for the frontend to handle.
    """
    endpoint, headers = resolve_gateway(db)
    merchant_ref = generate_merchant_ref()

    payload = {
        "first_name": data.first_name,
        "last_name":  data.last_name,
        "email":      data.email,
        "phone_no":   data.phone_no,
        "address":    data.address,
        "zip":        data.zip,
        "amount":     float(data.amount),
        "merchant_ref": merchant_ref,
    }

    # Log attempt BEFORE network call
    log_payment_attempt(merchant_ref, "INITIATED", payload)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                endpoint,
                headers=headers,
                json=payload
            )
            response.raise_for_status()

        gateway_response = response.json()
        log_payment_attempt(
            merchant_ref,
            "SUCCESS_GATEWAY_RESPONSE",
            gateway_response
        )

        # ─────────────────────────────────────────
        #  Determine Payment Flow
        # ─────────────────────────────────────────

        # Base response
        api_response = {
            "success":         True,
            "message":         gateway_response.get("message", "Payment initiated successfully."),
            "mizor_pay_txn_id": gateway_response.get("mizor_pay_txn_id"),
            "merchant_ref":    merchant_ref,
        }

        # ✅ REDIRECT flow
        redirect_url = gateway_response.get("redirect_url")
        if redirect_url:
            api_response["flow_type"]      = "REDIRECT"
            api_response["redirect_url"]   = redirect_url
            api_response["qr_data_string"] = None
            return api_response

        # ✅ QR CODE flow
        qr_data_string = gateway_response.get("intent_url")
        if not qr_data_string:
            payment_link = gateway_response.get("payment_link")
            if isinstance(payment_link, list) and payment_link:
                qr_data_string = payment_link[0]

        if qr_data_string:
            api_response["flow_type"]      = "QR_CODE"
            api_response["redirect_url"]   = None
            api_response["qr_data_string"] = qr_data_string
            return api_response

        # ✅ Fallback - Unknown flow
        log_payment_attempt(
            merchant_ref,
            "ERROR_UNKNOWN_FLOW",
            gateway_response
        )
        return JSONResponse(
            status_code=502,
            content={
                "success": False,
                "message": "Gateway returned a successful but incomplete response.",
                "gateway_response": gateway_response,
            }
        )

    # ─────────────────────────────────────────
    #  Error Handling
    # ─────────────────────────────────────────
    except httpx.TimeoutException:
        log_payment_attempt(merchant_ref, "ERROR_TIMEOUT")
        return JSONResponse(
            status_code=504,
            content={
                "success": False,
                "message": "The payment gateway request timed out. Please try again."
            }
        )

    except httpx.HTTPStatusError as e:
        gateway_error = {}
        try:
            gateway_error = e.response.json()
        except Exception:
            gateway_error = {"raw_text": e.response.text}

        log_payment_attempt(merchant_ref, "ERROR_GATEWAY_FAILURE", gateway_error)
        return JSONResponse(
            status_code=502,
            content={
                "success": False,
                "message": gateway_error.get("message", "Gateway returned an error."),
                "gateway_response": gateway_error,
            }
        )

    except httpx.RequestError as e:
        log_payment_attempt(
            merchant_ref,
            "ERROR_CONNECTION",
            {"error": repr(e)}
        )
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "message": "Unable to connect to the payment gateway."
            }
        )

    except Exception:
        log_payment_attempt(
            merchant_ref,
            "ERROR_INTERNAL_SERVER",
            {"traceback": traceback.format_exc()}
        )
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "An internal server error occurred."
            }
        )


# ─────────────────────────────────────────────
#  CALLBACK TEST RECEIVER
# ─────────────────────────────────────────────
# @router.post("/mizorpay/callback")
# async def mizorpay_callback(payload: dict):
#     print("=== CALLBACK RECEIVED ===")
#     print(json.dumps(payload, indent=2))
#
#     payin = payload.get("payin", {})
#     txn_status = payin.get("txn_status")
#     mizor_pay_txn_id = payin.get("mizor_pay_txn_id")
#     merchant_ref = payin.get("merchant_ref")
#
#     return {
#         "success": True,
#         "message": "Callback received",
#         "txn_status": txn_status,
#         "mizor_pay_txn_id": mizor_pay_txn_id,
#         "merchant_ref": merchant_ref
#     }

