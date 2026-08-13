from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import os
import uvicorn

from app.database import init_db, engine, Base, SessionLocal
from app.crud.user import get_password_hash
from app.models import User

from app.routers.admin import router as admin_router
from app.routers.user import router as user_router
from app.routers.products import router as fronted_router
from app.routers import phonepe
# from app.routers.invoices import router as invoice_router  # ✅ NEW
from fastapi.responses import FileResponse


# ---------------------- DB Setup ----------------------
Base.metadata.create_all(bind=engine)

# Add any model columns missing from pre-existing tables (create_all
# only creates new tables — see app/schema_sync.py).
from app.schema_sync import sync_missing_columns  # noqa: E402
sync_missing_columns()


# ---------------------- Lifespan: Startup Events ----------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    existing_admin = db.query(User).filter(User.email == "mizorpay@gmail.com").first()
    if not existing_admin:
        admin = User(
            first_name="Admin",
            last_name="User",
            email="mizorpay@gmail.com",
            password=get_password_hash("Admin@123"),
            role="admin",
        )
        db.add(admin)
        db.commit()
    db.close()
    yield


# ---------------------- App Initialization ----------------------
app = FastAPI(
    title="Vastralaye API",
    description=(
        "Vastralaye — storefront and admin API.\n\n"
        "Handcrafted ethnic wear: catalogue, cart, orders, invoices, coupons, "
        "reels and site content.\n\n"
        "Payments are processed by the Mizorpay gateway, so gateway-owned field "
        "names (`mizor_pay_txn_id`, `merchant_ref`) appear verbatim in the payment "
        "and webhook payloads below."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------- Health ----------------------
@app.get("/", tags=["Health"])
def root():
    """Plain liveness check — also what a bare visit to the API host lands on."""
    return {
        "message": "Vastralaye api is running",
        "status": "ok",
        "version": app.version,
        "docs": "/docs",
    }


@app.get("/payment/{order_id}")
def payment_page(order_id: str):
    return FileResponse("static/payment.html")

@app.get("/payment-success")
def payment_success():
    return FileResponse("static/payment-success.html")

@app.get("/payment-cancel")
def payment_cancel():
    return FileResponse("static/payment-cancel.html")


# ---------------------- Static Files ----------------------
STATIC_DIR = "static"

PRODUCTS_DIR = os.path.join(STATIC_DIR, "products")
CATEGORIES_DIR = os.path.join(STATIC_DIR, "categories")
INVOICES_DIR = os.path.join(STATIC_DIR, "invoices")  # ✅ NEW

os.makedirs(PRODUCTS_DIR, exist_ok=True)
os.makedirs(CATEGORIES_DIR, exist_ok=True)
os.makedirs(INVOICES_DIR, exist_ok=True)  # ✅ NEW

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ---------------------- Middleware ----------------------
SECRET_KEY = os.urandom(24).hex()
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ALLOW_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------- Unhandled-error handler ----------------------
# Unhandled exceptions are turned into 500 responses OUTSIDE the
# middleware stack, so they normally reach the browser without CORS
# headers and show up as a misleading "blocked by CORS policy" error.
# This handler logs the traceback and returns a JSON 500 that echoes
# the request Origin, so the real error is visible in the frontend.
from fastapi import Request  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
import logging as _logging  # noqa: E402

_app_logger = _logging.getLogger("app")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    _app_logger.exception(
        "Unhandled error on %s %s: %s", request.method, request.url.path, exc
    )
    headers = {}
    origin = request.headers.get("origin")
    if origin:
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        }
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}: {exc}"},
        headers=headers,
    )


# ---------------------- Routers ----------------------
app.include_router(user_router, prefix="", tags=["Users"])
app.include_router(admin_router, prefix="", tags=["Admin"])
app.include_router(fronted_router)
app.include_router(phonepe.router)

# ✅ Invoice Router
# app.include_router(
#     invoice_router,
#     prefix="/api/v1/users/user",
#     tags=["Invoices"],
# )

from app.routers import product_excel
app.include_router(product_excel.router)

from app.routers import category_excel
app.include_router(category_excel.router)

from app.routers import reels
app.include_router(reels.router)

from app.routers import newsletter
app.include_router(newsletter.router)

from app.routers import site_content
from app.routers import payment_gateway
from app.routers import google_auth
app.include_router(payment_gateway.router)   # ✅ admin payment integration
app.include_router(google_auth.router)   # ✅ Sign in with Google
app.include_router(site_content.router)


# ---------------------- Run the Server ----------------------
if __name__ == "__main__":
    uvicorn.run("run:app", host="0.0.0.0", port=8000, reload=True)