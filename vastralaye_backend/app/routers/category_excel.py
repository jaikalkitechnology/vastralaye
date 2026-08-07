from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import re

from app.database import get_db
from app.models.category import Category

router = APIRouter(prefix="/categories", tags=["Categories"])


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


@router.post("/upload-excel")
async def upload_category_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files allowed")

    try:
        df = pd.read_excel(file.file)
        # 🔥 IMPORTANT: convert NaN → None
        df = df.where(pd.notnull(df), None)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Excel file")

    if "name" not in df.columns:
        return {"error": "Excel must contain 'name' column"}

    added = 0
    failed = []

    for index, row in df.iterrows():
        try:
            name = row["name"]
            if not name:
                raise Exception("Category name is required")

            slug = row["slug"] if row.get("slug") else slugify(name)

            # ❗ Prevent duplicate categories
            exists = db.query(Category).filter(Category.slug == slug).first()
            if exists:
                raise Exception("Category already exists")

            # ✅ NORMALIZE IMAGE PATH
            image_value = row.get("image")

            if image_value:
                if str(image_value).startswith("/static/"):
                    image_path = image_value
                else:
                    image_path = f"/static/categories/{image_value}"
            else:
                image_path = None

            category = Category(
                name=name,
                slug=slug,
                image=image_path
            )

            db.add(category)
            added += 1

        except Exception as e:
            failed.append({
                "row": index + 2,
                "error": str(e)
            })

    db.commit()

    return {
        "message": "Category Excel upload completed",
        "added": added,
        "failed": len(failed),
        "errors": failed
    }
