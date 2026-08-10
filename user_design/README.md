# user_design — Account & Auth Pages Redesign

Redesign of every page in `vastralaye_frontend_react/src/pages/user/` (plus the shared
account shell in `src/components/user/`) to the full Vastralaye editorial theme —
ivory canvas, espresso band, maroon/gold accents, Fraunces serif + Jost sans.

## Screenshots

| # | Page | Route | Image |
|---|------|-------|-------|
| 01 | Forgot Password | `/forgot-password` | [`screenshots/01-forgot-password.png`](screenshots/01-forgot-password.png) |
| 02 | Reset Password | `/reset-password` | [`screenshots/02-reset-password.png`](screenshots/02-reset-password.png) |
| 03 | My Profile | `/account/profile` | [`screenshots/03-profile.png`](screenshots/03-profile.png) |
| 04 | My Orders | `/account/orders` | [`screenshots/04-orders.png`](screenshots/04-orders.png) |
| 05 | Account Settings | `/account/settings` | [`screenshots/05-settings.png`](screenshots/05-settings.png) |
| 06 | Invoice | (invoice view) | [`screenshots/06-invoice.png`](screenshots/06-invoice.png) |
| 07 | Product Detail | `/product/:id` | [`screenshots/07-product-detail.png`](screenshots/07-product-detail.png) |
| 08 | All Categories | `/categories` | [`screenshots/08-all-categories.png`](screenshots/08-all-categories.png) |
| 09 | All Products | `/products` | [`screenshots/09-all-products.png`](screenshots/09-all-products.png) |
| 10 | Order Detail | `/orders/:orderId` | [`screenshots/10-order-detail.png`](screenshots/10-order-detail.png) |
| 11 | Tax Invoice v2 | (order invoice view) | [`screenshots/11-invoice-v2.png`](screenshots/11-invoice-v2.png) |
| 12 | Invoice Page | `/account/invoices/:orderId` | [`screenshots/12-invoice-page.png`](screenshots/12-invoice-page.png) |

Mockup sources live in [`mockups/`](mockups) — plain HTML + one shared stylesheet
(`styles.css`) using the design.md tokens. Open any `.html` in a browser to inspect.

## The design

### Shared account shell (Profile / Orders / Settings)
- **Espresso account band** under the navbar: breadcrumb (`Home · My Account`), serif
  greeting **"Namaste, {first name}"**, and a gold **Vastralaye Member** chip with the
  member-since line — closed by the site's 3px gold rule.
- **Identity sidebar**: white card opening with the avatar (gold ring), name and email;
  nav items keep the gold left-rail active state (maroon icon, ivory fill); Sign Out sits
  under a hairline in sale red. Sticky on desktop.
- Each page starts with a gold **overline** + serif page title row.

### My Profile
- **Identity card**: blush arch backdrop, 116px avatar with double ring (white + gold),
  serif name, email pill, gold ornament divider, then hairline fact rows
  (Phone / City / Member since).
- **Personal Information card**: fields grouped under gold overlines (**Contact**,
  **Address**), hairline-separated sections, locked email note with shield glyph, blush
  security strip at the bottom.

### My Orders
- **Stat band**: one white card split by hairlines into four cells (Total Orders, Total
  Spent, Active, Delivered) — icon + overline label + serif number.
- **Filter bar**: flat search + three selects on one row.
- **Order cards**: ivory header (serif order no · gold diamond · placed / total · status
  chips right), body (3:4 thumbnails, item summary, maroon **View Order** + outline
  **Invoice**), and a **status timeline** — Placed → Processing → Shipped → Delivered
  with gold-filled dots/bars up to the current step (halo on the active step); cancelled
  orders skip the timeline. Tracking note left, delivery address right.

### Account Settings
- **Security card** (2/3): three password fields, strength meter rebuilt as **four gold
  segments** with requirement dots, match hint, maroon submit.
- **Account Status** (1/3): Email Verified chip, serif member-since, **profile
  completeness** segments in a blush block.
- **Danger Zone**: restrained white card with hairline sale border and red header.

### Auth (Forgot / Reset Password)
- **Split stage**: left 44% espresso brand panel — inset gold frame, wordmark, serif
  tagline, gold-diamond benefit list, footer line; right ivory form panel — gold
  overline (**Account recovery**), serif question headline, themed fields, maroon
  submit, blush tips card, hairline back-to-login row. Panel hides on mobile.

### Invoice
- **Toolbar**: back link + Print / Share (outline) and Download PDF (maroon).
- **Branded paper**: wordmark + GSTIN block left, maroon serif **TAX INVOICE** + number +
  Paid chip right, double gold rule, meta row, ivory Bill To / Ship To panels, **espresso
  table header**, totals block closed by a 2px gold rule with the serif maroon grand
  total, blush amount-in-words strip, ornament + serif thank-you footer.

## Regenerating screenshots

Each mockup is static HTML — load `mockups/<page>.html` in any browser, or screenshot
with Playwright (viewport 1440×900, `fullPage: true`, `deviceScaleFactor: 1.5`) and save
to `screenshots/<page>.png`.
