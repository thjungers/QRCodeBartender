from pydantic import BaseModel


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
