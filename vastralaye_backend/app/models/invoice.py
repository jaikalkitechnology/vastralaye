import random
import string
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Customer info
    customer_name = Column(String(255), nullable=True)
    customer_email = Column(String(255), nullable=True)
    customer_phone = Column(String(20), nullable=True)

    # Addresses
    billing_address = Column(Text, nullable=True)
    shipping_address = Column(Text, nullable=True)

    # Amounts
    subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    shipping_amount = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)

    # Payment info
    payment_method = Column(String(50), default="cod")
    payment_status = Column(String(50), default="unpaid")
    transaction_id = Column(String(255), nullable=True)

    # Status
    status = Column(String(50), default="generated")
    notes = Column(Text, nullable=True)

    # Dates
    invoice_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)          # <-- Fixed: was paid_date
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = relationship("InvoiceItem", back_populates="invoice", lazy="joined")
    order = relationship("Order", backref="invoice_ref")
    user = relationship("User", backref="invoices")

    # ════════════════════════════════════════
    # Class method to generate invoice number
    # ════════════════════════════════════════
    @staticmethod
    def generate_invoice_number() -> str:
        """Generate unique invoice number like INV-2024-A1B2C3"""
        year = datetime.utcnow().strftime("%Y")
        random_part = ''.join(
            random.choices(string.ascii_uppercase + string.digits, k=6)
        )
        return f"INV-{year}-{random_part}"


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    product_id = Column(Integer, nullable=False)

    # Product snapshot
    product_name = Column(String(255), nullable=False)
    product_image = Column(Text, nullable=True)
    product_description = Column(Text, nullable=True)
    product_sku = Column(String(100), nullable=True)

    # Pricing
    unit_price = Column(Float, default=0.0)
    quantity = Column(Integer, default=1)
    discount = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.0)       # <-- Added
    tax_amount = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)       # <-- Added
    total = Column(Float, default=0.0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    invoice = relationship("Invoice", back_populates="items")