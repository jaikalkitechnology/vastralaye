from datetime import datetime


from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(250))
    last_name = Column(String(250))
    email = Column(String(250), unique=True, index=True)
    # NULL for accounts created through Google — they have no password to check.
    password = Column(String(250), nullable=True)
    google_id = Column(String(64), nullable=True, index=True)
    # "password" | "google" — how the account was first created.
    auth_provider = Column(String(20), nullable=True)
    avatar = Column(String(255), nullable=True)  # 👈 only filename/path stored here
    role = Column(String(250), default="user")
    phone = Column(String(50), nullable=True)  # new field
    address_line1 = Column(String(250), nullable=True)  # new field
    address_line2 = Column(String(250), nullable=True)  # new field
    city = Column(String(100), nullable=True)  # new field
    region = Column(String(100), nullable=True)  # new field
    postal_code = Column(String(20), nullable=True)  # new field
    country = Column(String(100), nullable=True)  # new field
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)   # 👈 Soft Delete Flag
    active = Column(Boolean, default=True, nullable=False)
    # Has this address been proved? Deliberately NULLABLE, and NULL means
    # "predates verification" — schema_sync adds columns as NULL, so every
    # existing customer is grandfathered in rather than locked out of their
    # own account the moment this deploys. Only an explicit False blocks login.
    is_verified = Column(Boolean, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    active_at = Column(DateTime, nullable=True)

    @property
    def username(self):
        """Virtual username property — returns full name or email"""
        if self.first_name or self.last_name:
            return f"{self.first_name or ''} {self.last_name or ''}".strip()
        return self.email


    # ✅ All relationships must be indented properly within the class
    addresses = relationship("Address", back_populates="user")
    settings = relationship("UserSettings", back_populates="user", uselist=False)  # ✅ single object
    orders = relationship("Order", foreign_keys="[Order.user_id]", back_populates="user")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete")
    wishlist_items = relationship("WishlistItem", back_populates="user", cascade="all, delete")
    support_messages = relationship("SupportMessage", back_populates="user", cascade="all, delete")






# user setting




class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    email = Column(Boolean, default=True)
    offers = Column(Boolean, default=True)
    updates = Column(Boolean, default=True)

    user = relationship("User", back_populates="settings")

class SupportMessage(Base):
    __tablename__ = "support_messages"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String(255))
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="support_messages")



class EmailVerificationToken(Base):
    """A single-use link proving someone can read the address they signed up with.

    Mirrors PasswordResetToken: stored rather than a bare JWT, so a link can be
    spent once and superseded when a new one is requested.
    """

    __tablename__ = "email_verification_tokens"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), index=True, nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), index=True, nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)