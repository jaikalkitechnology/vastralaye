# import os
# import secrets
# import shutil
# import uuid
# from datetime import date, datetime
# from decimal import Decimal
# from typing import List, Optional
# import re
#
# import requests
# from fastapi import APIRouter, HTTPException, Depends, Request, Form, UploadFile, File, Query, Path,status
# from sqlalchemy.orm import Session
# from sqlalchemy.sql.functions import current_user
#
# from app.crud.user import create_user
# from app.models.models import User, AstrologerDetail, AstrologerWallet
#
# from app.schemas.astrologer import AstrologerDetailResponse, AstrologerSignupRequest
# from app.schemas.user_schemas import UserResponse, UserCreate
# from app.utils.authenticate import hash_password, get_current_user
# from app.utils.database import get_db
#
# router = APIRouter()
# token="bbb51ae4a5563b43a4088f906ff6868f"
#
# UPLOAD_DIR = "static/uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)
#
# def save_uploaded_file(file: UploadFile, user_id: str, suffix: str = ""):
#     if not file:
#         return None
#
#     # Generate secure filename
#     file_ext = os.path.splitext(file.filename)[1]
#     filename = f"{user_id}_{suffix}{file_ext}"
#     file_path = os.path.join(UPLOAD_DIR, filename)
#
#     # Save file
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
#
#     return filename
#
# @router.post("/signup", response_model=UserResponse)
# def signup(user: UserCreate, db: Session = Depends(get_db)):
#     # check if email exists
#     existing_user = db.query(User).filter(User.email == user.email).first()
#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already registered")
#     return create_user(db, user)
#
#
#
# # ===== Replace with your actual imports =====
# # from app.database import get_db
# # from app.models import User, AstrologerDetail, AstrologerWallet
# # from app.auth import hash_password
# # ============================================
#
# router = APIRouter()
#
# # ---------- Constants ----------
# ALLOWED_PROFILE = {".jpg", ".jpeg", ".png"}
# ALLOWED_AADHAAR = {".pdf", ".jpg", ".jpeg", ".png"}
# ALLOWED_PAN = {".pdf", ".jpg", ".jpeg", ".png"}
# ALLOWED_BANK = {".pdf", ".jpg", ".jpeg"}
# MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB
# UPLOAD_DIR = "static/uploads"
#
#
# # ---------- Validators ----------
# def validate_aadhaar_number(aadhaar: str):
#     if not aadhaar.isdigit() or len(aadhaar) != 12:
#         raise HTTPException(status_code=400, detail="aadhaarNumber must be a 12-digit number")
#
#
# def validate_pan_number(pan: str):
#     if not re.fullmatch(r"[A-Za-z0-9]{10}", pan):
#         raise HTTPException(status_code=400, detail="panNumber must be a 10-character alphanumeric string")
#
#
# def validate_ifsc(ifsc: str):
#     if not ifsc or len(ifsc) != 11:
#         raise HTTPException(status_code=400, detail="ifscCode must be 11 characters")
#
#
# def validate_account_number(acc: str):
#     if not acc.isdigit() or not (9 <= len(acc) <= 18):
#         raise HTTPException(status_code=400, detail="accountNumber must be numeric and 9–18 digits long")
#
#
# def validate_upi_id(upi: str):
#     if not upi:
#         return
#     if len(upi) > 100:
#         raise HTTPException(status_code=400, detail="upiId must be max 100 characters")
#     pattern = r"^[A-Za-z0-9.\-_]{2,}@[A-Za-z]{2,}$"
#     if not re.fullmatch(pattern, upi):
#         raise HTTPException(status_code=400, detail="Invalid UPI ID format. Example: name@bank or 9876543210@paytm")
#
#
# def check_file(upload_file: UploadFile, allowed_exts: set, field_name: str):
#     filename = getattr(upload_file, "filename", None)
#     if not filename:
#         raise HTTPException(status_code=400, detail=f"{field_name} missing filename")
#     ext = os.path.splitext(filename)[1].lower()
#     if ext not in allowed_exts:
#         raise HTTPException(status_code=400, detail=f"Unsupported file type for {field_name}: {filename}")
#     upload_file.file.seek(0, os.SEEK_END)
#     size = upload_file.file.tell()
#     upload_file.file.seek(0)
#     if size > MAX_FILE_SIZE:
#         raise HTTPException(status_code=400, detail=f"{field_name} must be <= 2MB")
#
#
# def save_file(upload_file: UploadFile, prefix: str) -> str:
#     ext = os.path.splitext(upload_file.filename)[1].lower()
#     unique_name = f"{prefix}_{int(datetime.utcnow().timestamp())}_{secrets.token_hex(5)}{ext}"
#     os.makedirs(UPLOAD_DIR, exist_ok=True)
#     disk_path = os.path.join(UPLOAD_DIR, unique_name)
#     with open(disk_path, "wb") as f:
#         upload_file.file.seek(0)
#         f.write(upload_file.file.read())
#     upload_file.file.seek(0)
#     return f"/{disk_path.replace(os.sep, '/')}"
#
#
# # ---------- MAIN ENDPOINT ----------
#
#
# # --- new / helper constants & functions ---
# MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB
# ALLOWED_FILE_TYPES = {
#     ".png": "image/png",
#     ".jpg": "image/jpeg",
#     ".jpeg": "image/jpeg",
#     ".pdf": "application/pdf",
#     ".csv": "text/csv",
# }
#
#
# async def check_file(upload_file: UploadFile, field_name: str):
#     """
#     Accepts png/jpeg/pdf/csv and enforces MAX_FILE_SIZE.
#     """
#     if not upload_file:
#         return
#
#     filename = getattr(upload_file, "filename", None)
#     if not filename:
#         raise HTTPException(status_code=400, detail=f"{field_name} missing filename")
#
#     ext = os.path.splitext(filename)[1].lower()
#     if ext not in ALLOWED_FILE_TYPES:
#         raise HTTPException(
#             status_code=400,
#             detail=f"{field_name} must be one of: {', '.join(ALLOWED_FILE_TYPES.keys())}"
#         )
#
#     content_type = upload_file.content_type or ""
#     if content_type != ALLOWED_FILE_TYPES[ext]:
#         raise HTTPException(status_code=400, detail=f"{field_name} has invalid MIME type")
#
#     # check size
#     contents = await upload_file.read()
#     if len(contents) > MAX_FILE_SIZE:
#         raise HTTPException(status_code=400, detail=f"{field_name} exceeds max size of 2MB")
#
#     # reset pointer for saving
#     try:
#         await upload_file.seek(0)
#     except Exception:
#         pass
#
#
# # ----------------- your endpoint (modified) -----------------
# @router.post("/signup/astrologer", status_code=status.HTTP_201_CREATED)
# async def signup_astrologer(
#     contactNo: str = Form(...),
#     countryCode: str = Form(...),
#     name: str = Form(...),
#     email: str = Form(None),
#     password: str = Form(None),
#     gender: str = Form(None),
#     birthDate: str = Form(None),
#     primarySkill: str = Form(None),
#     languageKnown: str = Form(None),
#     chatCharge: int = Form(0),
#     audioCallCharge: int = Form(0),
#     videoCallCharge: int = Form(0),
#      chatChargeUSD: float = Form(0),
#     audioCallChargeUSD: float = Form(0),
#     videoCallChargeUSD: float = Form(0),
#     experienceInYears: int = Form(0),
#     currentCity: str = Form(None),
#     highestQualification: str = Form(None),
#     learnAstrology: str = Form(None),
#     astrologerCategoryId: str = Form(None),
#
#     # KYC Fields
#     aadhaarNumber: str = Form(...),
#     panNumber: str = Form(...),
#     bankName: str = Form(None),
#     accountNumber: str = Form(None),
#     accountHolderName: str = Form(None),
#     ifscCode: str = Form(None),
#     upiId: str = Form(None),
#
#     # Files
#     aadhaarFront: UploadFile = File(...),
#     aadhaarBack: UploadFile = File(...),
#     panCardImage: UploadFile = File(...),
#     bankPassbookImage: Optional[UploadFile] = File(None),
#     cancelledChequeImage: Optional[UploadFile] = File(None),
#     bankStatementImage: Optional[UploadFile] = File(None),
#     profileImage: Optional[UploadFile] = File(None),
#
#     db: Session = Depends(get_db),
# ):
#     """
#     Register a new astrologer with full KYC + documents.
#     """
#
#     # ---------- VALIDATION ----------
#     validate_aadhaar_number(aadhaarNumber)
#     validate_pan_number(panNumber)
#
#     if ifscCode:
#         validate_ifsc(ifscCode)
#     if accountNumber:
#         validate_account_number(accountNumber)
#         if not accountHolderName:
#             raise HTTPException(status_code=400, detail="accountHolderName is required when providing accountNumber")
#     if upiId:
#         validate_upi_id(upiId)
#
#     if not (upiId or bankPassbookImage or cancelledChequeImage or bankStatementImage):
#         raise HTTPException(
#             status_code=400,
#             detail="Provide at least one: UPI ID or Bank Passbook or Cancelled Cheque or Bank Statement"
#         )
#
#     # ---------- FILE VALIDATION ----------
#     if profileImage:
#         await check_file(profileImage, "profileImage")
#     await check_file(aadhaarFront, "aadhaarFront")
#     await check_file(aadhaarBack, "aadhaarBack")
#     await check_file(panCardImage, "panCardImage")
#
#     if bankPassbookImage:
#         await check_file(bankPassbookImage, "bankPassbookImage")
#     if cancelledChequeImage:
#         await check_file(cancelledChequeImage, "cancelledChequeImage")
#     if bankStatementImage:
#         await check_file(bankStatementImage, "bankStatementImage")
#
#     # ---------- SAVE FILES FIRST ----------
#     profile_path = save_file(profileImage, "profile") if profileImage else None
#     aadhaar_front_path = save_file(aadhaarFront, "aadhaar_front")
#     aadhaar_back_path = save_file(aadhaarBack, "aadhaar_back")
#     pan_path = save_file(panCardImage, "pan")
#
#     bank_passbook_path = save_file(bankPassbookImage, "bank_passbook") if bankPassbookImage else None
#     cancelled_cheque_path = save_file(cancelledChequeImage, "cancelled_cheque") if cancelledChequeImage else None
#     bank_statement_path = save_file(bankStatementImage, "bank_statement") if bankStatementImage else None
#
#     # ---------- CHECK EXISTING USER ----------
#     existing_user = db.query(User).filter(User.contactNo == contactNo).first()
#     if not existing_user and email:
#         existing_user = db.query(User).filter(User.email == email).first()
#
#     if existing_user:
#         if existing_user.role == "customer":
#             raise HTTPException(status_code=403, detail="Cannot create astrologer for existing customer")
#         elif existing_user.role == "astrologer":
#             raise HTTPException(status_code=400, detail="Astrologer already exists")
#
#     # check astrologer table too
#     astro_dup = db.query(AstrologerDetail).filter(AstrologerDetail.contactNo == contactNo).first()
#     if astro_dup:
#         raise HTTPException(status_code=400, detail="Astrologer with this contact number already exists")
#
#     # ---------- PREPARE DATA ----------
#     generated_email = email or f"{contactNo}@jyotishi.com"
#     generated_password = hash_password(password or secrets.token_hex(8))
#
#     # ---------- CREATE RECORDS TRANSACTIONALLY ----------
#     try:
#         # create user (UUID PK auto-generated)
#         new_user = User(
#             contactNo=contactNo,
#             countryCode=countryCode,
#             email=generated_email,
#             password=generated_password,
#             role="astrologer",
#             lastSeen=datetime.utcnow(),
#             unread_count=0,
#             is_online=False
#         )
#         db.add(new_user)
#         db.flush()  # gives new_user.id
#
#         # create astrologer details
#         # ---------- NORMALIZE CATEGORY ID ----------
#         if astrologerCategoryId in ("", None, "string"):
#             normalized_category_id = None
#         else:
#             try:
#                 normalized_category_id = int(astrologerCategoryId)
#             except ValueError:
#                 raise HTTPException(
#                     status_code=400,
#                     detail="Invalid astrologerCategoryId"
#                 )
#
#         astro = AstrologerDetail(
#             user_id=new_user.id,
#             name=name,
#             email=generated_email,
#             contactNo=contactNo,
#             countryCode=countryCode,
#             birthDate=birthDate,
#             primarySkill=primarySkill,
#             languageKnown=languageKnown,
#             profileImage=profile_path,
#             chatCharge=chatCharge,
#             audioCallCharge=audioCallCharge,
#             videoCallCharge=videoCallCharge,
#             chatChargeUSD=chatChargeUSD,
#             audioCallChargeUSD=audioCallChargeUSD,
#             videoCallChargeUSD=videoCallChargeUSD,
#             experienceInYears=experienceInYears,
#             currentCity=currentCity,
#             highestQualification=highestQualification,
#             learnAstrology=learnAstrology,
#
#             # ✅ FIXED
#             astrologerCategoryId=normalized_category_id,
#
#             aadhaarNumber=aadhaarNumber,
#             panNumber=panNumber,
#             bankName=bankName,
#             accountNumber=accountNumber,
#             account_holder_name=accountHolderName,
#             ifscCode=ifscCode,
#             upiId=upiId,
#             aadhaarFrontImage=aadhaar_front_path,
#             aadhaarBackImage=aadhaar_back_path,
#             panCardImage=pan_path,
#             bankPassbookImage=bank_passbook_path,
#             cancelledChequeImage=cancelled_cheque_path,
#             bankStatementImage=bank_statement_path,
#             isApproved=True,
#             created_at=datetime.utcnow(),
#             updated_at=datetime.utcnow()
#         )
#
#         db.add(astro)
#         db.flush()  # gives astro.astro_id
#
#         # create wallet
#         # create wallet
#         # create wallet (NO id field)
#         new_wallet = AstrologerWallet(
#             astrologer_id=astro.astro_id,
#             amount=0.0,
#             isActive=True,
#             isDelete=False,
#             created_at=datetime.utcnow(),
#             updated_at=datetime.utcnow()
#         )
#
#         db.add(new_wallet)
#         db.flush()
#         db.commit()
#         db.refresh(new_wallet)
#
#
#
#     except Exception as exc:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
#
#     # ---------- RESPONSE ----------
#     return {
#         "message": "Astrologer registered successfully with KYC",
#         "user_id": new_user.id,
#         "astrologer_id": astro.astro_id,
#         "wallet_id": new_wallet.wallet_id,  # <-- FIXED
#         "upi_id": astro.upiId,
#         "bank_passbook_url": astro.bankPassbookImage,
#         "cancelled_cheque_url": astro.cancelledChequeImage,
#         "bank_statement_url": astro.bankStatementImage,
#         "profile_image_url": astro.profileImage,
#         "aadhaar_front_url": astro.aadhaarFrontImage,
#         "aadhaar_back_url": astro.aadhaarBackImage,
#         "pan_card_url": astro.panCardImage,
#         "account_holder_name": astro.account_holder_name,
#     }
