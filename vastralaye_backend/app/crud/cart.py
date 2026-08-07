from sqlalchemy.orm import Session, joinedload
from app.models import CartItem
from app.schemas.cart import CartItemCreate, CartItemUpdate


def get_cart_items(db: Session, user_id: int):
    """Return all cart items with product info."""
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == user_id)
        .options(joinedload(CartItem.product))  # ✅ eager load product
        .all()
    )

    result = []
    for item in cart_items:
        product = item.product

        # ✅ Convert product images into list
        images = []
        if product and product.images:
            images = [img.strip() for img in product.images.split(",") if img.strip()]

        # ✅ Build clean dictionary for frontend
        result.append({
            "id": item.id,
            "user_id": item.user_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "product_name": product.name if product else None,
            "price": product.price if product else None,
            "discount_price": product.discount_price if product else None,
            "images": images,
        })

    return result


def add_to_cart(db: Session, user_id: int, item: CartItemCreate):
    db_item = (
        db.query(CartItem)
        .filter(CartItem.user_id == user_id, CartItem.product_id == item.product_id)
        .first()
    )

    if db_item:
        db_item.quantity += item.quantity
    else:
        db_item = CartItem(
            user_id=user_id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_item)
    return db_item


def update_cart_item(db: Session, item_id: int, update: CartItemUpdate):
    db_item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if db_item:
        db_item.quantity = update.quantity
        db.commit()
        db.refresh(db_item)
    return db_item


def delete_cart_item(db: Session, item_id: int):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if item:
        db.delete(item)
        db.commit()


def clear_cart(db: Session, user_id: int):
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()
