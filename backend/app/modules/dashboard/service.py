from __future__ import annotations

from calendar import monthrange
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.activity.service import ActivityService
from app.modules.activity.schemas import ActivityLogResponse
from app.modules.contracts.models import Contract
from app.modules.dashboard.schemas import DashboardStats
from app.modules.expenses.models import Expense
from app.modules.reports.repository import ReportsRepository
from app.modules.rooms.models import Room
from app.modules.tenants.models import Tenant


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.reports_repo = ReportsRepository(db)
        self.activity_svc = ActivityService(db)

    async def get_stats(self) -> DashboardStats:
        today = date.today()
        month_start = date(today.year, today.month, 1)
        month_end = date(today.year, today.month, monthrange(today.year, today.month)[1])

        # ── Room counts ───────────────────────────────────────────────────────
        room_rows = (await self.db.execute(
            select(Room.status, func.count().label("cnt")).group_by(Room.status)
        )).all()
        room_counts: dict[str, int] = {r.status: r.cnt for r in room_rows}
        total_rooms = sum(room_counts.values())
        occupied = room_counts.get("Đang thuê", 0)
        vacant = room_counts.get("Trống", 0)
        reserved = room_counts.get("Đã đặt", 0)
        maintenance = room_counts.get("Bảo trì", 0)

        # ── Contracts ─────────────────────────────────────────────────────────
        in_7 = today + timedelta(days=7)
        in_30 = today + timedelta(days=30)

        active_count = int(await self.db.scalar(
            select(func.count()).select_from(Contract).where(
                Contract.terminated_at.is_(None), Contract.end_date >= today
            )
        ) or 0)
        exp_7 = int(await self.db.scalar(
            select(func.count()).select_from(Contract).where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= in_7,
            )
        ) or 0)
        exp_30 = int(await self.db.scalar(
            select(func.count()).select_from(Contract).where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= in_30,
            )
        ) or 0)

        # Expected revenue = SUM(monthly_rent) of all currently active contracts
        expected_rev = int(await self.db.scalar(
            select(func.coalesce(func.sum(Contract.monthly_rent), 0))
            .select_from(Contract)
            .where(Contract.terminated_at.is_(None), Contract.end_date >= today)
        ) or 0)

        # ── Financial (current month) ──────────────────────────────────────────
        month_rev = await self.reports_repo.get_revenue_for_period(month_start, month_end)
        month_exp = await self.reports_repo.get_expense_for_period(month_start, month_end)

        # ── Overdue / debt ────────────────────────────────────────────────────
        overdue = int(await self.db.scalar(
            select(func.coalesce(func.sum(Tenant.debt), 0))
        ) or 0)

        # ── Vacant without post ───────────────────────────────────────────────
        vwp = int(await self.db.scalar(
            select(func.count()).where(
                Room.status == "Trống", Room.has_active_post.is_(False)
            )
        ) or 0)

        return DashboardStats(
            total_rooms=total_rooms,
            occupied_rooms=occupied,
            vacant_rooms=vacant,
            reserved_rooms=reserved,
            maintenance_rooms=maintenance,
            occupancy_rate=round(occupied / total_rooms * 100, 1) if total_rooms else 0.0,
            vacancy_rate=round(vacant / total_rooms * 100, 1) if total_rooms else 0.0,
            active_contracts=active_count,
            expiring_contracts=exp_30,
            expiring_in_7_days=exp_7,
            expiring_in_30_days=exp_30,
            current_month_revenue=month_rev,
            current_month_expenses=month_exp,
            current_month_profit=month_rev - month_exp,
            overdue_amount=overdue,
            expected_revenue=expected_rev,
            vacant_without_post=vwp,
        )

    async def get_activity(self, limit: int = 8) -> list[ActivityLogResponse]:
        return await self.activity_svc.list_recent(limit)
