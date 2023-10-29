from pydantic import BaseModel


class TableBase(BaseModel):
    name: str
    slug: str

class TableCreate(TableBase):
    pass

class Table(TableBase):
    id: int

    class Config:
        from_attributes = True


class MenuCategory(BaseModel):
    """Category in the menu, read-only for now."""
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True


class Option(BaseModel):
    """Option for items, read-only for now."""
    id: int
    name: str
    slug: str
    type: str

    class Config:
        from_attributes = True


class MenuItem(BaseModel):
    """Item on the menu, read-only for now."""
    id: int
    name: str
    description: str
    image: str
    available: bool
    category: MenuCategory
    options: list[Option]

    class Config:
        from_attributes = True



# class TableDeep(TableBase):
#     id: int
#     orders: list["Order"]

