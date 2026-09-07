# models/category.py
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), index=True)
    image = Column(String(255))
    # Storefront visibility. schema_sync adds this NULLable on live
    # databases, so rows predating the column are NULL — every fronted
    # filter must treat NULL as visible, only False hides.
    is_active = Column(Boolean, default=True)

    subcategories = relationship("SubCategory", back_populates="category")
    products = relationship("Product", back_populates="category")

class SubCategory(Base):
    __tablename__ = "subcategories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    slug = Column(String(255), index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))

    category = relationship("Category", back_populates="subcategories")
    products = relationship("Product", back_populates="subcategory")