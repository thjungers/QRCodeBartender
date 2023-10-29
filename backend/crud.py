from sqlalchemy.orm import Session, subqueryload

from . import models, schemas

def get_menu(db: Session):
    return db.query(models.MenuItem).options(
        subqueryload(models.MenuItem.category),
        subqueryload(models.MenuItem.options)
    ).all()

def get_table(db: Session, table_id: int):
    return db.query(models.Table).filter(models.Table.id == table_id).first()

def get_tables(db: Session):
    return db.query(models.Table).all()