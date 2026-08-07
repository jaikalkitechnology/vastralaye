from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- Payment Request Schema ---
class PaymentRequest(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    phone_no: str = Field(..., min_length=10, max_length=15)
    address: str = Field(..., min_length=5)
    zip: str = Field(..., min_length=3)
    amount: float = Field(..., gt=0)

# --- Gateway Credential Schemas ---
class GatewayCredentialBase(BaseModel):
    gateway_name: str
    token_id: str
    base_url: str
    endpoint_path: Optional[str] = "/api/collection-v7-payment"
    is_active: bool = True

class GatewayCredentialCreate(GatewayCredentialBase):
    secret_key: str

class GatewayCredentialUpdate(BaseModel):
    gateway_name: Optional[str] = None
    token_id: Optional[str] = None
    secret_key: Optional[str] = None
    base_url: Optional[str] = None
    endpoint_path: Optional[str] = None
    is_active: Optional[bool] = None

class GatewayCredential(GatewayCredentialBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    class Config:
        from_attributes = True