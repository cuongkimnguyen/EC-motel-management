import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    meta_mid: str | None = None
    direction: str
    message_type: str
    content: str | None = None
    attachment_url: str | None = None
    status: str
    error_detail: str | None = None
    sender_type: str
    sender_name: str | None = None
    sent_at: datetime
    created_at: datetime


class ChatConversationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    psid: str
    page_id: str
    customer_name: str | None = None
    source: str
    lead_status: str
    interest_level: str
    tags: list[str]
    assignee: str | None = None
    unread_count: int
    last_message: str | None = None
    last_message_at: datetime | None = None
    created_at: datetime


class ChatConversationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    psid: str
    page_id: str
    customer_name: str | None = None
    source: str
    lead_status: str
    interest_level: str
    tags: list[str]
    assignee: str | None = None
    interested_room: str | None = None
    budget: int | None = None
    appointment_date: datetime | None = None
    internal_note: str | None = None
    phone: str | None = None
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int
    created_at: datetime
    messages: list[ChatMessageResponse] = []


class ConversationUpdate(BaseModel):
    lead_status: str | None = None
    interest_level: str | None = None
    tags: list[str] | None = None
    assignee: str | None = None
    interested_room: str | None = None
    budget: int | None = None
    appointment_date: datetime | None = None
    internal_note: str | None = None
    phone: str | None = None
    customer_name: str | None = None


class SendMessageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class ConversationStats(BaseModel):
    total: int
    unread: int
    by_lead_status: dict[str, int]
