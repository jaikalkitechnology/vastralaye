from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


# ==================== Category Schemas ====================
class CategoryBase(BaseModel):
    name: str
    slug: str
    image: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class CategoryWithSubcategories(CategoryResponse):
    subcategories: List['SubCategoryResponse']


# ==================== SubCategory Schemas ====================
class SubCategoryBase(BaseModel):
    name: str
    slug: str
    category_id: int


class SubCategoryCreate(SubCategoryBase):
    pass


class SubCategoryResponse(SubCategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class SubCategoryWithCategory(SubCategoryResponse):
    category: Optional[CategoryResponse] = None


# ==================== Product Schemas ====================
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    details: Optional[str] = None
    specifications: Optional[str] = None
    highlights: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    category_id: int
    subcategory_id: Optional[int] = None
    sizes: Optional[str] = None
    colors: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    in_stock: bool = True
    rating: float = 0.0
    reviews: int = 0
    featured: bool = False
    best_seller: bool = False
    new_arrival: bool = False
    is_active: bool = True
    # Tax details, managed in Admin → Products.
    hsn_code: Optional[str] = None
    sgst: Optional[float] = None
    cgst: Optional[float] = None


class ProductCreate(ProductBase):
    images: Optional[List[str]]


class ProductResponse(ProductBase):
    id: int
    images: List[str]
    created_at: datetime
    category: Optional[CategoryResponse] = None
    subcategory: Optional[SubCategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    specifications: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    discountPrice: Optional[float] = Field(None, description="Alias for discount_price for frontend compatibility")
    images: List[str]
    rating: float = 0.0
    reviews: int = 0
    in_stock: bool = True
    featured: bool = False
    best_seller: bool = False
    new_arrival: bool = False
    category_id: int
    subcategory: Optional[int] = Field(None, description="subcategory_id")
    brand: Optional[str] = None
    tags: Optional[List[str]]
    created_at: datetime
    createdAt: Optional[datetime] = Field(None, description="Alias for created_at for frontend compatibility")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @classmethod
    def from_product(cls, product):
        """Convert Product model to ProductListResponse with frontend-friendly field names"""
        return cls(
            id=product.id,
            name=product.name,
            description=product.description,
            price=product.price,
            discount_price=product.discount_price,
            discountPrice=product.discount_price,  # Frontend expects camelCase
            images=product.images,
            rating=product.rating,
            reviews=product.reviews,
            in_stock=product.in_stock,
            featured=product.featured,
            best_seller=product.best_seller,
            new_arrival=product.new_arrival,
            category_id=product.category_id,
            subcategory=product.subcategory_id,  # Frontend expects 'subcategory' not 'subcategory_id'
            brand=None,  # Add brand logic if available
            tags=[],  # Add tags logic if available
            created_at=product.created_at,
            createdAt=product.created_at  # Frontend expects camelCase
        )


# ==================== Review Schemas ====================
class ProductReviewBase(BaseModel):
    product_id: int
    user_id: int
    name: str
    rating: float = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ProductReviewCreate(BaseModel):
    name: str
    rating: float = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ProductReviewResponse(ProductReviewBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductReviewWithReplies(ProductReviewResponse):
    replies: List['ProductReviewReplyResponse']


class ProductReviewReplyBase(BaseModel):
    review_id: int
    admin_id: int
    reply_text: str


class ProductReviewReplyCreate(BaseModel):
    reply_text: str


class ProductReviewReplyResponse(ProductReviewReplyBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Filter & Pagination Schemas ====================
class ProductFilterParams(BaseModel):
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    search: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    in_stock: Optional[bool] = None
    featured: Optional[bool] = None
    best_seller: Optional[bool] = None
    new_arrival: Optional[bool] = None
    sort_by: Optional[str] = "featured"  # featured, newest, price_asc, price_desc, rating
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=100)


class PaginatedResponse(BaseModel):
    items: List[ProductListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int