# new_complete.md — Admin Content Management: What's Done

Implementation record for the features requested in [`new_pending.md`](new_pending.md) — all three
shipped in commit `4d5c043`. The storefront's homepage hero, testimonials and social links are now
fully manageable from the admin panel, each with graceful fallbacks so an empty database never
breaks the site.

Status: ✅ **complete** · verified with `npm run build` (passes), `tsc` (all new/changed files
type-clean) and backend `py_compile`. New tables auto-create on API startup — no manual migration.

---

## 1. Banner Control — homepage hero manageable from admin ✅

**Admin page:** `/admin/banners` (sidebar → *Content → Banners*)

| Layer | What shipped | File(s) |
|---|---|---|
| Backend model | `HeroBanner` — `image_url`, `overline`, `title_line_1`, `title_line_2` (italic maroon accent), `description`, `cta_primary_label/link`, `cta_secondary_label/link`, `sort_order`, `is_active` | `vastralaye_backend/app/models/site_content.py` |
| Backend API | `GET /api/v1/fronted/banners` (public, active in order) · `GET /api/v1/admin/banners` · `POST /api/v1/admin/banners` (multipart image → `static/uploads/banners/`, JPG/PNG/WebP ≤8MB) · `PUT /{id}` (optional new image, old file removed) · `PATCH /{id}/toggle` · `DELETE /{id}` (file cleanup) | `vastralaye_backend/app/routers/site_content.py` |
| Admin UI | Upload dropzone, overline/title-line-1/title-line-2/description fields, **both CTA labels + links**, sort order, active checkbox; edit-in-place (loads a banner back into the form), preview cards with Active/Hidden chip, order badge, Hide/Show, edit and delete actions | `src/pages/admin/AdminBanners.tsx` |
| Storefront | `HeroSection` fetches `GET /fronted/banners`; maps every field (overline optional, second title line optional, secondary CTA optional); autoplay interval tracks the fetched slide count; **falls back to the built-in static slides** when none are configured or the API fails | `src/components/HeroSection.tsx` |

## 2. Social media links — footer links + WhatsApp editable ✅

**Admin page:** `/admin/settings` (sidebar footer → *Store Settings*)

| Layer | What shipped | File(s) |
|---|---|---|
| Backend model | `SiteSetting` key–value store; managed keys: `instagram_url`, `facebook_url`, `twitter_url`, `youtube_url`, `whatsapp_number` | `app/models/site_content.py` |
| Backend API | `GET /api/v1/fronted/settings` (public) · `PUT /api/v1/admin/settings` (admin; upserts only provided keys) | `app/routers/site_content.py` |
| Admin UI | Single "Store Settings" form with per-field icons, URL validation (`https://…`) and WhatsApp number validation; empty field = keep the storefront default | `src/pages/admin/AdminSettings.tsx` |
| Storefront | Shared **cached hook** `useSiteSettings()` (one request app-wide) consumed by: `Footer` social icons (YouTube icon appears only when set), `WhatsAppFloat` (number, digits normalized), `InstagramGrid` profile link — all with the previous hard-coded values as fallback | `src/hooks/use-site-settings.ts`, `src/components/Footer.tsx`, `src/components/WhatsAppFloat.tsx`, `src/components/home/InstagramGrid.tsx` |

## 3. Testimonials — homepage quotes with optional customer image ✅

**Admin page:** `/admin/testimonials` (sidebar → *Content → Testimonials*)

| Layer | What shipped | File(s) |
|---|---|---|
| Backend model | `Testimonial` — `quote`, `customer_name`, `city`, `rating` (clamped 1–5), `image_url` (optional photo → `static/uploads/testimonials/`), `sort_order`, `is_active` | `app/models/site_content.py` |
| Backend API | `GET /api/v1/fronted/testimonials` (public, active in order) · `GET /api/v1/admin/testimonials` · `POST` (multipart, optional image) · `PUT /{id}` · `PATCH /{id}/toggle` · `DELETE /{id}` (file cleanup) | `app/routers/site_content.py` |
| Admin UI | Quote textarea, name/city, **tap-to-set star rating**, optional customer-photo upload, sort order, show/hide toggle; edit-in-place; list cards with stars, Live/Hidden chip, avatar (photo or initial), Hide/Show, edit and delete | `src/pages/admin/AdminTestimonials.tsx` |
| Storefront | `Testimonials` fetches the API; renders **round customer avatar** beside the name when a photo exists and real star counts per rating; **falls back to the built-in three quotes** when none exist | `src/components/home/Testimonials.tsx` |

## 4. Reels — external video link option (YouTube) ✅

