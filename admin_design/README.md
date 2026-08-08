# Vastralaye — Admin Panel Design Mockups & Screenshots

Visual mockups of the admin panel redesign described in [`../admin_design.md`](../admin_design.md) — espresso sidebar with gold accents, warm ivory canvas, maroon primary actions, Fraunces page titles/KPI numbers with Jost UI text. Data-first: dense tables, status chips, KPI tiles and charts, no storefront decoration.

Fabric-toned blocks stand in for product/category imagery; all numbers are illustrative sample data.

## Screenshots (`screenshots/`)

| # | Page | Shows | File |
|---|---|---|---|
| 01 | Dashboard | KPI row w/ sparklines & deltas, revenue area chart, category donut, recent orders, top products, low-stock alerts | `01-dashboard.png` |
| 02 | Orders | Filter tabs with counts, search/date/payment filters, orders table with payment & status chips, pagination | `02-orders.png` |
| 03 | Products | Toolbar (search, filters, Import Excel, Add Product), table with thumbs, SKU, price/MRP, low-stock chips, flags | `03-products.png` |
| 04 | Analytics | Monthly-orders bars (current month gold), sales-vs-orders lines, weekly bars, category-share donut, top customers | `04-analytics.png` |
| 05 | Coupons | Summary tiles, coupon table with usage progress bars, Active/Scheduled/Expired states | `05-coupons.png` |
| 06 | Users | Customer table with avatars, role & status chips, activate/deactivate actions | `06-users.png` |
| 07 | Reviews | Rating summary tiles, moderation cards with reply box / posted-reply state | `07-reviews.png` |
| 08 | Categories | Image cards with slugs, subcategory chips, counts, add-category tile | `08-categories.png` |

## Mockup sources (`mockups/`)

- `styles.css` — the complete admin design system (tokens, sidebar/topbar, KPI tiles, charts, tables, chips, toolbars). Doubles as the styling reference when restyling the real React admin components.
- `pages/` — one body file per page; `build.py` wraps each with the shared sidebar + topbar shell into `mockups/dist/` (git-ignored):

```bash
cd admin_design/mockups
python3 build.py            # outputs dist/*.html — open in any browser
```

Regenerate screenshots (requires Playwright + Chromium):

```bash
playwright screenshot --full-page --viewport-size=1512,900 --wait-for-timeout=2200 \
  "file://$PWD/dist/dashboard.html" ../screenshots/01-dashboard.png
```
