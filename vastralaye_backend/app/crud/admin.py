from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class CRUDProduct:
    @staticmethod
    def create_product(db: Session, data: ProductCreate, image_urls: List[str]) -> Product:
        # Enforce max 5 images
        if len(image_urls) > 5:
            raise HTTPException(status_code=400, detail="Maximum 5 images allowed")

        new_product = Product(
            name=data.name,
            details=data.details,
            description=data.description,
            price=data.price,
            discount_price=data.discount_price,
            rating=data.rating,
            reviews=data.reviews or 0,
            featured=data.featured,
            new_arrival=data.new_arrival,
            best_seller=data.best_seller,
            colors=data.colors,
            specifications=data.specifications,
            sizes=data.sizes,
            highlights=data.highlights,
            category_id=data.category_id,
            subcategory_id=data.subcategory_id,
            in_stock=data.in_stock,
            images=image_urls,
        )

        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return new_product

    @staticmethod
    def get_product(db: Session, product_id: int) -> Product:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    @staticmethod
    def get_all_products(db: Session) -> List[Product]:
        return db.query(Product).order_by(Product.id.desc()).all()

    @staticmethod
    def update_product(db: Session, product_id: int, data: ProductUpdate, image_urls: Optional[List[str]] = None) -> Product:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        update_data = data.dict(exclude_unset=True)

        for field, value in update_data.items():
            setattr(product, field, value)

        # If images passed, replace existing images (max 5)
        if image_urls is not None:
            if len(image_urls) > 5:
                raise HTTPException(status_code=400, detail="Maximum 5 images allowed")
            product.images = image_urls

        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete_product(db: Session, product_id: int) -> None:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        db.delete(product)
        db.commit()


crud_product = CRUDProduct()