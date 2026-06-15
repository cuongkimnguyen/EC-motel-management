from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.automations.repository import AutomationRepository
from app.modules.automations.schemas import (
    AutomationCreate,
    AutomationResponse,
    AutomationUpdate,
    TaskHistoryResponse,
)


class AutomationService:
    def __init__(self, db: AsyncSession):
        self.repo = AutomationRepository(db)

    async def list_automations(
        self, params: PaginationParams, status: str | None, module: str | None
    ) -> dict:
        automations, total = await self.repo.list_automations(
            params.page, params.limit, status=status, module=module
        )
        data = [AutomationResponse.model_validate(a) for a in automations]
        return make_paginated_response(data, total, params)

    async def get_automation(self, automation_id: str) -> AutomationResponse:
        a = await self.repo.get_by_id(automation_id)
        if not a:
            raise HTTPException(status_code=404, detail="Automation không tồn tại")
        return AutomationResponse.model_validate(a)

    async def create_automation(self, payload: AutomationCreate) -> AutomationResponse:
        status = "active" if payload.enable_immediately else "draft"
        a = await self.repo.create(
            name=payload.name,
            description=payload.description,
            trigger_type=payload.trigger_type,
            frequency=payload.frequency,
            run_time=payload.run_time,
            module=payload.module,
            condition=payload.condition,
            action=payload.action,
            notify_recipient=payload.notify_recipient,
            notify_channel=payload.notify_channel,
            status=status,
            is_enabled=payload.enable_immediately,
        )
        return AutomationResponse.model_validate(a)

    async def update_automation(self, automation_id: str, payload: AutomationUpdate) -> AutomationResponse:
        a = await self.repo.get_by_id(automation_id)
        if not a:
            raise HTTPException(status_code=404, detail="Automation không tồn tại")
        updates = payload.model_dump(exclude_none=True)
        a = await self.repo.update(a, **updates)
        return AutomationResponse.model_validate(a)

    async def toggle_automation(self, automation_id: str) -> AutomationResponse:
        a = await self.repo.get_by_id(automation_id)
        if not a:
            raise HTTPException(status_code=404, detail="Automation không tồn tại")
        new_enabled = not a.is_enabled
        new_status = "active" if new_enabled else "paused"
        a = await self.repo.update(a, is_enabled=new_enabled, status=new_status)
        return AutomationResponse.model_validate(a)

    async def run_automation(self, automation_id: str) -> TaskHistoryResponse:
        a = await self.repo.get_by_id(automation_id)
        if not a:
            raise HTTPException(status_code=404, detail="Automation không tồn tại")
        now = datetime.now(timezone.utc)
        history = await self.repo.create_task_history(
            name=a.name,
            task_type="automation",
            trigger_source="manual",
            status="completed",
            result_summary=f"Chạy thủ công automation '{a.name}' lúc {now.strftime('%H:%M %d/%m/%Y')}",
            module=a.module,
            automation_id=a.id,
        )
        await self.repo.update(a, last_run_at=now, run_count=a.run_count + 1)
        return TaskHistoryResponse.model_validate(history)

    async def get_logs(self, automation_id: str) -> list[TaskHistoryResponse]:
        a = await self.repo.get_by_id(automation_id)
        if not a:
            raise HTTPException(status_code=404, detail="Automation không tồn tại")
        logs = await self.repo.get_logs_for_automation(automation_id)
        return [TaskHistoryResponse.model_validate(log) for log in logs]

    async def delete_automation(self, automation_id: str) -> None:
        a = await self.repo.get_by_id(automation_id)
        if not a:
            raise HTTPException(status_code=404, detail="Automation không tồn tại")
        await self.repo.delete(a)
