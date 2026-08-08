# complete.md — Design Implementation: What's Done

Implementation of [`design.md`](design.md) / [`admin_design.md`](admin_design.md) in the actual codebase.
Status: ✅ shipped in this branch · verified with `npm run build` (passes) and Python syntax checks.
Remaining work is tracked in [`pending.md`](pending.md).

---

## Backend (FastAPI) — Reels feature (new)

| Item | File(s) |
|---|---|
| `Reel` model — caption, video/poster URLs, linked product, `show_on_home` / `show_on_pdp` placements, publish flag, view counter | `app/models/reel.py`, registered in `app/models/__init__.py` (table auto-creates on startup via `Base.metadata.create_all`) |
| Public API: `GET /api/v1/fronted/reels?placement=home|pdp&product_id=` (published reels + linked-product summary), `POST /api/v1/fronted/reels/{id}/view` (view counter) | `app/routers/reels.py` |
| Admin API: `GET /api/v1/admin/reels`, `POST /api/v1/admin/reels` (multipart video + optional poster, validation: MP4/WebM, ≤30 MB), `PATCH /api/v1/admin/reels/{id}/publish`, `DELETE /api/v1/admin/reels/{id}` (removes files) — all guarded by `get_current_admin_user` | `app/routers/reels.py` |
| Storage: uploads saved under `static/uploads/reels/`, served via existing `/static` mount | `app/routers/reels.py` |
| Router mounted in both entrypoints | `run.py`, `app/run.py` |

## Frontend — Phase 0 foundations

| Item | File(s) |
|---|---|
| Brand fonts **Fraunces + Jost** (preconnect + swap), real title/meta/theme-color (`Vastralaye — Handcrafted Ethnic Wear`) | `index.html` |
| New design tokens: ivory background, espresso foreground, **maroon primary**, blush secondary, sand muted, terracotta accent, sale red, 0.25rem radius; dark palette aligned; body uses `font-sans`, headings `font-serif` | `src/index.css` |
| Tailwind palette: `maroon/ivory/gold/blush/sand/espresso/sale` added; legacy names `navy/cream/terracotta/charcoal` re-pointed to brand values (old classes restyle automatically); `fontFamily.serif/sans` | `tailwind.config.ts` |
| Utility classes: `.overline-label` (gold tracked overline), `.scallop-divider(-blush)`, ken-burns animation, legacy `.btn-*` re-pointed | `src/index.css` |
| Button variants: maroon default → terracotta hover, espresso outline that fills on hover, `rounded-sm` | `src/components/ui/button.tsx` |
| **Global hex migration**: every `#559F4B`/`#E1783E` (and hover shades) across `src/` replaced with maroon/terracotta equivalents — zero legacy green/orange left anywhere | all `.tsx` via sweep |

## Frontend — Homepage (design.md §6.1)

| Section | Status | File |
|---|---|---|
| **Hero** — light editorial carousel: blush→sand canvas, serif headline with italic maroon accent, gold-ringed **arch (mehrab) image frame**, ken-burns + crossfade, line-style gold dots, dual CTAs (uses existing `/public` banners) | ✅ rewritten | `src/components/HeroSection.tsx` |
| **USP strip** — blush trust band: Free shipping ₹999+ · COD · 7-day returns · Handcrafted in India | ✅ new | `src/components/UspStrip.tsx` |
| **Shop by Category** — **arch cards** with gold inner ring on hover, serif names, "Shop now →", scroll-snap peek on mobile, arch-shaped skeletons; original API fetching preserved | ✅ rewritten | `src/components/CategorySection.tsx` |
| **Product carousels** — de-gradiented to brand tokens (maroon tabs/CTAs/loader) | ✅ restyled | `src/components/FeaturedProducts.tsx` |
| **Shoppable reels — "Vastralaye in Motion"** — 9:16 cards from `GET /fronted/reels?placement=home`: poster, play button, view count, attached shoppable product strip; click opens a **video lightbox** (autoplay + controls + shop link) and registers a view; renders nothing when no reels exist | ✅ new | `src/components/ReelsSection.tsx` |
| **Homepage assembly** — hero → USP → categories → products → reels; logged-in "My Account" card block removed | ✅ | `src/pages/Index.tsx` |

## Frontend — Global components

| Item | Status | File |
|---|---|---|
| **Announcement bar** — maroon, ivory tracked text, gold highlight, above the header | ✅ | `src/components/NavBar.tsx` |
| **Footer** — espresso editorial rewrite: gold top rule, serif brand block, Shop/Company/Help & Policies columns (all real routes), contact block, social circles, payment chips (UPI/VISA/MC/RuPay/COD) | ✅ rewritten | `src/components/Footer.tsx` |
| **Product card** — 3:4 image on sand, **hover second-image crossfade** + scale, flat badges (gold `NEW`, espresso `BESTSELLER`, red `-x%`, out-of-stock), white wishlist circle (maroon-filled when active), **quick-add bar** sliding up on hover (always visible on mobile), quiet title + price row (struck MRP + % off) + gold stars; all cart/wishlist logic & image normalization preserved | ✅ rewritten | `src/components/ProductCard.tsx` |

## Frontend — Admin

| Item | Status | File |
|---|---|---|
| **Reels manager page** — upload panel (video picker with format hints, caption, linked-product select fed by admin products API, Home/PDP placement checkboxes, optional poster, publish toggle) + library grid (poster/video preview, Published/Draft chip, views, placements, publish/unpublish, delete with confirm, external preview) | ✅ new | `src/pages/admin/AdminReels.tsx` |
| Sidebar: **Reels** nav item (Clapperboard icon); brand name → Vastralaye; gradient colors migrated | ✅ | `src/components/admin/AdminSidebar.tsx` |
| Route `/admin/reels` inside `AdminLayout` | ✅ | `src/App.tsx` |

## Verification

- `npm run build` — ✅ passes (vite production build).
- `tsc --noEmit` — all **changed/new files are type-clean**; project total went from 109 pre-existing errors to 108 (see pending.md).
- Backend: `python -m py_compile` ✅ on all changed files; reels table auto-creates on next API start (no manual migration needed).
- End-to-end reels flow: admin uploads at `/admin/reels` → file stored under `/static/uploads/reels/` → storefront homepage "Vastralaye in Motion" section appears automatically once a published reel exists.
