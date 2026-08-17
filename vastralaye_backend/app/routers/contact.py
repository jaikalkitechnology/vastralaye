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
from app.mail import DEFAULT_SMTP_SSL, send_custom_email
from app.models import User
from app.models.contact import ContactMessage, EmailSetting
from app.services import email_template as T
from app.services.account_email import resolve_site_url

import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Contact"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Where enquiries go until an admin sets something else. This mailbox is
# hosted at Hostinger, which is why the SMTP default below is theirs and not
# Gmail's — sending *from* it against smtp.gmail.com simply fails to log in.
DEFAULT_NOTIFY_EMAIL = "noreply@vastraliya.com"
DEFAULT_SENDER_NAME = "Vastraliya"
DEFAULT_SMTP_HOST = "smtp.hostinger.com"

MAX_NAME = 120
MAX_EMAIL = 160
MAX_PHONE = 40
MAX_MESSAGE = 4000
MIN_MESSAGE = 10


# ---------------------------------------------------------------- settings --

def _settings_row(db: Session) -> Optional[EmailSetting]:
    return db.query(EmailSetting).order_by(EmailSetting.id).first()


def _guess_host(sender: str) -> str:
    """A sensible SMTP host for an address nobody has configured a server for.

    Only a starting point for the form — the admin can always type their own.
    Gmail addresses go to Gmail; everything else defaults to Hostinger, which
    is where this store's own mailboxes live.
    """
    domain = (sender or "").rsplit("@", 1)[-1].lower()
    if domain in {"gmail.com", "googlemail.com"}:
        return "smtp.gmail.com"
    return DEFAULT_SMTP_HOST


def resolve_email_config(db: Session) -> dict:
    """The configuration actually used to send, DB first and `.env` behind it.

    The env vars are what the site ran on before this page existed; keeping
    them as the fallback means an untouched deployment carries on working.
    """
    row = _settings_row(db)
    env_sender = os.getenv("GMAIL_SENDER_EMAIL") or ""
    env_password = os.getenv("GMAIL_APP_PASSWORD") or ""
    sender = (row.sender_email if row and row.sender_email else env_sender).strip()

    host = (row.smtp_host if row and row.smtp_host else "").strip() or _guess_host(sender)
    port = int(row.smtp_port) if row and row.smtp_port else None
    ssl = row.smtp_ssl if row and row.smtp_ssl is not None else None
    if ssl is None:
        ssl = DEFAULT_SMTP_SSL if port is None else (port == 465)
    if port is None:
        port = 465 if ssl else 587

    return {
        "sender_email": sender,
        "app_password": (row.app_password if row and row.app_password else env_password).strip(),
        "sender_name": (row.sender_name if row and row.sender_name else DEFAULT_SENDER_NAME).strip(),
        "notify_email": (
            row.notify_email if row and row.notify_email
            else os.getenv("CONTACT_NOTIFY_EMAIL") or DEFAULT_NOTIFY_EMAIL
        ).strip(),
        "notify_cc": (row.notify_cc if row and row.notify_cc else "").strip(),
        "site_url": (row.site_url if row and row.site_url else "").strip(),
        "notify_enabled": bool(row.notify_enabled) if row else True,
        # NULL means "never decided" — a column schema_sync just added — so it
        # falls back to on rather than silently switching acknowledgements off.
        "ack_enabled": bool(row.ack_enabled) if row and row.ack_enabled is not None else True,
        "smtp_host": host,
        "smtp_port": port,
        "smtp_ssl": bool(ssl),
    }


MAX_CC = 5


