from sqlalchemy.orm import Session, joinedload
from app import models
from app.schemas import category as category_schema

# --- CATEGORY CRUD FUNCTIONS ---

def get_category_by_name(db: Session, name: str):
    return db.query(models.Category).filter(models.Category.name == name).first()

def create_category(db: Session, category: category_schema.CategoryCreate):
    db_category = models.Category(name=category.name, slug=category.slug)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Category)
        .options(joinedload(models.Category.subcategories))  # ✅ load subcategories
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_categories_with_count(db: Session, skip: int = 0, limit: int = 10):
    total = db.query(models.Category).count()
    categories = db.query(models.Category).offset(skip).limit(limit).all()
    return categories, total
def get_category(db: Session, category_id: int):
    return db.query(models.Category).filter(models.Category.id == category_id).first()

def update_category(db: Session, category_id: int, category: category_schema.CategoryCreate):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if db_category:
        db_category.name = category.name
        db_category.slug = category.slug
        db.commit()
        db.refresh(db_category)
        return db_category
    return None

def delete_category(db: Session, category_id: int):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if db_category:
        db.delete(db_category)
        db.commit()
        return db_category
    return None

# --- SUBCATEGORY CRUD FUNCTIONS ---

def create_subcategory(db: Session, subcategory: category_schema.SubCategoryCreate):
    # Find category by name
    category = db.query(models.Category).filter(models.Category.name == subcategory.category_name).first()
    if not category:
        raise ValueError("Category not found")

    db_subcategory = models.SubCategory(
        name=subcategory.name,
        slug=subcategory.slug,
        category_id=category.id
    )
    db.add(db_subcategory)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory


def get_subcategories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.SubCategory).offset(skip).limit(limit).all()

def get_subcategory(db: Session, subcategory_id: int):
    return db.query(models.SubCategory).filter(models.SubCategory.id == subcategory_id).first()

def update_subcategory(db: Session, subcategory_id: int, subcategory: category_schema.SubCategoryCreate):
    db_subcategory = db.query(models.SubCategory).filter(models.SubCategory.id == subcategory_id).first()
    if not db_subcategory:
        return None

    # Find category by name
    category = db.query(models.Category).filter(models.Category.name == subcategory.category_name).first()
    if not category:
        raise ValueError("Category not found")

    db_subcategory.name = subcategory.name
    db_subcategory.slug = subcategory.slug
    db_subcategory.category_id = category.id
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory

def delete_subcategory(db: Session, subcategory_id: int):
    db_subcategory = db.query(models.SubCategory).filter(models.SubCategory.id == subcategory_id).first()
    if db_subcategory:
        db.delete(db_subcategory)
        db.commit()
        return db_subcategory
    return None
