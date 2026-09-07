from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
import json


def _to_list_from_db(value):
    """Helper: DB stores comma string or None -> return list[str]."""
    if value is None:
        return []
    if isinstance(value, list):
        return value

    v = str(value).strip()
    if not v:
        return []

    # JSON list string case
    try:
        parsed = json.loads(v)
        if isinstance(parsed, list):
            return [str(x) for x in parsed]
    except Exception:
        pass

    # Comma-split fallback
    return [item.strip() for item in v.split(",") if item.strip()]


def _to_db_string_from_input(value):
    """Input may be list[str] or comma string -> return comma-string or None."""
    if value is None:
        return None
    if isinstance(value, list):
        return ",".join([str(x).strip() for x in value if str(x).strip()])
    if isinstance(value, str):
        s = value.strip()
        return s if s else None
    return str(value)


# ---------------------- BASE PRODUCT SCHEMA ----------------------
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    details: Optional[str] = None
    specifications: Optional[str] = None

    highlights: Optional[List[str]] = Field(default_factory=list)

    price: float
    discount_price: Optional[float] = None

    category_id: int
    subcategory_id: Optional[int] = None

    sizes: Optional[List[str]] = Field(default_factory=list)
    colors: Optional[List[str]] = Field(default_factory=list)
    images: Optional[List[str]] = Field(default_factory=list)

    # ✅ MUST MATCH SQLAlchemy
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None

    in_stock: bool = True
    featured: bool = False
    best_seller: bool = False
    new_arrival: bool = False



class ProductCreate(ProductBase):
    pass


class BestSellerRequest(BaseModel):
    product_id: int
    is_best_seller: bool


# ---------------------- PRODUCT UPDATE ----------------------
class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    details: Optional[str] = None
    specifications: Optional[str] = None
    highlights: Optional[List[str]] = None

    price: Optional[float] = None
    discount_price: Optional[float] = None

    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None

    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    images: Optional[List[str]] = None

    in_stock: Optional[bool] = None
    featured: Optional[bool] = None
    best_seller: Optional[bool] = None
    new_arrival: Optional[bool] = None


# ---------------------- PRODUCT OUT ----------------------
class ProductOut(ProductBase):
    id: int
    rating: float
    reviews: int
    created_at: Optional[datetime]
    # Storefront visibility — False means hidden from all fronted routes.
    # Surfaced so Admin → Products can show and toggle the state.
    is_active: bool = True
    # Tax details, editable from Admin → Products.
    hsn_code: Optional[str] = None
    sgst: Optional[float] = None
    cgst: Optional[float] = None

    # -------- FIELD VALIDATORS (Pydantic v2) --------
    @field_validator("sizes", mode="before")
    def _sizes_to_list(cls, v):
        return _to_list_from_db(v)

    @field_validator("colors", mode="before")
    def _colors_to_list(cls, v):
        return _to_list_from_db(v)

    @field_validator("images", mode="before")
    def _images_to_list(cls, v):
        return _to_list_from_db(v)

    @field_validator("highlights", mode="before")
    def _highlights_to_list(cls, v):
        return _to_list_from_db(v)

    model_config = ConfigDict(from_attributes=True)