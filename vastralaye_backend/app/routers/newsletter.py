import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.authentication import get_current_admin_user
from app.database import get_db
from app.models import User
from app.models.newsletter import NewsletterSubscriber

router = APIRouter(tags=["Newsletter"])

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class SubscribeIn(BaseModel):
    email: str


@router.post("/api/v1/fronted/newsletter/subscribe")
def subscribe(payload: SubscribeIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    existing = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.email == email).first()
    if existing:
        return {"detail": "You're already subscribed."}

    db.add(NewsletterSubscriber(email=email))
    db.commit()
    return {"detail": "Subscribed successfully."}


@router.get("/api/v1/admin/newsletter")
def list_subscribers(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    subs = (
        db.query(NewsletterSubscriber)
        .order_by(NewsletterSubscriber.created_at.desc())
        .all()
    )
    return [
        {"id": s.id, "email": s.email, "created_at": s.created_at}
        for s in subs
    ]
