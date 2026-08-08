# pending.md — Design Implementation: What Remains

Work from [`design.md`](design.md) / [`admin_design.md`](admin_design.md) not yet implemented in code.
Ordered roughly by impact. Mockups for everything below already exist in `design/` and `admin_design/`.

---

## Storefront (design.md)

### High impact
- [ ] **Product listing pages** (§5.10) — `ProductsPage.tsx`, `CategoryPage.tsx`, `AllCategoriesPage.tsx`, `ProductGrid.tsx`: serif page titles + breadcrumbs, 2/3/4-column grid with wider gutters, "Load more" pattern. *(New ProductCard already renders inside them, so they're partially upgraded.)*
- [ ] **Filter sidebar** (§5.10) — `FilterSidebar.tsx`: flat accordion groups, real color dots, active-filter chips row, mobile bottom-sheet filters.
- [ ] **Product detail page** (§5.11) — `ProductDetailPage.tsx` (1,100+ lines): thumbnail rail + sticky buy column, size swatches, accordions, restyled reviews, **product-video thumb in the gallery**, and the **"Watch It Styled" strip** — drop in the existing component: `<ReelsSection placement="pdp" productId={id} title="Watch It Styled" />`.
- [ ] **Editorial banners** (§5.6) — rewrite & re-enable `PromoSection.tsx` (2-up Festive/Everyday banners; needs campaign imagery).

### Homepage sections still to add (components specced in §5.7, mockups in `design/mockups/pages/home.html`)
- [ ] `BrandStory.tsx` — craft band with artisan stats on blush + block-print pattern.
- [ ] `Testimonials.tsx` — serif-italic quote cards (can seed from real product reviews API).
- [ ] `InstagramGrid.tsx` — 6-tile UGC grid linking to the brand profile.
- [ ] `NewsletterBand.tsx` — maroon band (needs a subscribe endpoint or provider).
- [ ] Scallop dividers + blush band alternation between homepage sections (CSS classes already shipped: `.scallop-divider`, `.scallop-divider-blush`).

### Medium
- [ ] **NavBar full restyle** (§5.1) — uppercase tracked links with gold underline, mega-menu panel restyle, expanded search row, refined mobile drawer. *(Announcement bar is done.)*
- [ ] **Cart / Wishlist / Checkout / Order confirmation** (§5.12) — token-based restyle, order-summary card, empty states, "Shukriya" confirmation.
- [ ] **Auth pages** (§5.12) — split layout with maroon brand panel (mockups: `08-login.png`, `09-register.png`).
- [ ] **Account pages** (§5.12) — sidebar with gold active state, flat cards.
- [ ] WhatsApp floating button; ornament divider as a reusable `<Ornament />` component (currently inline SVG in CategorySection).
- [ ] Policy pages / About / Contact typography pass; serif 404; branded `GlobalLoader`.

## Admin panel (admin_design.md)

- [ ] **Phase A shell** — espresso sidebar w/ grouped sections + gold active bar, new `AdminTopbar`, `StatusChip`/`DataTable`/`FilterTabs` primitives. *(Reels page + nav item shipped; the broader shell restyle remains.)*
- [ ] **Phase B** — dashboard & analytics blueprints; Recharts theme; **replace `data/mockAnalyticsData.ts` with the real endpoints** (`/analytics/monthly-orders`, `/analytics/daily-orders`, `/analytics/top-customers`, `/admin_stats`).
- [ ] **Phase C** — orders (filter tabs + detail drawer), products (toolbar + form drawer), categories, coupons per blueprints.
- [ ] **Phase D** — users, reviews moderation cards, empty states, confirm dialogs, responsive icon rail.

## Backend

- [ ] Optional reel enhancements: server-side poster-frame extraction (ffmpeg), per-reel ordering field, "orders via reels" attribution.
- [ ] Newsletter subscribe endpoint (for `NewsletterBand`).
- [ ] The security checklist from `README.md` (rotate committed secrets, env-var the DB URL / PhonePe / SMTP creds, restrict CORS, disable SQL echo, change default admin) — unchanged in this pass, still open.

## Assets & housekeeping

- [ ] Real photography per `design.md` §9 (hero banners currently reuse `/public` images; category/product imagery comes from the DB; reel videos upload via `/admin/reels`).
- [ ] ~108 **pre-existing** TypeScript errors across older pages (e.g. a bad `pro` import in `NavBar.tsx`) — untouched by this pass; worth a dedicated cleanup.
- [ ] `src/config.tsx` still points at the production API — switch to your local backend URL when developing (see README "Getting Started").
- [ ] Code-split the 2.6 MB JS bundle (dynamic imports for admin routes).
