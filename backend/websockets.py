from uuid import UUID

from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class WebSocketConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[UUID, list[WebSocket]] = {}
        self.user_types: dict[UUID, str] = {}

    async def connect(self, websocket: WebSocket, user_type: str, user_id: UUID) -> None:
        await websocket.accept()

        logger.info(f"WebSocket connected for user {user_type}:{user_id}")

        if user_id not in self.user_types:
            self.user_types[user_id] = user_type
            self.active_connections[user_id] = []

        if self.user_types[user_id] != user_type:
            raise ValueError("Trying to register a new user with a UUID already registered for a different user type")
        
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: UUID) -> None:
        self.active_connections[user_id].remove(websocket)
        logger.info(f"WebSocker for user {self.user_types[user_id]}:{user_id} disconnected")
    
    async def send_message(self, message, user_id: UUID) -> None:
        try:
            for websocket in self.active_connections[user_id]:
                logger.info(f"Sending message to user {self.user_types[user_id]}:{user_id}")
                try:
                    await websocket.send_json(message)
                except WebSocketDisconnect:
                    self.disconnect(websocket, user_id)
        except KeyError:
            # The client has not connected since the server started
            pass
    
    async def broadcast(self, message, user_type: str | None = None) -> None:
        websockets: list[WebSocket] = []
        for user_id in self.user_types:
            if user_type is None or self.user_types[user_id] == user_type:
                user_ws = self.active_connections[user_id]
                logger.info(f"Sending message to the {len(user_ws)} websockets of user {self.user_types[user_id]}:{user_id}")
                websockets.extend(user_ws)

        for websocket in websockets:
            try:
                await websocket.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(websocket, user_id)

    async def loop(self, websocket: WebSocket, user_id: UUID) -> None:
        """Loop to watch for websocket events, disregarding incomming messages."""
        try:
            while True:
                message = await websocket.receive()
                if message["type"] == "websocket.disconnect":
                    self.disconnect(websocket, user_id)
                    return
        except WebSocketDisconnect:
            self.disconnect(websocket, user_id)


ws_manager = WebSocketConnectionManager()

async def ws_endpoint(websocket: WebSocket, user_type: str, user_id: UUID) -> None:
    await ws_manager.connect(websocket, user_type, user_id)
    await ws_manager.loop(websocket, user_id)