def parse_cc(raw: Optional[str], exclude: str = "") -> list:
    """Split a typed CC list into clean, valid, de-duplicated addresses.

    Accepts commas, semicolons or newlines, because people paste from all
    three. Anything that isn't a valid address is dropped rather than sent:
    the whole message fails if the server rejects one recipient, and losing a
    notification to someone's stray comma would be a poor trade.
    """
    if not raw:
        return []
    parts = re.split(r"[,;\n\r]+", raw)
    seen, out = set(), []
    skip = (exclude or "").strip().lower()
    for part in parts:
        address = part.strip().lower()
        if not address or not EMAIL_RE.match(address):
            continue
        # No point copying the address it's already addressed to.
        if address == skip or address in seen:
            continue
        seen.add(address)
        out.append(address)
        if len(out) >= MAX_CC:
            break
    return out


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

    # Thank the sender. Independent of the shop's own notification: they go to
    # different people, and the customer's confirmation is the one they'll
    # notice missing. Also best-effort — a failure here must not turn a
    # successfully-received enquiry into an error on their screen.
    if config["ack_enabled"] and config["sender_email"] and config["app_password"]:
        row.ack_sent = _acknowledge(config, row)

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
    html = T.render_email(
        preheader=f"{row.name} · {row.message[:90]}",
        blocks=[
            T.heading(f"New enquiry from {row.name}"),
            T.details([
                ("Email", T.mailto(row.email)),
                ("Phone", T.esc(row.phone) if row.phone else "&mdash;"),
                ("Sent", T.esc(_pretty_date(row.created_at)) or "just now"),
            ]),
            T.quote("Message", row.message),
        ],
        footer_lines=[
            "Reply to this email to answer them directly, "
            "or open Admin &rsaquo; Enquiries to reply from the dashboard.",
        ],
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
            smtp_host=config["smtp_host"],
            smtp_port=config["smtp_port"],
            smtp_ssl=config["smtp_ssl"],
            # Extra people who want to see enquiries as they come in. Only on
            # this one — a customer must never receive the shop's CC list.
            cc=parse_cc(config["notify_cc"], exclude=config["notify_email"]),
            # So hitting Reply in the inbox answers the customer, not the shop.
            reply_to=row.email,
        )
        return (bool(ok), "" if ok else "SMTP send failed — check the logs")
    except Exception as exc:  # noqa: BLE001 - never let mail break the submission
        logger.error("Contact notification failed for message %s: %s", row.id, exc)
        return (False, str(exc))


def _acknowledge(config: dict, row: ContactMessage) -> bool:
    """Send the sender a "thanks, we'll be in touch" confirmation.

    Two things it is quietly doing beyond good manners: it proves to the
    customer that the form worked, and it gives them a copy of what they wrote
    — so a follow-up from them lands in the same thread rather than as a fresh
    enquiry nobody can match up.
    """
    shop = config["sender_name"] or DEFAULT_SENDER_NAME
    first_name = (row.name or "").split()[0] if (row.name or "").strip() else "there"

    plain = (
        f"Hi {first_name},\n\n"
        f"Thanks for getting in touch with {shop}. We've got your message and "
        "someone will get back to you shortly — usually within one business day.\n\n"
        f"— {shop}\n\n"
        "-------- what you sent us --------\n"
        f"{row.message}"
    )
    html = T.render_email(
        preheader=f"We've got your message — {shop} will reply shortly.",
        blocks=[
            T.heading(f"Thanks, {first_name}"),
            T.paragraph(
                f"We've got your message and someone from {shop} will get back to you "
                "shortly — usually within one business day."
            ),
            T.paragraph(
                "There's nothing you need to do. A copy of what you sent is below, "
                "for your records.",
                muted=True,
                size=14,
            ),
            T.ornament(),
            T.signoff(shop),
            T.quote("What you sent us", row.message, meta=_pretty_date(row.created_at) or None),
        ],
        footer_lines=[
            "Need to add something? Just reply to this email.",
            f"{T.esc(shop)} &middot; Premium ethnic wear, made in India",
        ],
    )

    try:
        return bool(
            send_custom_email(
                to_email=row.email,
                subject=f"Thanks for getting in touch — {shop}",
                plain_text=plain,
                html_content=html,
                sender_email=config["sender_email"],
                app_password=config["app_password"],
                sender_name=shop,
                smtp_host=config["smtp_host"],
                smtp_port=config["smtp_port"],
                smtp_ssl=config["smtp_ssl"],
                # The shop may send from noreply@; if they hit Reply, it has to
                # reach the inbox a person actually reads.
                reply_to=config["notify_email"] or config["sender_email"],
            )
        )
    except Exception as exc:  # noqa: BLE001 - never break a received enquiry
        logger.error("Acknowledgement to %s failed: %s", row.email, exc)
        return False


