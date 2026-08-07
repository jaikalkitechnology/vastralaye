from sqlalchemy.orm import Session
from app import models
from app.schemas import address as address_schema

def create_address(db: Session, address: address_schema.AddressCreate):
    db_address = models.Address(**address.dict())
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

def get_addresses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Address).offset(skip).limit(limit).all()
