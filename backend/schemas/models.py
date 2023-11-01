from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class Table(BaseModel):
    """A table that can make orders, read-only for now."""
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True


class MenuCategory(BaseModel):
    """A category in the menu, read-only for now."""
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True


class Option(BaseModel):
    """An option for items, read-only for now."""
    id: int
    name: str
    slug: str
    type: str

    class Config:
        from_attributes = True


class MenuItem(BaseModel):
    """An item on the menu, read-only for now."""
    id: int
    name: str
    description: str
    image: str
    available: bool
    category: MenuCategory
    options: list[Option]

    class Config:
        from_attributes = True

class MenuItemPatch(BaseModel):
    available: bool


class OrderOptionCreate(BaseModel):
    """An option for an item in an order to create."""
    option_slug: str
    value: str | bool

class OrderOption(BaseModel):
    """An option for an item in an order in the database."""
    id: int
    value: str | bool
    option: Option

class OrderOptionDeep(OrderOption):
    """An option for an item in an order in the database, with a reference to that item."""
    order_item: "OrderItem"


class OrderItemCreate(BaseModel):
    """An item in an order to create."""
    menu_item_id: int
    quantity: int = Field(gt=0)
    options: list[OrderOptionCreate]

class OrderItem(BaseModel):
    """An item in an order in the database."""
    id: int
    menu_item: MenuItem
    quantity: int
    options: list[OrderOption]

class OrderItemDeep(OrderItem):
    """An item in an order in the database, with a reference to that order."""
    order: "Order"


class OrderCreate(BaseModel):
    """An order to create."""
    client_name: str
    client_uuid: UUID
    table_slug: str
    items: list[OrderItemCreate]

class Order(BaseModel):
    """An order in the database."""
    id: int
    client_name: str
    client_uuid: UUID
    started: bool
    served: bool
    table: Table
    items: list[OrderItem]

class OrderPatch(BaseModel):
    started: bool | None = None
    served: bool | None = None

    @model_validator(mode="after")
    def check_one(self):
        if self.started is None and self.served is None:
            raise ValueError("at least one attribute is required")
        return self