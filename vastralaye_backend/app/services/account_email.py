"""
Account emails: verify your address, welcome, reset your password.

All three are links into the storefront, which is why `site_url` matters so
much here. It is configuration, never derived from the incoming request — an
attacker who could set the Origin header would otherwise have us email a
victim a "reset your password" link pointing at their own site.

Tokens are rows, not bare JWTs. A stored token can be spent once and revoked;
a signed string stays valid for its whole lifetime no matter what happens in
between, which is the wrong property for a link that changes a password.
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.mail import send_custom_email
from app.models.user import EmailVerificationToken, PasswordResetToken, User
from app.services import email_template as T

import logging

logger = logging.getLogger(__name__)

# How long a link stays good.
VERIFY_TTL_HOURS = 48
RESET_TTL_HOURS = 1

DEFAULT_SITE_URL = "https://vastraliya.com"


def resolve_site_url(config: dict) -> str:
    """Where emailed links point. Admin setting, then .env, then the default."""
    configured = (config.get("site_url") or "").strip()
    return (configured or os.getenv("FRONTEND_URL") or DEFAULT_SITE_URL).rstrip("/")


def _new_token() -> str:
    """128 bits from a CSPRNG — this is the whole secret behind the link."""
    return secrets.token_urlsafe(32)


# ------------------------------------------------------------------ tokens --

def issue_verification_token(db: Session, email: str) -> str:
    """Mint a fresh verification link and retire any earlier one."""
    email = (email or "").strip().lower()
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.email == email,
        EmailVerificationToken.used.is_(False),
    ).update({EmailVerificationToken.used: True}, synchronize_session=False)

    token = _new_token()
    db.add(
        EmailVerificationToken(
            email=email,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=VERIFY_TTL_HOURS),
            used=False,
        )
    )
    db.commit()
    return token


def issue_reset_token(db: Session, email: str) -> str:
    """Mint a fresh password-reset link and retire any earlier one."""
    email = (email or "").strip().lower()
    db.query(PasswordResetToken).filter(
        PasswordResetToken.email == email,
        PasswordResetToken.used.is_(False),
    ).update({PasswordResetToken.used: True}, synchronize_session=False)

    token = _new_token()
    db.add(
        PasswordResetToken(
            email=email,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=RESET_TTL_HOURS),
            used=False,
        )
    )
    db.commit()
    return token


def _consume(db: Session, model, token: str) -> Optional[str]:
    """Spend a token once. Returns the email, or None if it's no good.

    Marked used *before* the caller acts on it, so a double-click on the link
    can't run the action twice.
    """
    if not token:
        return None
    row = db.query(model).filter(model.token == token).first()
    if not row or row.used:
        return None
    if row.expires_at and row.expires_at < datetime.utcnow():
        return None
    row.used = True
    db.commit()
    return row.email


def _peek(db: Session, model, token: str) -> Optional[str]:
    """Is this token good, without spending it?

    Needed because the frontend checks a link before showing the form. Doing
    that with `_consume` would burn the token on page load and the customer
    would never get to use it.
    """
    if not token:
        return None
    row = db.query(model).filter(model.token == token).first()
    if not row or row.used:
        return None
    if row.expires_at and row.expires_at < datetime.utcnow():
        return None
    return row.email


def peek_reset_token(db: Session, token: str) -> Optional[str]:
    return _peek(db, PasswordResetToken, token)


def consume_verification_token(db: Session, token: str) -> Optional[str]:
    return _consume(db, EmailVerificationToken, token)


def consume_reset_token(db: Session, token: str) -> Optional[str]:
    return _consume(db, PasswordResetToken, token)


# ------------------------------------------------------------------ emails --

def _send(config: dict, to_email: str, subject: str, plain: str, html: str) -> bool:
    try:
        return bool(
            send_custom_email(
                to_email=to_email,
                subject=subject,
                plain_text=plain,
                html_content=html,
                sender_email=config["sender_email"],
                app_password=config["app_password"],
                sender_name=config["sender_name"],
                smtp_host=config["smtp_host"],
                smtp_port=config["smtp_port"],
                smtp_ssl=config["smtp_ssl"],
                reply_to=config.get("notify_email") or config["sender_email"],
            )
        )
    except Exception as exc:  # noqa: BLE001 - a signup must not 500 on mail
        logger.error("Account email to %s failed: %s", to_email, exc)
        return False


def _first_name(name: Optional[str]) -> str:
    return (name or "").strip().split()[0] if (name or "").strip() else "there"


def send_verification_email(db: Session, config: dict, user: User) -> bool:
    """"Confirm your email" with the activation link."""
    token = issue_verification_token(db, user.email)
    link = f"{resolve_site_url(config)}/verify-email?token={token}"
    shop = config["sender_name"]
    name = _first_name(user.first_name)

    plain = (
        f"Hi {name},\n\n"
        f"Welcome to {shop}. Confirm your email address to activate your account:\n\n"
        f"{link}\n\n"
        f"The link works for {VERIFY_TTL_HOURS} hours. If you didn't create an "
        f"account, you can ignore this email.\n\n— {shop}"
    )
    html = T.render_email(
        preheader=f"Confirm your email to activate your {shop} account.",
        blocks=[
            T.heading(f"Welcome, {name}"),
            T.paragraph(
                f"You're one click from your {shop} account. Confirm this is your "
                "email address and we'll activate it."
            ),
            T.button("Activate my account", link),
            T.fallback_link(link),
            T.paragraph(
                f"The link works for {VERIFY_TTL_HOURS} hours. If you didn't create "
                "an account, ignore this email — nothing will happen.",
                muted=True,
                size=13,
            ),
            T.ornament(),
            T.signoff(shop),
        ],
        footer_lines=[f"{T.esc(shop)} &middot; Handcrafted ethnic wear, made in India"],
    )
    return _send(config, user.email, f"Confirm your email — {shop}", plain, html)


def send_welcome_email(config: dict, user: User) -> bool:
    """For Google sign-ups, whose address Google has already proved.

    Sending them a verification link would be theatre: we trust Google's
    `email_verified` claim, so there is nothing left to confirm. They still get
    an email, because a new account appearing in silence is unsettling.
    """
    shop = config["sender_name"]
    name = _first_name(user.first_name)
    site = resolve_site_url(config)

    plain = (
        f"Hi {name},\n\n"
        f"Your {shop} account is ready — you signed in with Google, so there's "
        "nothing to confirm.\n\n"
        f"Start here: {site}\n\n— {shop}"
    )
    html = T.render_email(
        preheader=f"Your {shop} account is ready.",
        blocks=[
            T.heading(f"Welcome, {name}"),
            T.paragraph(
                f"Your {shop} account is ready. You signed in with Google, so your "
                "email is already confirmed — there's nothing for you to do."
            ),
            T.button("Start shopping", site),
            T.ornament(),
            T.signoff(shop),
        ],
        footer_lines=[f"{T.esc(shop)} &middot; Handcrafted ethnic wear, made in India"],
    )
    return _send(config, user.email, f"Welcome to {shop}", plain, html)


def send_password_reset_email(db: Session, config: dict, user: User) -> bool:
    """"Reset your password" with a single-use link."""
    token = issue_reset_token(db, user.email)
    link = f"{resolve_site_url(config)}/reset-password?token={token}"
    shop = config["sender_name"]
    name = _first_name(user.first_name)

    plain = (
        f"Hi {name},\n\n"
        f"Someone asked to reset the password on your {shop} account. "
        "Use this link to choose a new one:\n\n"
        f"{link}\n\n"
        f"It works once, and expires in {RESET_TTL_HOURS} hour. If this wasn't "
        "you, ignore this email — your password stays as it is.\n\n"
        f"— {shop}"
    )
    html = T.render_email(
        preheader=f"Choose a new password for your {shop} account.",
        blocks=[
            T.heading(f"Hi {name},"),
            T.paragraph(
                f"Someone asked to reset the password on your {shop} account. "
                "Choose a new one here:"
            ),
            T.button("Choose a new password", link),
            T.fallback_link(link),
            T.paragraph(
                f"The link works once and expires in {RESET_TTL_HOURS} hour. If this "
                "wasn't you, ignore this email — your password stays exactly as it is.",
                muted=True,
                size=13,
            ),
            T.ornament(),
            T.signoff(shop),
        ],
        footer_lines=[f"{T.esc(shop)} &middot; Handcrafted ethnic wear, made in India"],
    )
    return _send(config, user.email, f"Reset your password — {shop}", plain, html)
