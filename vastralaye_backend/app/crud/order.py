from sqlalchemy.orm import Session
from app.models import order as models
from app.schemas import order as schemas

def create_order(db: Session, order: schemas.OrderCreate):
    db_order = models.Order(user_id=order.user_id)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def add_tracking_update(db: Session, order_id: int, status: str, message: str):
    update = models.OrderTracking(order_id=order_id, status=status, message=message)
    db.add(update)

    # Also update main status in Order table
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if order:
        order.status = status

    db.commit()
    return update

def get_order_with_tracking(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()
