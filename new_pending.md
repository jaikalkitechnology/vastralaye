# new_pending.md — New Feature Requests (Admin Content Management)

Next batch of work: make the storefront's hard-coded content editable from the admin panel.
(Previous design/implementation status lives in [`complete.md`](complete.md) and [`pending.md`](pending.md).)

---

## 1. Admin — Banner Control page (homepage hero)

Manage the **homepage top banner(s)** — the hero carousel image and text — from the admin dashboard.

- [ ] **Backend**: `HeroBanner` model — `image_url`, `overline`, `title_line_1`, `title_line_2` (italic accent), `description`, `cta_primary_label` + `cta_primary_link`, `cta_secondary_label` + `cta_secondary_link`, `sort_order`, `is_active`. Endpoints:
  - `GET /api/v1/fronted/banners` (public, active banners in order)
  - `POST /api/v1/admin/banners` (multipart image upload → `static/uploads/banners/`)
  - `PUT /api/v1/admin/banners/{id}`, `PATCH .../{id}/toggle`, `DELETE .../{id}`
- [ ] **Admin**: new sidebar page `/admin/banners` — banner list with preview thumbs, drag/sort or order field, add/edit form (image upload, all text fields, CTA link pickers), active toggle.
- [ ] **Storefront**: `HeroSection.tsx` fetches `GET /fronted/banners`; falls back to the current static slides when the API returns none (so the homepage never breaks).

## 2. Admin — Social media links (footer)

Make the **footer social links** (Instagram / Facebook / Twitter, plus WhatsApp number) editable.

- [ ] **Backend**: simple `SiteSetting` key–value model (or a `social_links` settings table): `instagram_url`, `facebook_url`, `twitter_url`, `youtube_url` (optional), `whatsapp_number`. Endpoints:
  - `GET /api/v1/fronted/settings` (public — social links + WhatsApp)
  - `PUT /api/v1/admin/settings` (admin update)
- [ ] **Admin**: a "Store Settings" section (own page `/admin/settings` or a card inside an existing page) with URL inputs + validation.
- [ ] **Storefront**: `Footer.tsx` and `WhatsAppFloat.tsx` (and `InstagramGrid.tsx` profile link) read from `GET /fronted/settings` with the current hard-coded values as fallback.

## 3. Admin — Testimonials page (homepage, with image option)

Make the **homepage testimonials** editable, including an optional customer image.

- [ ] **Backend**: `Testimonial` model — `quote`, `customer_name`, `city`, `rating` (1–5), `image_url` (optional customer photo, upload → `static/uploads/testimonials/`), `sort_order`, `is_active`. Endpoints:
  - `GET /api/v1/fronted/testimonials` (public, active in order)
  - `POST /api/v1/admin/testimonials` (multipart), `PUT .../{id}`, `PATCH .../{id}/toggle`, `DELETE .../{id}`
- [ ] **Admin**: new sidebar page `/admin/testimonials` — list + add/edit form (quote, name, city, star rating, optional image upload, active toggle).
- [ ] **Storefront**: `home/Testimonials.tsx` fetches from the API; renders the customer photo (small round avatar beside the name) when `image_url` exists; falls back to the current static three quotes when the API returns none.

---

### Shared notes
- Follow the established pattern from the **Reels** feature (`app/models/reel.py`, `app/routers/reels.py`, `src/pages/admin/AdminReels.tsx`) — same auth (`get_current_admin_user`), same upload/storage approach, same admin page structure.
- All three storefront components must degrade gracefully (static fallback / hide) so an empty database never breaks the homepage.
- New tables auto-create via `Base.metadata.create_all` — no manual migration needed.
