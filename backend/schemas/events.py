"""Module to define the schemas of events, to be sent by WebSocket"""

from pydantic import BaseModel

class EventDetail(BaseModel):
    pass

class Event(BaseModel):
    name: str
    detail: EventDetail
    
class MenuItemAvailabilityEventDetail(EventDetail):
    item_id: int
    available: bool

class MenuItemAvailabilityEvent(Event):
    name: str = "app-menu-item-availability"
    detail: MenuItemAvailabilityEventDetail