def _esc(value: str) -> str:
    """The enquiry is untrusted text going into an HTML email."""
    return T.esc(value)


def _pretty_date(value) -> str:
    """'13 Aug 2026, 11:59' — or empty, for a row that predates timestamps."""
    try:
        return value.strftime("%d %b %Y, %H:%M") if value else ""
    except Exception:  # noqa: BLE001 - a date is decoration, never a failure
        return ""


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
        "ack_sent": bool(row.ack_sent),
        "email_error": row.email_error,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "reply": row.reply,
        "replied_at": row.replied_at.isoformat() if row.replied_at else None,
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


class ReplyIn(BaseModel):
    message: str


MIN_REPLY = 2
MAX_REPLY = 5000


@router.post("/api/v1/admin/contact-messages/{message_id}/reply")
def reply_to_enquiry(
    message_id: int,
    payload: ReplyIn,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Email a reply straight to whoever sent the enquiry.

    Unlike the enquiry notification, a failure here is **not** swallowed. The
    admin is the one acting, they can see the result, and they can fix it — so
    a send that didn't happen returns an error and nothing is recorded. A
    stored reply always means an email actually left.
    """
    row = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Message not found")

    body = (payload.message or "").strip()[:MAX_REPLY]
    if len(body) < MIN_REPLY:
        raise HTTPException(status_code=400, detail="Write a reply before sending.")

    config = resolve_email_config(db)
    if not config["sender_email"] or not config["app_password"]:
        raise HTTPException(
            status_code=400,
            detail="No sending account configured — set one in Email settings first.",
        )
    if not EMAIL_RE.match(row.email or ""):
        raise HTTPException(status_code=400, detail="This enquiry has no usable email address.")

    shop = config["sender_name"] or DEFAULT_SENDER_NAME
    subject = f"Re: your message to {shop}"

    # "Hi Riya," reads like a person; "Hi Riya Sharma," reads like a mail merge.
    first_name = (row.name or "").split()[0] if (row.name or "").strip() else "there"

    plain = (
        f"Hi {first_name},\n\n"
        f"{body}\n\n"
        f"— {shop}\n\n"
        "-------- your original message --------\n"
        f"{row.message}"
    )

    sent_on = _pretty_date(row.created_at)
    html = T.render_email(
        # The inbox preview line. Left to the client it would read "Hi Riya,",
        # which says nothing about why they should open it.
        preheader=f"{shop} has replied to your message",
        blocks=[
            T.heading(f"Hi {first_name},"),
            T.paragraph(body),
            T.ornament(),
            T.signoff(shop),
            T.quote(
                "Your message",
                row.message,
                meta=f"sent {sent_on}" if sent_on else None,
            ),
        ],
        footer_lines=[
            "Just reply to this email if you need anything else.",
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
            # The shop may well send from a noreply@ box; point the customer's
            # reply at the inbox a person actually reads.
            reply_to=config["notify_email"] or config["sender_email"],
        )
    except Exception as exc:  # noqa: BLE001 - the admin needs to see this
        logger.error("Reply to enquiry %s failed: %s", row.id, exc)
        raise HTTPException(status_code=400, detail=f"Could not send: {exc}")

    if not ok:
        raise HTTPException(
            status_code=400,
            detail="The mail server rejected the message. Check Email settings.",
        )

    row.reply = body
    row.replied_at = datetime.utcnow()
    row.replied_by = admin.id
    # Answering something is a stronger signal than opening it.
    row.is_read = True
    db.commit()
    db.refresh(row)

    logger.info("Admin %s replied to enquiry %s", admin.id, row.id)
    return {"detail": f"Reply sent to {row.email}", "message": _message_out(row)}


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
    notify_cc: Optional[str] = None
    site_url: Optional[str] = None
    notify_enabled: Optional[bool] = None
    ack_enabled: Optional[bool] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_ssl: Optional[bool] = None


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
        "notify_cc": (row.notify_cc if row else "") or "",
        "site_url": (row.site_url if row else "") or "",
        "notify_enabled": bool(row.notify_enabled) if row else True,
        "ack_enabled": bool(row.ack_enabled) if row and row.ack_enabled is not None else True,
        "smtp_host": (row.smtp_host if row else "") or "",
        "smtp_port": row.smtp_port if row and row.smtp_port else None,
        "smtp_ssl": row.smtp_ssl if row and row.smtp_ssl is not None else None,
        "app_password_masked": _mask(row.app_password) if row and row.app_password else "",
        # What sending actually uses right now, after the .env fallback. Without
        # this the page can look empty while mail is working fine from .env.
        "effective": {
            "sender_email": resolved["sender_email"],
            "sender_name": resolved["sender_name"],
            "notify_email": resolved["notify_email"],
            # The parsed list, so the page can show what will really be copied
            # rather than whatever was typed into the box.
            "notify_cc": parse_cc(resolved["notify_cc"], exclude=resolved["notify_email"]),
            "site_url": resolve_site_url(resolved),
            "smtp_host": resolved["smtp_host"],
            "smtp_port": resolved["smtp_port"],
            "smtp_ssl": resolved["smtp_ssl"],
            "ack_enabled": resolved["ack_enabled"],
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

    if payload.smtp_port is not None and not (1 <= payload.smtp_port <= 65535):
        raise HTTPException(status_code=400, detail="SMTP port must be between 1 and 65535.")

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
    if payload.site_url is not None:
        url = payload.site_url.strip().rstrip("/")
        if url and not re.match(r"^https?://[^\s/]+", url):
            raise HTTPException(
                status_code=400,
                detail="Site address must start with http:// or https://",
            )
        row.site_url = url or None
    if payload.notify_cc is not None:
        raw = payload.notify_cc.strip()
        typed = [x.strip() for x in re.split(r"[,;\n\r]+", raw) if x.strip()]
        bad = [x for x in typed if not EMAIL_RE.match(x.lower())]
        if bad:
            raise HTTPException(
                status_code=400,
                detail=f"Not a valid email address: {bad[0]}",
            )
        if len(typed) > MAX_CC:
            raise HTTPException(
                status_code=400,
                detail=f"At most {MAX_CC} CC addresses.",
            )
        row.notify_cc = ", ".join(parse_cc(raw)) or None
    if payload.notify_enabled is not None:
        row.notify_enabled = bool(payload.notify_enabled)
    if payload.ack_enabled is not None:
        row.ack_enabled = bool(payload.ack_enabled)
    if payload.smtp_host is not None:
        row.smtp_host = payload.smtp_host.strip()[:160] or None
    if payload.smtp_port is not None:
        row.smtp_port = payload.smtp_port
    if payload.smtp_ssl is not None:
        row.smtp_ssl = bool(payload.smtp_ssl)
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
            subject="Vastraliya — test email",
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
            smtp_host=config["smtp_host"],
            smtp_port=config["smtp_port"],
            smtp_ssl=config["smtp_ssl"],
            # Copy the CC list too, so the test proves those addresses work
            # rather than only the primary one.
            cc=parse_cc(config["notify_cc"], exclude=target),
        )
    except Exception as exc:  # noqa: BLE001 - the message is the whole point here
        raise HTTPException(status_code=400, detail=f"Could not send: {exc}")

    if not ok:
        raise HTTPException(
            status_code=400,
            detail="Gmail rejected the login. Check the address and app password.",
        )
    return {"detail": f"Test email sent to {target}"}
