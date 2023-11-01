from sqlalchemy.orm import Session

from .schemas import models

from . import models as db_models

def get_menu(db: Session):
    return db.query(db_models.MenuItem).all()

def get_menu_item(menu_item_id: int, db: Session):
    return db.query(db_models.MenuItem).filter(db_models.MenuItem.id == menu_item_id).first()

def get_option_by_slug(option_slug: str, db: Session):
    return db.query(db_models.Option).filter(db_models.Option.slug == option_slug).first()

def get_orders(db: Session):
    return db.query(db_models.Order).all()

def create_order(order: models.OrderCreate, db: Session):
    order_db = db_models.Order(
        client_name=order.client_name,
        client_uuid=order.client_uuid,
        table=get_table_by_slug(order.table_slug, db),
        items=[
            db_models.OrderItem(
                menu_item=get_menu_item(item.menu_item_id, db),
                quantity=item.quantity,
                options=[
                    db_models.OrderOption(
                        value=option.value,
                        option=get_option_by_slug(option.option_slug, db)
                    )
                    for option in item.options
                ]
            )
            for item in order.items
        ]
    )
    db.add(order_db)
    db.commit()
    db.refresh(order_db)
    return order_db

def get_table_by_id(table_id: int, db: Session):
    return db.query(db_models.Table).filter(db_models.Table.id == table_id).first()

def get_table_by_slug(table_slug: str, db: Session):
    return db.query(db_models.Table).filter(db_models.Table.slug == table_slug).first()

def get_tables(db: Session):
    return db.query(db_models.Table).all()