**Admin page:** `/admin/reels` — the upload panel now has an **"Upload File / Video Link"** toggle,
so a reel can come from an uploaded MP4 **or** a pasted link (YouTube watch/Shorts/youtu.be, or a
direct MP4 URL).

| Layer | What shipped | File(s) |
|---|---|---|
| Backend | `POST /api/v1/admin/reels` now accepts `video_link` as an alternative to `video_file` (exactly one required; http(s) validated, ≤255 chars; uploaded file wins if both are sent). External links are stored in `video_url` untouched; local-file cleanup on delete already skips external URLs | `vastralaye_backend/app/routers/reels.py` |
| Admin UI | Source toggle (maroon active state), link input with live **"✓ YouTube link detected"** hint, validation on submit; library cards show the **YouTube thumbnail** automatically when no poster is uploaded plus a small "YouTube" badge | `src/pages/admin/AdminReels.tsx` |
| Storefront | Reel cards use the YouTube thumbnail as poster fallback; the lightbox plays YouTube links in an **embedded player** (privacy-enhanced `youtube-nocookie.com`, autoplay) while uploaded/direct-MP4 reels keep the native `<video>` player — on both the homepage row and the PDP "Watch It Styled" strip | `src/components/ReelsSection.tsx` |
| Shared | `getYouTubeId()` / `youTubeThumb()` / `youTubeEmbed()` helpers | `src/lib/media.ts` |

## 5. Reels — edit option in the admin panel ✅

**Admin page:** `/admin/reels` — every reel card now has a **pencil (edit) button**; clicking it
loads the reel into the form for editing in place, same flow as Banners/Testimonials.

| Layer | What shipped | File(s) |
|---|---|---|
| Backend | New `PUT /api/v1/admin/reels/{id}` — updates caption, linked product, Home/PDP placements and publish state; **video and poster are optional on edit** (omitted = keep the current media; a new upload or link replaces it, with old local files cleaned up and external links left alone); same validation as create | `vastralaye_backend/app/routers/reels.py` |
| Admin UI | Edit-in-place: form header switches to "Edit Reel #id" with a *Cancel edit* action; all fields prefill (caption, product, placements, publish); the video source auto-detects — an external link opens in **Video Link** mode with the URL prefilled, an uploaded video opens in **Upload File** mode with a "current one is kept" hint; submit becomes *Update Reel* (PUT); deleting the reel being edited resets the form | `src/pages/admin/AdminReels.tsx` |

## 6. Sticky product-page reel — continuous playback + scroll behavior ✅

The floating reel on the product detail page now behaves exactly as requested:

| Behavior | Detail |
|---|---|
| **Continuous video** | Tapping the mini reel opens the full player **continuing from the same position** (no restart); closing the full player hands the position back so the mini reel **continues** where the big one stopped. (YouTube-linked reels show a thumbnail in mini mode, so continuity applies to uploaded/direct videos.) |
| **Scroll down → hide** | Scrolling down the page slides the mini reel away so it never blocks reading |
| **Scroll up → show** | Any upward scroll brings it back; it's always visible near the top of the page |
| Other | Small jitter filter (8px) so tiny scroll wiggles don't flicker it; ✕ still dismisses for the page view; falls back to the product's own video when no reel exists; renders nothing with no video at all |

Files: `src/components/StickyReelVideo.tsx` (direction-aware scroll listener, shared
playback-position ref between mini and expanded players, seek-on-open and seek-on-close).

---

## Shared infrastructure added

- `src/lib/media.ts` — shared `mediaUrl()` helper normalizing backend `/static/…` paths to absolute URLs.
- Sidebar: new **Content** section (Banners, Testimonials) + **Store Settings** entry with active state (`AdminSidebar.tsx`); topbar titles for the three new pages (`AdminTopbar.tsx`); lazy-loaded routes in `App.tsx` (stay in the code-split admin bundle).
- Both backend entrypoints (`run.py`, `app/run.py`) mount the new `site_content` router; models registered in `app/models/__init__.py` so tables auto-create.

## How to use (admin flow)

1. Start the backend — `hero_banners`, `testimonials`, `site_settings` tables create themselves.
2. **Banners:** admin → Content → Banners → upload an image, write the text/buttons, save → the homepage hero switches from the built-in slides to yours instantly.
3. **Social links:** admin → Store Settings → paste your Instagram/Facebook/Twitter/YouTube URLs and WhatsApp number → footer icons, the WhatsApp chat button and the Instagram section all update.
4. **Testimonials:** admin → Content → Testimonials → add quotes (with photos if you like) → the homepage "Loved by Our Customers" section shows them in your chosen order.
