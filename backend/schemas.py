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


class MenuCategoryBase(BaseModel):
    name: str

class MenuCategoryCreate(MenuCategoryBase):
    pass

class MenuCategory(MenuCategoryBase):
    id: int

    class Config:
        from_attributes = True


class MenuItemBase(BaseModel):
    name: str
    description: str
    category_id: int

    


# class TableDeep(TableBase):
#     id: int
#     orders: list["Order"]

