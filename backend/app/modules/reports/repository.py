from __future__ import annotations

from calendar import monthrange
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.contracts.models import Contract
from app.modules.expenses.models import Expense
from app.modules.rooms.models import Room
from app.modules.tenants.models import Tenant

# Expense category color palette (matches frontend charts)
CATEGORY_COLORS: dict[str, str] = {
    "Điện nước":       "#6366f1",
    "Internet":        "#8b5cf6",
    "Vệ sinh":         "#ec4899",
    "Sửa chữa":        "#f59e0b",
    "Mua sắm":         "#10b981",
    "Lương / quản lý": "#3b82f6",
    "Chi phí khác":    "#6b7280",
}


def _period_date_range(
    period_type: str, selected_year: int,
    selected_month: int, selected_quarter: int,
) -> tuple[date, date]:
    if period_type == "month":
        last_day = monthrange(selected_year, selected_month)[1]
        return (
            date(selected_year, selected_month, 1),
            date(selected_year, selected_month, last_day),
        )
    if period_type == "quarter":
        start_month = (selected_quarter - 1) * 3 + 1
        end_month = start_month + 2
        last_day = monthrange(selected_year, end_month)[1]
        return date(selected_year, start_month, 1), date(selected_year, end_month, last_day)
    # year
    return date(selected_year, 1, 1), date(selected_year, 12, 31)


def _prev_period_date_range(
    period_type: str, selected_year: int,
    selected_month: int, selected_quarter: int,
) -> tuple[date, date]:
    if period_type == "month":
        if selected_month == 1:
            return _period_date_range("month", selected_year - 1, 12, 1)
        return _period_date_range("month", selected_year, selected_month - 1, 1)
    if period_type == "quarter":
        if selected_quarter == 1:
            return _period_date_range("quarter", selected_year - 1, 1, 4)
        return _period_date_range("quarter", selected_year, 1, selected_quarter - 1)
    return _period_date_range("year", selected_year - 1, 1, 1)


def _trend_pct(current: int, previous: int) -> float | None:
    if previous == 0:
        return None
    return round((current - previous) / previous * 100, 1)


class ReportsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Revenue ────────────────────────────────────────────────────────────────

    async def get_revenue_for_period(
        self, start: date, end: date, building_id: str = "all"
    ) -> int:
        """Sum monthly_rent of contracts active during [start, end]."""
        q = (
            select(func.coalesce(func.sum(Contract.monthly_rent), 0))
            .select_from(Contract)
            .where(
                Contract.start_date <= end,
                Contract.end_date >= start,
                Contract.terminated_at.is_(None),
            )
        )
        if building_id != "all":
            q = q.join(Room, Room.id == Contract.room_id).where(Room.block == building_id)
        result = await self.db.scalar(q)
        return int(result or 0)

    # ── Expenses ───────────────────────────────────────────────────────────────

    async def get_expense_for_period(
        self, start: date, end: date, building_id: str = "all"
    ) -> int:
        q = (
            select(func.coalesce(func.sum(Expense.amount), 0))
            .where(Expense.expense_date >= start, Expense.expense_date <= end)
        )
        if building_id != "all":
            q = q.where(Expense.building_name == building_id)
        result = await self.db.scalar(q)
        return int(result or 0)

    async def get_expense_breakdown(
        self, start: date, end: date, building_id: str = "all"
    ) -> list[dict]:
        q = (
            select(Expense.category, func.sum(Expense.amount).label("amount"))
            .where(Expense.expense_date >= start, Expense.expense_date <= end)
            .group_by(Expense.category)
        )
        if building_id != "all":
            q = q.where(Expense.building_name == building_id)
        rows = (await self.db.execute(q)).all()
        total = sum(r.amount for r in rows) or 1
        return [
            {
                "category": r.category,
                "amount": int(r.amount),
                "percentage": round(r.amount / total * 100, 1),
                "color": CATEGORY_COLORS.get(r.category, "#6b7280"),
            }
            for r in rows
        ]

    # ── Rooms / Occupancy ──────────────────────────────────────────────────────

    async def get_room_counts(self, building_id: str = "all") -> dict:
        q = select(Room.status, func.count().label("cnt"))
        if building_id != "all":
            q = q.where(Room.block == building_id)
        q = q.group_by(Room.status)
        rows = (await self.db.execute(q)).all()
        counts: dict[str, int] = {r.status: r.cnt for r in rows}
        total = sum(counts.values())
        return {
            "total": total,
            "occupied": counts.get("Đang thuê", 0),
            "vacant": counts.get("Trống", 0),
            "counts": counts,
        }

    async def get_occupancy_by_building(self) -> list[dict]:
        q = (
            select(Room.block, Room.status, func.count().label("cnt"))
            .group_by(Room.block, Room.status)
        )
        rows = (await self.db.execute(q)).all()
        buildings: dict[str, dict] = {}
        for r in rows:
            b = buildings.setdefault(r.block, {"total": 0, "occupied": 0, "vacant": 0})
            b["total"] += r.cnt
            if r.status == "Đang thuê":
                b["occupied"] += r.cnt
            else:
                b["vacant"] += r.cnt
        return [
            {
                "building_name": name,
                "total_rooms": d["total"],
                "occupied_rooms": d["occupied"],
                "vacant_rooms": d["vacant"],
                "occupancy_rate": round(d["occupied"] / d["total"] * 100, 1) if d["total"] else 0.0,
            }
            for name, d in sorted(buildings.items())
        ]

    # ── Contracts ──────────────────────────────────────────────────────────────

    async def get_active_contract_count(self, building_id: str = "all") -> int:
        today = date.today()
        q = (
            select(func.count())
            .select_from(Contract)
            .where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
            )
        )
        if building_id != "all":
            q = q.join(Room, Room.id == Contract.room_id).where(Room.block == building_id)
        return int(await self.db.scalar(q) or 0)

    async def get_expiring_contracts(
        self, within_days: int = 30, building_id: str = "all"
    ) -> list[dict]:
        today = date.today()
        warning = today + timedelta(days=within_days)
        q = (
            select(Contract, Room, Tenant)
            .join(Room, Room.id == Contract.room_id)
            .join(Tenant, Tenant.id == Contract.tenant_id)
            .where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= warning,
            )
            .order_by(Contract.end_date)
        )
        if building_id != "all":
            q = q.where(Room.block == building_id)
        rows = (await self.db.execute(q)).all()
        return [
            {
                "id": str(c.id),
                "tenant_name": t.full_name,
                "room_name": r.name,
                "end_date": c.end_date.isoformat(),
                "days_left": (c.end_date - today).days,
            }
            for c, r, t in rows
        ]

    async def get_new_contracts_count(self, start: date, end: date) -> int:
        result = await self.db.scalar(
            select(func.count()).where(
                Contract.start_date >= start,
                Contract.start_date <= end,
            )
        )
        return int(result or 0)

    async def get_ended_contracts_count(self, start: date, end: date) -> int:
        result = await self.db.scalar(
            select(func.count()).where(
                Contract.terminated_at >= start,
                Contract.terminated_at <= end,
            )
        )
        return int(result or 0)

    # ── Tenants / Debt ─────────────────────────────────────────────────────────

    async def get_total_debt(self, building_id: str = "all") -> int:
        today = date.today()
        if building_id == "all":
            result = await self.db.scalar(
                select(func.coalesce(func.sum(Tenant.debt), 0))
            )
            return int(result or 0)
        # Filter to tenants with active contracts in the specified building
        subq = (
            select(Contract.tenant_id)
            .join(Room, Room.id == Contract.room_id)
            .where(
                Room.block == building_id,
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
            )
        )
        result = await self.db.scalar(
            select(func.coalesce(func.sum(Tenant.debt), 0))
            .where(Tenant.id.in_(subq))
        )
        return int(result or 0)

    async def get_tenant_debt_list(self, building_id: str = "all") -> list[dict]:
        today = date.today()
        billing_period = today.strftime("%Y-%m")
        q = (
            select(Tenant, Contract, Room)
            .join(Contract, Contract.tenant_id == Tenant.id)
            .join(Room, Room.id == Contract.room_id)
            .where(
                Tenant.debt > 0,
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
            )
        )
        if building_id != "all":
            q = q.where(Room.block == building_id)
        rows = (await self.db.execute(q)).all()
        result = []
        for t, c, r in rows:
            amount_due = c.monthly_rent
            amount_remaining = t.debt
            amount_paid = max(0, amount_due - amount_remaining)
            if today.day > c.payment_due_day + 3:
                status = "Quá hạn"
            elif today.day >= c.payment_due_day - 3:
                status = "Sắp đến hạn"
            else:
                status = "Đúng hạn"
            result.append({
                "id": str(t.id),
                "tenant_name": t.full_name,
                "room_name": r.name,
                "billing_period": billing_period,
                "amount_due": amount_due,
                "amount_paid": amount_paid,
                "amount_remaining": amount_remaining,
                "status": status,
            })
        return result

    # ── Trend helpers ──────────────────────────────────────────────────────────

    async def get_revenue_expense_trend(
        self, ref_date: date, building_id: str = "all"
    ) -> list[dict]:
        """Last 6 calendar months ending at ref_date's month."""
        result = []
        for i in range(5, -1, -1):
            m = ref_date.month - i
            y = ref_date.year
            while m <= 0:
                m += 12
                y -= 1
            start, end = _period_date_range("month", y, m, 1)
            revenue = await self.get_revenue_for_period(start, end, building_id)
            expense = await self.get_expense_for_period(start, end, building_id)
            result.append({
                "label": f"T{m}/{y}",
                "revenue": revenue,
                "expense": expense,
                "profit": revenue - expense,
            })
        return result

    async def get_debt_trend(
        self, ref_date: date, total_debt: int, building_id: str = "all"
    ) -> list[dict]:
        """Last 6 months. Uses revenue as new_debt proxy; collected = new_debt for past months."""
        result = []
        for i in range(5, -1, -1):
            m = ref_date.month - i
            y = ref_date.year
            while m <= 0:
                m += 12
                y -= 1
            start, end = _period_date_range("month", y, m, 1)
            new_debt = await self.get_revenue_for_period(start, end, building_id)
            # Past months: assume all collected. Current month: residual = total_debt.
            if i == 0:
                collected = max(0, new_debt - total_debt)
                month_total_debt = total_debt
            else:
                collected = new_debt
                month_total_debt = 0
            result.append({
                "label": f"T{m}/{y}",
                "total_debt": month_total_debt,
                "new_debt": new_debt,
                "collected": collected,
            })
        return result
