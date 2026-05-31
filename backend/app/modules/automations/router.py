from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.automations.schemas import AutomationCreate, AutomationResponse, AutomationUpdate, TaskHistoryResponse
from app.modules.automations.service import AutomationService

router = APIRouter(prefix="/api/automations", tags=["automations"])


@router.get("", response_model=dict)
async def list_automations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    module: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await AutomationService(db).list_automations(
        PaginationParams(page=page, limit=limit), status=status, module=module
    )


@router.post("", response_model=AutomationResponse, status_code=201)
async def create_automation(
    payload: AutomationCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await AutomationService(db).create_automation(payload)


@router.get("/{automation_id}", response_model=AutomationResponse)
async def get_automation(
    automation_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await AutomationService(db).get_automation(automation_id)


@router.put("/{automation_id}", response_model=AutomationResponse)
async def update_automation(
    automation_id: str,
    payload: AutomationUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await AutomationService(db).update_automation(automation_id, payload)


@router.patch("/{automation_id}/toggle", response_model=AutomationResponse)
async def toggle_automation(
    automation_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await AutomationService(db).toggle_automation(automation_id)


@router.post("/{automation_id}/run", response_model=TaskHistoryResponse)
async def run_automation(
    automation_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await AutomationService(db).run_automation(automation_id)


@router.get("/{automation_id}/logs", response_model=list[TaskHistoryResponse])
async def get_automation_logs(
    automation_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await AutomationService(db).get_logs(automation_id)


@router.delete("/{automation_id}", status_code=204)
async def delete_automation(
    automation_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await AutomationService(db).delete_automation(automation_id)
