# pending.md — What Remains

The full `design.md` and `admin_design.md` implementation is **done** — storefront (home,
listing, PDP, purchase flow, auth, account, static pages), admin panel (shell, dashboard,
analytics with real endpoints, all operational pages), and the reels + newsletter backend.
See [`complete.md`](complete.md). What's left is polish, cleanup and items that need
**your inputs or decisions**:

## Needs your input
- [ ] **Real assets** (`design.md` §9): campaign photography for hero/banner slots (currently the three images in `/public`), category images in the DB, and 9:16 reel videos — upload reels at `/admin/reels`.
- [ ] **Real handles**: `WHATSAPP_NUMBER` in `src/components/WhatsAppFloat.tsx`, `INSTAGRAM_URL` in `src/components/home/InstagramGrid.tsx`, social URLs in `Footer.tsx`.
- [ ] **Rotate the committed secrets** (README security checklist). The code now reads `DATABASE_URL`, `PHONEPE_CLIENT_ID/SECRET`, `MAIL_*`, `CORS_ALLOW_ORIGINS`, `SECRET_KEY` from the environment — set them on your server, rotate the exposed values, then remove `app/.env` from git (`git rm --cached`) and change the default admin bootstrap credentials in `run.py`.
- [ ] **Checkout route** is still commented out in `App.tsx` (checkout currently runs from the cart's payment modals). The restyled `Checkout.tsx` page is ready — un-comment the route if you want the dedicated page flow.
- [ ] `src/config.tsx` points at the production API — switch to `http://127.0.0.1:8000/api/v1` for local development.

## Nice-to-have / technical debt
- [ ] ~88 **pre-existing** TypeScript errors in legacy logic (untyped axios responses, loose store types) — no new ones were added; a dedicated typing pass would clear them.
- [ ] Further bundle splitting — admin is already lazy-loaded; the storefront main chunk (~2.3 MB) could split vendor libs (MUI is still imported by a few legacy spots and could be dropped entirely).
- [ ] Optional reels enhancements: server-side poster-frame extraction (ffmpeg), manual ordering, "orders via reels" attribution.
- [ ] Optional admin UI for newsletter subscribers (API already exists: `GET /api/v1/admin/newsletter`).
- [ ] Optional: mobile icon-rail / drawer collapse for the admin sidebar below 1200px (`admin_design.md` §2).
