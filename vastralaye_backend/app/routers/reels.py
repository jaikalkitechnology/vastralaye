import os
import time
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.authentication import get_current_admin_user
from app.database import get_db
from app.models import User
from app.models.product import Product
from app.models.reel import Reel

router = APIRouter(tags=["Reels"])

REELS_DIR = os.path.join("static", "uploads", "reels")
os.makedirs(REELS_DIR, exist_ok=True)

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_VIDEO_BYTES = 30 * 1024 * 1024  # 30 MB


def _save_upload(upload: UploadFile, prefix: str) -> str:
    ext = os.path.splitext(upload.filename or "")[1].lower() or ".mp4"
    filename = f"{prefix}_{int(time.time())}{ext}"
    path = os.path.join(REELS_DIR, filename)
    data = upload.file.read()
    if len(data) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 30 MB).")
    with open(path, "wb") as f:
        f.write(data)
    return f"/static/uploads/reels/{filename}"


def _first_image(product: Optional[Product]) -> Optional[str]:
    if not product:
        return None
    images = product.images or []
    return images[0] if images else None


def _reel_out(reel: Reel) -> dict:
    return {
        "id": reel.id,
        "caption": reel.caption,
        "video_url": reel.video_url,
        "poster_url": reel.poster_url,
        "show_on_home": reel.show_on_home,
        "show_on_pdp": reel.show_on_pdp,
        "is_published": reel.is_published,
        "views": reel.views or 0,
        "created_at": reel.created_at,
        "product": (
            {
                "id": reel.product.id,
                "name": reel.product.name,
                "price": reel.product.price,
                "discount_price": reel.product.discount_price,
                "image": _first_image(reel.product),
            }
            if reel.product
            else None
        ),
    }


# ---------------------------------------------------------------
# Public storefront endpoints
# ---------------------------------------------------------------

@router.get("/api/v1/fronted/reels")
def list_public_reels(
    placement: Optional[str] = Query(None, description="'home' or 'pdp'"),
    product_id: Optional[int] = Query(None),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    q = db.query(Reel).filter(Reel.is_published.is_(True))
    if placement == "home":
        q = q.filter(Reel.show_on_home.is_(True))
    elif placement == "pdp":
        q = q.filter(Reel.show_on_pdp.is_(True))
    if product_id is not None:
        q = q.filter(Reel.product_id == product_id)
    reels = q.order_by(Reel.created_at.desc()).limit(limit).all()
    return [_reel_out(r) for r in reels]


@router.post("/api/v1/fronted/reels/{reel_id}/view")
def register_reel_view(reel_id: int, db: Session = Depends(get_db)):
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    reel.views = (reel.views or 0) + 1
    db.commit()
    return {"id": reel.id, "views": reel.views}


# ---------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------

@router.get("/api/v1/admin/reels")
def list_admin_reels(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    reels = db.query(Reel).order_by(Reel.created_at.desc()).all()
    return [_reel_out(r) for r in reels]


@router.post("/api/v1/admin/reels")
def create_reel(
    caption: str = Form(...),
    product_id: Optional[int] = Form(None),
    show_on_home: bool = Form(True),
    show_on_pdp: bool = Form(True),
    is_published: bool = Form(True),
    video_file: Optional[UploadFile] = File(None),
    video_link: Optional[str] = Form(None),
    poster_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Create a reel from either an uploaded video file OR an external
    video link (YouTube / direct MP4 URL) — exactly one is required."""
    video_link = (video_link or "").strip()

    if not video_file and not video_link:
        raise HTTPException(
            status_code=400,
            detail="Provide a video file or a video link (YouTube / MP4 URL).",
        )
    if video_link and not video_link.lower().startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Video link must start with http(s)://")
    if len(video_link) > 255:
        raise HTTPException(status_code=400, detail="Video link is too long (max 255 chars).")
    if video_file and video_file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported video type. Use MP4/WebM.")
    if poster_file and poster_file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported poster type. Use JPG/PNG/WebP.")

    if product_id is not None:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Linked product not found")

    # Uploaded file wins when both are somehow sent
    video_url = _save_upload(video_file, "reel") if video_file else video_link
    poster_url = _save_upload(poster_file, "poster") if poster_file else None

    reel = Reel(
        caption=caption.strip(),
        video_url=video_url,
        poster_url=poster_url,
        product_id=product_id,
        show_on_home=show_on_home,
        show_on_pdp=show_on_pdp,
        is_published=is_published,
    )
    db.add(reel)
    db.commit()
    db.refresh(reel)
    return _reel_out(reel)


@router.patch("/api/v1/admin/reels/{reel_id}/publish")
def toggle_reel_publish(
    reel_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    reel.is_published = not reel.is_published
    db.commit()
    db.refresh(reel)
    return _reel_out(reel)


@router.delete("/api/v1/admin/reels/{reel_id}")
def delete_reel(
    reel_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")

    for url in (reel.video_url, reel.poster_url):
        if url and url.startswith("/static/"):
            path = url.lstrip("/")
            if os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass

    db.delete(reel)
    db.commit()
    return {"detail": "Reel deleted"}
