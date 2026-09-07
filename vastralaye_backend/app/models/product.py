from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.ext.hybrid import hybrid_property


class Product(Base):
    __tablename__ = "products"

    # ------------------ Basic Info ------------------
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    details = Column(Text, nullable=True)
    specifications = Column(Text, nullable=True)
    highlights = Column(Text, nullable=True)

    # ------------------ Pricing ---------------------
    price = Column(Float, nullable=False)
    discount_price = Column(Float, nullable=True)

    # ------------------ Categorization ---------------
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=True)

    # ------------------ Attributes -------------------
    sizes = Column(String(255), nullable=True)
    colors = Column(String(255), nullable=True)

    # IMAGES stored as text
    _images = Column("images", Text, nullable=True)

    @hybrid_property
    def images(self):
        if not self._images:
            return []
        return [img.strip() for img in self._images.split(",") if img.strip()]

    @images.setter
    def images(self, value):
        if isinstance(value, list):
            self._images = ",".join(value)
        else:
            self._images = value

    # ------------------ Media Files (NEW) -------------------
    video_url = Column(String(255), nullable=True)
    pdf_url = Column(String(255), nullable=True)

    # ------------------ Inventory --------------------
    in_stock = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    reviews = Column(Integer, default=0)
    # ------------------ Flags ------------------------
    featured = Column(Boolean, default=False)
    best_seller = Column(Boolean, default=False)
    new_arrival = Column(Boolean, default=False)

    # ------------------ Timestamps -------------------
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    hsn_code = Column(String(20))   # NEW FIELD
    # GST split for this product, as percentages (e.g. 2.5 + 2.5 for 5% GST).
    # schema_sync adds them NULLable on the live database.
    sgst = Column(Float, nullable=True)
    cgst = Column(Float, nullable=True)
    # ------------------ Relationships ----------------
    category = relationship("Category", back_populates="products")
    subcategory = relationship("SubCategory", back_populates="products")

    product_reviews = relationship(
        "ProductReview", back_populates="product", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', price={self.price})>"


class ProductReview(Base):
    __tablename__ = "product_reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # NEW FIELDS
    name = Column(String(120), nullable=False)

    rating = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="product_reviews")
    replies = relationship("ProductReviewReply", back_populates="review", cascade="all, delete")


class ProductReviewReply(Base):
    __tablename__ = "product_review_replies"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("product_reviews.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reply_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship("ProductReview", back_populates="replies")
    admin = relationship("User")
