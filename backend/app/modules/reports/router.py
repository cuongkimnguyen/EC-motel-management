from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.export import build_excel_workbook, excel_response, pdf_response
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.reports.schemas import ReportOverviewResponse
from app.modules.reports.service import ReportsService

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/export")
async def export_report(
    format: str = Query("excel", pattern="^(excel|pdf)$"),
    period_type: str = Query("month", pattern="^(month|quarter|year)$"),
    selected_month: int = Query(7, ge=1, le=12),
    selected_quarter: int = Query(1, ge=1, le=4),
    selected_year: int = Query(2025, ge=2000, le=2100),
    building_id: str = Query("all"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
) -> StreamingResponse:
    svc = ReportsService(db)
    period_label = (
        f"{selected_year}-{selected_month:02d}" if period_type == "month" else str(selected_year)
    )
    filename_base = f"report_{period_label}"

    if format == "excel":
        headers, rows = await svc.export_excel(
            period_type=period_type,
            selected_month=selected_month,
            selected_quarter=selected_quarter,
            selected_year=selected_year,
            building_id=building_id,
        )
        wb = build_excel_workbook(
            sheet_name="Bao cao",
            headers=headers,
            rows=rows,
            col_widths=[35, 20],
        )
        return excel_response(wb, f"{filename_base}.xlsx")
    else:
        html = await svc.export_pdf(
            period_type=period_type,
            selected_month=selected_month,
            selected_quarter=selected_quarter,
            selected_year=selected_year,
            building_id=building_id,
        )
        return pdf_response(html, f"{filename_base}.pdf")


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
