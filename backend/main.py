import secrets
from typing import Annotated
from uuid import UUID

from fastapi import Body, Depends, FastAPI, HTTPException, status, WebSocket, WebSocketException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session

from .schemas import events, models

from . import crud
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

ws_tokens = {}

# Dependency to open a database session
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to authenticate with HTTP Basic Auth
security = HTTPBasic()
def secure(credentials: Annotated[HTTPBasicCredentials, Depends(security)]) -> None:
    if not (credentials.username == "admin" and credentials.password == "admin"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"}
        )
    

@app.get("/seed/", dependencies=[Depends(secure)])
def seed_db(db: Session = Depends(get_db)):
    return seed_database(db)

@app.get("/auth/", dependencies=[Depends(secure)])
def check_authentication_credentials():
    pass


@app.get("/menu/", response_model=list[models.MenuItem])
def get_menu(db: Session = Depends(get_db)):
    return crud.get_menu(db)

@app.patch("/menu/{menu_item_id}/", response_model=models.MenuItem, dependencies=[Depends(secure)])
async def update_menu_item(menu_item_id: int, menu_item_patch: models.MenuItemPatch, db: Session = Depends(get_db)):
    # Update the menu item in the database
    new_menu_item = crud.update_menu_item(menu_item_id, menu_item_patch, db)

    # And send an event through the WebSocket to notify the update
    event = events.MenuItemAvailabilityEvent(
        detail=events.MenuItemAvailabilityEventDetail(
            item_id=menu_item_id, 
            available=menu_item_patch.available
        )
    )
    await ws_manager.broadcast(event.model_dump())

    return new_menu_item


@app.get("/client-orders/", response_model=list[models.Order])
def get_client_orders(client_id: UUID, db: Session = Depends(get_db)):
    return crud.get_orders(db, client_id)

@app.get("/orders/", response_model=list[models.Order], dependencies=[Depends(secure)])
def get_orders(db: Session = Depends(get_db)):
    return crud.get_orders(db)

@app.post("/orders/", response_model=models.Order)
async def create_order(order: models.OrderCreate, db: Session = Depends(get_db)):
    # Create the order in the database
    new_order = crud.create_order(order, db)

    # And send an event through the WebSocket to notify the admin dashboard
    event = events.NewOrderEvent(
        detail=events.NewOrderEventDetail(
            order=models.Order.model_validate(new_order)
        )
    )
    await ws_manager.broadcast(event.model_dump(), "admin")

    return new_order

@app.patch("/orders/{order_id}/", response_model=models.Order, dependencies=[Depends(secure)])
async def update_order(order_id: int, order_patch: models.OrderPatch, db: Session = Depends(get_db)):
    # Update the order in the database
    new_order = crud.update_order(order_id, order_patch, db)

    # And send an event through the WebSocket to notify the update
    if order_patch.started is not None:
        event = events.OrderStartedEvent(
            detail=events.OrderStartedEventDetail(
                order_id=order_id,
                started=order_patch.started
            )
        )
    elif order_patch.served is not None:
        event = events.OrderServedEvent(
            detail=events.OrderServedEventDetail(
                order_id=order_id,
                served=order_patch.served
            )
        )
    else:
        raise ValueError("order_patch must contain started or served.")
    
    # Broadcast this event to admins
    await ws_manager.broadcast(event.model_dump(), "admin")
    # And send it to the client who made the order
    await ws_manager.send_message(event.model_dump(), new_order.client_uuid)

    return new_order


@app.get("/tables/", response_model=list[models.Table])
def get_tables(db: Session = Depends(get_db)):
    return crud.get_tables(db)

# Routes to open a websocket connection
@app.get("/ws-auth/{user_id}", dependencies=[Depends(secure)])
def get_authentication_token_for_websocket(user_id: UUID):
    token = secrets.token_urlsafe()
    ws_tokens[user_id] = token
    return {"token": token}

@app.websocket("/ws/client/{user_id}/")
async def websocket_client_endpoint(websocket: WebSocket, user_id: UUID):
    await ws_endpoint(websocket, "client", user_id)

@app.websocket("/ws/admin/{user_id}/")
async def websocket_admin_endpoint(websocket: WebSocket, user_id: UUID, token: str):
    # Check the token before accepting the connection
    if ws_tokens[user_id] != token:
        raise WebSocketException(code=status.WS_1006_ABNORMAL_CLOSURE, reason="Authentication error: GET a valid token from /ws-auth/")

    await ws_endpoint(websocket, "admin", user_id)
