import uuid
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.contracts.models import Contract


class ContractRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, contract_id: str | uuid.UUID) -> Contract | None:
        result = await self.db.execute(select(Contract).where(Contract.id == contract_id))
        return result.scalar_one_or_none()

    async def get_active_for_room(self, room_id: uuid.UUID) -> Contract | None:
        """Return the current active (non-terminated, non-expired) contract for a room."""
        today = date.today()
        result = await self.db.execute(
            select(Contract).where(
                Contract.room_id == room_id,
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
            )
        )
        return result.scalar_one_or_none()

    async def get_last_code_for_year(self, year: int) -> str | None:
        prefix = f"HĐ-{year}-"
        result = await self.db.execute(
            select(Contract.code)
            .where(Contract.code.like(f"{prefix}%"))
            .order_by(Contract.code.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Contract:
        contract = Contract(**kwargs)
        self.db.add(contract)
        await self.db.flush()
        await self.db.refresh(contract)
        return contract

    async def update(self, contract: Contract, **kwargs) -> Contract:
        for key, value in kwargs.items():
            setattr(contract, key, value)
        await self.db.flush()
        await self.db.refresh(contract)
        return contract

    async def delete(self, contract: Contract) -> None:
        await self.db.delete(contract)
        await self.db.flush()

    async def list_contracts(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        status: str | None = None,
    ) -> tuple[list[Contract], int]:
        today = date.today()
        thirty_days = today + timedelta(days=30)

        q = select(Contract)
        if search:
            pattern = f"%{search}%"
            q = q.where(Contract.code.ilike(pattern))

        if status == "Đã chấm dứt":
            q = q.where(Contract.terminated_at.isnot(None))
        elif status == "Đã hết hạn":
            q = q.where(Contract.terminated_at.is_(None), Contract.end_date < today)
        elif status == "Sắp hết hạn":
            q = q.where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= thirty_days,
            )
        elif status == "Đang hiệu lực":
            q = q.where(Contract.terminated_at.is_(None), Contract.end_date > thirty_days)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0
        q = q.order_by(Contract.code.desc()).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total
