import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class WorkflowTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    trigger: str
    outcome: str
    module: str
    estimated_time: str
    is_builtin: bool
    created_at: datetime
