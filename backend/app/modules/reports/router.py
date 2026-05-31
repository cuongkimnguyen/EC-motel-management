from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.reports.schemas import ReportOverviewResponse
from app.modules.reports.service import ReportsService

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/overview", response_model=ReportOverviewResponse)
async def get_overview(
    period_type: str = Query("month", pattern="^(month|quarter|year)$"),
    selected_month: int = Query(7, ge=1, le=12),
    selected_quarter: int = Query(1, ge=1, le=4),
    selected_year: int = Query(2025, ge=2000, le=2100),
    building_id: str = Query("all"),
    compare_with_previous: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ReportsService(db).get_overview(
        period_type=period_type,
        selected_month=selected_month,
        selected_quarter=selected_quarter,
        selected_year=selected_year,
        building_id=building_id,
        compare_with_previous=compare_with_previous,
    )
