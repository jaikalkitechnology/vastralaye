# Vastralaye — Admin Panel Redesign Plan (`admin_design.md`)

**Goal:** give the admin panel (`/admin/*` routes in `vastralaye_frontend_react`) a clean, data‑first workspace that *visually belongs* to the Vastralaye brand defined in [`design.md`](design.md) — without sacrificing density or speed. Storefront = editorial & festive; **admin = calm, precise, operational**, sharing the same palette and type family.

Visual mockups + screenshots of every admin page live in [`admin_design/`](admin_design/).

> 📌 Scope: visual/UX refactor of the React admin only. All existing admin functionality (auth, CRUD, analytics endpoints) stays exactly as it works today. No backend changes.

---

## 1. Design Principles

1. **Same brand, different register.** Reuse the storefront tokens (ivory, espresso, maroon, gold) but muted: big surfaces are neutral, brand colors appear only in the sidebar, active states, primary buttons and chart strokes.
2. **Density first.** 13–14px UI text, compact paddings, tables over cards for lists. Serif (Fraunces) appears in exactly two places: page titles and KPI numbers.
3. **One accent per screen region.** Maroon = primary action & active nav. Gold = highlights (deltas, active chart series, focus rings on dark). Everything else is neutral.
4. **Status is color‑coded and consistent** across every table and card (see §3.4).
5. **No decoration.** No block‑print patterns, no arches, no scallops in the admin — those are storefront motifs. The espresso sidebar is the only "brand moment".

---

## 2. Layout System

```
┌──────────┬────────────────────────────────────────────┐
│          │  Topbar: page title · search · +action ·   │
│ Sidebar  │  notifications · admin chip                │
│ (espresso├────────────────────────────────────────────┤
│  fixed   │  Content canvas (ivory #F7F4EF)            │
│  240px)  │  KPI rows · charts · tables · forms        │
│          │                                            │
└──────────┴────────────────────────────────────────────┘
```

- **Sidebar** (`AdminSidebar.tsx`): fixed 240px, espresso `#2B1B12`, ivory text. Brand logo top. Nav grouped by section labels (11px gold uppercase): *Overview* (Dashboard, Analytics), *Catalog* (Products, Categories, Coupons), *Sales* (Orders, Reviews), *Customers* (Users, Support). Active item: 3px gold left bar + `rgba(201,154,69,.12)` fill + gold text. Bottom block: "View store ↗", Settings, Logout, and the logged‑in admin chip.
- **Topbar** (new `AdminTopbar.tsx`): white, 64px, 1px bottom border. Left: page title (Fraunces 22px) + one‑line muted context. Right: global search (`⌘K` hint), page‑specific primary action (maroon button), notification bell with dot, avatar chip.
- **Content canvas**: `#F7F4EF` background, 28–32px padding, 12‑col grid with 20px gutters, max‑width ~1400px.
- **Mobile/tablet**: sidebar collapses to an icon rail (72px) at <1200px and a drawer at <768px; tables gain horizontal scroll; KPI row wraps 2×2.

---

## 3. Admin Design Tokens

Extends `design.md` §3 — same fonts (Fraunces + Jost), same base hues, plus workspace neutrals:

| Token | Value | Usage |
|---|---|---|
| `admin-canvas` | `#F7F4EF` | Content background |
| `surface` | `#FFFFFF` | Cards, tables, topbar |
| `sidebar` | `#2B1B12` (espresso) | Sidebar bg |
| `primary` | `#7A1F2B` (maroon) | Primary buttons, active states, chart series 1 |
| `gold` | `#C99A45` | Active nav, deltas, chart series 2, focus on dark |
| `ink` | `#2B1B12` | Headings, table text |
| `muted` | `#6E5F53` | Secondary text, labels |
| `border` | `#E7DFD3` | Card & table borders (1px, no shadows at rest) |
| `ok` | `#3E6B4F` | Success, Delivered, Active, positive deltas |
| `warn` | `#B07C1F` | Pending, In transit, Low stock |
| `err` | `#C62828` | Failed, Cancelled, negative deltas, destructive |
| `info` | `#5C6B8A` | Shipped, informational chips |

