import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

#from app.config import DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:office123@localhost/e_new")
# DATABASE_URL = "mysql+pymysql://mizormart01:mizor0966@localhost/mizormart_schema"


#engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Checks connection before using it
    pool_size=10,  # Connection pool size
    max_overflow=20,  # Allows exceeding pool size temporarily
    echo=os.getenv("SQL_ECHO", "false").lower() == "true"  # Set SQL_ECHO=true for SQL logs during dev
)

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
