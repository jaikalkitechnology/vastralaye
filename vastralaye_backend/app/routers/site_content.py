import os
import re
import time
from typing import Dict, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.authentication import get_current_admin_user
from app.database import get_db
from app.models import User
from app.models.site_content import HeroBanner, PageBanner, SiteSetting, Testimonial

router = APIRouter(tags=["Site Content"])

BANNERS_DIR = os.path.join("static", "uploads", "banners")
PAGE_BANNERS_DIR = os.path.join("static", "uploads", "page_banners")
TESTIMONIALS_DIR = os.path.join("static", "uploads", "testimonials")
os.makedirs(BANNERS_DIR, exist_ok=True)
os.makedirs(PAGE_BANNERS_DIR, exist_ok=True)
os.makedirs(TESTIMONIALS_DIR, exist_ok=True)

# Storefront slots that can carry an admin-managed banner. "home_hero" is the
# background behind the homepage hero slides; the rest are catalogue bands.
PAGE_BANNER_PAGES = [
    "products",
    "categories",
    "new_arrivals",
    "best_sellers",
    "home_hero",
]

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB

# Settings keys editable from the admin panel
SETTING_KEYS = [
    "instagram_url",
    "facebook_url",
    "twitter_url",
    "youtube_url",
    "whatsapp_number",
    "call_number",
    "float_enabled",
]


def _save_image(upload: UploadFile, directory: str, prefix: str) -> str:
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type. Use JPG/PNG/WebP.")
    data = upload.file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (max 8 MB).")
    ext = os.path.splitext(upload.filename or "")[1].lower() or ".jpg"
    filename = f"{prefix}_{int(time.time())}{ext}"
    path = os.path.join(directory, filename)
    with open(path, "wb") as f:
        f.write(data)
    return "/" + path.replace(os.sep, "/")


def _remove_file(url: Optional[str]) -> None:
    if url and url.startswith("/static/"):
        path = url.lstrip("/")
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass


# ---------------------------------------------------------------
# Hero banners
# ---------------------------------------------------------------

def _banner_out(b: HeroBanner) -> dict:
    return {
        "id": b.id,
        "image_url": b.image_url,
        "overline": b.overline,
        "title_line_1": b.title_line_1,
        "title_line_2": b.title_line_2,
        "description": b.description,
        "cta_primary_label": b.cta_primary_label,
        "cta_primary_link": b.cta_primary_link,
        "cta_secondary_label": b.cta_secondary_label,
        "cta_secondary_link": b.cta_secondary_link,
        "sort_order": b.sort_order or 0,
        "is_active": b.is_active,
    }


@router.get("/api/v1/fronted/banners")
def list_public_banners(db: Session = Depends(get_db)):
    banners = (
        db.query(HeroBanner)
        .filter(HeroBanner.is_active.is_(True))
        .order_by(HeroBanner.sort_order.asc(), HeroBanner.id.asc())
        .all()
    )
    return [_banner_out(b) for b in banners]


