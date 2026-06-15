from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.workflow_templates.models import WorkflowTemplate


class WorkflowTemplateRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_all(self) -> list[WorkflowTemplate]:
        result = await self.db.execute(
            select(WorkflowTemplate).order_by(WorkflowTemplate.created_at)
        )
        return list(result.scalars().all())

    async def get_by_id(self, template_id: str) -> WorkflowTemplate | None:
        result = await self.db.execute(
            select(WorkflowTemplate).where(WorkflowTemplate.id == template_id)
        )
        return result.scalar_one_or_none()

    async def count(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(WorkflowTemplate)
        )
        return result.scalar() or 0

    async def bulk_insert(self, templates: list[dict]) -> None:
        for t in templates:
            self.db.add(WorkflowTemplate(**t))
        await self.db.flush()
