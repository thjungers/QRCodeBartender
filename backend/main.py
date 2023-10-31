from typing import Annotated
from uuid import UUID

from fastapi import Body, Depends, FastAPI, HTTPException, status, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, schemas
from .database import SessionLocal
from .seeding import seed_database
from .websockets import ws_endpoint, ws_manager

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

# Routes to open a websocket connection
@app.websocket("/ws/client/{user_id}/")
async def websocket_client_endpoint(websocket: WebSocket, user_id: UUID):
    await ws_endpoint(websocket, "client", user_id)

@app.websocket("/ws/admin/{user_id}/", dependencies=[Depends(secure)])
async def websocket_admin_endpoint(websocket: WebSocket, user_id: UUID):
    await ws_endpoint(websocket, "admin", user_id)

