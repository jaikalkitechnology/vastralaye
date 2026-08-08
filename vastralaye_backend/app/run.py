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
    title="Mizor API",
    description="Mizor — API Docs",
    version="1.0.0",
    lifespan=lifespan,
)

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


# ---------------------- Run the Server ----------------------
if __name__ == "__main__":
    uvicorn.run("run:app", host="0.0.0.0", port=8000, reload=True)