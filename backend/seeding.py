from yaml import safe_load

from . import models
from .database import Base, engine


def seed_database(db):
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    with open("seed.yaml", "r") as file:
        seed_data = safe_load(file.read())

    categories = {
        category["slug"]: models.MenuCategory(**category)
        for category in seed_data["categories"]
    }
    options = {
        option["slug"]: models.Option(**option)
        for option in seed_data["options"]
    }
    tables = {
        table["slug"]: models.Table(**table)
        for table in seed_data["tables"]
    }
    menu_items = [
        models.MenuItem(**dict(
            menu_item, 
            category=categories[menu_item["category"]],
            options=[
                options[option]
                for option in menu_item.get("options", [])
            ]
        ))
        for menu_item in seed_data["menuItems"]
    ]

    db.add_all(
        list(categories.values())
        + list(options.values())
        + list(tables.values())
        + menu_items
    )
    db.commit()

    return True
