from pydantic import BaseModel, ConfigDict
from typing import Optional

class AddressBase(BaseModel):
    name: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str
    phone: str
    default: Optional[bool] = False
    user_id: int


class AddressCreate(AddressBase):
    pass


class AddressOut(AddressBase):
    id: int

    # Pydantic v2 ORM model support
    model_config = ConfigDict(from_attributes=True)
