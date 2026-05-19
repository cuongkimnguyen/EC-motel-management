import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.rooms.models import Room


class RoomRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, room_id: str | uuid.UUID) -> Room | None:
        result = await self.db.execute(select(Room).where(Room.id == room_id))
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Room | None:
        result = await self.db.execute(select(Room).where(Room.code == code))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Room:
        room = Room(**kwargs)
        self.db.add(room)
        await self.db.flush()
        await self.db.refresh(room)
        return room

    async def update(self, room: Room, **kwargs) -> Room:
        for key, value in kwargs.items():
            setattr(room, key, value)
        await self.db.flush()
        await self.db.refresh(room)
        return room

    async def delete(self, room: Room) -> None:
        await self.db.delete(room)
        await self.db.flush()

    async def list_rooms(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        status: str | None = None,
        block: str | None = None,
        floor: str | None = None,
        price_min: int | None = None,
        price_max: int | None = None,
    ) -> tuple[list[Room], int]:
        q = select(Room)
        if search:
            pattern = f"%{search}%"
            q = q.where(Room.code.ilike(pattern) | Room.name.ilike(pattern))
        if status:
            q = q.where(Room.status == status)
        if block:
            q = q.where(Room.block == block)
        if floor:
            q = q.where(Room.floor == floor)
        if price_min is not None:
            q = q.where(Room.rent_price >= price_min)
        if price_max is not None:
            q = q.where(Room.rent_price <= price_max)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0

        q = q.order_by(Room.code).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def count_active_contracts(self, room_id: uuid.UUID) -> int:
        """Count non-terminated, non-expired contracts for a room."""
        from app.modules.contracts.models import Contract

        today = date.today()
        result = await self.db.execute(
            select(func.count())
            .select_from(Contract)
            .where(
                Contract.room_id == room_id,
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
            )
        )
        return result.scalar() or 0
