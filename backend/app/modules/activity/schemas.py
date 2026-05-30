from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ActivityLogResponse(BaseModel):
    id: str
    event_type: str
    description: str
    module: str
    reference_id: str | None = None
    reference_type: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    def model_post_init(self, __context) -> None:
        # Coerce UUID fields to str for JSON serialisation
        if self.id and not isinstance(self.id, str):
            object.__setattr__(self, "id", str(self.id))
        if self.reference_id and not isinstance(self.reference_id, str):
            object.__setattr__(self, "reference_id", str(self.reference_id))
