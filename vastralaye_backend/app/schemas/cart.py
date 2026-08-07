from pydantic import BaseModel, ConfigDict
from typing import Optional


class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemOut(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    product_name: Optional[str] = None

    # Pydantic v2 replacement for orm_mode = True
    model_config = ConfigDict(from_attributes=True)
