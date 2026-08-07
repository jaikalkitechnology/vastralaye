from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict, field_validator


# ---------------- Base ----------------
class WishlistBase(BaseModel):
    product_id: int


# ---------------- Create ----------------
class WishlistCreate(WishlistBase):
    pass


# ---------------- Product Details ----------------
class ProductInWishlist(BaseModel):
    id: int
    name: str
    price: float
    discount_price: Optional[float] = None

    # Can be string (comma separated), list, or None
    images: Union[str, List[str], None] = None

    @field_validator("images", mode="before")
    def split_images(cls, v):
        if isinstance(v, str):
            return [img.strip() for img in v.split(",") if img.strip()]
        return v or []

    model_config = ConfigDict(from_attributes=True)


class WishlistItemOut(BaseModel):
    id: int
    user_id: int
    product_id: int
    created_at: datetime
    product: Optional[ProductInWishlist] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------- Success Message ----------------
class SuccessMessage(BaseModel):
    message: str
