# app/main.py

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
import os
import uvicorn

from app.database import init_db, engine, Base, SessionLocal
from app.crud.user import get_password_hash
from app.models import User

from app.routers.admin import router as admin_router
from app.routers.user import router as user_router
from app.routers.products import router as fronted_router
from app.routers import phonepe
from app.routers.webhook import router as payment_webhook
from app.routers import product_excel
from app.routers import category_excel
from app.routers import reels

from fastapi.responses import FileResponse

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
    title="Mizor API",
    description="Mizor — API Docs",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------- Page Routes ----------------------
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

os.makedirs(os.path.join(STATIC_DIR, "products"),   exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "categories"), exist_ok=True)
os.makedirs(os.path.join(STATIC_DIR, "invoices"),   exist_ok=True)

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


# ---------------------- Routers ----------------------
app.include_router(admin_router,     prefix="", tags=["Admin"])
app.include_router(user_router,      prefix="", tags=["Users"])
app.include_router(fronted_router)
app.include_router(phonepe.router)
app.include_router(payment_webhook)   # ✅ /api/v1/webhook
app.include_router(product_excel.router)
app.include_router(category_excel.router)
app.include_router(reels.router)   # ✅ shoppable product reels

from app.routers import newsletter
app.include_router(newsletter.router)   # ✅ newsletter signups


# ---------------------- Run the Server ----------------------
if __name__ == "__main__":
    uvicorn.run("run:app", host="127.0.0.1", port=8000, reload=True)