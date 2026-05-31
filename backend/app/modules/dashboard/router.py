from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.dashboard.schemas import DashboardStats
from app.modules.dashboard.service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await DashboardService(db).get_stats()


@router.get("/activity")
async def get_activity(
    limit: int = Query(8, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    data = await DashboardService(db).get_activity(limit)
    return {"data": [item.model_dump() for item in data]}
