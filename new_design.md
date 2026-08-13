# new_design.md — Reels Experience & Storefront Polish

> **Status: ✅ ALL IMPLEMENTED** — **1)** the reels row becomes a slider when more videos exist,
> **2)** the reel viewer shows prev/next video previews with smooth slider navigation,
> **3)** the product page gets a sticky floating reel that follows the shopper on scroll,
> **4)** the WhatsApp button becomes a middle-right admin-controlled contact hub,
> **5)** UPI / Visa / Mastercard / RuPay / COD payment badges in the footer and cart,
> **6)** the Premium Collection list view is redesigned as an editorial card,
> **7)** the scroll-to-top button joins the espresso/gold theme,
> **8)** contact hub & footer socials use the original brand logos.

---

## 1. Reels row slider (when more videos than fit)

## Behavior spec

| Situation | What the user sees |
|---|---|
| Reels fit in the row | Plain row, no arrows — nothing changes |
| More reels than fit (desktop/tablet ≥768px) | Round white **arrow buttons** appear overlaying the left/right edges; clicking pages the row by ~85% of its width with smooth scrolling |
| At the start / end of the row | The corresponding arrow hides (left arrow hidden at start, right arrow hidden at end) |
| Mobile | Natural swipe with **scroll-snap** (cards snap into place); arrows stay hidden — touch is the slider |
| Any count | **All** published reels render (fetch limit raised 12 → 20) instead of the previous cap of 5 |

## Design details

- **Buttery paging animation:** arrow clicks glide the row with a custom eased scroll
  (requestAnimationFrame, ease-in-out cubic, 650ms) instead of the browser's abrupt native
  smooth-scroll; scroll-snap is paused during the glide and restored after so touch swiping keeps
  its snap. Reduced-motion visitors jump instantly. Clamped at row ends.
- **Staggered card entrance:** each reel card animates in individually (fade + 26px rise + subtle
  0.97→1 scale, 70ms stagger, capped at 6 steps) — and because visibility is per-card, reels that
  slide in from off-screen **animate on arrival** too. Applies to the homepage row **and the
  product page's "Watch It Styled" strip** automatically (shared component).
- **Arrow feedback:** hover grows the button 5% and turns it maroon; press squashes to 90% — a
  tactile click feel (200ms).
- Arrows: 40px round white buttons, 1px `border-border`, soft shadow, espresso chevron → **maroon on hover** — the "minimal round-bordered arrow buttons" pattern from `design.md` §5.5.
- Positioned at the vertical center of the video posters (not the product strips), overlapping the row edges by 12px.
- Row: `snap-x snap-mandatory` + `scroll-smooth`, native scrollbar hidden on all engines.
- Card widths per breakpoint: 56% (phone) → 46% → 36% (small tablet) → exactly **3 per view** at `md` → exactly **5 per view** at `lg` (`calc((100% − gaps) / n)` so cards align flush with the section grid).
- Arrow visibility is computed from live scroll position (`scroll` + `resize` listeners), so it stays correct on window resizes and after new reels load.

## Files changed

| File | Change |
|---|---|
| `src/components/ReelsSection.tsx` | Slider wrapper (`relative` + scroll container ref), left/right arrow buttons with edge-aware visibility, `slide()` paging, snap/smooth/hidden-scrollbar row, per-breakpoint exact card widths, removed the 5-card cap, fetch `limit: 20` |

No backend changes required (the public reels endpoint already supported `limit` up to 50).

---

## 2. Reel viewer — prev/next previews + slider (per marked screenshot)

When a reel is opened, the viewer is now a **carousel**, matching the marked mockup:

- **Side previews (desktop ≥768px):** dimmed 9:16 posters of the **previous and next videos**
  appear on the left/right of the playing reel (40% opacity, brighten on hover, clickable) —
  the Instagram-desktop-style layout from the screenshot.
- **Slider arrows:** round ivory prev/next buttons beside the player on **all** screen sizes;
  each fades out at its end of the list.
- **Position counter** ("2 / 8") on the top-left of the player.
- **Keyboard**: ← / → navigate, Esc closes. Every reel viewed registers a view count.
- **Smooth slide between reels:** clicking an arrow (or preview / keyboard) no longer swaps the
  video instantly — the current reel **glides out and the next glides in from the arrow's
  direction** (directional slide + fade + subtle scale, 380ms, soft ease-out; Instagram-style).
  The shoppable product strip travels with its video; the counter and close button stay fixed.
  Reduced-motion visitors get an instant swap. Viewer arrows also gained the hover-grow /
  press-squash feedback matching the row arrows.
- Videos re-mount on navigation (keyed by reel id) so uploaded MP4s autoplay and YouTube embeds
  reload correctly; the shoppable product strip updates per reel.

| File | Change |
|---|---|
| `src/components/ReelsSection.tsx` | Viewer refactored from single-reel state to indexed carousel: `activeIndex` + `prevReel`/`nextReel`, side preview buttons, arrow buttons, counter, keyboard handler, keyed player, shared `posterSrc()` (poster → YouTube thumb → video frame) |

## 3. Product page — sticky floating reel (per marked screenshot)

A small floating reel player on the product detail page that **follows the scroll**:

- **Direction-aware:** scrolling **down hides** it (never blocks reading); scrolling **up shows**
  it again, and it's always visible near the top of the page (8px jitter filter so it doesn't flicker).
- **Steps aside at "Watch It Styled":** while the product page's reels section is on screen, the
  sticky mini reel hides automatically (the reels are right there) and returns once you scroll past
  it — implemented with an IntersectionObserver on the section (`id="watch-it-styled"`), with a
  short retry so it still attaches when the section mounts after its reels load.
- **Continuous playback:** expanding continues the video from the mini player's position, and
  closing hands the position back to the mini player — one uninterrupted reel.
- **Opens the full carousel viewer:** tapping the sticky reel opens the same viewer as the reels
  row — **prev/next previews on the sides, slider arrows, counter, keyboard navigation** — loaded
  with **all** of the product's reels (a "N reels" chip on the mini player shows when more than one
  exists). The viewer is now a shared component (`ReelViewer.tsx`) used by both the reels row and
  the sticky player, so both always behave identically.
- Shows the product's **first PDP reel** (poster/autoplaying muted loop for uploads, YouTube
  thumbnail for links); falls back to the product's own `video/video_url` when no reel exists;
  renders nothing when there's no video at all.
- **Tap → expands** to the full-screen player (native video with controls, or embedded YouTube).
- **✕ dismisses** it for that page view. Positioned bottom-left so it never collides with the
  WhatsApp button (bottom-right). Caption shown along the bottom edge.

