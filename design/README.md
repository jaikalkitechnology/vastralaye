# Vastralaye — Design Mockups & Screenshots

Visual mockups of the storefront redesign described in [`../design.md`](../design.md) — warm ivory canvas, maroon/terracotta/gold accents, Fraunces + Jost typography, arch (mehrab) motifs, inspired by suta.in and aachho.com (patterns and mood only; all content and imagery here is our own placeholder work).

Colored fabric-toned blocks stand in for product photography — swap in real photos per the asset checklist in `design.md` §9.

## Screenshots (`screenshots/`)

| # | Page | File |
|---|---|---|
| 01 | Homepage (hero, USP strip, arch categories, new arrivals, editorial banners, bestsellers, brand story, testimonials, Instagram, newsletter, footer) | `01-home.png` |
| 02 | Product listing (filters, active chips, sort, grid, load more) | `02-products.png` |
| 03 | Product detail (gallery, buy column, trust row, accordions, reviews, related) | `03-product-detail.png` |
| 04 | Shopping bag / cart (items + order summary, coupon) | `04-cart.png` |
| 05 | Wishlist | `05-wishlist.png` |
| 06 | Checkout (address, payment, order summary) | `06-checkout.png` |
| 07 | Order confirmation | `07-order-confirmation.png` |
| 08 | Sign in | `08-login.png` |
| 09 | Create account | `09-register.png` |
| 10 | Account — My Orders | `10-account-orders.png` |
| 11 | Homepage — mobile (390px) | `11-home-mobile.png` |

## Mockup sources (`mockups/`)

- `styles.css` — the full mockup design system (tokens, components, mobile rules). This doubles as the styling reference when implementing the real React components.
- `partials/` — shared header & footer markup.
- `pages/` — one body file per page.
- `build.py` — assembles standalone pages into `mockups/dist/` (git-ignored):

```bash
cd design/mockups
python3 build.py            # outputs dist/*.html — open in any browser
```

Regenerate screenshots (requires Playwright + Chromium):

```bash
playwright screenshot --full-page --viewport-size=1440,900 --wait-for-timeout=2200 \
  "file://$PWD/dist/home.html" ../screenshots/01-home.png
# mobile: --viewport-size=390,844
```
