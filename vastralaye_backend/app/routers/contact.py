"""Contact Us — public submissions, the admin inbox, and email configuration.

The storefront form posts here instead of straight to a third-party mailer, so
every enquiry lands in the database first and is announced by email second. A
message is never lost to a wrong SMTP password: the row is the record, and
`emailed` says whether the notification made it out.
"""

import os
import re
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.authentication import get_current_admin_user
from app.database import get_db
from app.mail import send_custom_email
from app.models import User
from app.models.contact import ContactMessage, EmailSetting

import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Contact"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Where enquiries go until an admin sets something else.
DEFAULT_NOTIFY_EMAIL = "noreply@vastraliya.com"
DEFAULT_SENDER_NAME = "Vastralaye"

MAX_NAME = 120
MAX_EMAIL = 160
MAX_PHONE = 40
MAX_MESSAGE = 4000
MIN_MESSAGE = 10


# ---------------------------------------------------------------- settings --

def _settings_row(db: Session) -> Optional[EmailSetting]:
    return db.query(EmailSetting).order_by(EmailSetting.id).first()


def resolve_email_config(db: Session) -> dict:
    """The configuration actually used to send, DB first and `.env` behind it.

    The env vars are what the site ran on before this page existed; keeping
    them as the fallback means an untouched deployment carries on working.
    """
    row = _settings_row(db)
    env_sender = os.getenv("GMAIL_SENDER_EMAIL") or ""
    env_password = os.getenv("GMAIL_APP_PASSWORD") or ""
    return {
        "sender_email": (row.sender_email if row and row.sender_email else env_sender).strip(),
        "app_password": (row.app_password if row and row.app_password else env_password).strip(),
        "sender_name": (row.sender_name if row and row.sender_name else DEFAULT_SENDER_NAME).strip(),
        "notify_email": (
            row.notify_email if row and row.notify_email
            else os.getenv("CONTACT_NOTIFY_EMAIL") or DEFAULT_NOTIFY_EMAIL
        ).strip(),
        "notify_enabled": bool(row.notify_enabled) if row else True,
    }


def _mask(value: str) -> str:
    """'abcd efgh ijkl' → '••••••••ijkl' — recognisable, not reusable."""
    if not value:
        return ""
    tail = value[-4:] if len(value) > 4 else ""
    return "•" * max(8, len(value) - len(tail)) + tail


# ------------------------------------------------------------------ public --

