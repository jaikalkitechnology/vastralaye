# Vastralaye — Full‑Stack E‑Commerce Platform

Vastralaye is a complete e‑commerce platform for fashion & lifestyle retail, built as a monorepo with a **FastAPI + MySQL** backend and a **React + TypeScript (Vite)** storefront & admin panel. It covers the full shopping journey — catalog browsing, cart, wishlist, coupons, checkout with online payments (Mizorpay / PhonePe), order tracking, GST‑style PDF invoices, transactional emails — plus a rich admin dashboard with analytics, product/category/coupon/order/user management and bulk Excel imports.

> **Note on branding:** parts of the codebase reference the deployment brands *Mizor / MizorPayMart / Jokroup* (API title, invoice header, default URLs). The repository itself is **Vastralaye**.

---

## Table of Contents

- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Features](#features)
  - [Customer Storefront](#customer-storefront)
  - [Customer Account](#customer-account)
  - [Payments, Invoices & Emails](#payments-invoices--emails)
  - [Admin Panel](#admin-panel)
  - [Platform & Backend](#platform--backend)
- [API Overview](#api-overview)
- [Frontend Routes](#frontend-routes)
- [Getting Started](#getting-started)
  - [Backend Setup](#1-backend-fastapi)
  - [Frontend Setup](#2-frontend-react--vite)
- [Configuration](#configuration)
- [Seeding Demo Data](#seeding-demo-data)
- [Deployment Notes](#deployment-notes)
- [Security & Production Checklist](#security--production-checklist)
- [Repository Notes](#repository-notes)

---

## Repository Structure

```
vastralaye/
├── vastralaye_backend/              # FastAPI backend (Python)
│   ├── run.py                       # Main API entrypoint (uvicorn, port 8000)
│   ├── requirements.txt             # Python dependencies
│   ├── seed.py                      # Demo users + reviews seeder
│   ├── upload_product.py            # Pushes product.xlsx to the bulk-import API
│   ├── upload_category.py           # Pushes category.xlsx to the bulk-import API
│   ├── product.xlsx / category.xlsx # Sample catalog data for bulk import
│   ├── static/                      # Runtime media (uploads, avatars, invoices, payment pages)
│   └── app/
│       ├── run.py                   # Alternate app entrypoint (older variant)
│       ├── database.py              # SQLAlchemy engine / session (MySQL via PyMySQL)
│       ├── authentication.py        # JWT creation & validation
│       ├── security.py              # Password hashing helpers
│       ├── mail.py                  # SMTP transactional email helpers
│       ├── models/                  # SQLAlchemy models (User, Product, Order, Invoice, …)
│       ├── schemas/                 # Pydantic request/response schemas
│       ├── crud/                    # Data-access layer
│       ├── routers/                 # API route modules (user, admin, products, phonepe, webhook, excel import, …)
│       ├── utilis/                  # Invoice PDF generator, email config & senders
│       └── static/products/         # Seed product images used by the Excel import
│
└── vastralaye_frontend_react/       # React storefront + admin panel (TypeScript)
    ├── vite.config.ts               # Dev server (port 8080) + /api proxy
    ├── src/
    │   ├── App.tsx                  # Route definitions
    │   ├── config.tsx               # API base URLs
    │   ├── api/                     # Axios API clients (user + admin)
    │   ├── auth/                    # Auth/token service
    │   ├── contexts/StoreContext.tsx# Global store (cart, wishlist, loading state)
    │   ├── components/              # NavBar, product grid/cards, filters, shadcn/ui, admin charts…
    │   └── pages/                   # Storefront, account, admin and policy pages
    └── public/                      # Logos, banners, favicon
```

## Tech Stack

**Backend**

| Area | Technology |
|---|---|
| Framework | FastAPI + Uvicorn (Starlette, Pydantic v2) |
| Database | MySQL with SQLAlchemy 2 ORM (PyMySQL driver, connection pooling) |
| Auth | JWT (`python-jose`), OAuth2 password flow for admin, `passlib` password hashing |
| Payments | Mizorpay payment gateway (initiate / callback / webhook) + PhonePe Checkout v2 (OAuth) |
| Emails | SMTP via `smtplib` / `aiosmtplib` / `fastapi-mail` (Gmail app-password & custom SMTP) |
| PDF | ReportLab — GST-style invoice generation |
| Data import | pandas — Excel (.xlsx) bulk import of products & categories |
| Media | Static file serving for product/category images, avatars, videos, product PDFs |

**Frontend**

| Area | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite (SWC) |
| UI | Tailwind CSS, shadcn/ui (Radix primitives), MUI, Lucide & React Icons, Framer Motion, Swiper/Embla carousels |
| State & data | TanStack React Query, React Context store, Redux, Axios |
| Forms & validation | React Hook Form + Zod |
| Charts | Recharts (admin analytics) |
| Extras | jsPDF / html2pdf / html2canvas (client-side invoice download), EmailJS (contact form), QR code generation, Sonner/Toastify notifications |

---

## Features

### Customer Storefront

- **Home page** with hero banners, category showcase, featured products, promo sections, new arrivals and best sellers.
- **Product catalog** — all products page, category & subcategory pages (SEO-friendly slugs), dedicated *New Arrivals* and *Best Sellers* listings, server-side pagination.
- **Search & filtering** — navbar product search plus a filter sidebar (category, price and attribute filters).
- **Product detail pages** — image galleries, pricing/discounts, stock info, and a full **ratings & reviews system** (star ratings, write/edit/delete reviews, threaded replies).
- **Wishlist** — add/remove products, persisted per user.
- **Shopping cart** — add to cart, update quantities, remove items, clear cart.
- **Coupons** — list active coupons and apply coupon codes for discounts at checkout.
- **Checkout** — shipping address capture, order creation and online payment, with an order confirmation page.
- **Order tracking** — per-order tracking timeline with live status updates, plus order cancellation.
- **Info & policy pages** — About, Contact (EmailJS-powered), FAQ, Privacy Policy, Terms & Conditions, Refund Policy, Returns & Exchanges, Shipping & Delivery Policy, Data Retention Policy.
- **UX niceties** — global loading overlay, toast notifications, scroll-to-top, responsive mobile-first layout, 404 page.

### Customer Account

- **Authentication** — sign up, login (JWT), change password, and **forgot/reset password** via emailed secure token.
- **Profile management** — edit personal details and upload a profile avatar (PNG/JPG validation).
- **Account settings** page and account deletion endpoint.
- **Order history** — list of past orders with detail pages.
- **Invoices** — invoice list & summary, invoice detail view, downloadable **PDF invoices** (server-generated and client-side export).
- **Support** — send support messages to the store team and receive email replies.

### Payments, Invoices & Emails

- **Mizorpay integration** — payment initiation from checkout, payment callback handling, and a dedicated **webhook endpoint** (`/api/v1/webhook`) with verbose logging that updates order payment status.
- **PhonePe Checkout v2** — OAuth token flow, payment link generation with expiry, and hosted payment pages (`payment.html`, `payment-success.html`, `payment-cancel.html`).
- **Invoice engine** — ReportLab-generated GST-style PDF invoices (company details, GSTIN, itemized totals) stored under `static/invoices/` with HTML fallback rendering.
- **Transactional emails** — password reset links, support replies and notifications via configurable SMTP senders.

### Admin Panel

- **Secure admin login** (OAuth2 token) with role-based access control.
- **Dashboard** — store-wide stats at a glance (orders, revenue, users, products).
- **Analytics** — monthly & daily order trends, weekly performance, sales vs orders comparison, category distribution and top customers — all charted with Recharts.
- **Product management** — create/edit/delete products with multi-image upload, mark **new arrivals** and **best sellers**, edit stock & pricing.
- **Category management** — categories and subcategories CRUD with images and slugs.
- **Bulk Excel import** — upload `product.xlsx` / `category.xlsx` through `/products/upload-excel` and `/categories/upload-excel` to mass-create the catalog (helper scripts included).
- **Order management** — order list & detail, update order status and payment status, delete orders.
- **User management** — user list with stats, activate/deactivate accounts.
- **Coupon management** — create/update/delete discount coupons.
- **Review moderation** — view customer reviews and post admin replies.
- **Support inbox** — read customer support messages and reply by email.

### Platform & Backend

- **REST API** documented automatically at `/docs` (Swagger UI) and `/redoc`.
- **JWT auth** with long-lived tokens (30 days) and role claims (`admin` / customer).
- **Auto schema creation** — SQLAlchemy models create tables on startup; a default admin account is bootstrapped on first run (see the `lifespan` hook in [`vastralaye_backend/run.py`](vastralaye_backend/run.py) — **change these credentials before deploying**).
- **CORS & session middleware** pre-configured for cross-origin frontend access.
- **Static media hosting** under `/static` (product images, category images, avatars, videos, product PDFs, invoices).
- **Seed tooling** — scripts to generate demo users, reviews and a full sample catalog with images.

---

## API Overview

| Prefix / Route | Purpose |
|---|---|
| `POST/GET /api/v1/users/*` | Customer APIs — auth (`/signUp`, `/login`, `/forgot-password`, `/reset-password`), profile & avatar, wishlist, cart, checkout, orders & tracking, reviews & replies, coupons (`/list`, `/apply`, `/coupons/active`), invoices, support, payment initiation & callback |
| `POST/GET /api/v1/admin/*` | Admin APIs — `/token` login, users & stats, category/subcategory CRUD, product CRUD (new-arrivals, best-sellers), coupons, orders (status / payment-status), analytics, dashboard stats, support inbox |
| `GET /api/v1/fronted/products/*` | Public storefront catalog — categories (with subcategories & slug lookup), products (list, paginated, detail), product reviews |
| `POST /api/v1/webhook` | Mizorpay payment webhook (updates order payment status) |
| `GET /generate-payment/{amount}`, `GET /get-token/{order_id}` | PhonePe checkout link generation & token retrieval |
| `GET /payment/{order_id}`, `/payment-success`, `/payment-cancel` | Hosted payment pages |
| `POST /products/upload-excel`, `POST /categories/upload-excel` | Bulk Excel catalog import |
| `GET /static/*` | Uploaded media & generated invoices |
| `GET /docs`, `GET /redoc` | Interactive API documentation |

## Frontend Routes

| Area | Routes |
|---|---|
| Storefront | `/`, `/products`, `/product/:id`, `/category/:slug`, `/categories`, `/new-arrivals`, `/best-sellers`, `/cart`, `/wishlist` |
| Auth | `/login`, `/register`, `/forgot-password`, `/reset-password` |
| Account | `/account/profile`, `/account/orders`, `/account/settings`, `/account/invoices`, `/account/invoices/:orderId` |
| Orders | `/orders/:orderId`, `/order-confirmation` |
| Admin | `/admin`, `/admin/users`, `/admin/products`, `/admin/categories`, `/admin/coupons`, `/admin/analytics`, `/admin/orders`, `/admin/reviews` |
| Info & policies | `/about`, `/contact-us`, `/privacy-policy`, `/terms-conditions`, `/refund-policy`, `/shipping-delivery-policy`, `/data-retention-policy` |

---

## Getting Started

### Prerequisites

- **Python** 3.11+ (with `pip`)
- **Node.js** 18+ (with `npm`)
- **MySQL** 8.x server running locally

### 1. Backend (FastAPI)

```bash
cd vastralaye_backend

# Create & activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Create the MySQL database and point the app at it. The connection string currently lives in [`app/database.py`](vastralaye_backend/app/database.py):

```sql
CREATE DATABASE e_new CHARACTER SET utf8mb4;
```

> Update `DATABASE_URL` in `app/database.py` to match your MySQL user/password/database (moving it to an environment variable is strongly recommended — see [Security](#security--production-checklist)).

Create a `.env` file (see [Configuration](#configuration)), then run the API:

```bash
python run.py
# API:      http://127.0.0.1:8000
# Swagger:  http://127.0.0.1:8000/docs
```

Tables are auto-created on first startup and a default admin user is bootstrapped (change its credentials in `run.py` before any real deployment).

### 2. Frontend (React + Vite)

```bash
cd vastralaye_frontend_react
npm install
npm run dev
# App: http://localhost:8080
```

**Pointing the frontend at your backend:** API base URLs are set in [`src/config.tsx`](vastralaye_frontend_react/src/config.tsx) (production URLs by default). For local development change them to your local API:

```ts
export const BASE_URL = 'http://127.0.0.1:8000/api/v1';
export const BASE_IMG = 'http://127.0.0.1:8000';
```

The Vite dev server also ships a `/api` proxy (see [`vite.config.ts`](vastralaye_frontend_react/vite.config.ts)) that rewrites `/api/*` → `<target>/api/v1/*`; update its `target` if you prefer proxying instead of direct URLs.

**Available scripts:** `npm run dev` (dev server), `npm run build` (production build), `npm run build:dev` (dev-mode build), `npm run preview` (preview build), `npm run lint` (ESLint).

---

## Configuration

Backend settings are read from environment variables (via `python-dotenv` — put them in `vastralaye_backend/.env` or export them in your shell). **Never commit real secrets.**

| Variable | Used by | Purpose |
|---|---|---|
| `SECRET_KEY` | `app/authentication.py`, `app/security.py` | JWT signing key (set a long random value) |
| `GMAIL_SENDER_EMAIL` | `app/mail.py` | SMTP sender address for transactional email |
| `GMAIL_APP_PASSWORD` | `app/mail.py` | Gmail app password for the sender account |
| `COMPANY_NAME` | `app/mail.py` | Brand name used in outgoing emails |
| `SUPPORT_EMAIL` | `app/mail.py` | Reply-to / support address in emails |
| `PAYMENT_BASE_URL` | `app/routers/user.py` | Mizorpay gateway base URL |
| `PAYMENT_TOKEN_ID` | `app/routers/user.py` | Mizorpay API token ID |
| `PAYMENT_SECRET_KEY` | `app/routers/user.py` | Mizorpay API secret |
| `MIZORPAY_TOKEN` / `MIZORPAY_KEY` | `app/test.py` | Credentials for the payment test script |

Some settings are still **hardcoded** and should be migrated to environment variables before production: the database URL (`app/database.py`), PhonePe `CLIENT_ID`/`CLIENT_SECRET` (`app/routers/phonepe.py`), and the SMTP account in `app/utilis/email_config.py`.

---

## Seeding Demo Data

1. **Default admin** — created automatically at API startup (see the `lifespan` hook in `run.py`).
2. **Catalog (products & categories)** — with the API running, load the sample Excel catalogs:
   ```bash
   cd vastralaye_backend
   # Edit API_URL inside these scripts to point at your server first
   python upload_category.py    # imports category.xlsx  → POST /categories/upload-excel
   python upload_product.py     # imports product.xlsx   → POST /products/upload-excel
   ```
   Seed product images live in `app/static/products/`.
3. **Demo users & reviews** — `seed.py` creates 100 sample Indian users and randomized product reviews (edit its `DATABASE_URL` first):
   ```bash
   python seed.py
   ```

---

## Deployment Notes

- Run the API with a production server, e.g. `gunicorn -k uvicorn.workers.UvicornWorker run:app` (or `uvicorn run:app --host 0.0.0.0 --port 8000`), behind Nginx/HTTPS.
- Build the frontend with `npm run build` and serve `dist/` from your web server or CDN; set `src/config.tsx` to your public API URL before building.
- Ensure the backend `static/` directory is writable — product images, category images, avatars, videos and generated invoice PDFs are stored there at runtime (persist it across deploys).
- Configure your payment gateway dashboard (Mizorpay webhook URL → `https://<api-domain>/api/v1/webhook`; PhonePe redirect/callback URLs) to match your domain.

## Security & Production Checklist

- [ ] **Rotate and remove committed secrets.** A `.env` file and hardcoded credentials (DB password, PhonePe client secret, SMTP password, payment tokens) exist in the source tree. Move them to environment variables, rotate every exposed credential, and untrack the file: `git rm --cached vastralaye_backend/app/.env` (git history will still contain old values — rotation is what actually revokes them).
- [ ] Change the **default admin credentials** bootstrapped in `run.py`.
- [ ] Set a strong `SECRET_KEY` — the JWT fallback default must not reach production.
- [ ] Restrict **CORS** (`allow_origins=["*"]` today) to your real frontend domains.
- [ ] Disable SQLAlchemy `echo=True` (SQL logging) in `app/database.py` for production.
- [ ] Serve everything over **HTTPS** and verify the payment webhook's authenticity/signature.
- [ ] Don't commit runtime uploads, logs or generated invoices — the repo `.gitignore` now excludes them going forward.

## Repository Notes

- **Two backend entrypoints exist:** [`vastralaye_backend/run.py`](vastralaye_backend/run.py) is the primary one (it also mounts the payment webhook); `vastralaye_backend/app/run.py` is an older variant kept for reference.
- **Inactive modules:** `app/routers/` contains extra routers carried over from a sibling project (astrologer consultations, chat, calls, live streaming, wallets, notifications, etc.). They are **not mounted** by either entrypoint and are not part of the running application.
- The frontend originated from a [Lovable](https://lovable.dev) template — see `vastralaye_frontend_react/README.md` for template-specific notes.
