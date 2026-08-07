from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class InvoiceItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_image: Optional[str] = None
    product_description: Optional[str] = None
    product_sku: Optional[str] = None
    unit_price: float
    quantity: int
    discount: float = 0
    tax_rate: float = 18
    tax_amount: float = 0
    subtotal: float
    total: float

    class Config:
        from_attributes = True


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    order_id: int
    user_id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_address: Optional[str] = None
    subtotal: float
    discount_amount: float = 0
    shipping_amount: float = 0
    tax_rate: float = 18
    tax_amount: float = 0
    total_amount: float
    payment_method: str = "cod"
    payment_status: str = "unpaid"
    status: str = "generated"
    notes: Optional[str] = None
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    items: List[InvoiceItemOut] = []

    class Config:
        from_attributes = True


class InvoiceListItem(BaseModel):
    id: int
    invoice_number: str
    order_id: int
    total_amount: float
    payment_method: str
    payment_status: str
    status: str
    invoice_date: Optional[str] = None
    total_items: int = 0

    class Config:
        from_attributes = True