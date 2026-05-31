import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AutomationCreate(BaseModel):
    name: str
    description: str | None = None
    trigger_type: str
    frequency: str | None = None
    run_time: str | None = None
    module: str
    condition: str | None = None
    action: str
    notify_recipient: str | None = None
    notify_channel: str | None = None
    enable_immediately: bool = True


class AutomationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    trigger_type: str | None = None
    frequency: str | None = None
    run_time: str | None = None
    module: str | None = None
    condition: str | None = None
    action: str | None = None
    notify_recipient: str | None = None
    notify_channel: str | None = None


class AutomationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    trigger_type: str
    frequency: str | None
    run_time: str | None
    module: str
    condition: str | None
    action: str
    notify_recipient: str | None
    notify_channel: str | None
    status: str
    is_enabled: bool
    last_run_at: datetime | None
    next_run_at: datetime | None
    run_count: int
    created_at: datetime
    updated_at: datetime


class TaskHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    task_type: str
    trigger_source: str
    status: str
    result_summary: str | None
    module: str
    automation_id: uuid.UUID | None
    created_at: datetime
