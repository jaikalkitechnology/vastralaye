# schemas.py

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from enum import Enum


# ✅ NEW: Payment Method Enum
class PaymentMethod(str, Enum):
    COD = "cod"
    CARD = "card"
    UPI = "upi"
    NET_BANKING = "netbanking"


# ✅ NEW: Payment Status Enum
class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    UNPAID = "unpaid"
    FAILED = "failed"
    REFUNDED = "refunded"


class TrackingUpdate(BaseModel):
    status: str
    message: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


# ✅ UPDATED: OrderCreate with payment_method & shipping_address
class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    payment_method: PaymentMethod = PaymentMethod.COD
    shipping_address: Optional[str] = None
    coupon_code: Optional[str] = None
    # Structured address parts from the checkout form — stored on the order
    # for GST place-of-supply and the tracking-system shipping address.
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class OrderProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class OrderUserOut(BaseModel):
    id: int
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    city: Optional[str]
    country: Optional[str]

    class Config:
        from_attributes = True


class OrderItemOut(BaseModel):
    id: int
    quantity: int
    price: float
    product: OrderProductOut

    class Config:
        from_attributes = True


# ✅ UPDATED: OrderOut with payment_method, payment_status, shipping_address
class OrderOut(BaseModel):
    id: int
    user_id: int
    status: str
    created_at: datetime
    total_amount: float

    # ✅ NEW: Payment & shipping fields
    payment_method: Optional[str] = "cod"
    payment_status: Optional[str] = "unpaid"
    shipping_address: Optional[str] = None

    # Existing
    user: Optional[OrderUserOut] = None
    items: Optional[List[OrderItemOut]] = None
    tracking_updates: Optional[List[TrackingUpdate]] = None
    # ✅ NEW PRICING FIELDS
    subtotal: Optional[float] = None
    discount: Optional[float] = None
    base_amount: Optional[float] = None
    gst: Optional[float] = None

    class Config:
        from_attributes = True


# ✅ NEW: Simple order response for create endpoint
class OrderCreateResponse(BaseModel):
    id: int
    user_id: int
    status: str
    total_amount: float
    payment_method: str
    payment_status: str
    shipping_address: Optional[str] = None
    created_at: datetime
    items: List[OrderItemCreate]

    payment_method: Optional[str]

    # ✅ REQUIRED
    customer_name: str
    phone_number: str

    # ✅ OPTIONAL
    transaction_id: Optional[str] = None
    utr_number: Optional[str] = None


    city: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    items: Optional[List[OrderItemOut]] = None

    class Config:
        from_attributes = True

