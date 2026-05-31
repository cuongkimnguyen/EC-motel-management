import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict


class AgentChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class AgentConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    session_id: str
    role: str
    content: str
    message_type: str
    related_module: str | None
    suggested_actions: list[Any] | None
    list_items: list[str] | None
    created_at: datetime


class AgentChatResponse(BaseModel):
    reply: AgentConversationResponse
    session_id: str


class AgentOverview(BaseModel):
    today_tasks: int
    running_automations: int
    pending_alerts: int
    ai_assisted: int
    overdue_tenants: int
    expiring_contracts: int


class AgentAlertItem(BaseModel):
    id: str
    type: str
    title: str
    message: str
    priority: str
    reference_id: str | None
    reference_type: str | None
    created_at: datetime
