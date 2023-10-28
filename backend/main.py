from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from yaml import safe_load

from . import crud, schemas
from .database import SessionLocal

app = FastAPI()
with open("menu.yaml", "r") as file:
    menu = safe_load(file.read())

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/menu/")
def get_menu():
    return menu

@app.get("/menu/{item_id}")
def get_menu_item(item_id: int):
    return [item for item in menu if item["id"] == item_id][0]

@app.get("/tables/", response_model=list[schemas.Table])
def get_tables(db: Session = Depends(get_db)):
    return crud.get_tables(db)




# from . import models
# from .database import Base, engine
# Base.metadata.create_all(engine)
