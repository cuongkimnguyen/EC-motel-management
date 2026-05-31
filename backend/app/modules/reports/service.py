from __future__ import annotations

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.reports.repository import (
    ReportsRepository,
    _period_date_range,
    _prev_period_date_range,
    _trend_pct,
)
from app.modules.reports.schemas import (
    ContractReport,
    DebtTrendItem,
    ExpiringContractItem,
    ExpenseCategoryItem,
    FinancialReport,
    OccupancyByBuildingItem,
    ReportKPI,
    ReportOverviewResponse,
    RevenueExpenseTrendItem,
    RoomOperationReport,
    TenantDebtItem,
)


class ReportsService:
    def __init__(self, db: AsyncSession):
        self.repo = ReportsRepository(db)

    async def get_overview(
        self,
        period_type: str,
        selected_month: int,
        selected_quarter: int,
        selected_year: int,
        building_id: str,
        compare_with_previous: bool,
    ) -> ReportOverviewResponse:
        start, end = _period_date_range(
            period_type, selected_year, selected_month, selected_quarter
        )
        today = date.today()

        # ── KPI ────────────────────────────────────────────────────────────────
        revenue = await self.repo.get_revenue_for_period(start, end, building_id)
        expense = await self.repo.get_expense_for_period(start, end, building_id)
        total_debt = await self.repo.get_total_debt(building_id)
        expiring = await self.repo.get_expiring_contracts(30, building_id)
        room_counts = await self.repo.get_room_counts(building_id)

        revenue_trend = expense_trend = profit_trend = None
        if compare_with_previous:
            ps, pe = _prev_period_date_range(
                period_type, selected_year, selected_month, selected_quarter
            )
            prev_rev = await self.repo.get_revenue_for_period(ps, pe, building_id)
            prev_exp = await self.repo.get_expense_for_period(ps, pe, building_id)
            revenue_trend = _trend_pct(revenue, prev_rev)
            expense_trend = _trend_pct(expense, prev_exp)
            profit_trend = _trend_pct(revenue - expense, prev_rev - prev_exp)

        total_rooms = room_counts["total"] or 1
        kpi = ReportKPI(
            total_revenue=revenue,
            total_expense=expense,
            net_profit=revenue - expense,
            occupancy_rate=round(room_counts["occupied"] / total_rooms * 100, 1),
            occupied_rooms=room_counts["occupied"],
            vacant_rooms=room_counts["vacant"],
            total_debt=total_debt,
            expiring_contracts=len(expiring),
            revenue_trend=revenue_trend,
            expense_trend=expense_trend,
            profit_trend=profit_trend,
        )

        # ── Revenue/expense trend (last 6 months) ─────────────────────────────
        raw_trend = await self.repo.get_revenue_expense_trend(today, building_id)
        rev_trend = [RevenueExpenseTrendItem(**r) for r in raw_trend]

        # ── Expense breakdown ──────────────────────────────────────────────────
        raw_breakdown = await self.repo.get_expense_breakdown(start, end, building_id)
        exp_breakdown = [ExpenseCategoryItem(**r) for r in raw_breakdown]

        # ── Occupancy by building ──────────────────────────────────────────────
        raw_occ = await self.repo.get_occupancy_by_building()
        occ_by_building = [OccupancyByBuildingItem(**r) for r in raw_occ]

        # ── Debt trend ────────────────────────────────────────────────────────
        raw_debt = await self.repo.get_debt_trend(today, total_debt, building_id)
        debt_trend = [DebtTrendItem(**r) for r in raw_debt]

        # ── Room operation ────────────────────────────────────────────────────
        soon_vacant = len(expiring)
        room_op = RoomOperationReport(
            total_rooms=room_counts["total"],
            occupied_rooms=room_counts["occupied"],
            vacant_rooms=room_counts["vacant"],
            soon_vacant_rooms=soon_vacant,
            occupancy_rate=round(room_counts["occupied"] / total_rooms * 100, 1),
        )

        # ── Contract report ───────────────────────────────────────────────────
        active_count = await self.repo.get_active_contract_count(building_id)
        new_count = await self.repo.get_new_contracts_count(start, end)
        ended_count = await self.repo.get_ended_contracts_count(start, end)
        contract_rep = ContractReport(
            active_contracts=active_count,
            expiring_in_30_days=len(expiring),
            new_contracts_this_period=new_count,
            ended_contracts_this_period=ended_count,
            expiring_list=[ExpiringContractItem(**e) for e in expiring],
        )

        # ── Financial report ──────────────────────────────────────────────────
        expected_rent = await self.repo.get_revenue_for_period(start, end, building_id)
        uncollected = total_debt
        collected = max(0, expected_rent - uncollected)
        financial = FinancialReport(
            expected_rent=expected_rent,
            collected_rent=collected,
            uncollected_rent=uncollected,
            total_expense=expense,
            estimated_profit=collected - expense,
        )

        # ── Tenant debt list ──────────────────────────────────────────────────
        raw_debt_list = await self.repo.get_tenant_debt_list(building_id)
        debt_list = [TenantDebtItem(**d) for d in raw_debt_list]

        return ReportOverviewResponse(
            kpi=kpi,
            revenue_trend=rev_trend,
            expense_breakdown=exp_breakdown,
            occupancy_by_building=occ_by_building,
            debt_trend=debt_trend,
            room_operation=room_op,
            contract_report=contract_rep,
            financial_report=financial,
            tenant_debt_list=debt_list,
        )
