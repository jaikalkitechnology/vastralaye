from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.models.models import UserReview, User
from app.schemas.userreviews import (
    UserReviewCreate,
    UserReviewUpdate,
    UserReviewResponse,
)
from app.utils.database import get_db
from app.utils.authenticate import get_current_user  # ✅ Authentication import
from sqlalchemy import func, asc, desc

router = APIRouter()

@router.post("/userreviews", response_model=UserReviewResponse)
def create_user_review(
    data: UserReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Prevent duplicate review
    exists = db.query(UserReview).filter(
        UserReview.userId == current_user.id,
        UserReview.astrologerId == data.astrologerId,
        UserReview.isDelete == False
    ).first()

    if exists:
        raise HTTPException(409, "You already reviewed this astrologer")

    review = UserReview(
        userId=current_user.id,
        astrologerId=data.astrologerId,
        rating=data.rating,
        review=data.review,
        isActive=data.isActive,
        isDelete=data.isDelete,
        isPublic=data.isPublic,
        createdBy=current_user.id,
        modifiedBy=current_user.id,
    )

    db.add(review)
    db.commit()
    db.refresh(review)
    return review





@router.get("/userreviews", response_model=List[UserReviewResponse])
def get_all_user_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ Require auth
):
    return db.query(UserReview).filter(UserReview.isDelete == False).all()



@router.get("/astrologers/{astrologer_id}/reviews",
            response_model=List[UserReviewResponse])
def get_reviews_by_astrologer(
    astrologer_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    order_dir: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offset = (page - 1) * size

    query = db.query(UserReview).filter(
        UserReview.astrologerId == astrologer_id,
        UserReview.isDelete == False
    )

    # Ordering by created_at
    if order_dir == "asc":
        query = query.order_by(asc(UserReview.created_at))
    else:
        query = query.order_by(desc(UserReview.created_at))

    total = query.count()

    reviews = query.offset(offset).limit(size).all()

    return reviews

@router.put("/userreviews/{review_id}", response_model=UserReviewResponse)
def update_user_review(
    review_id: int,
    data: UserReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(UserReview).filter(
        UserReview.id == review_id,
        UserReview.isDelete == False
    ).first()

    if not review:
        raise HTTPException(404, "Review not found")

    # 🔒 Only owner can update
    if review.userId != current_user.id:
        raise HTTPException(403, "Not allowed")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(review, key, value)

    review.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(review)
    return review

