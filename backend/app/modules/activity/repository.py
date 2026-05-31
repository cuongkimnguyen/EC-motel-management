import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.activity.models import ActivityLog


class ActivityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        event_type: str,
        description: str,
        module: str,
        reference_id: uuid.UUID | str | None = None,
        reference_type: str | None = None,
        actor_id: uuid.UUID | None = None,
    ) -> ActivityLog:
        ref_uuid: uuid.UUID | None = None
        if reference_id is not None:
            ref_uuid = uuid.UUID(str(reference_id)) if not isinstance(reference_id, uuid.UUID) else reference_id
        entry = ActivityLog(
            event_type=event_type,
            description=description,
            module=module,
            reference_id=ref_uuid,
            reference_type=reference_type,
            actor_id=actor_id,
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def list_recent(self, limit: int = 8) -> list[ActivityLog]:
        result = await self.db.execute(
            select(ActivityLog)
            .order_by(ActivityLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
