from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, schemas
from .database import SessionLocal
from .seeding import seed_database

app = FastAPI()

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


@app.get("/seed/")
def seed_db(db: Session = Depends(get_db)):
    return seed_database(db)


@app.get("/menu/", response_model=list[schemas.MenuItem])
def get_menu(db: Session = Depends(get_db)):
    return crud.get_menu(db)

@app.post("/orders/", response_model=schemas.Order)
def get_menu(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(order, db)

@app.get("/tables/", response_model=list[schemas.Table])
def get_tables(db: Session = Depends(get_db)):
    return crud.get_tables(db)
