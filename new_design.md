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

## Verification

- `tsc --noEmit` — no errors in any changed file.
- `npm run build` — production build passes.
- Zero-regression paths: ≤1 reel → no arrows/previews anywhere; no reels and no product video → no sticky player; small catalogs render exactly as before.
