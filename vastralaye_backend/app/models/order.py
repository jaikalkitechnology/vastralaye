# models.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # ✅ Customer Details
    customer_name = Column(String(100), nullable=True)
    phone_number = Column(String(20), nullable=False)

    # ✅ Address (keep both structured + full text)
    shipping_address = Column(Text, nullable=True)

    # Optional structured fields (recommended)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)

    # ✅ Payment Info
    payment_method = Column(String(50), default="cod")  # cod, online, upi, card
    payment_status = Column(String(30), default="pending")  # pending, paid, failed, refunded

    transaction_id = Column(String(100), nullable=True, unique=True, index=True)
    utr_number = Column(String(100), nullable=True)

    # Shipment number from the Vastraliya tracking system — filled in by a
    # background sync right after checkout; shown to the customer so they can
    # follow the parcel on tracking.vastraliya.com.
    tracking_number = Column(String(100), nullable=True)

    # ✅ Mizorpay Payment Fields (NEW)
    merchant_ref = Column(String(255), nullable=True, unique=True, index=True)
    mizor_pay_txn_id = Column(String(255), nullable=True, unique=True, index=True)
    rrn_no = Column(String(100), nullable=True)
    paid_amount = Column(Float, nullable=True)
    payment_date = Column(DateTime, nullable=True)

    # ✅ Order Info
    status = Column(String(50), default="pending")  # pending, confirmed, shipped, delivered, cancelled
    total_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0)
    gst_amount = Column(Float, default=0)
    shipping_amount = Column(Float, default=0)

    # ✅ Additional Info
    notes = Column(Text, nullable=True)
    is_paid = Column(Boolean, default=False)
    is_cancelled = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="orders")

    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )

    tracking = relationship(
        "OrderTracking",
        back_populates="order",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, status={self.status}, payment_status={self.payment_status})>"

    def to_dict(self):
        """Convert order to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "customer_name": self.customer_name,
            "phone_number": self.phone_number,
            "shipping_address": self.shipping_address,
            "city": self.city,
            "state": self.state,
            "pincode": self.pincode,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "transaction_id": self.transaction_id,
            "merchant_ref": self.merchant_ref,
            "mizor_pay_txn_id": self.mizor_pay_txn_id,
            "rrn_no": self.rrn_no,
            "paid_amount": self.paid_amount,
            "payment_date": self.payment_date.isoformat() if self.payment_date else None,
            "status": self.status,
            "total_amount": self.total_amount,
            "discount_amount": self.discount_amount,
            "gst_amount": self.gst_amount,
            "shipping_amount": self.shipping_amount,
            "notes": self.notes,
            "is_paid": self.is_paid,
            "is_cancelled": self.is_cancelled,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    discount_price = Column(Float, nullable=True)  # Final price after discount

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class OrderTracking(Base):
    __tablename__ = "order_tracking"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    status = Column(String(50))
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="tracking")