from uuid import UUID

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

menu_items_options_table = Table(
    "menu_items_m2m_options",
    Base.metadata,
    Column("menu_item_id", ForeignKey("menu_items.id")),
    Column("option_id", ForeignKey("options.id")),
)

class Table(Base):
    __tablename__ = "tables"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(unique=True)
    slug: Mapped[str] = mapped_column(unique=True, index=True)

    orders: Mapped[list["Order"]] = relationship(back_populates="table", lazy="selectin")

class MenuCategory(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(unique=True)
    slug: Mapped[str] = mapped_column(unique=True, index=True)

    items: Mapped[list["MenuItem"]] = relationship(back_populates="category", lazy="selectin")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str]
    description: Mapped[str]
    image: Mapped[str]
    available: Mapped[bool] = mapped_column(default=True)

    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    
    category: Mapped["MenuCategory"] = relationship(back_populates="items", lazy='selectin')
    options: Mapped[list["Option"]] = relationship(secondary=menu_items_options_table, back_populates="menu_item", lazy='selectin')
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="menu_item", lazy="selectin")

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_name: Mapped[str]
    client_uuid: Mapped[UUID]
    started: Mapped[bool] = mapped_column(default=False)
    served: Mapped[bool] = mapped_column(default=False)

    table_id: Mapped[int] = mapped_column(ForeignKey("tables.id"))

    table: Mapped["Table"] = relationship(back_populates="orders", lazy='selectin')
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", lazy='selectin')

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    quantity: Mapped[int]

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    menu_item_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id"))

    order: Mapped["Order"] = relationship(back_populates="items", lazy="selectin")
    menu_item: Mapped["MenuItem"] = relationship(back_populates="order_items", lazy='selectin')
    options: Mapped[list["OrderOption"]] = relationship(back_populates="order_item", lazy='selectin')

class Option(Base):
    __tablename__ = "options"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str]
    slug: Mapped[str] = mapped_column(unique=True, index=True)
    type: Mapped[str]

    menu_item: Mapped[list["MenuItem"]] = relationship(secondary=menu_items_options_table, back_populates="options", lazy="selectin")
    order_options: Mapped[list["OrderOption"]] = relationship(back_populates="option", lazy="selectin")

class OrderOption(Base):
    __tablename__ = "order_options"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    value: Mapped[str]

    option_id: Mapped[int] = mapped_column(ForeignKey("options.id"))
    order_item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id"))

    option: Mapped["Option"] = relationship(back_populates="order_options", lazy='selectin')
    order_item: Mapped["OrderItem"] = relationship(back_populates="options", lazy="selectin")

