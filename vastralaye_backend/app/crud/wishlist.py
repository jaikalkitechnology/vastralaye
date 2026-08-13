from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from app.services.product_media import normalize_images



# ✅ Get all wishlist items for a user
def get_user_wishlist(db: Session, user_id: int):
    wishlist_items = (
        db.query(models.WishlistItem)
        .filter(models.WishlistItem.user_id == user_id)
        .options(joinedload(models.WishlistItem.product))
        .all()
    )

    response_data = []

    for item in wishlist_items:
        product = item.product
        product_data = None

        if product:
            product_data = {
                "id": product.id,
                "name": product.name,
                "price": product.price,
                "discount_price": product.discount_price,
                "images": normalize_images(product.images),
            }

        response_data.append({
            "id": item.id,
            "product_id": item.product_id,
            "created_at": item.created_at,
            "product": product_data,
        })

    return response_data





# ✅ Add new item to wishlist
def add_to_wishlist(db: Session, user_id: int, wishlist: schemas.WishlistCreate):
    # Check if already exists to avoid duplicates
    existing = (
        db.query(models.WishlistItem)
        .filter(
            models.WishlistItem.user_id == user_id,
            models.WishlistItem.product_id == wishlist.product_id,
        )
        .first()
    )
    if existing:
        return existing

    db_item = models.WishlistItem(
        user_id=user_id,
        product_id=wishlist.product_id,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


# ✅ Remove item from wishlist
def remove_from_wishlist(db: Session, user_id: int, product_id: int):
    db_item = (
        db.query(models.WishlistItem)
        .filter(
            models.WishlistItem.user_id == user_id,
            models.WishlistItem.product_id == product_id,
        )
        .first()
    )

    if not db_item:
        return False

    db.delete(db_item)
    db.commit()
    return True
