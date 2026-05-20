import uuid
from datetime import date, datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: uuid.UUID
    type: str
    reference_id: str | None
    title: str
    message: str
    date: date
    read: bool
    priority: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotificationCount(BaseModel):
    unread: int
