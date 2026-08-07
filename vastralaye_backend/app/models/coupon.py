from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime
from app.database import Base
from datetime import datetime

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(250), unique=True, nullable=False, index=True)
    description = Column(String(250))
    discount_type = Column(String(250), nullable=False)  # "percentage" or "fixed"
    discount_value = Column(Float, nullable=False)
    minimum_purchase = Column(Float, default=0.0)
    valid_from = Column(DateTime, nullable=False, default=datetime.utcnow)
    valid_to = Column(DateTime, nullable=False)
    max_uses = Column(Integer, nullable=True)  # nullable for unlimited usage
    used_count = Column(Integer, default=0)
    active = Column(Boolean, default=True)
