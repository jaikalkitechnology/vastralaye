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
        {"id": s.id, "email": s.email, "created_at": s.created_at,
         "last_emailed_at": s.last_emailed_at}
        for s in subs
    ]


# ---------------------------------------------------------------
# Writing to a subscriber — same machinery as replying to an enquiry
# ---------------------------------------------------------------

import logging
from datetime import datetime

from app.mail import send_custom_email
from app.services import email_template as T

logger = logging.getLogger("newsletter")

MIN_BODY = 2
MAX_BODY = 5000
MAX_SUBJECT = 150


class SubscriberEmailIn(BaseModel):
    subject: str = ""
    message: str


@router.post("/api/v1/admin/newsletter/{subscriber_id}/email")
def email_subscriber(
    subscriber_id: int,
    payload: SubscriberEmailIn,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Send a branded email to one newsletter subscriber.

    Mirrors the enquiry reply: a failure is not swallowed — the admin is
    acting and can fix the cause, so a recorded send always means an email
    actually left.
    """
    # Imported here, not at module top: contact.py also imports models this
    # module defines indirectly, and the app wires both routers at startup.
    from app.routers.contact import DEFAULT_SENDER_NAME, resolve_email_config

    row = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.id == subscriber_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Subscriber not found")

    body = (payload.message or "").strip()[:MAX_BODY]
    if len(body) < MIN_BODY:
        raise HTTPException(status_code=400, detail="Write a message before sending.")

    config = resolve_email_config(db)
    if not config["sender_email"] or not config["app_password"]:
        raise HTTPException(
            status_code=400,
            detail="No sending account configured — set one in Email settings first.",
        )

    shop = config["sender_name"] or DEFAULT_SENDER_NAME
    subject = (payload.subject or "").strip()[:MAX_SUBJECT] or f"A note from {shop}"

    plain = (
        "Hello,\n\n"
        f"{body}\n\n"
        f"— {shop}\n\n"
        "You're receiving this because you subscribed to Letters from the Loom."
    )
    html = T.render_email(
        preheader=f"A note from {shop}",
        blocks=[
            T.heading("Hello,"),
            T.paragraph(body),
            T.ornament(),
            T.signoff(shop),
        ],
        footer_lines=[
            "You're receiving this because you subscribed to Letters from the Loom.",
            f"{T.esc(shop)} &middot; Premium ethnic wear, made in India",
        ],
    )

    try:
        ok = send_custom_email(
            to_email=row.email,
            subject=subject,
            plain_text=plain,
            html_content=html,
            sender_email=config["sender_email"],
            app_password=config["app_password"],
            sender_name=shop,
            smtp_host=config["smtp_host"],
            smtp_port=config["smtp_port"],
            smtp_ssl=config["smtp_ssl"],
            reply_to=config["notify_email"] or config["sender_email"],
        )
    except Exception as exc:  # noqa: BLE001 - the admin needs to see this
        logger.error("Email to subscriber %s failed: %s", row.id, exc)
        raise HTTPException(status_code=400, detail=f"Could not send: {exc}")

    if not ok:
        raise HTTPException(
            status_code=400,
            detail="The mail server rejected the message. Check Email settings.",
        )

    row.last_emailed_at = datetime.utcnow()
    db.commit()
    logger.info("Admin %s emailed subscriber %s", admin.id, row.id)
    return {"detail": f"Email sent to {row.email}",
            "subscriber": {"id": row.id, "email": row.email,
                           "created_at": row.created_at,
                           "last_emailed_at": row.last_emailed_at}}


@router.delete("/api/v1/admin/newsletter/{subscriber_id}")
def delete_subscriber(
    subscriber_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    row = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.id == subscriber_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    db.delete(row)
    db.commit()
    return {"detail": f"{row.email} removed from the list"}
