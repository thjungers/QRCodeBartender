from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

menu_items_options_table = Table(
    "menu_items_m2m_options",
    Base.metadata,
    Column("menu_item_id", ForeignKey("menu_items.id")),
    Column("option_id", ForeignKey("options.id")),
)

menu_items_order_items_table = Table(
    "menu_items_m2m_order_items",
    Base.metadata,
    Column("menu_item_id", ForeignKey("menu_items.id")),
    Column("order_item_id", ForeignKey("order_items.id")),
)

class Table(Base):
    __tablename__ = "tables"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(unique=True)
    slug: Mapped[str] = mapped_column(unique=True, index=True)

    orders: Mapped[list["Order"]] = relationship(back_populates="table")

class MenuCategory(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(unique=True)
    slug: Mapped[str] = mapped_column(unique=True, index=True)

    items: Mapped[list["MenuItem"]] = relationship(back_populates="category")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str]
    description: Mapped[str]
    image: Mapped[str]

    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    
    category: Mapped["MenuCategory"] = relationship(back_populates="items")
    options: Mapped[list["Option"]] = relationship(secondary=menu_items_options_table, back_populates="menu_item")
    order_items: Mapped[list["OrderItem"]] = relationship(secondary=menu_items_order_items_table, back_populates="menu_item")

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_name: Mapped[str]
    started: Mapped[bool]
    served: Mapped[bool]

    table_id: Mapped[int] = mapped_column(ForeignKey("tables.id"))

    table: Mapped["Table"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    menu_item_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id")) # TODO this is a many-to-many

    order: Mapped["Order"] = relationship(back_populates="items")
    menu_item: Mapped[list["MenuItem"]] = relationship(secondary=menu_items_order_items_table, back_populates="order_items")
    options: Mapped[list["OrderOption"]] = relationship(back_populates="order_item")

class Option(Base):
    __tablename__ = "options"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str]
    slug: Mapped[str] = mapped_column(unique=True, index=True)
    type: Mapped[str]

    menu_item: Mapped[list["MenuItem"]] = relationship(secondary=menu_items_options_table, back_populates="options")
    order_options: Mapped[list["OrderOption"]] = relationship(back_populates="option")

class OrderOption(Base):
    __tablename__ = "order_options"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    value: Mapped[str]

    option_id: Mapped[int] = mapped_column(ForeignKey("options.id"))
    order_item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id"))

    option: Mapped["Option"] = relationship(back_populates="order_options")
    order_item: Mapped["OrderItem"] = relationship(back_populates="options")

