"""Module to define the schemas of events, to be sent by WebSocket"""

from pydantic import BaseModel

from .models import Order

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

class NewOrderEventDetail(EventDetail):
    order: Order

class NewOrderEvent(Event):
    name: str = "app-new-order"
    detail: NewOrderEventDetail

class OrderStartedEventDetail(EventDetail):
    order_id: int
    started: bool

class OrderStartedEvent(Event):
    name: str = "app-order-started"
    detail: OrderStartedEventDetail

class OrderServedEventDetail(EventDetail):
    order_id: int
    served: bool

class OrderServedEvent(Event):
    name: str = "app-order-served"
    detail: OrderServedEventDetail
