from sqlalchemy import Column, String, Boolean, ForeignKey, Integer


from sqlalchemy.orm import relationship
from app.database import Base

class Address(Base):
    __tablename__ = "addresses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(250))
    line1 = Column(String(250))
    line2 = Column(String(250), nullable=True)
    city = Column(String(250))
    state = Column(String(250))
    postal_code = Column(String(250))
    country = Column(String(250))
    phone = Column(String(250))
    default = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="addresses")
