from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import uuid4
from datetime import datetime


# -------------------
# UserSettings Schemas
# -------------------
class UserSettingsBase(BaseModel):
    email: bool = True      # Email notifications
    offers: bool = True     # Promotional offers
    updates: bool = True    # App updates


class UserSettingsCreate(UserSettingsBase):
    pass


class UserSettingsUpdate(UserSettingsBase):
    pass


class UserSettingsOut(UserSettingsBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


# -------------------
# Address Schemas
# -------------------
class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str
    phone: str
    default: bool

    model_config = ConfigDict(from_attributes=True)


# -------------------
# User Schemas
# -------------------
class UserBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None


class UserCreate(UserBase):
    password: str  # Required on registration


class UserOut(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None

    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    created_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    active_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------
# Password / Auth Schemas
# -------------------
class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)
    confirm_password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class SuccessMessage(BaseModel):
    message: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AdminCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)