from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class NewsletterSubscriber(Base):
    """Email captured by the storefront newsletter band."""

    __tablename__ = "newsletter_subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Set when an admin writes to this subscriber from the Enquiries page.
    # Nullable so schema_sync can add it to existing databases (lands NULL).
    last_emailed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<NewsletterSubscriber(email='{self.email}')>"
