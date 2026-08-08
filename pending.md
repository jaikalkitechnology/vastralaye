# pending.md — Design Implementation: What Remains

Work from [`design.md`](design.md) / [`admin_design.md`](admin_design.md) not yet implemented in code.
Everything previously listed for the homepage, reels, newsletter, WhatsApp float, loader/404 and
code-splitting has shipped — see [`complete.md`](complete.md). Mockups for all items below exist in
`design/` and `admin_design/`.

---

## Storefront (design.md)

### High impact
- [ ] **Product listing pages** (§5.10) — `ProductsPage.tsx`, `CategoryPage.tsx`, `AllCategoriesPage.tsx`, `ProductGrid.tsx`: serif page titles + breadcrumbs, wider-gutter grid, "Load more" pattern. *(They already render the new ProductCard and inherit the new tokens, so they're visually ~70% there.)*
- [ ] **Filter sidebar** (§5.10) — `FilterSidebar.tsx` (760 lines): flat accordion groups, color dots, active-filter chips row, mobile bottom-sheet filters.
- [ ] **Product detail page layout** (§5.11) — `ProductDetailPage.tsx` (1,100+ lines): thumbnail rail + sticky buy column, size swatches, accordions instead of tabs, restyled reviews, **product-video thumb in the gallery** (product model already has `video_url`). *(The "Watch It Styled" reels strip is already live on the page.)*

### Medium
- [ ] **NavBar full restyle** (§5.1) — uppercase tracked links with gold underline, mega-menu panel restyle, expanded search row, refined mobile drawer. *(Announcement bar + brand colors are done.)*
- [ ] **Cart / Wishlist / Checkout / Order confirmation** (§5.12) — layout restyle to the mockups (order-summary card, coupon row, "Shukriya" confirmation). Tokens/buttons already apply.
- [ ] **Auth pages** (§5.12) — split layout with maroon brand panel (mockups: `08-login.png`, `09-register.png`).
- [ ] **Account pages** (§5.12) — sidebar with gold active state, flat order cards.
- [ ] Policy pages / About / Contact typography pass (serif headings inherit already; spacing/width pass remains).

## Admin panel (admin_design.md)

- [ ] **Phase A shell** — espresso sidebar with grouped sections + gold active bar, new `AdminTopbar`, `StatusChip`/`DataTable`/`FilterTabs` primitives. *(Reels manager page + nav item shipped.)*
- [ ] **Phase B** — dashboard & analytics blueprints; Recharts theme; **replace `data/mockAnalyticsData.ts` with the real endpoints** (`/analytics/monthly-orders`, `/analytics/daily-orders`, `/analytics/top-customers`, `/admin_stats`).
- [ ] **Phase C** — orders (filter tabs + detail drawer), products (toolbar + form drawer), categories, coupons per blueprints.
- [ ] **Phase D** — users, reviews moderation cards, empty states, confirm dialogs, responsive icon rail.
- [ ] Admin newsletter subscribers view (API exists: `GET /api/v1/admin/newsletter`).

## Backend

- [ ] Optional reel enhancements: server-side poster-frame extraction (ffmpeg), per-reel ordering, "orders via reels" attribution.
- [ ] The security checklist from `README.md` (rotate committed secrets, env-var the DB URL / PhonePe / SMTP creds, restrict CORS, disable SQL echo, change default admin) — still open.

## Assets & housekeeping

- [ ] Real photography per `design.md` §9 — hero/banner slots currently reuse the three images in `/public`; shoot proper 9:16 reels and campaign banners, upload reels via `/admin/reels`.
- [ ] ~106 **pre-existing** TypeScript errors in older pages — untouched; worth a dedicated cleanup pass.
- [ ] `src/config.tsx` still points at the production API — switch to your local backend URL when developing.
- [ ] Instagram grid links to a placeholder profile URL (`INSTAGRAM_URL` in `home/InstagramGrid.tsx`) and WhatsApp float number (`WHATSAPP_NUMBER` in `WhatsAppFloat.tsx`) — set the real handles.
- [ ] Further bundle splitting (vendor chunks; storefront main chunk is still ~2.3 MB).
