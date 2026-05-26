"""ActivityService — cross-cutting utility for recording system events.

Called by other module services after significant mutations.
Failures are silently swallowed so that activity logging never breaks
the main operation. Caller is responsible for passing the same DB
session so the insert participates in the same transaction.
"""
from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.activity.repository import ActivityRepository
from app.modules.activity.schemas import ActivityLogResponse


class ActivityService:
    def __init__(self, db: AsyncSession):
        self.repo = ActivityRepository(db)

    async def log_event(
        self,
        event_type: str,
        description: str,
        module: str,
        reference_id: uuid.UUID | str | None = None,
        reference_type: str | None = None,
        actor_id: uuid.UUID | None = None,
    ) -> None:
        """Insert an activity log entry. Never raises — failures are silently ignored."""
        try:
            await self.repo.create(
                event_type=event_type,
                description=description,
                module=module,
                reference_id=reference_id,
                reference_type=reference_type,
                actor_id=actor_id,
            )
        except Exception:
            # Activity logging is non-critical; do not propagate to caller.
            pass

    async def list_recent(self, limit: int = 8) -> list[ActivityLogResponse]:
        entries = await self.repo.list_recent(limit)
        result = []
        for e in entries:
            result.append(ActivityLogResponse(
                id=str(e.id),
                event_type=e.event_type,
                description=e.description,
                module=e.module,
                reference_id=str(e.reference_id) if e.reference_id else None,
                reference_type=e.reference_type,
                created_at=e.created_at,
            ))
        return result