### 3.1 Type scale
Page title 22px Fraunces 500 · card titles 13px uppercase tracked Jost 600 · KPI numbers 28–30px Fraunces 500 · table text 13.5px · labels/chips 11–12px.

### 3.2 Cards & elevation
White, 1px `border`, radius 6px, padding 20–24px. Hover on interactive rows: `#FBF8F3`. Shadows only on popovers/drawers.

### 3.3 Buttons
`primary` maroon (11px uppercase tracked, radius 4px) · `outline` espresso border · `ghost` text; icon buttons 32px square. Destructive = `err` outline that fills on hover.

### 3.4 Status chips (shared component)
Pill, 11px, 600 weight, tinted bg at 12% of its color: **Delivered/Active/Paid** `ok` · **Pending/Low stock** `warn` · **Shipped/In transit** `info` · **Cancelled/Failed/Blocked** `err` · **Draft/Inactive** muted.

### 3.5 Charts (Recharts theme)
Single theme object consumed by every chart in `src/components/admin/charts/`:
- Series colors in order: maroon `#7A1F2B`, gold `#C99A45`, info `#5C6B8A`, ok `#3E6B4F`, terracotta `#B85C38`.
- Area fills = series color at 10–15% opacity; grid lines `#EFE7DB`; axis text 11px `muted`; tooltips = white card, 1px border, no shadow blur beyond 24px.
- Bars: radius 3px top, 60% band; active month/bar in gold.
- Donut: 62% inner radius, legend right with value + share.

---

## 4. Component Inventory (file‑by‑file flow)

| File | Changes |
|---|---|
| `src/components/admin/AdminLayout.tsx` | New shell: fixed sidebar + topbar + canvas grid (§2); collapse behavior; remove any leftover storefront chrome |
| `src/components/admin/AdminSidebar.tsx` | Espresso restyle, grouped nav, gold active bar, bottom admin chip + View store/Logout |
| **new** `src/components/admin/AdminTopbar.tsx` | Title/context, global search, per‑page primary action slot, bell, avatar |
| `src/components/admin/cards/StatsCard.tsx` | KPI tile: icon chip (12% tint), 11px uppercase label, Fraunces number, delta chip (▲ ok / ▼ err) + "vs last month", 40px sparkline |
| `src/components/admin/charts/*.tsx` (Monthly, Weekly, CategoryChart, CustomerChart, OrderTrendsChart, SalesVsOrdersChart) | Apply the §3.5 Recharts theme; titles become card headers with a range select (30d/90d/12m); **replace `data/mockAnalyticsData.ts` with the real admin endpoints** (`/api/v1/admin/analytics/monthly-orders`, `/analytics/daily-orders`, `/analytics/top-customers`, `/admin_stats`) via TanStack Query |
| **new** `ui` admin pieces | `StatusChip`, `DataTable` (sortable header, row hover, sticky header, right‑aligned numerics, actions column), `FilterTabs` (counts in tabs), `EmptyState`, `ConfirmDialog` (destructive = err) |
| `src/pages/admin/AdminDashboard.tsx` | Per §5.1 blueprint |
| `src/pages/admin/AdminOrder.tsx` | Filter tabs + table + drawer detail (§5.2) |
| `src/pages/admin/AdminProducts.tsx`, `AdminEditProductForm.tsx` | Toolbar (search, category filter, Import Excel `outline`, Add Product `primary`), table w/ thumbs & stock chips; form in right drawer with sticky Save |
| `src/pages/admin/AdminCategories.tsx` | Image cards grid + inline add panel |
| `src/pages/admin/AdminCoupons.tsx` | Table + create drawer; expired rows muted |
| `src/pages/admin/AdminUsers.tsx` | Table w/ avatar+name cell, role & status chips, activate/deactivate confirm |
| `src/pages/admin/CustomerReviews.tsx` | Moderation cards: stars, product ref, quote, reply box, approve/reply/delete |
| `src/pages/admin/AdminAnalytics.tsx` | 2×2 chart grid + top customers table (§5.4) |

