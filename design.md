# Vastralaye — Design Redesign Plan (`design.md`)

**Goal:** Rework the storefront's look & feel to match the premium Indian ethnic‑wear aesthetic of the reference sites, adapted to our own brand:

- **Reference 1 — [suta.in](https://suta.in/):** minimal, warm, artisanal. Ivory/cream canvas, earthy accents, elegant serif headlines, generous whitespace, storytelling ("crafted by weavers") sections, soft photography, quiet UI.
- **Reference 2 — [aachho.com](https://www.aachho.com/):** Jaipur festive. Jewel maroon/pink + gold accents, **arch (mehrab) & scallop motifs**, block‑print patterns, campaign‑style banners, prominent ratings/badges/offers, energetic merchandising.

**Our direction = Suta's calm editorial base + Aachho's festive accents & motifs.**

> ⚠️ **Inspiration only, never copying.** Do not reuse their logos, photos, illustrations, copy or fonts‑as‑branding. We replicate the *layout patterns, color mood and typography style* with our own assets.
>
> 📌 **Scope:** customer storefront only (`vastralaye_frontend_react`). The **admin panel keeps its current utilitarian UI**. No backend/API changes are required by this plan.

---

## Table of Contents

1. [Design Language Summary](#1-design-language-summary)
2. [Current State Audit](#2-current-state-audit)
3. [Design Tokens (Foundations)](#3-design-tokens-foundations)
4. [Signature Elements & Motifs](#4-signature-elements--motifs)
5. [Component‑by‑Component Change Flow](#5-component-by-component-change-flow)
6. [Page Blueprints](#6-page-blueprints)
7. [Motion & Interaction Guidelines](#7-motion--interaction-guidelines)
8. [Mobile UX Rules](#8-mobile-ux-rules)
9. [Asset Checklist](#9-asset-checklist)
10. [Implementation Flow (Phases & Checklists)](#10-implementation-flow-phases--checklists)
11. [QA / Definition of Done](#11-qa--definition-of-done)

---

## 1. Design Language Summary

What the reference sites do, and what we adopt:

| Pattern | Suta | Aachho | We adopt |
|---|---|---|---|
| Announcement bar with rotating offers | ✅ thin, calm | ✅ bold, colored | ✅ maroon bar, ivory text, 3 rotating messages |
| Sticky header, logo + inline menu + icon cluster | ✅ | ✅ | ✅ restyled `NavBar` |
| Mega menu with imagery | ✅ | ✅ | ✅ keep ours, restyle |
| Full‑bleed photographic hero carousel (light, editorial) | ✅ | ✅ (festive campaigns) | ✅ replace dark hero |
| USP strip (shipping/COD/returns/handcrafted) | ✅ | ✅ | ✅ new component |
| "Shop by Category" tiles | circles/tiles | **arch‑shaped cards** | ✅ arch cards (signature) |
| New Arrivals / Bestsellers product carousels | ✅ | ✅ | ✅ restyle `FeaturedProducts` |
| Editorial 2‑up collection banners | ✅ | ✅ | ✅ revive `PromoSection` |
| Brand‑story band (craft, artisan stats) | ✅ (core identity) | ➖ | ✅ new section |
| Testimonials / customer photos | ✅ | ✅ | ✅ new section |
| Instagram / UGC grid | ✅ | ✅ | ✅ new section |
| Newsletter band | ✅ | ✅ | ✅ new section |
| Product card: 3:4 image, hover image‑swap, quick add | ✅ subtle | ✅ + % badges & stars | ✅ combined |
| Shoppable video reels (watch & shop) | ✅ | ✅ (video commerce widgets) | ✅ home reels row + PDP video strip |
| Serif display headings + clean sans body | ✅ | ✅ | ✅ Fraunces + Jost |
| Scallop/arch/block‑print ornament | ➖ | ✅ | ✅ used sparingly |
| Dark, link‑rich footer + payment icons | ✅ | ✅ | ✅ espresso footer |

**Mood keywords:** warm · handcrafted · editorial · festive‑premium · unhurried · trustworthy.

---

## 2. Current State Audit

What exists today in `vastralaye_frontend_react` and what clashes with the target look:

| Area | Today | Problem vs. target |
|---|---|---|
| `src/components/HeroSection.tsx` | Full‑screen **black** hero, Unsplash stock photos, purple/teal gradient overlays, glassy feature chips | Opposite mood — must become light, warm, editorial |
| `src/components/ProductCard.tsx` | Square images, `rounded-2xl`, heavy shadows, **hard‑coded green/orange gradients** (`#559F4B`, `#E1783E`), gradient badges | Loud & generic; needs flat, 3:4, quiet card with hover swap |
| `src/components/CategorySection.tsx` | Grid cards + green/orange gradient pills & blurred blobs | Replace with arch cards, serif headings, no gradients |
| `src/components/NavBar.tsx` | White sticky bar, mega menu exists, no announcement bar | Good bones; needs announcement bar + token restyle |
| `src/components/Footer.tsx` | Light footer, colorful social tiles | Needs dark espresso/maroon editorial footer |
| `src/pages/Index.tsx` | Hero → (account card) → categories → featured; `PromoSection` commented out | Reorder to the blueprint in §6; drop the "My Account" card block |
| `src/index.css` | shadcn tokens: navy primary `226 58% 22%`, orange accent; `--radius: 0.5rem` | Re‑point tokens to the new palette; smaller radius |
| `tailwind.config.ts` | Custom colors `navy / cream / terracotta / charcoal` already exist | Reuse the *names*, change the *values* → instant partial migration |
| `index.html` | Title `mizorpaymart`, no brand fonts, Lovable dev script | Add Google Fonts, proper title/meta, remove dev script for prod |
| Overall | Mix of navy theme + green/orange gradients + generic stock imagery | Unify on one token system; **zero hard‑coded hex in components** |

Hard‑coded colors to hunt down and replace everywhere (grep for them): `#559F4B`, `#6ab45c`, `#E1783E`, `#f08a4e`, `rose-500`, `purple-500`, `teal-500`, gradient classes `bg-gradient-to-*` used for decoration.

---

## 3. Design Tokens (Foundations)

### 3.1 Color palette

Warm ivory canvas (Suta) + maroon/gold festive accents (Aachho).

> **Revision (2026-10-08, PR [#155](https://github.com/jaikalkitechnology/vastralaye/pull/155)):** `maroon`, `terracotta` and `gold` below were originally hand-picked approximations. They've since been replaced with colors sampled directly from pixels in the real logo (`vastralaye_frontend_react/public/logo_vas.png` — the one already wired into `NavBar`/`Footer`), so the site matches the actual brand mark exactly instead of an eyeballed guess. `maroon` was sampled from the "VASTRALIYA" wordmark text; `gold` from the dress's gold trim; `terracotta` has no source in the logo at all (the logo only has two colors), so it's now defined as the midpoint blend of the sampled maroon + gold rather than an invented orange. `ivory`, `espresso`, `blush`, `sand`, `sale` and `success` are unchanged — they're the supporting neutral canvas, not colors drawn from the logo.

| Token | Hex | HSL | Usage |
|---|---|---|---|
| `ivory` (background) | `#FAF6F0` | `36 50% 96%` | Page background, light sections |
| `surface` | `#FFFFFF` | `0 0% 100%` | Cards, header, inputs |
| `espresso` (foreground) | `#2B1B12` | `22 41% 12%` | Headings, body text, dark footer bg |
| `maroon` (**primary**) | `#992534` | `352 61% 37%` | Buttons, links, announcement bar, active states — sampled from logo wordmark |
| `terracotta` (**accent**) | `#AD6148` | `15 41% 48%` | Hovers, highlights, secondary CTAs — derived as the midpoint of logo maroon + gold |
| `gold` | `#C29E5C` | `39 46% 56%` | Overlines, stars, ornaments, thin borders — sampled from logo trim |
| `blush` | `#F6E8E4` | `13 50% 93%` | Alternate section bands, hover fills |
| `sand` (muted) | `#EFE7DB` | `36 38% 90%` | Muted fills, skeletons, dividers |
| `sale` (destructive) | `#C62828` | `0 66% 47%` | Sale badges, errors, "% OFF" |
| `success` | `#3E6B4F` | `143 27% 33%` | In‑stock, success toasts |

**Mapping to existing CSS variables in `src/index.css` (`:root`)** — change values, keep names, so all shadcn components restyle automatically:

```css
--background: 36 50% 96%;        /* ivory */
--foreground: 22 41% 12%;        /* espresso */
--card: 0 0% 100%;
--card-foreground: 22 41% 12%;
--primary: 352 61% 37%;          /* maroon — sampled from logo_vas.png wordmark */
--primary-foreground: 36 50% 96%;
--secondary: 13 50% 93%;         /* blush */
--secondary-foreground: 22 41% 12%;
--muted: 36 38% 90%;             /* sand */
--muted-foreground: 22 15% 38%;
--accent: 15 41% 48%;            /* terracotta — midpoint of logo maroon + gold */
--accent-foreground: 0 0% 100%;
--destructive: 0 66% 47%;        /* sale red */
--border: 33 28% 86%;
--input: 33 28% 86%;
--ring: 352 61% 37%;
--radius: 0.25rem;               /* sharper, editorial */
```

**Mapping in `tailwind.config.ts`** — re‑point the existing custom names (legacy classes migrate for free), add the new ones:

```ts
navy:       '#992534',  // legacy name, now maroon (rename usages to `maroon` over time)
maroon:     '#992534',
cream:      '#FAF6F0',
ivory:      '#FAF6F0',
terracotta: '#AD6148',
gold:       '#C29E5C',
blush:      '#F6E8E4',
sand:       '#EFE7DB',
espresso:   '#2B1B12',
charcoal:   '#2B1B12',  // legacy name, now espresso
sale:       '#C62828',
```

Rules: **no raw hex in components** — tokens only. Gradients are banned as decoration; the only allowed gradient is a black→transparent scrim over hero/banner photos for text legibility.

### 3.2 Typography

| Role | Font | Weights | Notes |
|---|---|---|---|
| Display / headings | **Fraunces** (Google Fonts) | 400, 500, 600 (+ italic 400) | Warm "old‑style" serif; alternates: Playfair Display, Cormorant Garamond |
| Body / UI | **Jost** (Google Fonts) | 300, 400, 500, 600 | Geometric sans, very common in Indian D2C; alternates: Karla, Poppins |

- Load via `<link>` in `index.html` (preconnect + single CSS request, `display=swap`).
- `tailwind.config.ts` → `fontFamily: { serif: ['Fraunces','Georgia','serif'], sans: ['Jost','system-ui','sans-serif'] }`; body defaults to `font-sans`.
- **Type scale:** hero H1 44–56px serif; section H2 30–36px serif; card/product titles 14–15px sans (normal case); body 15–16px; nav links 13–14px sans **uppercase, tracking `0.08em`**; overlines 11–12px uppercase gold, tracking `0.25em`.
- **Section header recipe** (used by every homepage section):
  1. gold overline (e.g. `HANDPICKED FOR YOU`),
  2. serif H2 (e.g. `New Arrivals`),
  3. optional 1‑line muted subtitle,
  4. small ornament divider (see §4).

### 3.3 Shape, elevation, buttons

- **Radius:** images & cards `rounded-none`→`rounded-sm` (2–4px); pills only for tiny badges; the arch shape is the *only* dramatic curve.
- **Shadows:** none at rest; `shadow-[0_10px_30px_-12px_rgba(43,27,18,0.18)]` on hover/dropdowns only. Prefer 1px `border-border` over shadows.
- **Buttons** (restyle `src/components/ui/button.tsx` variants):
  - `primary` — maroon fill, ivory text, uppercase 13px tracked, `rounded-[2px]`, px‑8 py‑3; hover: terracotta.
  - `outline` — 1px espresso border on transparent/ivory; hover: espresso fill, ivory text.
  - `ghost/link` — text + thin underline (`underline-offset-4`) + `→` that nudges 4px right on hover ("View all" pattern).
- **Inputs:** white bg, 1px `border-input`, radius 2px, focus ring maroon; labels 12px uppercase tracked.

---

## 4. Signature Elements & Motifs

These five recurring details create the "ethnic‑premium" recognition:

1. **Arch (mehrab) image frame** — Aachho's hallmark. Category cards & select banners use a tall arch: `aspect-[3/4] rounded-t-[10rem] overflow-hidden` (mobile `rounded-t-[7rem]`). Optional 1px gold outline offset 6px inside the arch.
2. **Scallop section divider** — thin scalloped edge between contrasting bands, as a reusable CSS class (no images):
   ```css
   .scallop-divider { height: 14px;
     background: radial-gradient(circle at 8px -4px, transparent 12px, hsl(var(--background)) 13px);
     background-size: 28px 14px; }
   ```
3. **Block‑print pattern background** — one faint inline‑SVG paisley/floral tile (`opacity 0.04–0.06`, espresso on ivory or ivory on maroon) used on: brand‑story band, newsletter band, footer top edge. Create as `src/components/decor/BlockPrintPattern.tsx`.
4. **Ornament divider** — tiny centered SVG (diamond/paisley, gold, ~24px) under section headings. Create `src/components/decor/Ornament.tsx`.
5. **Warm photography treatment** — models on clean warm backgrounds, natural light, no neon; all product/banner imagery gets a consistent ivory‑warm grade. Never mix cool‑toned stock photos into merch rows.

---

## 5. Component‑by‑Component Change Flow

Work top‑down; every item lists the file(s) and the exact change. **Delete all green/orange gradient styling on touch.**

### 5.0 Foundations

| File | Changes |
|---|---|
| `index.html` | Add Google Fonts (Fraunces + Jost) with preconnect; set real `<title>` ("Vastralaye — Handcrafted Ethnic Wear"), meta description, `theme-color` `#992534`; remove `cdn.gpteng.co` script for production builds |
| `src/index.css` | Replace `:root` token values (§3.1); set `body { @apply bg-background text-foreground font-sans antialiased; }`; add `.section` (py‑14 md:py‑20), `.section-title` recipe, `.scallop-divider`, `.overline` utilities; delete `.product-card`, `.btn-*` legacy classes after migration |
| `tailwind.config.ts` | New color values + `fontFamily` (§3.1/3.2); add `borderRadius: { arch: '10rem 10rem 0 0' }`; keyframes: `marquee` (announcement), `fade-up` (section reveal), `kenburns` (hero zoom) |
| `src/components/ui/button.tsx` | Restyle variants per §3.3 |

### 5.1 Header — `src/components/NavBar.tsx`

1. **Announcement bar (new, above header):** maroon bg, ivory 12px uppercase text, center; rotates 3 messages every 4s (fade), e.g. free‑shipping / COD / festive‑offer. Optional dismiss ✕. Content from a simple const array (backend wiring later).
2. **Header row (white, sticky — keep behavior):** desktop layout `logo left · nav center · icons right`. Nav links uppercase tracked 13px, espresso; active/hover state = 2px **gold underline** grown from center (no color boxes). Links: `New Arrivals · Bestsellers · Categories ▾ · About · Contact`, plus a **`Sale` link in `sale` red**.
3. **Mega menu (keep logic, restyle):** white panel, 1px border, soft shadow; columns of subcategory text links (13px, espresso→maroon hover) + 1–2 featured image tiles (3:4, category name overlaid on scrim); remove counters/pills.
4. **Icon cluster:** Search, Wishlist (count dot in maroon), Account, Cart (count dot) — 1.5px stroke lucide icons, espresso, terracotta on hover. Search expands as a full‑width row under the header (Suta style) rather than a tiny inline box.
5. **Mobile:** hamburger → left `Sheet` drawer: logo, accordion category tree, account links, support phone/email; icons row stays in header.

### 5.2 Hero — `src/components/HeroSection.tsx` (rewrite)

- Replace the black full‑screen hero with a **light editorial carousel**: height `~82vh` desktop / `aspect-[4/5]` mobile; image `object-cover` with a *subtle* left scrim only.
- Slide content (left‑aligned, max‑w‑xl): gold overline (collection name) → serif H1 (e.g. "Woven for the Festive Season") → 1‑line sub → two CTAs (`primary` "Shop Now", `outline` "Explore Collection").
- Slow Ken‑Burns zoom on the active image; crossfade between slides (no slide‑push); 6s autoplay, pause on hover.
- Controls: thin line‑style dots bottom‑center (active = gold, 24px wide); arrows appear on hover (desktop only).
- Slides come from a local `heroSlides` const with **our banner photos** (see §9) — no Unsplash. Remove the glassy feature chips (moved to the USP strip below).

### 5.3 USP strip — **new** `src/components/UspStrip.tsx`

Thin band directly under the hero, blush bg, 4 items (2×2 on mobile): `Free Shipping ₹999+ · Cash on Delivery · 7‑Day Easy Returns · Handcrafted in India`. Icon (1.5px stroke, terracotta) + 13px label. No cards, no shadows — just a bordered band.

### 5.4 Categories — `src/components/CategorySection.tsx` (rewrite visuals, keep data fetching)

- Section header recipe (§3.2): overline `EXPLORE`, H2 `Shop by Category`, ornament.
- **Arch cards** (§4.1): image fills the arch, category name below in serif 18px + tiny "Shop now →" in terracotta on hover; hover = image scale `1.05` + gold outline fade‑in.
- Layout: horizontal scroll‑snap carousel on mobile (peek half card), 4–6 across on desktop; "View all categories →" link right‑aligned to `/categories`.
- Delete: gradient pills, blur blobs, stats badges, rounded‑2xl cards.

### 5.5 Product carousels — `src/components/FeaturedProducts.tsx` (+ `user/Newarrival.tsx`, `user/BestSeller.tsx`)

- One reusable `ProductCarousel` presentation: section header + embla/swiper row of `ProductCard`s (4 desktop / 2.2 peek mobile), minimal round‑bordered arrow buttons, "View all →" link.
- Homepage gets two instances: **New Arrivals** (`/new-arrivals` data) and **Bestsellers** (`/best-sellers` data) — or one section with two Suta‑style text tabs (`New In | Bestsellers`, gold underline on active).
- Alternate section backgrounds: ivory → blush → ivory, separated by `.scallop-divider`.

### 5.6 Editorial banners — `src/components/PromoSection.tsx` (rewrite & re‑enable)

- 2‑up banner grid (stack on mobile): each = 4:5 image, scrim, overline + serif title + `outline` CTA on ivory text (e.g. "The Festive Edit" / "Everyday Cottons"), linking to category/filtered listing.
- Optionally one full‑width seasonal campaign banner (21:9) between carousels for sales — `sale` red accents allowed here only.

### 5.7 New homepage sections (all new files under `src/components/home/`)

| Component | Content |
|---|---|
| `BrandStory.tsx` | Split band on blush + faint block‑print bg: image left (artisan/detail shot), right: overline `OUR CRAFT`, serif H2, 2 short paragraphs, 3 inline stats in serif (e.g. `40+ crafts · 900+ styles · 50k+ customers`), `outline` CTA → `/about` |
| `ReelsSection.tsx` | **Shoppable video reels** — overline `WATCH & SHOP`, H2 "Vastralaye in Motion"; horizontal row of 9:16 reel cards (5 desktop / peek-scroll mobile). Each card: video poster with play button + "Reel" chip + view count, and an attached mini product strip (thumb, name, price, →) linking to the PDP. Tap opens an inline `<video>` lightbox (muted autoplay, tap for sound). Serve `.mp4` posters+clips from the backend's existing `/static/uploads/product_videos/` storage; lazy-load posters, never autoplay in the row |
| `Testimonials.tsx` | Carousel of quote cards: 5 gold stars, 2–3 line quote (serif italic), customer name + city; ivory cards, 1px border; static seed data first |
| `InstagramGrid.tsx` | Overline `@vastralaye` + H2 "As Worn By You"; 6 square tiles (hover: espresso scrim + Instagram glyph) linking to the profile; static images first |
| `NewsletterBand.tsx` | Maroon band, ivory block‑print pattern at 5%: serif H2 "Stay in the Loop", sub‑line, email input + gold `Subscribe` button (front‑end only; toast on submit) |

### 5.8 Homepage composition — `src/pages/Index.tsx`

Assemble per §6.1; **remove** the logged‑in "My Account" card block (those links live in the account dropdown & drawer).

### 5.9 Product card — `src/components/ProductCard.tsx` (rewrite visuals, keep cart/wishlist logic)

- **Image `aspect-[3/4]`**, sand placeholder bg, radius 2px; **hover swaps to the 2nd product image** (crossfade 300ms) + scale 1.03. Card itself: no border, no shadow, transparent on section bg; only the image is boxed.
- Badges top‑left, flat & small (11px uppercase): `NEW` gold fill · `BESTSELLER` espresso fill · `-{d}% ` sale‑red fill. Max 2, stacked.
- Wishlist heart top‑right on the image: white circle, espresso stroke → filled maroon when active.
- **Quick add:** ivory/95 bar slides up over the image bottom on hover — "ADD TO CART" (13px tracked); on touch devices a small permanent 🛍 button bottom‑right of the image instead.
- Text block (left‑aligned, no card padding box): title 14px sans (1 line clamp) → price row: final price 15px semibold espresso + MRP struck muted + `(d% off)` in sale red 12px → rating row: small gold stars + count, only when a rating exists ("No ratings yet" text is dropped).
- Delete: gradients, `rounded-2xl`, hover‑translate, "you save" pill, green title hover.

### 5.10 Listing pages — `src/pages/ProductsPage.tsx`, `CategoryPage.tsx`, `AllCategoriesPage.tsx`, `components/ProductGrid.tsx`, `components/FilterSidebar.tsx`

- Page top: breadcrumb (12px muted) + serif H1 category title + item count; optional short category description (Suta style).
- Toolbar: result count left; `Sort` select right (minimal, borderless until open); mobile: sticky `Filter` + `Sort` bar above the grid, filters open in a bottom `Sheet`/`Drawer`.
- Grid: 2 cols mobile / 3–4 desktop, `gap-x-4 gap-y-10` — breathing room like the references.
- `FilterSidebar`: plain accordion groups (uppercase 12px titles) — Category, Price (slider), Size, Color (real color dots), Discount; active filters as removable espresso chips above the grid; "Clear all" text link. Remove card boxes/shadows around filter groups.
- `AllCategoriesPage`: grid of arch cards (reuse §5.4 card).

### 5.11 Product detail — `src/pages/ProductDetailPage.tsx`

- Layout: **left** vertical thumbnail rail + main 3:4 image (click zoom / pinch on mobile, swipeable); the rail's **last thumb is the product video** (poster + small play badge) when the product has one — selecting it plays the video in the main frame (muted, loop, tap for sound); **right** sticky info column:
  title (serif 26–30px) → rating link → price block (final + struck MRP + % off) → tax/shipping microcopy → **size selector as square outline swatches** (selected = espresso fill) + "Size guide" link → quantity stepper → full‑width `primary` ADD TO CART + heart `outline` square → trust icon row (COD · Easy returns · Secure payments) → accordions (Description · Fabric & Care · Shipping & Returns) instead of tabs.
- Below: `ReviewSection` restyled (summary: big serif average + gold star bars; review cards flat with 1px dividers) → **"Watch It Styled" related-video strip** (blush band reusing the `ReelsSection` card: styling reels, fabric close-ups and customer videos for this product, each with its shoppable product strip) → "You may also like" `ProductCarousel`.
- **Mobile:** sticky bottom bar with price + ADD TO CART after scrolling past the fold.

### 5.12 Cart, wishlist, checkout, auth, account

| File | Changes |
|---|---|
| `src/pages/CartPage.tsx` | Two columns: items list (88px 3:4 thumbs, title, size, qty stepper, line price, remove ✕) + sticky ivory‑bordered order summary (coupon input + `Apply`, totals, savings in `success` green, maroon CHECKOUT btn, payment icons row); empty state: block‑print illustration + serif "Your bag is empty" + CTA |
| `src/pages/WishlistPage.tsx` | Reuse new `ProductCard` grid + "move to cart" action; matching empty state |
| `src/pages/Checkout.tsx` / `OrderConfirmation.tsx` | Match tokens; confirmation = serif "Shukriya! Order placed", order summary card, gold ornament |
| `LoginPage / RegisterPage / ForgotPassword / ResetPassword` | Centered 420px card on ivory, serif H1, minimal inputs (§3.3); optional 50% brand image split on desktop |
| `user/*` account pages + `UserSidebar` | Left rail: 13px uppercase items with gold active underline; content cards flat with 1px borders; keep functionality |

### 5.13 Footer — `src/components/Footer.tsx` (rewrite)

- **Espresso** (`#2B1B12`) background, ivory text, gold accents; optional scallop or thin gold rule top edge.
- Row 1: brand block (logo in ivory, 2‑line story, social icons — simple 1.5px stroke, gold on hover) + 3 link columns (`Shop`, `Company`, `Help & Policies` — covers all existing policy routes) + `Contact` (address, phone, email, hours).
- Row 2: newsletter inline (if not using the band) — else skip.
- Bottom bar: `© 2026 Vastralaye · All rights reserved` + payment method icons (UPI, Visa, MC, RuPay, COD) in muted ivory.
- Mobile: columns collapse to accordions.
- Link colors: ivory/70 → gold hover, 14px; column titles 12px uppercase gold tracked.

### 5.14 Global odds & ends

- `src/components/GlobalLoader.tsx`: ivory overlay + small pulsing brand mark or spinning gold ornament (no generic blue spinner).
- `NotFound.tsx`: serif 404 + "Thread not found" style message + CTA home.
- `ScrollToTopButton.tsx`: square espresso button, gold arrow.
- Toasts (sonner/toaster): ivory bg, 1px espresso border, maroon accent strip; success uses `success` green.
- Add floating **WhatsApp chat button** bottom‑right (both references have one) — simple `https://wa.me/<number>` link, espresso circle w/ white glyph.
- Skeletons: `sand` shimmer, match new aspect ratios (3:4 cards, arch categories).

---

## 6. Page Blueprints

### 6.1 Homepage (final section order)

```
01 Announcement bar        (maroon, rotating offers)
02 Header + mega menu      (sticky)
03 Hero carousel           (light editorial, 2–4 slides)
04 USP strip               (blush band)
05 Shop by Category        (arch cards)          — ivory
06 New Arrivals carousel                          — ivory
07 Editorial banners       (2-up: Festive / Everyday)
08 Bestsellers carousel                           — blush + scallop edges
09 Shoppable reels         ("Vastralaye in Motion", 9:16 video cards)
10 Brand story band        (craft + stats)        — blush/pattern
11 Testimonials carousel                          — ivory
12 Instagram / UGC grid                           — ivory
13 Newsletter band                                — maroon
14 Footer                                         — espresso
```

### 6.2 Listing page: breadcrumb → serif title + count → toolbar → sidebar (desktop) / drawer (mobile) → 2–4 col grid → pagination ("Load more" `outline` button preferred) → footer.

### 6.3 PDP: breadcrumb → gallery (last thumb = product video) + sticky buy column → accordions → reviews → "Watch It Styled" video strip → related carousel → (mobile) sticky ATC bar.

### 6.4 Checkout/auth pages stay **distraction‑light**: header simplified (logo + secure badge), no mega menu needed.

---

## 7. Motion & Interaction Guidelines

Framer Motion is already installed — use it *quietly*:

- **Section reveal:** fade + 16px rise, 0.5s ease‑out, once per viewport entry (`whileInView`), stagger children 60ms. No bouncy springs.
- **Hero:** crossfade 800ms + Ken‑Burns scale 1.0→1.06 over the slide's 6s life.
- **Cards:** image swap crossfade 300ms; scale 1.03; quick‑add bar slides up 200ms.
- **Mega menu / drawers:** fade+drop 150–200ms.
- **Never:** parallax jank, gradient animations, hover translate of whole cards, spin/pulse decorations (delete existing `spin-slow`, `pulse-slow` uses).
- Respect `prefers-reduced-motion`: disable Ken‑Burns & reveals.

---

## 8. Mobile UX Rules

- Breakpoints: design mobile‑first at 390px; key checks at 768 / 1024 / 1440.
- Header condenses to: hamburger · logo · search+cart; announcement bar stays (smaller, 11px).
- All carousels become scroll‑snap rows with a **half‑card peek** (signals scrollability).
- Filters & size guide open as bottom sheets; footer columns become accordions.
- Sticky ATC bar on PDP; quick‑add via small permanent button on cards (no hover on touch).
- Tap targets ≥ 44px; product grid 2‑up with 12–16px gutters.

---

## 9. Asset Checklist

To be produced/collected before Phase 2 (all our own or licensed — nothing from the reference sites):

- [ ] Logo refresh: primary wordmark (espresso on ivory) + reversed (ivory on maroon/espresso) + square mark for favicon/WhatsApp.
- [ ] 3–4 **hero banners**: 2400×1200 desktop + 1080×1350 mobile crops, warm‑graded lifestyle photography, subject right / copy space left.
- [ ] Category images (one per live category), consistent warm background, subject centered for the **arch crop** (min 900×1200).
- [ ] 2 editorial banner images (1200×1500) + 1 seasonal campaign banner (2400×1000).
- [ ] Brand‑story image (artisan/fabric detail) + 6 UGC squares (≥800×800).
- [ ] **Reel videos:** 5+ vertical 9:16 clips (15–30s, ≤8MB `.mp4`, muted-friendly) with poster frames — styling reels, fabric close‑ups, customer videos; per‑product videos upload to the backend's existing `/static/uploads/product_videos/`.
- [ ] Block‑print SVG tile + ornament SVG (commission or draw in‑house).
- [ ] Payment method icon set (SVG, monochrome ivory).
- [ ] Every product ideally has ≥2 images (enables card hover‑swap; card must degrade gracefully with 1).
- [ ] Compress everything (WebP/AVIF ≤ 250KB hero, ≤ 120KB cards); backend already serves via `/static`.

---

## 10. Implementation Flow (Phases & Checklists)

Ship phase‑by‑phase — the site stays usable after every phase. Each phase = one PR.

### Phase 0 — Foundations *(≈ half day)*
- [ ] `index.html`: fonts, title/meta, theme‑color, drop dev script (prod)
- [ ] `src/index.css`: new token values + base utilities (§3.1, §5.0)
- [ ] `tailwind.config.ts`: colors, fonts, radius, keyframes
- [ ] `ui/button.tsx` variants restyled
- [ ] Smoke‑check: whole app renders with new palette; nothing functionally broken

### Phase 1 — Header & Footer *(≈ 1 day)*
- [ ] Announcement bar in `NavBar.tsx`
- [ ] Header/mega‑menu/mobile‑drawer restyle
- [ ] `Footer.tsx` espresso rewrite (all existing links preserved)
- [ ] WhatsApp float + `ScrollToTopButton` restyle

### Phase 2 — Homepage *(≈ 2 days, needs §9 assets)*
- [ ] `HeroSection.tsx` rewrite (light editorial carousel)
- [ ] New `UspStrip.tsx`
- [ ] `CategorySection.tsx` arch cards
- [ ] `ProductCarousel` extraction + New Arrivals/Bestsellers sections
- [ ] `PromoSection.tsx` rewrite + re‑enable
- [ ] New `ReelsSection` (shoppable reels row + video lightbox)
- [ ] New `BrandStory` / `Testimonials` / `InstagramGrid` / `NewsletterBand`
- [ ] `Index.tsx` reassembled per §6.1 (account card block removed)

### Phase 3 — Product card & listings *(≈ 1–2 days)*
- [ ] `ProductCard.tsx` rewrite (3:4, hover swap, flat badges, quick add)
- [ ] `ProductGrid.tsx`, `ProductsPage.tsx`, `CategoryPage.tsx`, `AllCategoriesPage.tsx`
- [ ] `FilterSidebar.tsx` accordion restyle + mobile filter sheet
- [ ] Skeletons updated to new ratios

### Phase 4 — Product detail *(≈ 1–2 days)*
- [ ] Gallery (thumb rail, zoom, swipe) + sticky buy column; product-video thumb plays in main frame
- [ ] "Watch It Styled" related-video strip (reuse `ReelsSection` card)
- [ ] Size swatches, qty stepper, trust row, accordions
- [ ] `ReviewSection` restyle; related‑products carousel
- [ ] Mobile sticky ATC bar

### Phase 5 — Cart → checkout → account *(≈ 1–2 days)*
- [ ] `CartPage` (+ summary card, coupon UI, empty state), `WishlistPage`
- [ ] `Checkout` / `OrderConfirmation` / `TrackOrder`
- [ ] Auth pages; account pages + `UserSidebar`; invoices/orders pages tokens

### Phase 6 — Polish & cleanup *(≈ 1 day)*
- [ ] Policy pages, FAQ, About, Contact typography pass
- [ ] `GlobalLoader`, `NotFound`, toasts, favicon
- [ ] **Grep‑sweep:** zero occurrences of `#559F4B`, `#E1783E`, decorative `bg-gradient-to-*`, `rounded-2xl` cards, Unsplash URLs
- [ ] Delete dead legacy classes from `index.css`; remove unused MUI usages where shadcn replaced them
- [ ] Run §11 QA

**Dependency note:** Phases 1, 3 depend only on Phase 0. Phase 2 needs Phase 0 + assets (§9). Phases 4–5 need Phase 3's card/tokens. Two devs can run (1+2) and (3+4) in parallel after Phase 0.

---

## 11. QA / Definition of Done

- [ ] **Visual consistency:** every page uses only §3 tokens; serif headings everywhere; no leftover gradients/stock photos.
- [ ] **Reference parity check:** homepage matches §6.1 order; arch cards, announcement bar, USP strip, editorial banners, dark footer all present.
- [ ] **Responsive:** 390 / 768 / 1024 / 1440 pass on Home, PLP, PDP, Cart, Checkout; no horizontal scroll; carousels peek correctly.
- [ ] **Accessibility:** text contrast AA (espresso on ivory ✅, ivory on maroon ✅, gold only for ≥18px or decorative); focus states visible (maroon ring); carousel/menus keyboard‑operable; images have alts; `prefers-reduced-motion` respected.
- [ ] **Performance:** hero LCP image preloaded & ≤250KB; fonts `display=swap`; Lighthouse mobile ≥ 80 perf / ≥ 90 a11y on Home & PLP.
- [ ] **Functionality untouched:** auth, cart, wishlist, coupons, checkout/payment, orders, reviews, invoices, admin panel all behave exactly as before (visual‑only refactor).
- [ ] **No copied assets** from suta.in / aachho.com anywhere in the repo.

---

*This document is the single source of truth for the redesign. Implement in the phase order above; tick checkboxes in PRs as sections land. Update this file if decisions change.*
