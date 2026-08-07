from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, JSON
from sqlalchemy.sql import func
from ..database import Base

# ===================================================================
#  MODEL 1: PAYMENT GATEWAY CREDENTIALS
# ===================================================================
class PaymentGatewayCredential(Base):
    __tablename__ = "payment_gateway_credentials"

    id = Column(Integer, primary_key=True, index=True)
    gateway_name = Column(String(100), unique=True, nullable=False)
    token_id = Column(Text, nullable=False)
    secret_key = Column(Text, nullable=False)
    base_url = Column(String(255), nullable=False)
    endpoint_path = Column(String(255), nullable=False, default="/api/collection-v7-payment")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)


# ===================================================================
#  MODEL 2: PAYMENT LOGS
#  (This is now a separate, top-level class, which is correct)
# ===================================================================
class PaymentLog(Base):
    __tablename__ = "payment_logs"

    id = Column(Integer, primary_key=True, index=True)
    merchant_ref = Column(String(255), unique=True, index=True, nullable=False)
    status = Column(String(50), index=True)
    amount = Column(Float)  # This will now work because Float is imported
    user_id = Column(Integer, nullable=True)
    request_payload = Column(JSON) # This will now work because JSON is imported
    gateway_response = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())