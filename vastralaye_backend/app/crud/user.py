from fastapi import HTTPException
from sqlalchemy.orm import Session
from app import models
from app.models import User
from app.schemas import user as user_schema
from datetime import datetime
from app.security import pwd_context

from app.schemas.user import UserCreate, UserOut, UserSettingsUpdate

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_user1(db: Session, user: UserCreate):
    try:
        hashed_password = get_password_hash(user.password)
        db_user = User(
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            password=hashed_password,
            phone=user.phone,
            address_line1=user.address_line1,
            address_line2=user.address_line2,
            city=user.city,
            region=user.region,
            postal_code=user.postal_code,
            country=user.country,
            created_at=datetime.utcnow(),
            avatar=None
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))