class ContactIn(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    message: str


def _clean(value: Optional[str], limit: int) -> str:
    return (value or "").strip()[:limit]


@router.post("/api/v1/fronted/contact")
def submit_contact(payload: ContactIn, db: Session = Depends(get_db)):
    """Take a Contact Us submission: store it, then try to announce it."""
    name = _clean(payload.name, MAX_NAME)
    email = _clean(payload.email, MAX_EMAIL).lower()
    phone = _clean(payload.phone, MAX_PHONE)
    message = _clean(payload.message, MAX_MESSAGE)

    if not name:
        raise HTTPException(status_code=400, detail="Please tell us your name.")
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(message) < MIN_MESSAGE:
        raise HTTPException(
            status_code=400,
            detail=f"Please write at least {MIN_MESSAGE} characters so we can help.",
        )

    row = ContactMessage(name=name, email=email, phone=phone or None, message=message)
    db.add(row)
    db.commit()
    db.refresh(row)

    # Announce it. Delivery is best-effort on purpose — the enquiry is already
    # saved, and a customer should never see an SMTP problem they can't act on.
    config = resolve_email_config(db)
    blocker = _why_not_sending(config)
    if blocker:
        # Say which of the two it is — "not configured" and "deliberately off"
        # need completely different actions from whoever reads the admin page.
        row.email_error = blocker
    else:
        ok, error = _notify(config, row)
        row.emailed = ok
        row.email_error = None if ok else (error or "")[:255]
    db.commit()

    # Never leak whether the notification worked; that's the shop's problem.
    return {"message": "Thanks — we've got your message and will be in touch.", "id": row.id}


def _why_not_sending(config: dict) -> str:
    """Empty when mail can be attempted; otherwise the reason, for the admin page."""
    if not config["notify_enabled"]:
        return "Email notifications are switched off in Admin › Enquiries"
    if not config["notify_email"]:
        return "No notification address set in Admin › Enquiries"
    if not config["sender_email"] or not config["app_password"]:
        return "No sending account configured in Admin › Enquiries"
    return ""


def _notify(config: dict, row: ContactMessage) -> tuple:
    """Email one enquiry to the configured inbox. Returns (ok, error)."""
    subject = f"New enquiry from {row.name}"
    lines = [
        f"Name:    {row.name}",
        f"Email:   {row.email}",
        f"Phone:   {row.phone or '—'}",
        f"Sent:    {row.created_at or datetime.utcnow()}",
        "",
        row.message,
    ]
    plain = "\n".join(lines)
    html = (
        '<div style="font-family:Segoe UI,Arial,sans-serif;color:#2B1B12">'
        f'<h2 style="color:#7A1F2B;margin:0 0 16px">New enquiry from {_esc(row.name)}</h2>'
        '<table cellpadding="6" style="border-collapse:collapse;font-size:14px">'
        f'<tr><td><b>Email</b></td><td><a href="mailto:{_esc(row.email)}">{_esc(row.email)}</a></td></tr>'
        f'<tr><td><b>Phone</b></td><td>{_esc(row.phone or "—")}</td></tr>'
        '</table>'
        f'<p style="white-space:pre-wrap;margin-top:16px">{_esc(row.message)}</p>'
        '</div>'
    )
    try:
        ok = send_custom_email(
            to_email=config["notify_email"],
            subject=subject,
            plain_text=plain,
            html_content=html,
            sender_email=config["sender_email"],
            app_password=config["app_password"],
            sender_name=config["sender_name"],
            # So hitting Reply in the inbox answers the customer, not the shop.
            reply_to=row.email,
        )
        return (bool(ok), "" if ok else "SMTP send failed — check the logs")
    except Exception as exc:  # noqa: BLE001 - never let mail break the submission
        logger.error("Contact notification failed for message %s: %s", row.id, exc)
        return (False, str(exc))


def _esc(value: str) -> str:
    """The enquiry is untrusted text going into an HTML email."""
    return (
        (value or "")
        .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        .replace('"', "&quot;")
    )


# ------------------------------------------------------------------- admin --

def _message_out(row: ContactMessage) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "email": row.email,
        "phone": row.phone,
        "message": row.message,
        "is_read": bool(row.is_read),
        "emailed": bool(row.emailed),
        "email_error": row.email_error,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


@router.get("/api/v1/admin/contact-messages", dependencies=[Depends(get_current_admin_user)])
def list_contact_messages(
    db: Session = Depends(get_db),
    unread_only: bool = False,
    search: str = "",
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    query = db.query(ContactMessage)
    if unread_only:
        query = query.filter(ContactMessage.is_read.is_(False))
    term = (search or "").strip()
    if term:
        like = f"%{term}%"
        query = query.filter(
            (ContactMessage.name.ilike(like))
            | (ContactMessage.email.ilike(like))
            | (ContactMessage.message.ilike(like))
        )

    total = query.count()
    rows = (
        query.order_by(desc(ContactMessage.created_at), desc(ContactMessage.id))
        .offset(offset)
        .limit(limit)
        .all()
    )
    # Counted across everything, not the current filter — it's a badge, and a
    # badge that changed when you typed in the search box would be nonsense.
    unread = db.query(func.count(ContactMessage.id)).filter(
        ContactMessage.is_read.is_(False)
    ).scalar() or 0

    return {
        "data": [_message_out(r) for r in rows],
        "total": total,
        "unread": unread,
        "limit": limit,
        "offset": offset,
    }


class ReadFlag(BaseModel):
    is_read: bool = True


@router.patch("/api/v1/admin/contact-messages/{message_id}/read",
              dependencies=[Depends(get_current_admin_user)])
def mark_contact_message(message_id: int, payload: ReadFlag, db: Session = Depends(get_db)):
    row = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Message not found")
    row.is_read = bool(payload.is_read)
    db.commit()
    return _message_out(row)


@router.delete("/api/v1/admin/contact-messages/{message_id}",
               dependencies=[Depends(get_current_admin_user)])
def delete_contact_message(message_id: int, db: Session = Depends(get_db)):
    row = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(row)
    db.commit()
    return {"detail": "Message deleted"}


# ---------------------------------------------------- email configuration --

class EmailConfigIn(BaseModel):
    sender_email: Optional[str] = None
    # Blank means "keep the stored password" — the form only ever shows a mask.
    app_password: Optional[str] = None
    sender_name: Optional[str] = None
    notify_email: Optional[str] = None
    notify_enabled: Optional[bool] = None


def _config_out(db: Session) -> dict:
    row = _settings_row(db)
    resolved = resolve_email_config(db)
    # Text fields come back as "" and never null: these feed controlled inputs,
    # and a null would flip them to uncontrolled the first time it's rendered.
    return {
        "configured": bool(row),
        "sender_email": (row.sender_email if row else "") or "",
        "sender_name": (row.sender_name if row else "") or "",
        "notify_email": (row.notify_email if row else "") or "",
        "notify_enabled": bool(row.notify_enabled) if row else True,
        "app_password_masked": _mask(row.app_password) if row and row.app_password else "",
        # What sending actually uses right now, after the .env fallback. Without
        # this the page can look empty while mail is working fine from .env.
        "effective": {
            "sender_email": resolved["sender_email"],
            "sender_name": resolved["sender_name"],
            "notify_email": resolved["notify_email"],
            "has_password": bool(resolved["app_password"]),
            "from_env": not bool(row and row.sender_email),
        },
        "updated_at": row.updated_at.isoformat() if row and row.updated_at else None,
    }


@router.get("/api/v1/admin/email-config", dependencies=[Depends(get_current_admin_user)])
def get_email_config(db: Session = Depends(get_db)):
    return _config_out(db)


@router.put("/api/v1/admin/email-config")
def update_email_config(
    payload: EmailConfigIn,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    for field, limit in (("sender_email", MAX_EMAIL), ("notify_email", MAX_EMAIL)):
        value = (getattr(payload, field) or "").strip()
        if value and not EMAIL_RE.match(value):
            raise HTTPException(
                status_code=400,
                detail=f"{field.replace('_', ' ').capitalize()} is not a valid email address.",
            )
        if len(value) > limit:
            raise HTTPException(status_code=400, detail=f"{field.replace('_', ' ')} is too long.")

    row = _settings_row(db)
    if not row:
        row = EmailSetting()
        db.add(row)

    if payload.sender_email is not None:
        row.sender_email = payload.sender_email.strip() or None
    if payload.sender_name is not None:
        row.sender_name = payload.sender_name.strip()[:120] or None
    if payload.notify_email is not None:
        row.notify_email = payload.notify_email.strip() or None
    if payload.notify_enabled is not None:
        row.notify_enabled = bool(payload.notify_enabled)
    # Blank keeps what's stored, so re-saving the form doesn't wipe the password
    # the admin can only ever see masked.
    if payload.app_password:
        row.app_password = payload.app_password.strip()

    row.updated_by = admin.id
    db.commit()
    logger.info("Admin %s updated the email configuration", admin.id)
    return _config_out(db)


class TestEmailIn(BaseModel):
    to_email: Optional[str] = None


@router.post("/api/v1/admin/email-config/test")
def send_test_email(
    payload: TestEmailIn,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Prove the credentials work before an enquiry depends on them."""
    config = resolve_email_config(db)
    target = (payload.to_email or "").strip() or config["notify_email"]
    if not EMAIL_RE.match(target or ""):
        raise HTTPException(status_code=400, detail="No valid address to send the test to.")
    if not config["sender_email"] or not config["app_password"]:
        raise HTTPException(
            status_code=400,
            detail="Set the sender address and app password first.",
        )

    try:
        ok = send_custom_email(
            to_email=target,
            subject="Vastralaye — test email",
            plain_text=(
                "This is a test from Admin › Enquiries.\n\n"
                "If you're reading it, contact form notifications will arrive here."
            ),
            html_content=(
                '<div style="font-family:Segoe UI,Arial,sans-serif;color:#2B1B12">'
                '<h2 style="color:#7A1F2B">Test email</h2>'
                "<p>Sent from Admin › Enquiries. If you're reading this, contact form "
                "notifications will arrive at this address.</p></div>"
            ),
            sender_email=config["sender_email"],
            app_password=config["app_password"],
            sender_name=config["sender_name"],
        )
    except Exception as exc:  # noqa: BLE001 - the message is the whole point here
        raise HTTPException(status_code=400, detail=f"Could not send: {exc}")

    if not ok:
        raise HTTPException(
            status_code=400,
            detail="Gmail rejected the login. Check the address and app password.",
        )
    return {"detail": f"Test email sent to {target}"}
