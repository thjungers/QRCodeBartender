from sqlalchemy.orm import Session, selectinload

from . import models, schemas

def get_menu(db: Session):
    return db.query(models.MenuItem).options(
        selectinload(models.MenuItem.category),
        selectinload(models.MenuItem.options)
    ).all()

def get_menu_item(menu_item_id: int, db: Session):
    return db.query(models.MenuItem).filter(models.MenuItem.id == menu_item_id).first()

def get_option_by_slug(option_slug: str, db: Session):
    return db.query(models.Option).filter(models.Option.slug == option_slug).first()

def create_order(order: schemas.OrderCreate, db: Session):
    order_db = models.Order(
        client_name=order.client_name,
        table=get_table_by_slug(order.table_slug, db),
        items=[
            models.OrderItem(
                menu_item=get_menu_item(item.menu_item_id, db),
                quantity=item.quantity,
                options=[
                    models.OrderOption(
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
    return db.query(models.Table).filter(models.Table.id == table_id).first()

def get_table_by_slug(table_slug: str, db: Session):
    return db.query(models.Table).filter(models.Table.slug == table_slug).first()

def get_tables(db: Session):
    return db.query(models.Table).all()