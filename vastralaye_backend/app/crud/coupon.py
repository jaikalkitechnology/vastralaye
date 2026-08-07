from sqlalchemy.orm import Session
from app import models, schemas
from app.schemas import coupon as coupon_schema

def get_coupon_by_code(db: Session, code: str):
    return db.query(models.Coupon).filter(models.Coupon.code == code).first()

def get_coupon_by_id(db: Session, coupon_id: int):
    return db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()

def create_coupon(db: Session, coupon: coupon_schema.CouponCreate):
    db_coupon = models.Coupon(
        code=coupon.code,
        description=coupon.description,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        minimum_purchase=coupon.minimum_purchase,
        valid_from=coupon.valid_from,
        valid_to=coupon.valid_to,
        max_uses=coupon.max_uses,
        active=coupon.active
    )
    db.add(db_coupon)
    db.commit()
    db.refresh(db_coupon)
    return db_coupon

def get_coupon(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Coupon).offset(skip).limit(limit).all()

def update_coupon(db: Session, db_coupon: models.Coupon, coupon_update: coupon_schema.CouponUpdate):
    # Update the coupon details based on the fields provided in coupon_update
    for key, value in coupon_update.dict(exclude_unset=True).items():
        setattr(db_coupon, key, value)

    # Commit the changes to the database
    db.commit()
    db.refresh(db_coupon)

    return db_coupon

def delete_coupon(db: Session, db_coupon: models.Coupon):
    db.delete(db_coupon)
    db.commit()
