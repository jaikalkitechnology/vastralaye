import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.constants.permissions import COUPON_MANAGE
from app.utils.authenticate import admin_required, require_permissions
from app.utils.database import get_db
from app.models.models import Coupon, AstrologerDetail, AstrologerPendingChanges, AstrologerUnlockRequest
from app.models.models import CustomerDetail
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/admins", tags=["Admin"])

# Pydantic schemas
class CouponCreateRequest(BaseModel):
    code: str
    max_usage: int = 500

class CouponUpdateRequest(BaseModel):
    max_usage: int = None
    is_active: bool = None

class CouponResponse(BaseModel):
    code: str
    max_usage: int
    used_count: int
    is_active: bool
    customers_used: List[str] = []

    class Config:
        from_attributes = True

# Create a new coupon
@router.post("/create", response_model=CouponResponse)
def create_coupon(payload: CouponCreateRequest, db: Session = Depends(get_db),    current_user = Depends(require_permissions(COUPON_MANAGE))):
    existing = db.query(Coupon).filter(Coupon.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    coupon = Coupon(
        code=payload.code,
        max_usage=payload.max_usage,
        used_count=0,
        is_active=True
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)

    return CouponResponse(
        code=coupon.code,
        max_usage=coupon.max_usage,
        used_count=coupon.used_count,
        is_active=coupon.is_active,
        customers_used=[]
    )

# Update coupon (activate/deactivate or change max usage)
@router.put("/update/{code}", response_model=CouponResponse)
def update_coupon(code: str, payload: CouponUpdateRequest, db: Session = Depends(get_db),admin=Depends(admin_required)):
    coupon = db.query(Coupon).filter(Coupon.code == code).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    if payload.max_usage is not None:
        coupon.max_usage = payload.max_usage
    if payload.is_active is not None:
        coupon.is_active = payload.is_active

    db.commit()
    db.refresh(coupon)

    # Get customers who used this coupon
    customers = db.query(CustomerDetail).filter(CustomerDetail.coupon_code == code).all()
    customer_names = [c.name for c in customers]

    return CouponResponse(
        code=coupon.code,
        max_usage=coupon.max_usage,
        used_count=coupon.used_count,
        is_active=coupon.is_active,
        customers_used=customer_names
    )

# List all coupons
@router.get("/list", response_model=List[CouponResponse])
def list_coupons(db: Session = Depends(get_db),admin=Depends(admin_required)):
    coupons = db.query(Coupon).all()
    response = []
    for coupon in coupons:
        customers = db.query(CustomerDetail).filter(CustomerDetail.coupon_code == coupon.code).all()
        customer_names = [c.name for c in customers]
        response.append(
            CouponResponse(
                code=coupon.code,
                max_usage=coupon.max_usage,
                used_count=coupon.used_count,
                is_active=coupon.is_active,
                customers_used=customer_names
            )
        )
    return response

# Delete coupon
@router.delete("/delete/{code}")
def delete_coupon(code: str, db: Session = Depends(get_db),admin=Depends(admin_required)):
    coupon = db.query(Coupon).filter(Coupon.code == code).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    db.delete(coupon)
    db.commit()
    return {"status": "success", "message": f"Coupon {code} deleted"}



TEXT_FIELDS = [...]  # your text field names
IMAGE_FIELDS = [...] # your image field names

@router.get("/astrologers/unlock-status")
def admin_list_unlock_status(
    db: Session = Depends(get_db),
    admin=Depends(admin_required),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    order_by: str = Query("astro_id")
):
    # 1️⃣ Load all astrologers (paginated)
    astrologers = db.query(AstrologerDetail).order_by(getattr(AstrologerDetail, order_by)).offset(offset).limit(limit).all()
    if not astrologers:
        return {"success": True, "count": 0, "data": []}

    astro_ids = [a.astro_id for a in astrologers]
    astro_map = {a.astro_id: a for a in astrologers}

    # 2️⃣ Load pending changes for these astrologers
    pending_rows = db.query(AstrologerPendingChanges).filter(
        AstrologerPendingChanges.astrologer_id.in_(astro_ids)
    ).all()
    pending_map = {p.astrologer_id: p for p in pending_rows}

    # 3️⃣ Load pending unlock requests
    requests = db.query(AstrologerUnlockRequest).filter(
        AstrologerUnlockRequest.astrologer_id.in_(astro_ids),
        AstrologerUnlockRequest.status == "pending"
    ).all()
    requests_by_astro: Dict[str, List[Any]] = {}
    for r in requests:
        requests_by_astro.setdefault(r.astrologer_id, []).append(r)

    # 4️⃣ Build response
    result = []
    for astro_id in astro_ids:
        astro = astro_map[astro_id]
        pend = pending_map.get(astro_id)
        unlock_status = None
        if pend:
            unlock_status = {c.name: getattr(pend, c.name) for c in pend.__table__.columns if c.name not in ("id", "astrologer_id", "created_at", "updated_at")}

        pending_text_fields = {}
        pending_image_fields = {}
        for req in requests_by_astro.get(astro_id, []):
            new_values = req.new_values or {}
            if isinstance(new_values, str):
                try:
                    new_values = json.loads(new_values)
                except Exception:
                    new_values = {}

            for field, value in new_values.items():
                if field in TEXT_FIELDS:
                    pending_text_fields[field] = value
                elif field in IMAGE_FIELDS:
                    pending_image_fields[field] = value
                else:
                    pending_text_fields.setdefault(field, value)

        result.append({
            "astro_id": astro.astro_id,
            "name": getattr(astro, "name", None),
            "email": getattr(astro, "email", None),
            "contactNo": getattr(astro, "contactNo", None),
            "unlock_status": unlock_status,
            "pending_text_fields": pending_text_fields,
            "pending_image_fields": pending_image_fields,
            "pending_request_count": len(requests_by_astro.get(astro_id, [])),
            "has_pending_changes_row": pend is not None
        })

    return {
        "success": True,
        "count": len(result),
        "data": result
    }