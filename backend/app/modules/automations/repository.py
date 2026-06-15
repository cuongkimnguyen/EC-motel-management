from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.automations.models import Automation, AgentTaskHistory


class AutomationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_automations(
        self, page: int, limit: int, status: str | None, module: str | None
    ) -> tuple[list[Automation], int]:
        q = select(Automation)
        if status:
            q = q.where(Automation.status == status)
        if module:
            q = q.where(Automation.module == module)
        count_q = select(func.count()).select_from(q.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0
        result = await self.db.execute(
            q.order_by(Automation.created_at.desc()).offset((page - 1) * limit).limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_by_id(self, automation_id: str) -> Automation | None:
        result = await self.db.execute(
            select(Automation).where(Automation.id == automation_id)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Automation:
        a = Automation(**kwargs)
        self.db.add(a)
        await self.db.flush()
        await self.db.refresh(a)
        return a

    async def update(self, automation: Automation, **kwargs) -> Automation:
        for k, v in kwargs.items():
            setattr(automation, k, v)
        automation.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(automation)
        return automation

    async def delete(self, automation: Automation) -> None:
        await self.db.delete(automation)
        await self.db.flush()

    async def create_task_history(self, **kwargs) -> AgentTaskHistory:
        item = AgentTaskHistory(**kwargs)
        self.db.add(item)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def list_task_history(
        self, page: int, limit: int
    ) -> tuple[list[AgentTaskHistory], int]:
        q = select(AgentTaskHistory)
        count_q = select(func.count()).select_from(AgentTaskHistory)
        total = (await self.db.execute(count_q)).scalar() or 0
        result = await self.db.execute(
            q.order_by(AgentTaskHistory.created_at.desc()).offset((page - 1) * limit).limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_logs_for_automation(self, automation_id: str) -> list[AgentTaskHistory]:
        result = await self.db.execute(
            select(AgentTaskHistory)
            .where(AgentTaskHistory.automation_id == automation_id)
            .order_by(AgentTaskHistory.created_at.desc())
            .limit(50)
        )
        return list(result.scalars().all())
