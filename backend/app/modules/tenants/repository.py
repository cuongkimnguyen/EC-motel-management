import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tenants.models import Tenant


class TenantRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, tenant_id: str | uuid.UUID) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.phone == phone))
        return result.scalar_one_or_none()

    async def get_by_cccd(self, cccd: str) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.cccd == cccd))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Tenant:
        tenant = Tenant(**kwargs)
        self.db.add(tenant)
        await self.db.flush()
        await self.db.refresh(tenant)
        return tenant

    async def update(self, tenant: Tenant, **kwargs) -> Tenant:
        for key, value in kwargs.items():
            setattr(tenant, key, value)
        await self.db.flush()
        await self.db.refresh(tenant)
        return tenant

    async def delete(self, tenant: Tenant) -> None:
        await self.db.delete(tenant)
        await self.db.flush()

    async def list_tenants(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        status: str | None = None,
        gender: str | None = None,
    ) -> tuple[list[Tenant], int]:
        q = select(Tenant)
        if search:
            pattern = f"%{search}%"
            q = q.where(
                Tenant.full_name.ilike(pattern)
                | Tenant.phone.ilike(pattern)
                | Tenant.cccd.ilike(pattern)
            )
        if status:
            q = q.where(Tenant.status == status)
        if gender:
            q = q.where(Tenant.gender == gender)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0
        q = q.order_by(Tenant.full_name).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def has_active_contract(self, tenant_id: uuid.UUID) -> bool:
        from app.modules.contracts.models import Contract

        today = date.today()
        result = await self.db.execute(
            select(func.count())
            .select_from(Contract)
            .where(
                Contract.tenant_id == tenant_id,
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
            )
        )
        return (result.scalar() or 0) > 0