@router.get("/api/v1/admin/banners")
def list_admin_banners(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    banners = db.query(HeroBanner).order_by(HeroBanner.sort_order.asc(), HeroBanner.id.asc()).all()
    return [_banner_out(b) for b in banners]


@router.post("/api/v1/admin/banners")
def create_banner(
    title_line_1: Optional[str] = Form(None),
    title_line_2: Optional[str] = Form(None),
    overline: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    cta_primary_label: Optional[str] = Form(None),
    cta_primary_link: Optional[str] = Form(None),
    cta_secondary_label: Optional[str] = Form(None),
    cta_secondary_link: Optional[str] = Form(None),
    sort_order: int = Form(0),
    is_active: bool = Form(True),
    image_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    # Every field is optional. image_url / title_line_1 are NOT NULL in the
    # database, so "not set" is stored as an empty string — which the
    # storefront already treats as absent — rather than needing a migration.
    image_url = _save_image(image_file, BANNERS_DIR, "banner") if image_file else ""
    banner = HeroBanner(
        image_url=image_url,
        overline=(overline or "").strip() or None,
        title_line_1=(title_line_1 or "").strip(),
        title_line_2=(title_line_2 or "").strip() or None,
        description=(description or "").strip() or None,
        cta_primary_label=(cta_primary_label or "").strip() or None,
        cta_primary_link=(cta_primary_link or "").strip() or None,
        cta_secondary_label=(cta_secondary_label or "").strip() or None,
        cta_secondary_link=(cta_secondary_link or "").strip() or None,
        sort_order=sort_order,
        is_active=is_active,
    )
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return _banner_out(banner)


@router.put("/api/v1/admin/banners/{banner_id}")
def update_banner(
    banner_id: int,
    title_line_1: Optional[str] = Form(None),
    title_line_2: Optional[str] = Form(None),
    overline: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    cta_primary_label: Optional[str] = Form(None),
    cta_primary_link: Optional[str] = Form(None),
    cta_secondary_label: Optional[str] = Form(None),
    cta_secondary_link: Optional[str] = Form(None),
    sort_order: int = Form(0),
    is_active: bool = Form(True),
    image_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    banner = db.query(HeroBanner).filter(HeroBanner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    if image_file is not None:
        _remove_file(banner.image_url)
        banner.image_url = _save_image(image_file, BANNERS_DIR, "banner")

    banner.title_line_1 = (title_line_1 or "").strip()
    banner.title_line_2 = (title_line_2 or "").strip() or None
    banner.overline = (overline or "").strip() or None
    banner.description = (description or "").strip() or None
    banner.cta_primary_label = (cta_primary_label or "").strip() or None
    banner.cta_primary_link = (cta_primary_link or "").strip() or None
    banner.cta_secondary_label = (cta_secondary_label or "").strip() or None
    banner.cta_secondary_link = (cta_secondary_link or "").strip() or None
    banner.sort_order = sort_order
    banner.is_active = is_active
    db.commit()
    db.refresh(banner)
    return _banner_out(banner)


@router.patch("/api/v1/admin/banners/{banner_id}/toggle")
def toggle_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    banner = db.query(HeroBanner).filter(HeroBanner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    banner.is_active = not banner.is_active
    db.commit()
    db.refresh(banner)
    return _banner_out(banner)


@router.delete("/api/v1/admin/banners/{banner_id}")
def delete_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    banner = db.query(HeroBanner).filter(HeroBanner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    _remove_file(banner.image_url)
    db.delete(banner)
    db.commit()
    return {"detail": "Banner deleted"}


# ---------------------------------------------------------------
# Page banners (catalogue pages: products / categories /
# new_arrivals / best_sellers — one image + text per page)
# ---------------------------------------------------------------

HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
DEFAULT_OVERLAY_COLOR = "#2B1B12"  # espresso — dark wash under ivory headings
DEFAULT_OVERLAY_OPACITY = 95
# The homepage hero prints espresso copy, so its wash defaults to ivory instead.
OVERLAY_DEFAULTS = {"home_hero": ("#FAF6F0", 90)}


def _overlay_defaults(page: str) -> tuple:
    return OVERLAY_DEFAULTS.get(page, (DEFAULT_OVERLAY_COLOR, DEFAULT_OVERLAY_OPACITY))


def _normalize_hex(value: Optional[str]) -> Optional[str]:
    """'#abc' / '#AABBCC' → '#AABBCC'. Anything else raises."""
    s = (value or "").strip()
    if not s:
        return None
    if not s.startswith("#"):
        s = f"#{s}"
    if not HEX_COLOR_RE.match(s):
        raise HTTPException(
            status_code=400,
            detail="Overlay colour must be a hex value like #2B1B12",
        )
    if len(s) == 4:  # expand #abc → #aabbcc
        s = "#" + "".join(c * 2 for c in s[1:])
    return s.upper()


def _page_banner_out(b: PageBanner) -> dict:
    default_color, default_opacity = _overlay_defaults(b.page)
    return {
        "id": b.id,
        "page": b.page,
        "image_url": b.image_url,
        "title": b.title,
        "subtitle": b.subtitle,
        "is_active": b.is_active,
        "full_bleed": bool(b.full_bleed),
        "overlay_color": b.overlay_color or default_color,
        "overlay_opacity": (
            b.overlay_opacity if b.overlay_opacity is not None else default_opacity
        ),
    }


@router.get("/api/v1/fronted/page-banners")
def list_public_page_banners(db: Session = Depends(get_db)):
    banners = db.query(PageBanner).filter(PageBanner.is_active.is_(True)).all()
    return [_page_banner_out(b) for b in banners]


@router.get("/api/v1/admin/page-banners")
def list_admin_page_banners(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    banners = db.query(PageBanner).all()
    return [_page_banner_out(b) for b in banners]


@router.put("/api/v1/admin/page-banners/{page}")
def upsert_page_banner(
    page: str,
    title: Optional[str] = Form(None),
    subtitle: Optional[str] = Form(None),
    is_active: bool = Form(True),
    full_bleed: bool = Form(False),
    overlay_color: Optional[str] = Form(None),
    overlay_opacity: Optional[int] = Form(None),
    remove_image: bool = Form(False),
    image_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    if page not in PAGE_BANNER_PAGES:
        raise HTTPException(status_code=400, detail=f"Unknown page. Use one of: {', '.join(PAGE_BANNER_PAGES)}")

    banner = db.query(PageBanner).filter(PageBanner.page == page).first()
    if not banner:
        banner = PageBanner(page=page)
        db.add(banner)

    banner.title = (title or "").strip() or None
    banner.subtitle = (subtitle or "").strip() or None
    banner.is_active = is_active
    banner.full_bleed = full_bleed
    banner.overlay_color = _normalize_hex(overlay_color)
    banner.overlay_opacity = (
        None if overlay_opacity is None else max(0, min(100, int(overlay_opacity)))
    )

    if image_file is not None:
        _remove_file(banner.image_url)
        banner.image_url = _save_image(image_file, PAGE_BANNERS_DIR, f"page_{page}")
    elif remove_image:
        _remove_file(banner.image_url)
        banner.image_url = None

    db.commit()
    db.refresh(banner)
    return _page_banner_out(banner)


# ---------------------------------------------------------------
# Testimonials
# ---------------------------------------------------------------

def _testimonial_out(t: Testimonial) -> dict:
    return {
        "id": t.id,
        "quote": t.quote,
        "customer_name": t.customer_name,
        "city": t.city,
        "rating": t.rating or 5.0,
        "image_url": t.image_url,
        "sort_order": t.sort_order or 0,
        "is_active": t.is_active,
    }


@router.get("/api/v1/fronted/testimonials")
def list_public_testimonials(db: Session = Depends(get_db)):
    items = (
        db.query(Testimonial)
        .filter(Testimonial.is_active.is_(True))
        .order_by(Testimonial.sort_order.asc(), Testimonial.id.asc())
        .all()
    )
    return [_testimonial_out(t) for t in items]


@router.get("/api/v1/admin/testimonials")
def list_admin_testimonials(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    items = db.query(Testimonial).order_by(Testimonial.sort_order.asc(), Testimonial.id.asc()).all()
    return [_testimonial_out(t) for t in items]


@router.post("/api/v1/admin/testimonials")
def create_testimonial(
    quote: str = Form(...),
    customer_name: str = Form(...),
    city: Optional[str] = Form(None),
    rating: float = Form(5.0),
    sort_order: int = Form(0),
    is_active: bool = Form(True),
    image_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    rating = max(1.0, min(5.0, rating))
    image_url = _save_image(image_file, TESTIMONIALS_DIR, "customer") if image_file else None
    item = Testimonial(
        quote=quote.strip(),
        customer_name=customer_name.strip(),
        city=(city or "").strip() or None,
        rating=rating,
        image_url=image_url,
        sort_order=sort_order,
        is_active=is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _testimonial_out(item)


@router.put("/api/v1/admin/testimonials/{testimonial_id}")
def update_testimonial(
    testimonial_id: int,
    quote: str = Form(...),
    customer_name: str = Form(...),
    city: Optional[str] = Form(None),
    rating: float = Form(5.0),
    sort_order: int = Form(0),
    is_active: bool = Form(True),
    image_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    item = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    if image_file is not None:
        _remove_file(item.image_url)
        item.image_url = _save_image(image_file, TESTIMONIALS_DIR, "customer")

    item.quote = quote.strip()
    item.customer_name = customer_name.strip()
    item.city = (city or "").strip() or None
    item.rating = max(1.0, min(5.0, rating))
    item.sort_order = sort_order
    item.is_active = is_active
    db.commit()
    db.refresh(item)
    return _testimonial_out(item)


@router.patch("/api/v1/admin/testimonials/{testimonial_id}/toggle")
def toggle_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    item = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    item.is_active = not item.is_active
    db.commit()
    db.refresh(item)
    return _testimonial_out(item)


@router.delete("/api/v1/admin/testimonials/{testimonial_id}")
def delete_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    item = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    _remove_file(item.image_url)
    db.delete(item)
    db.commit()
    return {"detail": "Testimonial deleted"}


# ---------------------------------------------------------------
# Site settings (social links, WhatsApp)
# ---------------------------------------------------------------

class SettingsIn(BaseModel):
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    twitter_url: Optional[str] = None
    youtube_url: Optional[str] = None
    whatsapp_number: Optional[str] = None
    call_number: Optional[str] = None
    float_enabled: Optional[str] = None  # "true" / "false"


def _settings_dict(db: Session) -> Dict[str, str]:
    rows = db.query(SiteSetting).filter(SiteSetting.key.in_(SETTING_KEYS)).all()
    return {row.key: row.value or "" for row in rows}


@router.get("/api/v1/fronted/settings")
def get_public_settings(db: Session = Depends(get_db)):
    return _settings_dict(db)


@router.put("/api/v1/admin/settings")
def update_settings(
    payload: SettingsIn,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    for key in SETTING_KEYS:
        value = getattr(payload, key)
        if value is None:
            continue
        row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
        if row:
            row.value = value.strip()
        else:
            db.add(SiteSetting(key=key, value=value.strip()))
    db.commit()
    return _settings_dict(db)
