# app/crud/product.py
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy import func

from app.models.product import Product, ProductReview

def create_product(db: Session, payload, image_urls: Optional[List[str]] = None) -> Product:
    image_urls = image_urls or []
    if len(image_urls) > 10:
        raise HTTPException(status_code=400, detail="Too many images.")
    db_obj = Product(
        name=payload.name,
        description=payload.description,
        details=payload.details,
        specifications=payload.specifications,
        highlights=payload.highlights or [],
        price=payload.price,
        discount_price=payload.discount_price,
        category_id=payload.category_id,
        subcategory_id=payload.subcategory_id,
        sizes=payload.sizes or [],
        colors=payload.colors or [],
        images=image_urls or payload.images or [],
        in_stock=payload.in_stock,
        featured=payload.featured,
        best_seller=payload.best_seller,
        new_arrival=payload.new_arrival,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_product(db: Session, product_id: int) -> Product:
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


def list_products(db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
    return db.query(Product).order_by(Product.id.desc()).offset(skip).limit(limit).all()


def update_product(db: Session, product_id: int, data) -> Product:
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in data.items():
        if v is not None and hasattr(p, k):
            setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


def delete_product(db: Session, product_id: int):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(p)
    db.commit()
    return True


def recalc_product_rating(db: Session, product_id: int):
    rows = db.query(ProductReview).filter(ProductReview.product_id == product_id).all()
    total = len(rows)
    if total == 0:
        rating = 0.0
    else:
        s = sum((r.rating or 0) for r in rows)
        rating = round(s / total, 2)
    db.query(Product).filter(Product.id == product_id).update({"rating": rating, "reviews": total})
    db.commit()
