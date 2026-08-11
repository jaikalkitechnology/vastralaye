"""Sign in with Google, switched on and off from the admin dashboard.

Uses the Google Identity Services *ID token* flow: the browser gets a signed
JWT from Google and posts it here. Only the client ID is needed to verify it,
so there is no client secret to store — the client ID is public by design and
is served to the storefront.

Settings live in `site_settings` under keys the public settings endpoint does
not expose, so they can be read and written independently of the social links.
"""

import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, Form, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.authentication import create_access_token, get_current_admin_user
from app.database import get_db
from app.models import User
from app.models.site_content import SiteSetting

router = APIRouter(tags=["Google Login"])
log = logging.getLogger("google_auth")

ENABLED_KEY = "google_login_enabled"
CLIENT_ID_KEY = "google_client_id"
ALLOW_SIGNUP_KEY = "google_allow_signup"

TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
VALID_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


# ---------------------------------------------------------------
# Settings helpers
# ---------------------------------------------------------------

def _get(db: Session, key: str, default: str = "") -> str:
    row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
    return (row.value if row and row.value is not None else default) or default


def _set(db: Session, key: str, value: str) -> None:
    row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
    if row:
        row.value = value
    else:
        db.add(SiteSetting(key=key, value=value))


def _flag(value: str, default: bool = False) -> bool:
    if not value:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _config(db: Session) -> dict:
    client_id = _get(db, CLIENT_ID_KEY).strip()
    return {
        # Never advertise it as on without a client ID — the button would
        # render and then fail on click.
        "enabled": _flag(_get(db, ENABLED_KEY)) and bool(client_id),
        "client_id": client_id,
        "allow_signup": _flag(_get(db, ALLOW_SIGNUP_KEY), default=True),
    }


# ---------------------------------------------------------------
# Public config — the storefront needs the client ID to render the button
# ---------------------------------------------------------------

@router.get("/api/v1/fronted/auth/google")
def public_google_config(db: Session = Depends(get_db)):
    cfg = _config(db)
    return {"enabled": cfg["enabled"], "client_id": cfg["client_id"] if cfg["enabled"] else ""}


# ---------------------------------------------------------------
# Admin
# ---------------------------------------------------------------

@router.get("/api/v1/admin/auth/google")
def admin_google_config(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    cfg = _config(db)
    google_users = db.query(User).filter(User.auth_provider == "google").count()
    return {
        **cfg,
        # `enabled` above is the effective state; this is the raw switch, so the
        # admin can see "on but no client ID" rather than a silent off.
        "switch_on": _flag(_get(db, ENABLED_KEY)),
        "google_users": google_users,
    }


@router.put("/api/v1/admin/auth/google")
def update_google_config(
    enabled: bool = Form(False),
    client_id: Optional[str] = Form(None),
    allow_signup: bool = Form(True),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    cleaned = (client_id or "").strip()
    if enabled and not cleaned:
        raise HTTPException(
            status_code=400,
            detail="Add your Google Client ID before turning Google sign-in on.",
        )
    if cleaned and not cleaned.endswith(".apps.googleusercontent.com"):
        raise HTTPException(
            status_code=400,
            detail="That doesn't look like a Google Client ID — it should end in .apps.googleusercontent.com",
        )

    _set(db, ENABLED_KEY, "true" if enabled else "false")
    _set(db, CLIENT_ID_KEY, cleaned)
    _set(db, ALLOW_SIGNUP_KEY, "true" if allow_signup else "false")
    db.commit()
    return _config(db)


# ---------------------------------------------------------------
# Sign in
# ---------------------------------------------------------------

class GoogleLoginIn(BaseModel):
    credential: str


async def _verify_id_token(token: str, client_id: str) -> dict:
    """Ask Google to validate the JWT, then check it was issued for us."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(TOKENINFO_URL, params={"id_token": token})
    except httpx.HTTPError as exc:
        log.error("Google tokeninfo unreachable: %s", exc)
        raise HTTPException(status_code=503, detail="Could not reach Google. Please try again.")

    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Google sign-in token was rejected.")

    claims = res.json()

    # A valid signature isn't enough — it has to be *our* token.
    if claims.get("aud") != client_id:
        log.error("Google token audience mismatch: %s", claims.get("aud"))
        raise HTTPException(status_code=401, detail="This Google token was issued for another app.")
    if claims.get("iss") not in VALID_ISSUERS:
        raise HTTPException(status_code=401, detail="Unexpected token issuer.")
    if str(claims.get("email_verified", "")).lower() not in {"true", "1"}:
        raise HTTPException(status_code=401, detail="Your Google email address is not verified.")
    if not claims.get("email"):
        raise HTTPException(status_code=401, detail="Google did not return an email address.")

    return claims


@router.post("/api/v1/users/auth/google")
async def google_login(payload: GoogleLoginIn, db: Session = Depends(get_db)):
    cfg = _config(db)
    if not cfg["enabled"]:
        raise HTTPException(status_code=403, detail="Google sign-in is turned off.")

    claims = await _verify_id_token(payload.credential, cfg["client_id"])
    email = claims["email"].strip().lower()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        if not cfg["allow_signup"]:
            raise HTTPException(
                status_code=403,
                detail="No account found for this Google address. Please register first.",
            )
        user = User(
            first_name=(claims.get("given_name") or "").strip() or "Customer",
            last_name=(claims.get("family_name") or "").strip() or "",
            email=email,
            password=None,          # Google-only account
            role="user",
            auth_provider="google",
            google_id=claims.get("sub"),
            avatar=claims.get("picture"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if user.deleted_at is not None:
            raise HTTPException(
                status_code=403,
                detail="Your account is deactivated. Contact support to reactivate.",
            )
        # Link the Google identity to the existing account on first use.
        if not user.google_id:
            user.google_id = claims.get("sub")
        if not user.auth_provider:
            user.auth_provider = "password"
        if not user.avatar and claims.get("picture"):
            user.avatar = claims.get("picture")
        db.commit()

    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}
