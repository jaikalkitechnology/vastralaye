from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Reel(Base):
    """Shoppable product video shown on the storefront.

    Placements: homepage "Vastralaye in Motion" row and/or the product
    page "Watch It Styled" strip.
    """

    __tablename__ = "reels"

    id = Column(Integer, primary_key=True, index=True)
    caption = Column(String(255), nullable=False)

    video_url = Column(String(255), nullable=False)
    poster_url = Column(String(255), nullable=True)

    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    show_on_home = Column(Boolean, default=True)
    show_on_pdp = Column(Boolean, default=True)

    is_published = Column(Boolean, default=True)
    views = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product")

    def __repr__(self):
        return f"<Reel(id={self.id}, caption='{self.caption}')>"
