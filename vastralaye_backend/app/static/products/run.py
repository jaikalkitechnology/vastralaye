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



# ---------------------- DB Setup ----------------------
Base.metadata.create_all(bind=engine)


# ---------------------- Lifespan: Startup Events ----------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    existing_admin = db.query(User).filter(User.email == "admin@jokroup.com").first()
    if not existing_admin:
        admin = User(
            first_name="Admin",
            last_name="User",
            email="admin@jokroup.com",
            password=get_password_hash("admin123"),
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


# ---------------------- Static Files ----------------------
STATIC_DIR = "/root/jokgroupfastapi/static"

PRODUCTS_DIR = os.path.join(STATIC_DIR, "products")
CATEGORIES_DIR = os.path.join(STATIC_DIR, "categories")

os.makedirs(PRODUCTS_DIR, exist_ok=True)
os.makedirs(CATEGORIES_DIR, exist_ok=True)

app.mount("static", StaticFiles(directory=STATIC_DIR), name="static")


# ---------------------- Middleware ----------------------
SECRET_KEY = os.urandom(24).hex()
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------- Routers ----------------------
app.include_router(user_router, prefix="", tags=["Users"])
app.include_router(admin_router, prefix="", tags=["Admin"])
app.include_router(fronted_router)
from app.routers import product_excel

app.include_router(product_excel.router)
from app.routers import category_excel

app.include_router(category_excel.router)

# ---------------------- Run the Server ----------------------
if __name__ == "__main__":
    uvicorn.run("run:app", host="0.0.0.0", port=8000, reload=True)
