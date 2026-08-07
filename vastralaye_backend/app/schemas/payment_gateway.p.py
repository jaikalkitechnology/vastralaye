from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# ===================================================================
#  PAYMENT SCHEMAS (This section fixes your AttributeError)
# ===================================================================

class PaymentRequest(BaseModel):
    """
    Schema for the data required from the client to initiate a new payment.
    FastAPI will use this to validate the incoming request body.
    """
    first_name: str = Field(..., min_length=1, description="Customer's first name")
    last_name: str = Field(..., min_length=1, description="Customer's last name")
    email: EmailStr  # Pydantic's EmailStr provides automatic email validation
    phone_no: str = Field(..., min_length=10, max_length=15, description="Customer's phone number")
    address: str = Field(..., min_length=5, description="Customer's address")
    zip: str = Field(..., min_length=3, description="Customer's zip or postal code")
    amount: float = Field(..., gt=0, description="Payment amount, must be greater than zero")

    class Config:
        # This provides a default example for your API documentation (e.g., in /docs)
        schema_extra = {
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "johndoe@example.com",
                "phone_no": "1234567890",
                "address": "123 Main St, Anytown",
                "zip": "12345",
                "amount": 99.99
            }
        }


# ===================================================================
#  USER SCHEMAS (Standard practice for user management)
# ===================================================================

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True # This allows the model to be created from a SQLAlchemy object


# ===================================================================
#  PAYMENT GATEWAY CREDENTIAL SCHEMAS (Based on your CRUD file)
# ===================================================================

class GatewayCredentialBase(BaseModel):
    gateway_name: str
    token_id: str
    base_url: str
    endpoint_path: Optional[str] = "/api/collection-v7-payment"
    is_active: bool = True

class GatewayCredentialCreate(GatewayCredentialBase):
    secret_key: str = Field(..., description="The secret key, required on creation.")

class GatewayCredentialUpdate(BaseModel):
    # All fields are optional when updating
    gateway_name: Optional[str] = None
    token_id: Optional[str] = None
    secret_key: Optional[str] = None # Allow updating the secret key
    base_url: Optional[str] = None
    endpoint_path: Optional[str] = None
    is_active: Optional[bool] = None

class GatewayCredential(GatewayCredentialBase):
    """Schema for returning a credential (omits secret_key for security)."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True