| File | Change |
|---|---|
| `src/components/ReelViewer.tsx` | **New shared viewer component** — extracted carousel (previews, arrows, counter, keyboard, view tracking, shoppable strip, `initialSeek` continuity) used by both surfaces |
| `src/components/StickyReelVideo.tsx` | Fetches **all** product reels (fallback to the product's own video), direction-aware visibility, mini player with "N reels" chip, opens `ReelViewer` with playback continuity both ways |
| `src/components/ReelsSection.tsx` | Now delegates its lightbox to `ReelViewer` (behavior unchanged, ~150 lines slimmer) |
| `src/pages/ProductDetailPage.tsx` | Renders `<StickyReelVideo productId fallbackVideoUrl>` alongside the "Watch It Styled" strip |

---

## 4. Floating contact hub — middle-right, admin-controlled, multi-link

The old fixed WhatsApp button is now a **contact hub pinned to the middle of the right edge**:

- A round espresso/gold button (chat icon) sits at the **vertical center of the right side**;
  tapping it **expands a cascade of link buttons** upward (40ms stagger, scale+slide in):
  **WhatsApp** (green), **Call** (maroon, `tel:`), **Instagram / Facebook / YouTube** (white with
  gold hover) — the icon flips to ✕ while open.
- **Fully admin-controlled** from *Admin → Store Settings*:
  - every link comes from settings (`whatsapp_number`, new `call_number`, `instagram_url`,
    `facebook_url`, `youtube_url`) — an **empty field hides that button** from the hub;
  - a new **"Show the floating contact button" toggle** (`float_enabled`) switches the whole hub
    off storefront-wide;
  - new fields validated (call number format) and served through the same public settings API.
- Closed-state links are unfocusable (`tabIndex -1`) and hidden from pointer events; labels via
  `aria-label`/`title`. The sticky PDP reel (bottom-left) and this hub (middle-right) never collide.

| File | Change |
|---|---|
| `src/components/WhatsAppFloat.tsx` | Rebuilt as the expandable middle-right contact hub |
| `src/pages/admin/AdminSettings.tsx` | New Call-number field + floating-button toggle |
| `src/hooks/use-site-settings.ts` | `call_number` / `float_enabled` in the settings shape |
| `vastralaye_backend/app/routers/site_content.py` | `call_number` + `float_enabled` setting keys accepted & served |

---

## 5. Footer payment badges — logos instead of text

The footer's payment row (`UPI · VISA · MASTERCARD · RUPAY · COD`) no longer uses plain text chips —
each method now renders as a **white badge chip with its brand mark**:

| Method | Mark |
|---|---|
| UPI | Orange/green chevrons + wordmark |
| Visa | Blue italic wordmark |
| Mastercard | Interlocking red/orange circles |
| RuPay | Wordmark + orange/green chevrons |
| COD | Banknote icon + "COD" |

- Drawn as **inline SVGs** in a new reusable `PaymentBadges` component — zero external image
  assets (nothing to host, hotlink or break), crisp at any resolution, each chip carries an
  accessible `aria-label`/`title`.
- White chips on the espresso footer read like the standard payment-trust row on major stores.
- Reusable anywhere with one line (`<PaymentBadges />`) — **also used in the cart's Order Summary**
  (below the Proceed to Checkout button), replacing its text chips; chips carry a subtle border so
  they read on white cards as well as the dark footer.

| File | Change |
|---|---|
| `src/components/PaymentBadges.tsx` | New — the five SVG badge chips (bordered for light surfaces) |
| `src/components/Footer.tsx` | Bottom bar renders `<PaymentBadges />` instead of text chips |
| `src/pages/CartPage.tsx` | Order Summary payment row now renders `<PaymentBadges />` |

---

## 6. Premium Collection — List view redesigned

The homepage product section's **Grid / List toggle** had a leftover old-style list layout
(gradient accent bars, glowing stars, a pile of gradient badges mixed into the button row).
The list row is now a clean **editorial horizontal card**:

- **Left:** fixed 3:4 image column on sand with the same **hover second-image crossfade** as the
  grid card, and the same flat badges (gold `NEW`, espresso `BESTSELLER`, red `-x%`, out-of-stock).
- **Right:** gold category overline → **serif product title** (maroon on hover) → gold star rating
  with count → two-line muted description (hidden on phones) → price block (semibold price, struck
  MRP, red % off) → bottom action row separated by a hairline: maroon **Add to Cart**, square
  outline wishlist heart (blush fill when saved), and a hover-reveal "View details →" on desktop.
- Flat `bg-white border-border rounded-sm` container with a soft shadow on hover — no gradients,
  no badge soup. Stays horizontal on mobile (that's the point of list view) with tightened
  paddings and a compact "Add" label.
- Review fetching, image normalization and cart/wishlist logic are byte-preserved; the same
  component serves the products page's list mode, so it upgrades there too.

| File | Change |
|---|---|
| `src/components/ProductListItem.tsx` | Rewritten to the editorial list row (visuals only) |

---

## 7. Scroll-to-top button — brought onto the theme

The back-to-top button was the last off-theme element — an orange→green **gradient circle**
(legacy hexes the color migration didn't catch) with a looping bounce and ping ripple, both
banned by the motion rules. Now per `design.md` §5.14:

- **Square espresso chip with a gold chevron** and a 1px gold border — matching the WhatsApp-hub /
  sticky-reel floating family; deepens to **maroon on hover** with the 5% grow / 90% press-squash
  feedback used across the site; the chevron nudges up 2px on hover (single transition, no loops).
- Same slide-in behavior (appears after 300px of scroll, slides away near the top), scroll listener
  now passive.
- **Position fixed for mobile PDP:** `bottom-20` on small screens so it clears the sticky
  add-to-cart bar, `bottom-6` from `md:` up; bottom-right, clear of the middle-right contact hub
  and the bottom-left sticky reel — the three floating elements each own a corner.

| File | Change |
|---|---|
| `src/pages/ScrollToTopButton.tsx` | Restyled to the espresso/gold theme; bounce + ripple removed; mobile offset added |

---

## 8. Original brand logos — contact hub & footer socials

The contact hub and the footer social row were drawing their links with **generic lucide
outline icons** (a camera square for Instagram, a plain triangle for YouTube…). Both now use
the **official brand-mark SVGs**, inlined the same way as the payment badges (§5) — no image
requests, no external icon fonts:

- **New shared icon set** `src/components/icons/SocialIcons.tsx` — the original logo paths for
  **WhatsApp, Instagram, Facebook, YouTube and X (Twitter)**. Every glyph fills with
  `currentColor`; the Instagram mark can also render with the **official warm gradient**
  (`gradient` prop: #FEDA75 → #FA7E1E → #D62976 → #962FBF → #4F5BD5), and the classic radial
  Instagram gradient is exported as a CSS background for chips.
- **Floating contact hub (`WhatsAppFloat`)** — each expanded mini-button is now the brand's
  original logo on its **official color**: WhatsApp white-on-green `#25D366`, Instagram
  white-on-gradient, Facebook white-on-`#1877F2`, X white-on-black, YouTube white-on-`#FF0000`;
  Call keeps the maroon theme chip (a phone has no brand). Buttons grow 10% on hover; the
  espresso/gold main toggle is unchanged. **X (Twitter) joins the hub** — like the others it
  appears only when its URL is set in Admin → Store Settings, and the hand-drawn WhatsApp
  path was replaced with the official logo.
- **Footer social row** — the outline circles became **ivory chips with the full-color original
  logos** (green WhatsApp, gradient Instagram, blue Facebook, black X, red YouTube), which read
  crisply on the espresso footer like app icons; hover brightens the chip to white and grows it
  10%. **WhatsApp is now part of the footer socials too**, linking to the same admin-controlled
  `wa.me` number as the hub (shared `FALLBACK_WHATSAPP` until one is set); YouTube still appears
  only when configured.
- All links keep their **Admin → Store Settings wiring** — same `useSiteSettings()` cache, same
  per-link show/hide rules, same `float_enabled` kill-switch.

| File | Change |
|---|---|
| `src/components/icons/SocialIcons.tsx` | New — official WhatsApp / Instagram / Facebook / YouTube / X logo SVGs + Instagram gradient |
| `src/components/WhatsAppFloat.tsx` | Hub buttons redrawn with original logos on brand colors; X (Twitter) link added |
| `src/components/Footer.tsx` | Social row rebuilt as ivory chips with full-color brand logos; WhatsApp link added |
| `src/hooks/use-site-settings.ts` | Exports the shared `FALLBACK_WHATSAPP` number |

---

## 9. Account & auth pages redesigned → see `user_design/`

Every page in `src/pages/user/` (Profile, Orders, Account Settings, Forgot/Reset
Password, Invoice) plus the shared account shell (`UserLayout`/`UserSidebar`) was
redesigned to the editorial theme — espresso greeting band, identity sidebar, order
status timelines, split-panel auth stage, branded invoice paper. Full design docs,
HTML mockups and screenshots live in **[`user_design/`](user_design/README.md)**.

---

## 10. Footer — illustrated heritage background

The espresso footer now carries a two-layer **background illustration** (inspired by the
aachho.com footer, drawn as original artwork in the Vastralaye palette):

1. **Woven paisley sky** — a repeating gold boteh tile (inline SVG data-URI) at 5%
   opacity across the whole footer.
2. **Heritage panorama** — a full-width Rajasthani skyline band along the base, in
   zari-style gold line art on the dark ground: tiered Hawa-Mahal-style facade, arched
   gateway under a rising sun, camel, women carrying pots, teal peacock, village hut and
   a domed fort on rolling dunes, dotted with terracotta/maroon buti flowers. Drawn as
   one inline SVG component (`FooterScene`) — no image requests, crisp at any width
   (`preserveAspectRatio: xMidYMax slice`), `aria-hidden` + `pointer-events-none`.

The panorama gets its own reserved band below the bottom bar (h-36 → h-52 responsive),
so links and payment badges keep full contrast.

| File | Change |
|---|---|
| `src/components/decor/FooterScene.tsx` | New — the illustrated skyline SVG |
| `src/components/Footer.tsx` | Paisley tile layer + panorama band at the base |

---

## 11. Catalogue page banners (All Products / All Categories)

Both catalogue pages open with a full-width **image banner** instead of a plain heading:

- **Admin-driven image** — the banner background is the first hero banner from
  **Admin → Banner Control** (`GET /fronted/banners`, fetched once per session and shared
  between pages), laid under an espresso gradient (95% → 35% left-to-right) so the ivory
  serif title, breadcrumb and counts stay readable over any photo.
- **Fallback** — with no banner configured, the band renders the espresso + gold paisley
  treatment, so the page never looks broken.
- Layout: ivory breadcrumb (`Home · <gold>Shop/Categories</gold>`), serif ivory title,
  muted subtitle with live counts, gold line–diamond–line ornament; closed by the site's
  3px gold rule (same family as the hero and account band).
- The paisley tile moved to a shared `decor/patterns.ts` (used by the footer and banners).

| File | Change |
|---|---|
| `src/components/PageBanner.tsx` | New — shared admin-image banner with espresso fallback |
| `src/components/decor/patterns.ts` | New — shared `PAISLEY_TILE` data-URI |
| `src/pages/ProductsPage.tsx` | Banner replaces the in-container breadcrumb + heading |
| `src/pages/AllCategoriesPage.tsx` | Banner replaces the in-container breadcrumb + heading |
| `src/components/Footer.tsx` | Imports the shared paisley tile |

---

## 12. Premium Collection section — chrome brought onto the theme

The homepage Premium Collection section (`FeaturedProducts`) still wore the old template:
gray gradient background, bold gray heading with a maroon pill badge, rounded-xl icon
tabs, a gray toggle group, a mega CTA with ping/scale animations, and an invalid
`<style jsx>` block. Now:

- **Header** — centered editorial stack in a `Reveal`: gold overline **Curated For You**,
  serif "Premium Collection", muted subline.
- **Tabs** — hairline underline tabs (uppercase, letter-spaced, no icons): active tab gets
  a **2px gold underline** and espresso text on a shared `border-b` rule; row scrolls on
  mobile with the standard hidden-scrollbar utilities (styled-jsx block removed).
- **Grid/List toggle** — flat bordered pair, active side espresso-filled; sits on the same
  hairline as the tabs.
- **View All Products** — hairline espresso outline button that fills espresso on hover
  with an arrow nudge (ping ripple, shadows and scale removed).
- **Empty & loading states** — blush icon circle + serif title + themed buttons; single
  maroon ring spinner.
- All fetching/pagination/tab lazy-loading and the `ProductGrid` wiring are unchanged —
  the cards were already on-theme.

| File | Change |
|---|---|
| `src/components/FeaturedProducts.tsx` | Section chrome restyled (visuals only) |

---

## 13. Mobile bottom navigation

Phones get a fixed **bottom tab bar** (suta-style): five tabs on white over a top
hairline — **Login/Account** (switches by auth state), **Categories**, a **raised
espresso Search circle** at the center (gold ring, white cut-out border, links to the
catalogue), **New Arrivals**, and **Cart** with a maroon count badge. Active tab turns
maroon. Mobile only (`md:hidden`), mounted globally; it hides itself on admin pages,
checkout and the split-panel auth screens. On the **product page** the nav stays and the
mobile sticky add-to-cart bar **stacks directly above it** (`bottom-[53px]` below md);
the sticky reel and scroll-to-top float up accordingly (124px clearance on phones, 84px
for the reel on tablets where only the bar shows). The footer's panorama band gains
mobile bottom clearance so the artwork isn't covered.

| File | Change |
|---|---|
| `src/components/MobileBottomNav.tsx` | New — the bottom tab bar |
| `src/App.tsx` | Mounts the nav for non-admin routes |
| `src/components/Footer.tsx` | Panorama band gets `mb-14` on mobile |

---

## 14. New Arrivals & Bestsellers pages — redesigned with banners

Both listing pages still wore the gray template (bold gray headings on `bg-gray-50`,
default controls, red error screens). Now, matching §11's catalogue pages:

- **`PageBanner` on top** — same admin-driven image band (Admin → Banner Control, espresso
  gradient, paisley fallback) with the page title, breadcrumb and a live product count
  ("Fresh off the loom…" / "Most-loved weaves…").
- **Controls bar** — hairline `border-y` row: muted "Showing X to Y of N" left, uppercase
  "Per page" + flat select right.
- **Pagination** — square `rounded-sm` page buttons with the current page filled espresso,
  hairline uppercase Previous/Next, muted ellipses and page-info line.
- **States** — maroon ring spinner; serif error screen with themed retry; empty states get
  the gold ornament + serif title.
- Fetching, pagination math and `ProductCard` grid are untouched.

| File | Change |
|---|---|
| `src/components/user/Newarrival.tsx` | Banner + themed chrome (visuals only) |
| `src/components/user/BestSeller.tsx` | Banner + themed chrome (visuals only) |

---

## 15. Product card — matted atelier redesign

`ProductCard` (used by every grid: homepage tabs, catalogue, New Arrivals, Bestsellers,
related products) moved from the borderless left-aligned card to a **matted gallery
card**:

- **White mat frame** — the 3:4 image sits inside a bordered white card with 10px
  matting; hover lifts it with a soft espresso shadow, warms the border to gold and
  reveals an **inner gold hairline frame** around the image.
- **Museum-label typography, centered** — gold category overline (when the product has a
  category), serif name (maroon on hover), gold stars + count, price with struck MRP and
  red % off, closed by a **44px gold rule that draws in on hover**.
- **Quick-add** — the slide-up bar is now espresso/ivory (always visible on touch);
  wishlist becomes a framed square chip matching the site's square vocabulary.
- Badges (gold NEW / espresso BESTSELLER / red −x% / out-of-stock), hover image-swap,
  image normalization and all cart/wishlist logic unchanged.

| File | Change |
|---|---|
| `src/components/ProductCard.tsx` | Rewritten to the matted card (visuals only) |

---

## 16. Product details page — atelier redesign

Implemented from the approved mockup (`user_design/mockups/07-product-detail.html`):

- **Gallery**: thumbnails moved from a side rail to a **filmstrip under the main image**
  (active thumb gold-ringed, video keeps its play mark); the stage gets the inner gold
  hairline frame, flat badges and a "Hover to zoom" chip. Zoom/media logic unchanged.
- **Info column**: gold category overline + live stock dot → serif 33px title → star row
  with a "N reviews" anchor that scrolls to the reviews section + SKU → **blush price
  panel** (serif price, struck MRP, red % off, tax microcopy) → gold ornament → **colour
  swatches** (gold outline when active) → **size chips** (espresso fill when selected) →
  flat quantity stepper → CTA grid (maroon Add to Cart, outline **Buy Now** — a new
  minimal flow: same validation, adds to cart and navigates to it — wishlist + share
  chips) → 3-cell **trust strip** → serif accordion with gold ± markers.
- **Full-width sections** replace the old desktop/mobile duplicates: Watch It Styled
  (unchanged), **You Might Also Like** — existing slider mechanics now rendering the
  shared matted `ProductCard` — and a single **Reviews** section (`#reviews`).
- Sticky reel, mobile add-to-cart bar stacking and all fetch/cart/wishlist logic
  preserved; the file's pre-existing type errors dropped 16 → 15.

| File | Change |
|---|---|
| `src/pages/ProductDetailPage.tsx` | Rebuilt to the atelier layout (presentation + minimal Buy Now flow) |

---

## 17. All Categories — gallery-hall redesign

Implemented from the approved mockup (`user_design/mockups/08-all-categories.html`):

- **Featured duo** — the two largest categories (by product count) pinned above the
  gallery as wide image banners: espresso gradient + faint paisley, inner gold frame,
  gold "pieces" count chip, eyebrow (Most Loved / Festive Ready), serif name, collections
  line and a framed **Explore →** button. Hidden while searching.
- **Toran garland divider** — a gold pennant-garland SVG with terracotta beads under the
  centered "Shop by Category" header.
- **Jharokha arch gallery** — the arch cards now **stagger** (every second card drops on
  sm+), carry a serif **roman numeral**, and on hover show the inner gold arch ring, an
  espresso veil rising with "Explore →", a maroon name and a small gold rule.
- **Espresso CTA strip** — "Can't find your weave?" over paisley with an inner gold frame
  and a gold-outline Browse All Products button (replaces the blush box).
- Pagination now runs over the non-featured categories (featured stay pinned); active
  page fills espresso. Search/sort/count logic and the image normalizer are unchanged.

| File | Change |
|---|---|
| `src/pages/AllCategoriesPage.tsx` | Rebuilt to the gallery-hall layout |

---

## 18. All Products — catalogue-room redesign

Implemented from the approved mockup (`user_design/mockups/09-all-products.html`):

- **"Refine" filter panel** — the sidebar became a white card with an ivory serif header
  ("Refine" + maroon Clear-all), hairline sections under gold overlines: **Category**
  (counts right, active = maroon + gold diamond, subcategories kept), **Price** (gold
  slider + flat min/max inputs), **Availability** and **Highlights** as gold-check
  boxes. Mobile drawer behavior unchanged.
- **Toolbar-integrated search** — the standalone search field moved into the hairline
  toolbar's right cluster on desktop (compact 240–280px field with clear-X); mobile keeps
  a full-width field above the toolbar.
- **Active filter chips row** — every applied filter renders as a dismissible blush pill
  (quoted search, `₹min–₹max` price, In stock, Featured, Bestsellers, New arrivals,
  category/subcategory names resolved from loaded products), each × removing just that
  filter and syncing the sidebar via a new optional backward-compatible `value` prop;
  "Clear all filters" resets everything. The old inline "Clear N filters" link retired.
- Fetching, sorting, pagination, `ProductGrid` and `PageBanner` untouched.

| File | Change |
|---|---|
| `src/components/FilterSidebar.tsx` | Restyled to the Refine panel + optional `value` sync prop |
| `src/pages/ProductsPage.tsx` | Toolbar search, chips row, default-filter reset wiring |

---

## 19. Admin sidebar — responsive on every screen

The admin shell assumed desktop: the espresso sidebar was permanently fixed at 240px and
the content column permanently offset `ml-60`, leaving almost no room on phones. Now:

- **lg+ (≥1024px)** — unchanged: static 240px rail, content offset, no hamburger.
- **Below lg** — the sidebar becomes an **off-canvas drawer**: hidden by default
  (`-translate-x-full`), content takes the full width, and a bordered **hamburger button**
  appears in the topbar. Opening slides the rail in (300ms) over an espresso backdrop
  with a subtle blur; it closes via the backdrop, a new X button in the brand row,
  the Escape key, or automatically on any navigation (route-change effect). Body scroll
  locks while open.
- Topbar/content paddings tightened on small screens (`px-4`/`p-4` → `lg:px-8`/`p-8`).
- Props are optional and backward-compatible (`isOpen`/`onClose` on the sidebar,
  `onMenuClick` on the topbar); all nav logic, auth redirect and the nested-shell
  context are untouched.

| File | Change |
|---|---|
| `src/components/admin/AdminSidebar.tsx` | Off-canvas drawer + backdrop + close/Escape/route-close |
| `src/components/admin/AdminLayout.tsx` | Drawer state, `lg:ml-60`, responsive padding |
| `src/components/admin/AdminTopbar.tsx` | Hamburger trigger below lg |

---

## 20. Per-page banners — 4 images + text from the admin dashboard

The catalogue banners are now individually managed: **Admin → Banner Control** gains a
**Page Banners** section with one card per storefront page — **All Products, All
Categories, New Arrivals, Bestsellers** — each holding an image upload (JPG/PNG/WebP,
8 MB), a heading, a tagline and an Active toggle.

- **Backend**: new `page_banners` table (auto-created on deploy — new table, no
  migration), `GET /fronted/page-banners` (active only), `GET /admin/page-banners`,
  and `PUT /admin/page-banners/{page}` (multipart upsert; replaces/removes the stored
  file safely; page key validated).
- **Frontend**: `PageBanner` gains a `page` prop; the per-page banner's image **and
  text** override the defaults, falling back to the first hero slide's image and then
  the paisley band — so nothing breaks before the admin uploads anything. Fetched once
  per session and shared across pages.
- The four pages pass their slot keys (`products`, `categories`, `new_arrivals`,
  `best_sellers`).

| File | Change |
|---|---|
| `app/models/site_content.py` | New `PageBanner` model |
| `app/routers/site_content.py` | fronted/admin list + admin upsert endpoints |
| `src/components/PageBanner.tsx` | `page` prop + page-banner cache + text override |
| `src/pages/admin/AdminPageBanners.tsx` | New — the 4-card management section |
| `src/pages/admin/AdminBanners.tsx` | Mounts the Page Banners section |
| Products/Categories/NewArrivals/BestSellers pages | Pass their slot keys |

---

## 21. Order Detail page & Tax Invoice — implemented

Built from the approved mockups (`user_design/mockups/10-order-detail.html`,
`11-invoice-v2.html`). The page previously carried the old template look and an invoice
with green accents; both are now on the brand system, and the page renders inside the
site's NavBar/Footer chrome (the route had neither).

**Order view**
- **Espresso band**: breadcrumb, serif "Order #N", status pill and a
  "Placed {date} · N items · ₹total" meta line, closed by the 3px gold rule.
- **Toolbar**: back link plus Print / View Invoice (outline) and Download Invoice (maroon).
- **Order Journey card**: the gold four-step timeline (Placed → Processing → Shipped →
  Delivered) with per-step timestamps and a haloed active dot; latest tracking note and
  AWB below a hairline; a COD "due on delivery" chip in the header.
- **Items card**: 3:4 thumbnails, serif names, qty × price lines, line totals, subtotal row.
- **Tracking History card**: vertical timeline, gold dot on the newest update, keeps its
  expand/collapse toggle.
- **Sidebar**: Payment Summary (green coupon savings, gold-ruled serif maroon total,
  method/status chips, `PaymentBadges`), Delivery Address, an espresso **help strip** with
  a gold WhatsApp Support button, and the hairline-red Cancel Order button on its existing
  AlertDialog flow.

**Tax Invoice view**
- **Espresso letterhead** on the paper: ivory wordmark + address/GSTIN left; gold serif
  TAX INVOICE, number, "Original for recipient" and a payment chip right, over paisley.
- Ivory meta strip, Bill To / Ship To panels, espresso-headed items table with product
  thumbnails and SKU/HSN sublines, blush amount-in-words panel with the "You saved ₹X"
  line, gold-ruled grand total, and a footer with the gold ornament + "For Vastralaye ·
  Authorised signatory", serif thank-you and fine print.
- `no-print` / `print:` classes keep the site chrome and toolbar out of printed output.

All fetching, cancel/print/email/reorder handlers and status maps are unchanged; the file
type-checks with **zero** errors (down from its previous count) and the build passes.

| File | Change |
|---|---|
| `src/pages/OrderDetailPage.tsx` | Rebuilt order view + invoice view to the approved designs |

---

## 22. Invoice page (`/account/invoices/:orderId`) — A4 document redesign

The standalone invoice was the last page still wearing the old template: a **green
header**, green accent text and a footer advertising **`support@mizorpaymart.com`**.
Rebuilt from the approved mockup (`user_design/mockups/12-invoice-page.html`) as a proper
financial document:

- **Page chrome** — espresso band (breadcrumb, serif "Invoice {number}", gold payment
  pill, order/issued line) over a **sticky toolbar** (Back to order, Print, maroon
  Download PDF with its spinner) that stays reachable down a long invoice. The page moved
  out of the account shell into the storefront frame (NavBar + Footer) so it no longer
  stacked two espresso bands; it keeps its own auth guard.
- **A4 paper** — centered sheet with a drop shadow and a rotated **status watermark**
  (UNPAID red / PAID green at 5% opacity), espresso letterhead over paisley with the
  Vastralaye address, phone and **GSTIN**, gold "TAX INVOICE" and payment chip.
- **Three-panel row** (Bill to / Ship to / ivory Invoice details), a **9-column GST items
  table** (row no., thumbnail, item + SKU, HSN, qty, rate, taxable, GST, amount) with
  espresso header and zebra rows.
- **Lower block** — amount-in-words (reusing the existing `numberToWords`, and fixing its
  duplicated "Rupees Rupees" output), a **Payment details** box (method, status pills,
  transaction ID, paid-on), and totals closing on the gold-ruled serif maroon grand total
  plus an espresso **"Amount due on delivery"** band for unpaid/COD.
- **Notes & terms**, gold-ornament **"For Vastralaye · Authorised signatory"**, thank-you
  line, fine print, and a maroon→gold→terracotta edge bar.
- The printed document keeps **inline hex styling** throughout, because html2pdf/html2canvas
  cannot resolve Tailwind's CSS-variable colors; Tailwind is used only for the chrome,
  which is marked `no-print`.

Fetching (including the 404 order-fallback), 401 handling, `convertImagesToBase64`, the
html2pdf config, print, toasts and the invoice types are unchanged. File type-checks with
zero errors and the build passes.

| File | Change |
|---|---|
| `src/pages/InvoiceDetailPage.tsx` | Rebuilt to the A4 document design; old green/mizorpaymart branding removed |

---

## 23. Admin print invoice — merchant document redesign

`AdminOrder.tsx` builds its invoice as a **print-popup HTML template**, and it was the last
place carrying old-template artifacts: a `/logo.png` labelled *"MizorPayMart Logo"*, a
`support@mizorpaymart.com` footer, a *"MizorPay Mart"* generated-on line, emoji headings
(📋 📍 📦 📧 📱), Segoe UI, and a gray/green/amber palette half-migrated to brand colors.
Rebuilt from the approved mockup (`user_design/mockups/13-admin-invoice.html`):

- **Espresso action bar** (screen only): "Admin · Invoice for order #N" with a gold
  **Print / Save as PDF** button and an outline Close.
- **Branded letterhead**: wordmark, real Vastralaye address/email/phone/GSTIN, gold
  "TAX INVOICE", the serif order number and an **"Office copy"** chip — this is the
  merchant's copy, not the customer's.
- **Status strip**: three hairline-divided cells (order date + time, order status chip,
  payment status chip + method) replacing the three mismatched pastel boxes; chips are
  gold/green/red by state.
- **Bill to / Ship to** ivory panels with gold overline labels, no emoji.
- **Items table**: espresso header, product thumbnails, `HSN · SKU` subline (replacing the
  piped `HSN: x | SKU: y` string), zebra rows for long orders.
- **Totals**: subtotal, GST at the configured rate, shipping, gold-ruled serif maroon grand
  total, plus an espresso **"To collect on delivery"** band for unpaid, non-cancelled
  orders. Beside it, a new **amount-in-words** panel with item/unit counts.
- **Footer**: merchant line with GSTIN, queries line, generated timestamp, and the gold
  ornament + "For Vastralaye · Authorised signatory"; thank-you, fine print and the
  maroon→gold→terracotta edge bar.
- The popup now loads **Fraunces + Jost** from Google Fonts so printed sheets match the
  brand instead of falling back to Segoe UI, and print CSS drops the action bar, keeps
  headers repeating across pages and sets A4 margins.
- Fields absent from the admin payload (discount, place of supply, AWB) are simply not
  rendered rather than faked.

**Also fixed:** the file hard-coded `IMAGE_BASE_URL = "https://api.mizorpaymart.com"`
instead of importing `BASE_IMG`, so admin order/invoice product images stayed pinned to
that domain even on local or staging deploys. It now follows the app config.

| File | Change |
|---|---|
| `src/pages/admin/AdminOrder.tsx` | Print invoice template rebuilt; `amountInWords` helper added; image base now from config |

---

## 24. Checkout popup — boutique order slip

The cart's **Proceed to Checkout** popup (`PaymentMethodModal` in `CartPage.tsx`) was a
narrow `sm:max-w-lg` dialog where contact details, payment tiles, six read-only address
inputs, the item list, the totals and the buttons all stacked in one scrolling column —
so on most screens the total and **Place Order** sat well below the fold. Three
directions were mocked up (compact + sticky footer, boutique order slip, wizard with a
stepper); the **order slip** was chosen and built.

- **Two columns** (`md:grid-cols-[290px_1fr]`, 900px sheet, native dialog padding and
  close button removed via `p-0 gap-0 [&>button]:hidden`).
- **Espresso rail** on the left: `PAISLEY_TILE` at 8%, the wordmark with gold *laye*,
  *"Almost yours — woven by hand, wrapped with care."*, then each line item as a 34×45
  thumbnail with a gold quantity bubble, size · colour subline and gold line total. Below
  it subtotal / coupon / shipping and, under a 2px gold rule, the serif gold **grand
  total** with an *Inclusive of GST (18%)* note.
- **Form column** on the right: gold `Review & pay` overline, serif **Complete Your
  Order**, a bordered square close button, then two gold-ruled section labels.
  - *Deliver to* collapses the old contact block **and** the six locked address inputs
    into one ivory card: maroon initials avatar, name, full address · phone, email, and
    an **Edit** link to `/account/profile`. When no address is on file the card says so
    in sale red and the link becomes **Add** — previously the user only found out by
    pressing Place Order and getting a toast.
  - *Payment method* is a 2-up radio grid; COD carries a gold **Recommended** tag, the
    online tile carries UPI / VISA / MC / RuPay badges. Selected = maroon border +
    `ring-1` + blush fill.
  - A contextual note under the grid says what happens next (keep ₹total ready for the
    courier / UPI QR on desktop, UPI app on mobile).
  - The action block is `mt-auto`, so the maroon **Place Order · ₹total** (or **Pay
    ₹total**) bar and the Secure · 7-day returns · Cancel row always sit at the bottom of
    the sheet, aligned with the rail.
- **Mobile**: the grid stacks — rail first (tagline hidden, item list capped at 150px and
  scrollable so subtotal/total stay on the first screen), form below.
- The GST row was dropped from the rail: `total` is already GST-inclusive, so listing
  `subtotal + GST(18%)` above a total that equalled the subtotal read as broken
  arithmetic. It is now one note under the total. No tax calculation was changed.

`handlePlaceOrder`, the COD/online branches, the profile loader, the QR modal and every
validation rule are untouched — only the presentation layer was replaced.

| File | Change |
|---|---|
| `src/pages/CartPage.tsx` | `PaymentMethodModal` markup replaced with the order-slip layout; `paymentMethods` carry badges + `recommended`; module-level `getProductImageUrl` added (the in-component `getImageUrl` now delegates to it); imports `DialogClose` and `PAISLEY_TILE` |

Mockups: `user_design/mockups/14-checkout-modal.html` (chosen) plus the two alternates.
Screenshots `user_design/screenshots/14-checkout-modal{,-mobile}.png` are captures of the
built component, not the mockup.

---

## 25. Home hero background — admin-managed image + wash

The homepage hero (`HeroSection.tsx`, slides fed by Banner Control) briefly carried an
original illustrated artisan courtyard — a marigold toran, a pit handloom with a
weaver, a charkha, a rangoli — drawn in the same zari line art as the footer panorama.
It has been **replaced with a photograph the admin uploads**, because a real campaign
image is what the hero is for. The illustration lives on in history at commit
`42921b8` (`src/components/decor/HeroScene.tsx`) if it is ever wanted back.

The hero now reuses the page-banner machinery from §20 through a fifth slot,
**`home_hero`** — no new table, no new endpoints, and the same upload/overlay controls
as the catalogue bands:

- **Background image** — uploaded in Admin → Banner Control → *Homepage hero
  background*, drawn `object-cover` behind the whole section.
- **Overlay colour + strength** — the same left-to-right wash as the catalogue banners,
  so the copy side is tinted and the campaign-image side shows more photo.
- **Copy flips automatically.** The hero prints espresso copy on a light canvas, so
  `home_hero` defaults to an **ivory** wash at 90 rather than espresso at 95. If the
  admin picks a dark colour, `isLightColor()` (Rec. 709 luminance) flips the heading to
  ivory, the accent line to gold, the body copy to `ivory/80`, the outline button to
  ivory and the slide dots to `ivory/30` — so a dark wash can never swallow dark text.
- **No image = no change.** The section keeps its original blush → ivory → sand
  gradient and espresso copy, so the homepage looks exactly as before until something
  is uploaded.

The admin card for this slot drops the heading, tagline and full-width-artwork fields
(the hero's text comes from the slides above it) and previews the hero itself — overline,
serif headline, Shop-now button and the arch frame — at the current wash. Its colour
swatches lead with the light tints (ivory / blush / sand) instead of the dark ones.

| File | Change |
|---|---|
| `src/components/HeroSection.tsx` | Illustration removed; admin background image + wash; copy colours derived from the wash |
| `src/components/decor/HeroScene.tsx` | Deleted |
| `src/components/PageBanner.tsx` | `home_hero` key, exported `fetchPageBanners`, `overlayDefaults`, `isLightColor` |
| `src/pages/admin/AdminPageBanners.tsx` | Card extracted to `renderCard(slot, isHero)`; hero card with its own preview and presets |
| `app/routers/site_content.py` | `home_hero` page key + per-slot overlay defaults |

---

## 26. Page banners — full-width artwork mode

The page-banner slots from §20 assume a *photo*: the image is washed with an espresso
gradient and the page's heading, tagline and breadcrumb are painted over it. That's
wrong for a **ready-made banner** — artwork that already carries its own headline and
its own (often light) background. Uploading one gave a near-black left edge and two
competing headlines.

Each page-banner slot gains a **Full-width artwork** toggle:

- **On** — the image is shown whole, at its own aspect ratio, with no gradient and no
  heading over it. A slim espresso strip above it carries the breadcrumb, the gold rule
  still closes the band, and the heading is kept as an `sr-only` `<h1>` so the page
  still has a real heading for search engines and screen readers. The tagline is not
  rendered, and the admin field is disabled to say so.
- **Off** (default) — unchanged behaviour, so existing banners are unaffected.
- The mode only ever applies to a page's **own** upload, never to the shared hero-banner
  fallback — a hero photo inherited by a catalogue page still gets the wash it needs.
- Wide artwork shrinks below legibility on a phone (a 4:1 strip is ~100px tall at
  420px), so below `md` the image is cropped to its centre at a fixed 150px instead of
  scaling down; from `md` up it runs at full height.
- The admin preview switches to `object-contain` when the toggle is on, so the card
  shows what the storefront will show.

`full_bleed` is a new nullable boolean on `page_banners`; existing databases pick it up
through `schema_sync` at startup, so there's no migration to run.

### Overlay colour control

The wash over a banner photo was hard-coded `from-espresso/95 via-espresso/75
to-espresso/35`. It's now admin-controlled per page, in the same card:

- **Colour** — a native colour picker, a hex field, and five brand swatches (espresso,
  maroon, terracotta, deep gold, black). The hex field is free text, so the swatch,
  preview and gradient fall back to espresso while a partial value is being typed;
  the backend normalises `#abc` → `#AABBCC` and rejects anything that isn't hex.
- **Strength** — a 0–100 slider with a live percentage. The gradient keeps the original
  95 / 75 / 35 fall-off as a *ratio* (`peak`, `peak × 0.79`, `peak × 0.37`), so 95
  reproduces the previous espresso wash exactly and lower values thin the whole ramp
  evenly rather than flattening it.
- The colour is also the **band background** — behind a transparent image, and on the
  paisley fallback when no image is uploaded.
- The card's image area became a **live preview** of the storefront band: the wash, the
  breadcrumb, the serif heading and the gold ornament, all at the current settings. The
  controls hide under Full-width artwork, which draws no overlay.
- `hexToRgba` / `overlayGradient` / the defaults are exported from `PageBanner` so the
  admin preview and the storefront cannot drift apart.

`overlay_color` (`varchar(7)`) and `overlay_opacity` (`int`) are both nullable and fall
back to espresso / 95, so existing rows render exactly as before.

| File | Change |
|---|---|
| `app/models/site_content.py` | `PageBanner.full_bleed`, `.overlay_color`, `.overlay_opacity` |
| `app/routers/site_content.py` | New fields in the payload and multipart upsert; hex normalise/validate, opacity clamped 0–100 |
| `src/components/PageBanner.tsx` | Full-bleed branch, mobile centre-crop, `sr-only` heading, overlay colour/strength applied to wash + band, exported colour helpers |
| `src/pages/admin/AdminPageBanners.tsx` | Full-width toggle, colour picker + hex + swatches, strength slider, live band preview |

---

## 27. Add New Banner — every field optional

The hero-slide form in Admin → Banners refused to save unless **Title line 1** was
filled and an image was chosen, and the API enforced the same two (`Form(...)` /
`File(...)`). Both are now optional, on the client and the server.

- The only remaining check is that a *new* slide has **an image or some text** —
  overline, either title line, or the description. The CTA fields don't count towards
  it: they arrive pre-filled with "Shop Now" → `/products`, so counting them would have
  made the check unreachable, and a hero of nothing but a button isn't a slide.
- The `*` is gone from the Title line 1 label and the upload prompt now says
  *"(optional)"*.

The storefront had to learn to cope with the gaps:

- **No image** → the arch visual isn't rendered at all and the grid drops to a single
  column, instead of a broken `<img src="">`.
- **No title** → the `<h1>` is skipped rather than rendering empty; the `<br>` between
  the two title lines only appears when both exist; the image's `alt` is built from
  whichever lines exist.
- **No description** → the paragraph is skipped.
- The banner list in admin shows a *No image* placeholder and an italic *Untitled slide*
  where those are missing, and the delete confirmation falls back to `#id`.

**No migration.** `hero_banners.image_url` and `.title_line_1` are `NOT NULL`, so "not
set" is written as an **empty string** rather than NULL — which the storefront already
treats as absent. Relaxing the columns would have meant another `ALTER` on a live table
for no behavioural gain.

| File | Change |
|---|---|
| `app/routers/site_content.py` | `title_line_1` and `image_file` optional on create and update; missing values stored as `""` |
| `src/pages/admin/AdminBanners.tsx` | Required-field guards replaced with a single has-content check; label/prompt copy; list placeholders |
| `src/components/HeroSection.tsx` | Arch visual, `<h1>` and description each render only when present; single-column layout without an image |

---

## 28. Admin › Payment Integration + webhook audit

New page at `/admin/payments` (Sales → Payments) and a hardened webhook.

### The page

- **Gateway credentials** — Token ID, Secret Key, Base URL, Endpoint path, and a
  live/disabled toggle. Stored secrets come back **masked** (`••••••••a91f`); leaving a
  secret field blank keeps what's saved, so the form round-trips without re-typing them.
- **Webhook** — the exact URL to paste into the gateway dashboard, with a copy button;
  a **shared secret** field; and a **verify settled amount** switch.
- **Recent online payments** — the last 25 non-COD orders with merchant ref, txn id,
  status, total and paid amount, plus a red banner counting online orders that have **no
  merchant reference at all**.

Credentials now actually drive payments: `initiate-payment` resolves the active
credential row first and falls back to `.env`, so the page isn't decorative. The
module-level `raise ValueError` on missing `.env` keys is gone — it took the whole API
down at import rather than just the payment endpoint.

### Webhook findings

Audited `POST /api/v1/webhook`. What was wrong, and what changed:

| Finding | Severity | Status |
|---|---|---|
| No authentication — any caller who guesses a `merchant_ref` could mark an order **paid** | Critical | Opt-in shared secret added |
| `/webhook/test` was public and ran the real handler — a second unauthenticated way to mark orders paid | Critical | Now admin-only |
| Every request header logged at INFO, including the gateway's auth token; full body (customer PII) too | High | Redacted; both moved to DEBUG |
| Settled amount was written to the order with no check against the total | High | Mismatch always logged; blocking is opt-in |
| Unknown `txn_status` returned 400, so the gateway retried a payload that could never succeed | Medium | Returns 200 + `ignored` |
| No audit trail — `PaymentLog` and `create_or_update_payment_log` existed but nothing called them | Medium | Every webhook now writes a `payment_logs` row |

Both new controls default to **off** so live payments behave exactly as before; the page
explains what each one does and warns while the webhook is unauthenticated.

### Not fixed — the flow is broken upstream

`initiate-payment` generates a `merchant_ref`, sends it to the gateway and returns it to
the browser, but **never writes it to an order** — it has no `db` session and no cart
items, and nothing else sets `Order.merchant_ref`. The webhook matches on exactly that
column, so it 404s on every real callback: online payments can be taken and never
confirmed. Fixing it means creating the pending order at initiate time, which changes
checkout, so it is reported rather than done. The page surfaces the count.

| File | Change |
|---|---|
| `app/models/payment_gateway.py` | `webhook_secret`, `verify_amount` |
| `app/routers/payment_gateway.py` | New — admin GET/PUT credentials, GET payment logs |
| `app/routers/webhook.py` | Secret check, redacted logging, amount check, audit rows, admin-only test endpoint |
| `app/routers/user.py` | `resolve_gateway()`; DB credentials with `.env` fallback; no boot-time crash |
| `run.py`, `app/run.py` | Register the router |
| `src/pages/admin/AdminPayments.tsx` | New page |
| `src/App.tsx`, `src/components/admin/AdminSidebar.tsx` | Route + Sales → Payments |

---

## 29. Sign in with Google, switched from the admin dashboard

**Admin → Settings → Login Methods** (`/admin/login-methods`) holds a switch, the Google
**Client ID**, and a "let new customers sign up with Google" toggle. Turn it on and a
**Continue with Google** button appears above the email/password form on `/login`; turn
it off and the button disappears entirely. Password sign-in is never affected.

- **ID-token flow, so there is no client secret to store.** The browser gets a signed
  JWT from Google Identity Services and posts it to `POST /api/v1/users/auth/google`.
  The server validates it with Google and then checks it was issued *for us* —
  `aud` equals our client ID, `iss` is a Google issuer, `email_verified` is true.
  A valid Google token minted for a different app is rejected.
- **The button is Google's own**, rendered by GIS — their branding rules require the
  official mark, and it brings locale and accessibility with it. The script is loaded
  once, lazily, and only when the feature is on.
- **`enabled` is never advertised without a client ID**, so the button can't render and
  then fail on click; saving `enabled` with a blank ID is rejected, as is an ID that
  doesn't end in `.apps.googleusercontent.com`.
- **Account linking**: signing in with Google using an email that already has a password
  account links the two rather than creating a duplicate — same customer, one account,
  orders and wishlist intact.
- **Google-only accounts have no password.** `users.password` is now explicitly nullable,
  and the password login path returns *"This account uses Google sign-in"* instead of
  throwing when it finds a NULL hash.
- Settings live in `site_settings` under keys the public settings endpoint doesn't
  expose, so nothing leaks through `/fronted/settings`.

| File | Change |
|---|---|
| `app/models/user.py` | `password` nullable, `google_id`, `auth_provider` |
| `app/routers/google_auth.py` | New — public config, admin config, token verification, sign-in |
| `app/routers/user.py` | Password login guards against a NULL hash |
| `run.py`, `app/run.py` | Register the router |
| `src/components/auth/GoogleSignInButton.tsx` | New — config fetch, GIS loader, rendered button |
| `src/pages/LoginPage.tsx` | Button + "or" divider above the form |
| `src/contexts/StoreContext.tsx` | `loginWithGoogle()` |
| `src/pages/admin/AdminLoginMethods.tsx` | New admin page |
| `src/App.tsx`, `src/components/admin/AdminSidebar.tsx` | Route + Settings → Login Methods |

**Callback endpoint.** The popup flow never redirects, so nothing here needed a callback
URL — but Google Cloud Console has an *Authorised redirect URIs* field and leaving it
blank invites guessing. `POST /api/v1/users/auth/google/callback` now genuinely
implements the redirect (`login_uri`) flow: it validates Google's double-submit
`g_csrf_token`, verifies the credential through the same path as the popup, and hands
the session back to the storefront in the **URL fragment** — fragments never reach a
server and don't appear in referrers or access logs, unlike a query parameter. `GET` on
the same path returns a plain-text explanation instead of a bare 405. `GoogleSignInButton`
consumes `#google_token` / `#google_error` on mount and scrubs it from history. The
storefront origin the callback returns to is saved automatically when the admin page
saves, since that page is served from the storefront and knows it.

**Setup diagnostics.** Google returns *"Access blocked: Authorization Error"* before any
token reaches us, so the app can't catch it — the fix is always in Google Cloud Console.
The admin page therefore prints the **exact origin** to paste into *Authorised JavaScript
origins*, read live from `window.location.origin` rather than described in prose, **and**
the callback URL for *Authorised redirect URIs*, each with a copy button; warns when that origin is a LAN IP (never accepted) or plain `http` on a
non-loopback host (never accepted); and lists what each of Google's error codes —
`origin_mismatch`, `access_denied`, `invalid_client` — actually means.

---

## 30. Admin user stats — `User.is_active` crash

`GET /admin/users/stats` raised
`AttributeError: type object 'User' has no attribute 'is_active'` on every call — the
column is `active`, not `is_active`. The user-list filter twenty lines earlier already
used the right name, so the two had simply drifted.

Both now count on **`deleted_at`** rather than either boolean, because that is the column
that actually decides anything:

- login rejects on `user.deleted_at is not None`, not on `active`;
- `PUT /user/{id}/deactivate` sets `deleted_at` first and mirrors it into `active`;
- `deleted_at` has existed since the original schema, so it can't be NULL-ambiguous the
  way `active` can on rows that predate the boolean — `schema_sync` adds new columns as
  NULL, and `NULL == False` is NULL in SQL, so those rows would have vanished from *both*
  counts and the totals would not have reconciled.

`inactive` is therefore derived as `total - active` instead of being counted separately,
so the four numbers always add up. The list filter uses the same expression, so the stats
band and the table below it can no longer disagree.

Five more `User.is_active` references live in `app/routers/authenticate.py`, alongside
`User.contactNo`, `User.countryCode` and `User.is_deleted` — none of which exist on this
model. That file is leftover from a different project and is registered in neither
entrypoint, so it is dead code rather than a latent crash.

| File | Change |
|---|---|
| `app/routers/admin.py` | `get_users_stats` counts on `deleted_at`, derives `inactive`; list filter matched to it |

---

## 31. Admin › Users — edit and delete

The Users table could only view a customer and toggle them active. It now has **Edit**
and **Delete** on every row.

**Edit** opens a dialog over the row: name, email, phone, role, and the full address
block. `PUT /admin/user/{id}` applies it, refusing on:

- a malformed email, or one another account already uses (409);
- a role outside `user` / `admin`;
- removing **your own** admin rights, or those of the **last remaining** admin — either
  would lock everyone out of the dashboard.

The API's refusal text is what the toast shows, so the admin reads the actual reason
rather than a generic failure.

**Delete** is a permanent removal, and deliberately narrower than it looks.
`DELETE /admin/user/{id}` **refuses anyone who has orders or invoices** — that history is
accounting data and outlives the account — and answers with the count plus a pointer to
Deactivate instead. It also refuses self-deletion and the last admin. For everyone else
it clears the rows that would otherwise trip a foreign key (addresses, settings, cart,
wishlist, support messages, reviews and review replies, and password-reset tokens, which
key on email rather than `user_id`) before removing the account. The confirm dialog spells
out what goes and why order-holders can't be deleted.

`orders.user_id` is `NOT NULL` with no `ON DELETE`, so without that guard the first
delete of a real customer would have been a foreign-key 500 — or, worse, taken their
order history with it.

| File | Change |
|---|---|
| `app/routers/admin.py` | `AdminUserUpdate`, `PUT /user/{id}`, `DELETE /user/{id}`, `_count_admins` |
| `src/pages/admin/AdminUsers.tsx` | Edit + Delete row actions, edit dialog, delete confirmation |

---

## 32. Google sign-in — fetch phone & address from the Google profile

Optional, off by default, switched from **Admin → Settings → Login Methods**. With it on,
a customer who signs in with Google is asked for two extra scopes and their **blank**
phone/address fields are filled from their Google profile.

- **A second token, not the ID token.** The ID token that signs the customer in carries
  only email, name and picture — no contact details. The People API needs an OAuth
  *access* token, minted in the browser by `google.accounts.oauth2.initTokenClient`, so
  there is still no client secret and no server-side code exchange.
- **`GET people.googleapis.com/v1/people/me?personFields=addresses,phoneNumbers`** on the
  server, with our own JWT identifying which account to fill.
- **Blanks only.** Anything the customer has already typed wins — they entered it for a
  reason, and Google's copy is frequently stale. A whitespace-only value counts as blank;
  a blank value from Google is dropped rather than written.
- **Shape-tolerant.** Google returns lists, so the mapping prefers the `home` address and
  `mobile` number, falls back to whichever entry is marked primary, then to the first. When
  an address has no structured parts — common — the `formattedValue` blob goes into line 1
  rather than leaving the form empty.
- **Enrichment, never a gate.** A declined consent, a blocked popup, an unreachable
  People API or an empty Google profile all end in a quiet no-op. The customer is already
  signed in by then and nothing here can undo that.

The mapping lives in `app/services/google_profile.py` as pure functions — no HTTP, no
ORM — because Google's payload shapes vary enough to be worth testing directly.

**Expect partial results.** These are *sensitive* scopes: until Google verifies the app it
is capped at 100 users and shows a warning on the consent screen. And most people never
save an address to their Google profile, so the checkout form still has to work for
everyone. The admin toggle says both things where they'll be read.

| File | Change |
|---|---|
| `app/services/google_profile.py` | New — scopes, `pick_entry`, `profile_fields`, `fill_blanks` |
| `app/routers/google_auth.py` | `google_fetch_profile` setting; `POST /users/auth/google/profile`; public config exposes the scopes |
| `src/components/auth/GoogleSignInButton.tsx` | Requests the scopes after sign-in and posts the access token |
| `src/pages/admin/AdminLoginMethods.tsx` | Toggle + sensitive-scope warning |

---

## 33. Google avatars 404'd against the API

The backend log filled with:

```
GET /https%3A//lh3.googleusercontent.com/a/ACg8oc… HTTP/1.1  404 Not Found
```

`GET /users/get_profile` unconditionally prefixed the stored avatar with the API origin:

```python
user.avatar = f"{base_url}/{user.avatar.lstrip('/')}"
```

Fine for a locally uploaded `/static/avatars/u7.jpg`. But a Google sign-in stores the
absolute `https://lh3.googleusercontent.com/…`, which became
`http://api/https://lh3.googleusercontent.com/…` — the browser percent-encodes the `:` in
a path segment, and the request lands back on the API as `/https%3A//lh3…` → 404, and the
customer sees no profile picture.

**The line also mutated a live ORM object.** `user` comes from the session, so that
assignment was one autoflush away from writing the prefixed URL back to the database —
after which every subsequent read would prefix it again, compounding. The fix detaches
with `db.expunge(user)` before touching the field, so a display concern can't reach the
stored data at all.

The mirror of this existed on the frontend: `/users/me` returns the stored path
untouched, and `UserSidebar` used it directly as `src`. Google URLs worked there;
locally uploaded avatars resolved against the *storefront* origin and 404'd quietly.
Both surfaces now go through `mediaUrl()`, which also learned to pass `blob:` and
`data:` through — `ProfilePage` shows a `URL.createObjectURL` preview while picking a
new photo, and prefixing that would have broken it.

| File | Change |
|---|---|
| `app/routers/user.py` | `get_profile` leaves absolute URLs alone and expunges before mutating |
| `src/lib/media.ts` | `blob:` / `data:` pass through alongside `http(s):` |
| `src/components/user/UserSidebar.tsx`, `src/pages/user/ProfilePage.tsx` | Resolve avatars via `mediaUrl` |

---

## 34. Wishlist crashed on `normalize_images`

`GET /users/wishlist` raised `NameError: name 'normalize_images' is not defined` —
`app/crud/wishlist.py` called it but nothing in the codebase ever defined it. The whole
wishlist endpoint was dead.

Added `app/services/product_media.py::normalize_images` and imported it. It has to be
tolerant, because the `images` column holds more than one shape:

- `Product.images` is a hybrid property returning a **list**, but the same column is read
  as a raw **comma-separated string** elsewhere (the Excel import, some admin queries);
- rows written before that property existed still hold the raw string;
- and a stray `None` or empty segment in either shape shouldn't matter.

So it accepts list, tuple, string or `None`, strips blanks, and returns `[]` for anything
unexpected rather than raising — a product with odd image data should render without its
pictures, not 500 the whole wishlist.

**Worth knowing:** `admin.py` carries **three** copies of a local `to_list` closure doing
the same job. They're identical in behaviour to this helper and could collapse into it,
but that's three edits in a 2,000-line router for no behavioural change, so it's flagged
rather than done.

| File | Change |
|---|---|
| `app/services/product_media.py` | New — `normalize_images` |
| `app/crud/wishlist.py` | Import it |

---

## 35. Refreshing the homepage flashed the built-in banner

Every refresh painted the stock "Woven for the Festive Season" hero for a moment
before the admin's banner replaced it. The banner state started at the hard-coded
`fallbackSlides` and only became correct once `GET /fronted/banners` came back —
so the built-in set was always on screen first, for as long as that request took.

The obvious fix — start blank — swaps one problem for another: a white gap that
collapses the page and jumps when the real hero arrives. What's wanted is neither
default nor blank, but *the banner the admin set*, immediately.

So the last resolved banners are kept in `localStorage` and used to seed state on
mount. A refresh renders the admin's hero on the first paint; the fetch still runs
and quietly corrects it if anything changed. Stale-while-revalidate, deliberately
with **no TTL** — a cached copy is only ever on screen for the length of one
request, and a briefly-outdated banner beats a visible swap.

Three details that matter:

- **Only a genuine first-ever visit has nothing to show.** That case renders a
  hero-shaped skeleton in the brand gradient (`aria-busy="true"`) holding the exact
  same footprint — not the stock slides, which would flash, and not nothing, which
  would jump.
- **The fallback is cached too**, so a store with no banners configured also skips
  the placeholder on later visits.
- **A failed request is not.** If the API is down the stock set is shown but never
  written to the cache — a network error isn't evidence the store has no banners,
  and persisting it would reintroduce the exact flash on the next refresh.

The same seeding was applied to `fetchPageBanners`, so `/products`, `/categories`,
`/new-arrivals` and `/best-sellers` stop flashing their hard-coded titles as well.

The cache is versioned (`vastralaye:` prefix, `v: 1`); a shape change bumps the
version so old entries are ignored rather than misread, and every read/write is
wrapped — private mode, a full quota or hand-edited junk all degrade to a cold
cache, never an error.

| File | Change |
|---|---|
| `src/lib/persistentCache.ts` | New — versioned `readCache` / `writeCache` |
| `src/components/HeroSection.tsx` | Seed slides from cache; skeleton on cold start; don't cache error fallbacks |
| `src/components/PageBanner.tsx` | Seed `cachedPageBanners` from cache, revalidate once, write back |

---

## Verification

- `tsc --noEmit` — no errors in any changed file.
- `npm run build` — production build passes.
- Zero-regression paths: ≤1 reel → no arrows/previews anywhere; no reels and no product video → no sticky player; small catalogs render exactly as before.
- Checkout popup driven in a real browser against the production build (Playwright,
  desktop 1440×950 and mobile 420×900): Cancel / ✕ / Escape all close it, the tiles
  toggle the CTA between *Place Order · ₹total* and *Pay ₹total*, and Place Order posts
  `{items, payment_method:"cod", shipping_address}` and opens the success modal. No
  console or page errors.
- Banner refresh driven in a real browser against the production build, with
  `/fronted/banners` deliberately delayed 900ms so any flash is unmissable. Cold
  cache: skeleton → admin banner. Refresh: the admin banner and nothing else — no
  stock slides, no white gap, no swap. Degraded paths checked too: cold start with
  the API down still shows a hero and does *not* cache it, the admin banner returns
  once the API recovers, and a second outage keeps the cached admin banner rather
  than falling back to stock. `/categories` behaves the same — the hard-coded
  "All Categories" title never appears on a refresh. No console or page errors.
- Wishlist fix tested at both levels. `normalize_images` over ten shapes: hybrid list,
  raw string, padded string, empty, NULL, empty list, list with blanks and `None`, only
  separators, tuple, and an unexpected int — none raise. Then the real
  `get_user_wishlist` against a live session: a normal product returns both images, a
  NULL-images product returns `[]`, a legacy row holding `" x.jpg , , y.jpg "` returns
  `["x.jpg", "y.jpg"]`, and a wishlist row whose product was deleted returns
  `product: None` instead of crashing.
- Avatar resolution tested on both sides. Server branch over seven stored shapes: a
  Google URL passes through, a local path gains the API origin with or without a leading
  slash, and empty/None/whitespace all fall back to the default. `mediaUrl` over seven
  more: `http(s):`, `blob:` and `data:` untouched, stored paths prefixed, empty stays
  empty.
- Google profile fetch tested both halves. The mapping module against seven payload
  shapes: home/mobile beat work, typed values are never overwritten while blanks are
  still filled, an unstructured address falls back to `formattedValue`, an empty payload
  is a clean no-op, `primary` is the fallback when there's no `home`, a whitespace-only
  existing value counts as blank, and blank Google values are dropped. In a real browser
  with GIS stubbed: with the toggle on the correct scope string is requested and the
  access token posted; with it off neither happens. No console errors.
- Admin user edit/delete exercised twice over. Against a real SQLAlchemy session: users
  with orders (409), self-delete (400), last-admin (400), duplicate email (409),
  malformed email (400) and self-demotion (400) are all refused, a clean delete leaves
  zero orphan child rows and zero reset tokens, and plain field updates apply. In a real
  browser against the production build: both row actions render, the edit dialog
  prefills, `PUT` carries the changed name and role, `DELETE` hits the right URL, and a
  409 from the API surfaces its own message in the UI. No console errors.
- User stats queries exercised against a real SQLAlchemy session (4 fixture users, one
  soft-deleted, one admin, one Google-only): stats return
  `{total: 4, active: 3, inactive: 1, admins: 1}` and reconcile, the list filter returns
  3 and 1 for the two states, and `User.is_active` still raises — confirming the fix
  addressed a genuine missing attribute.
- Google sign-in driven against the production build with the config stubbed on and
  off: the button renders above the form with the "or" divider when on and is absent
  when off, the email/password form is unaffected either way, and neither state logs a
  console error. The admin page renders its switch, client-ID field, setup steps and
  account count.
- Banner form driven in a real browser against the production build: a fully untouched
  form is blocked with "Nothing to show yet" and sends no request; a title with no image
  posts successfully; the storefront renders no-image, title-only and image-only slides
  with zero broken images and no console errors.
- Home hero background driven against the production build at four settings — ivory 90,
  ivory 65, espresso 80 (copy correctly flips to ivory/gold) and no image (unchanged
  blush → sand gradient) — plus the admin hero card with its own preview and light-first
  swatches. No console or page errors.
- Full-width artwork mode driven end to end against the production build: `/categories`
  with a `full_bleed` banner renders the artwork whole with no wash and no painted
  heading, keeps the `sr-only` `<h1>`, and centre-crops below `md`; the admin card shows
  the toggle, the contained preview and the disabled tagline. No console or page errors.
- Overlay control driven against the production build at three settings — espresso 95
  (pixel-identical to the previous hard-coded wash), maroon 70 and black 40 — plus the
  admin card showing the picker, swatches, slider and live preview. No console or page
  errors.
