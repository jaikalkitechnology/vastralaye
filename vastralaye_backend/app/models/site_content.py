from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class HeroBanner(Base):
    """Homepage hero slide managed from the admin panel."""

    __tablename__ = "hero_banners"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String(255), nullable=False)
    overline = Column(String(120), nullable=True)
    title_line_1 = Column(String(160), nullable=False)
    title_line_2 = Column(String(160), nullable=True)   # italic maroon accent line
    description = Column(Text, nullable=True)
    cta_primary_label = Column(String(60), nullable=True)
    cta_primary_link = Column(String(255), nullable=True)
    cta_secondary_label = Column(String(60), nullable=True)
    cta_secondary_link = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PageBanner(Base):
    """Per-page catalogue banner (image + text) managed from the admin
    panel — one row per storefront page (products / categories /
    new_arrivals / best_sellers)."""

    __tablename__ = "page_banners"

    id = Column(Integer, primary_key=True, index=True)
    page = Column(String(40), unique=True, nullable=False, index=True)
    image_url = Column(String(255), nullable=True)
    title = Column(String(160), nullable=True)
    subtitle = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    # Artwork that already carries its own headline/background: show it
    # edge-to-edge at its own aspect ratio, with no espresso wash and no
    # heading painted over it.
    full_bleed = Column(Boolean, default=False)
    # Wash laid over the image (and the band colour when no image is set),
    # as "#RRGGBB" plus a 0-100 strength. NULL falls back to espresso @ 95.
    overlay_color = Column(String(7), nullable=True)
    overlay_opacity = Column(Integer, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Testimonial(Base):
    """Homepage customer testimonial managed from the admin panel."""

    __tablename__ = "testimonials"

    id = Column(Integer, primary_key=True, index=True)
    quote = Column(Text, nullable=False)
    customer_name = Column(String(120), nullable=False)
    city = Column(String(120), nullable=True)
    rating = Column(Float, default=5.0)
    image_url = Column(String(255), nullable=True)   # optional customer photo
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SiteSetting(Base):
    """Key–value store for site-wide settings (social links, WhatsApp…)."""

    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(80), unique=True, nullable=False, index=True)
    value = Column(String(500), nullable=True)


class HomeSection(Base):
    """Admin-managed home sections that used to be hard-coded: the two
    collection cards under the hero and the craft-story band. One row per
    slot ("card_1", "card_2", "story"), upserted from Admin › Banners. A
    missing row means the storefront shows its built-in version; a row with
    is_active=False hides that section entirely."""

    __tablename__ = "home_sections"

    id = Column(Integer, primary_key=True, index=True)
    slot = Column(String(20), unique=True, nullable=False, index=True)
    overline = Column(String(120), nullable=True)
    title_line_1 = Column(String(160), nullable=True)
    title_line_2 = Column(String(160), nullable=True)    # story heading, line 2
    description = Column(Text, nullable=True)            # story paragraph
    cta_label = Column(String(60), nullable=True)
    cta_link = Column(String(255), nullable=True)
    # The three "40+ / Craft forms" counters on the story band.
    stat1_value = Column(String(40), nullable=True)
    stat1_label = Column(String(80), nullable=True)
    stat2_value = Column(String(40), nullable=True)
    stat2_label = Column(String(80), nullable=True)
    stat3_value = Column(String(40), nullable=True)
    stat3_label = Column(String(80), nullable=True)
    image_url = Column(String(255), nullable=True)       # empty → built-in artwork
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
