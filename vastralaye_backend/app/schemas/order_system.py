from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


# ---------------- PRODUCT DETAILS IN ORDER ----------------
class ProductInOrder(BaseModel):
    id: int
    name: str
    price: float
    discount_price: Optional[float] = None
    images: List[str]  # parsed list of images

    model_config = ConfigDict(from_attributes=True)


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float
    product: ProductInOrder  # Include product details

    model_config = ConfigDict(from_attributes=True)


class OrderUser(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderTrackingResponse(BaseModel):
    id: int
    status: str
    message: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    user: OrderUser
    status: str
    total_amount: float
    payment_status: Optional[str] = None
    created_at: datetime

    # 🔥 MUST MATCH ORM RELATIONSHIP NAMES
    items: List[OrderItemResponse] = []
    tracking: List[OrderTrackingResponse] = []

    model_config = ConfigDict(from_attributes=True)
