from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class SubcategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    category_id: Optional[int] = None   # allow None
    subcategory_id: Optional[int] = None

    # Pydantic v2 ORM mode
    model_config = ConfigDict(from_attributes=True)


class SubCategoryCreate(BaseModel):
    name: str
    slug: str
    category_id: int


class SubCategoryUpdate(BaseModel):
    name: str
    slug: str


class CategoryBase(BaseModel):
    name: str
    slug: str


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    image: Optional[str] = None

    # Avoid mutable defaults — set None
    subcategories: Optional[List[SubcategoryOut]] = None

    # Replace orm_mode with from_attributes
    model_config = ConfigDict(from_attributes=True)