---

## 5. Page Blueprints

*(Every page rendered as a screenshot in `admin_design/screenshots/`.)*

### 5.1 Dashboard — `01-dashboard.png`
1. KPI row ×4: Total Revenue, Orders, Customers, Avg. Order Value — each with delta + sparkline.
2. Row 2: **Revenue Overview** area chart (8 cols, range select) + **Orders by Category** donut (4 cols).
3. Row 3: **Recent Orders** table (6 rows: id, customer, items, total, payment, status, ⋯) + right column stack: **Top Products** (thumb, name, sold, revenue) and **Low Stock** alerts with restock links.

### 5.2 Orders — `02-orders.png`
Filter tabs with counts (All · Pending · Shipped · Delivered · Cancelled) · search + date range + export `outline` · full‑width table (order, customer, date, items, total, payment chip, status chip, actions) · pagination footer "Showing 1–10 of 1,284". Row click → right drawer with items, address, tracking timeline and status/payment‑status selects.

### 5.3 Products — `03-products.png`
Toolbar: search, category select, stock filter; actions: `Import Excel` (outline, existing `/products/upload-excel` flow) + `Add Product` (primary). Table: thumb+name, SKU, category, price/MRP, stock (number + Low‑stock chip when <10), flags (New/Bestseller mini‑badges), status, actions (edit/duplicate/delete).

### 5.4 Analytics — `04-analytics.png`
KPI strip (This month: revenue, orders, AOV, conversion) → 2×2 charts: Monthly Orders (bars, current month gold), Sales vs Orders (dual line), Weekly Performance (bars), Category Share (donut) → **Top Customers** table (rank, customer, city, orders, LTV).

### 5.5 Coupons — `05-coupons.png`
`Create Coupon` primary → table: code (mono chip), type/value, min order, usage (used/limit + tiny progress bar), validity, status (Active/Scheduled/Expired), actions.

### 5.6 Users — `06-users.png`
Search + role & status filters → table: avatar+name+email, phone, joined, orders, spent, role chip, status chip, Activate/Deactivate action. Deactivation uses `ConfirmDialog`.

### 5.7 Reviews — `07-reviews.png`
Summary tiles (avg rating, total, pending replies) → moderation list: each card = stars, product link, customer + date, review text, existing reply (if any) or reply textarea with `Post Reply` primary; approve/delete ghosts.

### 5.8 Categories — `08-categories.png`
`Add Category` primary → responsive grid of image cards (name, slug, product & subcategory counts, edit/delete) + "Import Excel" tile; subcategories listed as removable chips inside each card.

---

## 6. Interaction & Motion

- Everything loads with skeletons matching final geometry (no spinners inside cards).
- Row hover reveals the actions column; destructive actions always confirm.
- Drawers (order detail, product form, coupon create) slide from right, 380–520px, canvas dimmed 40%.
- Charts animate once on mount (300ms); no looping animation.
- Toasts bottom‑right, admin‑styled (white, 1px border, status color strip).

## 7. Implementation Flow

- **Phase A — shell** *(≈1 day)*: tokens file, `AdminLayout`, `AdminSidebar`, `AdminTopbar`, `StatusChip`, `DataTable`, `FilterTabs`. Every page instantly inherits the new frame.
- **Phase B — dashboard & analytics** *(≈1–1.5 days)*: `StatsCard`, Recharts theme, wire real endpoints (drop `mockAnalyticsData.ts`), dashboard + analytics blueprints.
- **Phase C — operational pages** *(≈2 days)*: Orders (tabs+drawer), Products (+form drawer), Categories, Coupons.
- **Phase D — people pages & polish** *(≈1 day)*: Users, Reviews, empty states, confirm dialogs, responsive rail/drawer, QA below.

**QA:** all data flows unchanged · AA contrast on chips/charts · 1280/1440/1680 layouts + icon‑rail at 1024 · no storefront motifs in admin · no hard‑coded hex outside the token file.
