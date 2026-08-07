from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CouponBase(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str  # "percentage" or "fixed"
    discount_value: float
    minimum_purchase: Optional[float] = 0.0
    valid_from: datetime
    valid_to: datetime
    max_uses: Optional[int] = None
    active: bool = True


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    minimum_purchase: Optional[float] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    max_uses: Optional[int] = None
    active: Optional[bool] = None


class CouponOut(CouponBase):
    id: int
    used_count: int

    # Pydantic v2 ORM mode
    model_config = ConfigDict(from_attributes=True)
