import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

#from app.config import DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:office123@localhost/e_new")
# DATABASE_URL = "mysql+pymysql://mizormart01:mizor0966@localhost/mizormart_schema"


# Pool options apply to server databases; SQLite (used for local testing)
# rejects them and needs check_same_thread instead.
_engine_kwargs: dict = {
    "echo": os.getenv("SQL_ECHO", "false").lower() == "true"  # Set SQL_ECHO=true for SQL logs during dev
}
if DATABASE_URL.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs.update(
        pool_pre_ping=True,  # Checks connection before using it
        pool_size=10,        # Connection pool size
        max_overflow=20,     # Allows exceeding pool size temporarily
    )

engine = create_engine(DATABASE_URL, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


#SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ✅ Create DB Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ Create tables on DB Init
def init_db():
    Base.metadata.create_all(bind=engine)
