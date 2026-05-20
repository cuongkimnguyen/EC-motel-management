import uuid
from datetime import date

from sqlalchemy import and_, delete, func, or_, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.models import Notification


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, notif_id: str | uuid.UUID) -> Notification | None:
        result = await self.db.execute(select(Notification).where(Notification.id == notif_id))
        return result.scalar_one_or_none()

    async def upsert(
        self,
        type: str,
        reference_id: str,
        title: str,
        message: str,
        priority: str,
    ) -> None:
        """Insert or update notification by (type, reference_id). Preserves read state."""
        stmt = (
            insert(Notification)
            .values(
                id=uuid.uuid4(),
                type=type,
                reference_id=reference_id,
                title=title,
                message=message,
                date=date.today(),
                priority=priority,
                read=False,
            )
            .on_conflict_do_update(
                constraint="uq_notification_type_ref",
                set_={
                    "title": title,
                    "message": message,
                    "date": date.today(),
                    "priority": priority,
                    # NOTE: `read` is intentionally NOT updated — preserve user's read state
                },
            )
        )
        await self.db.execute(stmt)
        await self.db.flush()

    async def delete_stale(self, valid_keys: list[tuple[str, str]]) -> None:
        """Delete auto-generated notifications whose source condition no longer holds."""
        auto_types = ["contract_expiry", "vacant_room", "maintenance"]
        if not valid_keys:
            await self.db.execute(
                delete(Notification).where(Notification.type.in_(auto_types))
            )
            await self.db.flush()
            return

        # Delete auto-generated notifications NOT in the valid set
        # Build the condition: type IN auto_types AND (type, reference_id) NOT IN valid_keys
        valid_conditions = or_(
            *[
                and_(Notification.type == t, Notification.reference_id == r)
                for t, r in valid_keys
            ]
        )
        await self.db.execute(
            delete(Notification).where(
                Notification.type.in_(auto_types),
                ~valid_conditions,
            )
        )
        await self.db.flush()

    async def mark_read(self, notif_id: str | uuid.UUID) -> Notification | None:
        notif = await self.get_by_id(notif_id)
        if notif:
            notif.read = True
            await self.db.flush()
            await self.db.refresh(notif)
        return notif

    async def mark_all_read(self) -> None:
        await self.db.execute(update(Notification).values(read=True))
        await self.db.flush()

    async def count_unread(self) -> int:
        result = await self.db.execute(
            select(func.count()).where(Notification.read.is_(False))
        )
        return result.scalar() or 0

    async def list_notifications(
        self,
        page: int,
        limit: int,
        read: bool | None = None,
        type: str | None = None,
    ) -> tuple[list[Notification], int]:
        q = select(Notification)
        if read is not None:
            q = q.where(Notification.read == read)
        if type:
            q = q.where(Notification.type == type)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0
        q = (
            q.order_by(Notification.date.desc(), Notification.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all()), total
