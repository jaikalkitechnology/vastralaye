import csv
import math
import io

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd

from app.database import get_db
from app.models import Category, SubCategory
from app.models.product import Product
from app.authentication import get_current_admin_user

# Every endpoint here writes to the catalogue, so the whole router sits
# behind the admin guard — these were open to anyone before.
router = APIRouter(
    prefix="/products",
    tags=["Products"],
    dependencies=[Depends(get_current_admin_user)],
)

@router.post("/upload-excel")
async def upload_products_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files allowed")

    try:
        df = pd.read_excel(file.file)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Excel file")

    required_columns = {"name", "price", "category_id"}
    if not required_columns.issubset(df.columns):
        return {
            "error": "Missing required columns",
            "required_columns": list(required_columns)
        }

    added = 0
    failed = []

    for index, row in df.iterrows():
        try:
            product = Product(
                name=str(row.get("name")),
                description=row.get("description"),
                details=row.get("details"),
                specifications=row.get("specifications"),
                highlights=row.get("highlights"),

                price=float(row.get("price")),
                discount_price=float(row["discount_price"]) if row.get("discount_price") is not None else None,

                category_id=int(row.get("category_id")),
                subcategory_id=int(row["subcategory_id"]) if row.get("subcategory_id") is not None else None,

                sizes=row.get("sizes"),
                colors=row.get("colors"),

                video_url=row.get("video_url"),  # now None, not NaN
                pdf_url=row.get("pdf_url"),  # now None, not NaN

                in_stock=bool(row.get("in_stock", True)),
                featured=bool(row.get("featured", False)),
                best_seller=bool(row.get("best_seller", False)),
                new_arrival=bool(row.get("new_arrival", False)),
                is_active=bool(row.get("is_active", True)),
            )

            # ✅ SET IMAGES SEPARATELY (hybrid property)
            images_value = row.get("images")
            if images_value:
                image_list = [
                    img.strip()
                    for img in str(images_value).replace("\n", ",").split(",")
                    if img.strip()
                ]

                normalized_images = []
                for img in image_list:
                    if img.startswith("/static/"):
                        normalized_images.append(img)
                    else:
                        normalized_images.append(f"/static/products/{img}")

                product.images = normalized_images

            # ✅ THIS WAS MISSING
            db.add(product)
            added += 1

        except Exception as e:
            failed.append({
                "row": index + 2,
                "error": str(e)
            })

    db.commit()

    return {
        "message": "Excel upload completed",
        "added": added,
        "failed": len(failed),
        "errors": failed
    }
def clean(value):
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    return value

@router.post("/products")
def upload_products(file: UploadFile = File(...), db: Session = Depends(get_db)):
    df = pd.read_excel(file.file)

    df.columns = df.columns.str.strip()

    for _, row in df.iterrows():

        category = db.query(Category).filter_by(
            slug=row["category_slug"]
        ).first()

        if not category:
            raise HTTPException(
                status_code=400,
                detail=f"Category not found: {row['category_slug']}"
            )

        subcategory = None
        if clean(row["subcategory_slug"]):
            subcategory = db.query(SubCategory).filter_by(
                slug=row["subcategory_slug"],
                category_id=category.id
            ).first()

        product = Product(
            name=str(row["name"]).strip(),
            description=clean(row["description"]),
            details=clean(row["details"]),
            specifications=clean(row["specifications"]),
            highlights=clean(row["highlights"]),
            price=float(row["price"]),
            discount_price=float(row["discount_price"]) if clean(row["discount_price"]) else None,
            category_id=category.id,
            subcategory_id=subcategory.id if subcategory else None,
            sizes=clean(row["sizes"]),
            colors=clean(row["colors"]),
            video_url=clean(row["video_url"]),   # 🔥 FIXED
            pdf_url=clean(row["pdf_url"]),       # 🔥 FIXED
            in_stock=bool(row["in_stock"]),
            featured=bool(row["featured"]),
            best_seller=bool(row["best_seller"]),
            new_arrival=bool(row["new_arrival"]),
            is_active=bool(row["is_active"])
        )

        db.add(product)

    db.commit()
    return {"status": "Products uploaded successfully"}

@router.post("/subcategories")
def upload_subcategories(file: UploadFile = File(...), db: Session = Depends(get_db)):
    df = pd.read_excel(file.file)

    # safety: strip column names
    df.columns = df.columns.str.strip()

    for _, row in df.iterrows():
        category_slug = str(row["category_slug"]).strip()
        name = str(row["name"]).strip()
        slug = str(row["slug"]).strip()

        category = db.query(Category).filter_by(slug=category_slug).first()
        if not category:
            continue

        if not db.query(SubCategory).filter_by(slug=slug).first():
            db.add(SubCategory(
                name=name,
                slug=slug,
                category_id=category.id
            ))

    db.commit()
    return {"status": "Subcategories uploaded successfully"}

@router.post("/categories")
def upload_categories(file: UploadFile = File(...), db: Session = Depends(get_db)):
    df = pd.read_excel(file.file)

    for _, row in df.iterrows():
        slug = str(row["slug"]).strip()
        name = str(row["name"]).strip()

        if not db.query(Category).filter_by(slug=slug).first():
            db.add(Category(
                name=name,
                slug=slug,
                image=""
            ))

    db.commit()
    return {"status": "Categories uploaded successfully"}


@router.post("/products/upload-hsn")
async def upload_hsn(file: UploadFile = File(...), db: Session = Depends(get_db)):

    contents = await file.read()

    csv_file = io.StringIO(contents.decode("utf-8-sig"))  # removes hidden BOM
    reader = csv.DictReader(csv_file)

    updated = 0

    for row in reader:
        row = {k.strip(): v.strip() for k, v in row.items()}  # clean spaces

        product_id = int(row["id"])
        hsn_code = row["HSN Code"]

        product = db.query(Product).filter(Product.id == product_id).first()

        if product:
            product.hsn_code = hsn_code
            updated += 1

    db.commit()

    return {"message": "HSN upload completed", "updated": updated}