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
    # Shared secret the gateway must echo back on the webhook. NULL/empty
    # leaves the webhook open, which is how it has always behaved — set it
    # here and in the gateway dashboard to lock it down.
    webhook_secret = Column(String(255), nullable=True)
    # Refuse to mark an order paid when the settled amount doesn't match the
    # order total. Off by default: if the gateway reports in a different unit
    # this would block every confirmation, so it needs verifying once first.
    verify_amount = Column(Boolean, default=False)
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