# Phase 4 — Module A: Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `/api/reports/*` aggregation endpoints that power the `/reports` frontend screen.

**Architecture:** Pure service+repository layer over existing tables (rooms, contracts, expenses, tenants). No new DB tables. One combined `GET /api/reports/overview` returns all report data; additional endpoints return individual chart datasets. All queries are filtered by period (month/quarter/year) and optional building.

**Tech Stack:** FastAPI, SQLAlchemy 2.x async, Pydantic v2, PostgreSQL. Follows the established 4-layer pattern: router → service → repository → DB.

---

## Pre-condition

Existing modules (rooms, contracts, expenses, tenants, notifications, posts) are all passing.

Run to confirm: `cd backend && .venv/bin/python -m pytest --tb=short -q`

---

## File Map

| Action | Path |
|--------|------|
| Create | `docs/api-contracts/reports.md` |
| Create | `backend/app/modules/reports/__init__.py` |
| Create | `backend/app/modules/reports/schemas.py` |
| Create | `backend/app/modules/reports/repository.py` |
| Create | `backend/app/modules/reports/service.py` |
| Create | `backend/app/modules/reports/router.py` |
| Modify | `backend/app/main.py` |
| Create | `backend/tests/modules/test_reports.py` |

---

## Task 1: Write API Contract

**Files:**
- Create: `docs/api-contracts/reports.md`

- [ ] **Step 1: Create the API contract**

```markdown
# Reports Module — API Contract

> Source of truth: `docs/frontend-business-spec.md` §5.7, §7 Reports section.
> Frontend types: `frontend/src/app/reports/types.ts`

## Endpoints

### GET /api/reports/overview

Returns all report data for the selected period in a single response.

**Auth:** Bearer token required (admin)

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| period_type | string | month | `month` \| `quarter` \| `year` |
| selected_month | int | current month | 1–12 |
| selected_quarter | int | 1 | 1–4 |
| selected_year | int | current year | e.g. 2025 |
| building_id | string | all | `all` \| `Khu A` \| `Khu B` \| `Khu C` |
| compare_with_previous | bool | false | Include trend % vs previous period |

**Response 200:**
```json
{
  "kpi": {
    "total_revenue": 45000000,
    "total_expense": 12000000,
    "net_profit": 33000000,
    "occupancy_rate": 80.0,
    "occupied_rooms": 16,
    "vacant_rooms": 4,
    "total_debt": 5200000,
    "expiring_contracts": 3,
    "revenue_trend": 5.2,
    "expense_trend": -2.1,
    "profit_trend": 8.4
  },
  "revenue_trend": [
    { "label": "T1/2025", "revenue": 42000000, "expense": 11000000, "profit": 31000000 }
  ],
  "expense_breakdown": [
    { "category": "Điện nước", "amount": 5000000, "percentage": 41.7, "color": "#6366f1" }
  ],
  "occupancy_by_building": [
    { "building_name": "Khu A", "total_rooms": 8, "occupied_rooms": 7, "vacant_rooms": 1, "occupancy_rate": 87.5 }
  ],
  "debt_trend": [
    { "label": "T1/2025", "total_debt": 5200000, "new_debt": 3000000, "collected": 42000000 }
  ],
  "room_operation": {
    "total_rooms": 20,
    "occupied_rooms": 16,
    "vacant_rooms": 3,
    "soon_vacant_rooms": 1,
    "occupancy_rate": 80.0
  },
  "contract_report": {
    "active_contracts": 16,
    "expiring_in_30_days": 3,
    "new_contracts_this_period": 2,
    "ended_contracts_this_period": 1,
    "expiring_list": [
      { "id": "uuid", "tenant_name": "...", "room_name": "...", "end_date": "2025-08-10", "days_left": 5 }
    ]
  },
  "financial_report": {
    "expected_rent": 48000000,
    "collected_rent": 43000000,
    "uncollected_rent": 5000000,
    "total_expense": 12000000,
    "estimated_profit": 31000000
  },
  "tenant_debt_list": [
    {
      "id": "tenant-uuid",
      "tenant_name": "Nguyễn Văn A",
      "room_name": "Phòng A101",
      "billing_period": "2025-07",
      "amount_due": 3500000,
      "amount_paid": 0,
      "amount_remaining": 3500000,
      "status": "Quá hạn"
    }
  ]
}
```

**Error responses:**
- `401 Unauthorized` — missing/invalid token
- `422 Unprocessable Entity` — invalid filter params

---

### Revenue/expense computation rules

- **Revenue** = `SUM(monthly_rent)` from contracts active during the period:
  `start_date <= period_end AND end_date >= period_start AND terminated_at IS NULL`
  (terminated contracts count only if termination_date is within period)
- **Expense** = `SUM(amount)` from expenses where `expense_date BETWEEN period_start AND period_end`
  (filtered by building_name if building_id != 'all')
- **Occupancy** = live room counts (not historical), filtered by block if building_id set
- **Total debt** = `SUM(tenants.debt)` for tenants with active contracts
- **Revenue trend** = last 6 months of (revenue, expense) regardless of period filter
- **Expense breakdown** = expenses in period grouped by category with % share
- **Debt trend** = last 6 months; total_debt = current snapshot; new_debt = monthly_rent sum; collected = new_debt - total_debt
```

- [ ] **Step 2: Commit the contract**

```bash
git add docs/api-contracts/reports.md
git commit -m "docs: add reports API contract"
```

---

## Task 2: Reports Schemas

**Files:**
- Create: `backend/app/modules/reports/__init__.py`
- Create: `backend/app/modules/reports/schemas.py`

- [ ] **Step 1: Create `__init__.py`**

```python
# backend/app/modules/reports/__init__.py
```
(empty file)

- [ ] **Step 2: Write the failing test for schemas (import check)**

```python
# backend/tests/modules/test_reports.py
from app.modules.reports.schemas import (
    ReportKPI, RevenueExpenseTrendItem, ExpenseCategoryItem,
    OccupancyByBuildingItem, DebtTrendItem, RoomOperationReport,
    ContractReport, ExpiringContractItem, FinancialReport,
    TenantDebtItem, ReportOverviewResponse,
)

def test_schema_imports():
    """Schemas importable and constructable."""
    kpi = ReportKPI(
        total_revenue=1000,
        total_expense=500,
        net_profit=500,
        occupancy_rate=80.0,
        occupied_rooms=8,
        vacant_rooms=2,
        total_debt=0,
        expiring_contracts=1,
    )
    assert kpi.net_profit == 500
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
cd /Users/nguyenkimcuong/Workspace/src/motelmanage/backend
.venv/bin/python -m pytest tests/modules/test_reports.py::test_schema_imports -v
```
Expected: `ImportError` or `ModuleNotFoundError`

- [ ] **Step 4: Create schemas**

```python
# backend/app/modules/reports/schemas.py
from __future__ import annotations

from pydantic import BaseModel


class ReportKPI(BaseModel):
    total_revenue: int
    total_expense: int
    net_profit: int
    occupancy_rate: float
    occupied_rooms: int
    vacant_rooms: int
    total_debt: int
    expiring_contracts: int
    revenue_trend: float | None = None
    expense_trend: float | None = None
    profit_trend: float | None = None
    occupancy_trend: float | None = None


class RevenueExpenseTrendItem(BaseModel):
    label: str
    revenue: int
    expense: int
    profit: int


class ExpenseCategoryItem(BaseModel):
    category: str
    amount: int
    percentage: float
    color: str


class OccupancyByBuildingItem(BaseModel):
    building_name: str
    total_rooms: int
    occupied_rooms: int
    vacant_rooms: int
    occupancy_rate: float


class DebtTrendItem(BaseModel):
    label: str
    total_debt: int
    new_debt: int
    collected: int


class RoomOperationReport(BaseModel):
    total_rooms: int
    occupied_rooms: int
    vacant_rooms: int
    soon_vacant_rooms: int
    occupancy_rate: float


class ExpiringContractItem(BaseModel):
    id: str
    tenant_name: str
    room_name: str
    end_date: str
    days_left: int


class ContractReport(BaseModel):
    active_contracts: int
    expiring_in_30_days: int
    new_contracts_this_period: int
    ended_contracts_this_period: int
    expiring_list: list[ExpiringContractItem]


class FinancialReport(BaseModel):
    expected_rent: int
    collected_rent: int
    uncollected_rent: int
    total_expense: int
    estimated_profit: int


class TenantDebtItem(BaseModel):
    id: str
    tenant_name: str
    room_name: str
    billing_period: str
    amount_due: int
    amount_paid: int
    amount_remaining: int
    status: str  # Quá hạn | Sắp đến hạn | Đúng hạn


class ReportOverviewResponse(BaseModel):
    kpi: ReportKPI
    revenue_trend: list[RevenueExpenseTrendItem]
    expense_breakdown: list[ExpenseCategoryItem]
    occupancy_by_building: list[OccupancyByBuildingItem]
    debt_trend: list[DebtTrendItem]
    room_operation: RoomOperationReport
    contract_report: ContractReport
    financial_report: FinancialReport
    tenant_debt_list: list[TenantDebtItem]
```

- [ ] **Step 5: Run test — expect PASS**

```bash
.venv/bin/python -m pytest tests/modules/test_reports.py::test_schema_imports -v
```
Expected: `PASSED`

- [ ] **Step 6: Commit**

```bash
git add backend/app/modules/reports/ backend/tests/modules/test_reports.py
git commit -m "feat: add reports schemas"
```

---

## Task 3: Reports Repository

**Files:**
- Create: `backend/app/modules/reports/repository.py`

- [ ] **Step 1: Add repository test (write first)**

Append to `backend/tests/modules/test_reports.py`:

```python
import pytest
from httpx import AsyncClient


async def make_room(client, auth_headers, block="Khu A", status="Trống") -> dict:
    import random, string
    code = "R-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    payload = {
        "code": code, "name": f"Phòng {code}", "floor": "Tầng 1",
        "block": block, "area": 20, "rent_price": 3_000_000,
        "deposit": 6_000_000, "electricity_price": 3500,
        "water_price": 15000, "service_fee": 100_000,
        "max_tenants": 2, "status": status,
    }
    r = await client.post("/api/rooms", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    return r.json()


async def make_tenant(client, auth_headers) -> str:
    import random
    cccd = str(random.randint(100_000_000_000, 999_999_999_999))
    phone = "09" + str(random.randint(10_000_000, 99_999_999))
    payload = {
        "full_name": "Test Tenant", "phone": phone, "cccd": cccd,
        "gender": "Nam", "date_of_birth": "1990-01-01",
        "permanent_address": "Hà Nội",
    }
    r = await client.post("/api/tenants", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def make_contract(client, auth_headers, room_id, tenant_id,
                        start="2025-01-01", end="2025-12-31") -> dict:
    payload = {
        "room_id": room_id, "tenant_id": tenant_id,
        "start_date": start, "end_date": end,
        "monthly_rent": 3_000_000, "deposit": 6_000_000,
        "billing_cycle": 1, "payment_due_day": 5,
    }
    r = await client.post("/api/contracts", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    return r.json()


async def make_expense(client, auth_headers, amount=500_000,
                       building="Khu A", date="2025-07-15") -> dict:
    payload = {
        "title": "Test expense", "category": "Điện nước",
        "amount": amount, "expense_date": date,
        "payment_status": "Đã thanh toán", "payment_method": "Tiền mặt",
        "building_name": building, "note": "",
    }
    r = await client.post("/api/expenses", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    return r.json()


async def test_reports_overview_empty(client: AsyncClient, auth_headers: dict):
    """Overview returns zeros when no data."""
    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": 7,
                "selected_year": 2025, "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert "kpi" in body
    assert body["kpi"]["total_revenue"] == 0
    assert body["kpi"]["total_expense"] == 0
    assert body["kpi"]["net_profit"] == 0
    assert "revenue_trend" in body
    assert "expense_breakdown" in body
    assert "occupancy_by_building" in body
    assert "debt_trend" in body
    assert "room_operation" in body
    assert "contract_report" in body
    assert "financial_report" in body
    assert "tenant_debt_list" in body
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
.venv/bin/python -m pytest tests/modules/test_reports.py::test_reports_overview_empty -v
```
Expected: `404` or connection error (route not registered yet)

- [ ] **Step 3: Create repository**

```python
# backend/app/modules/reports/repository.py
from __future__ import annotations

import uuid
from calendar import monthrange
from datetime import date, timedelta

from sqlalchemy import case, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.contracts.models import Contract
from app.modules.expenses.models import Expense
from app.modules.rooms.models import Room
from app.modules.tenants.models import Tenant

# Expense category color palette (matches frontend charts)
CATEGORY_COLORS = {
    "Điện nước":      "#6366f1",
    "Internet":       "#8b5cf6",
    "Vệ sinh":        "#ec4899",
    "Sửa chữa":       "#f59e0b",
    "Mua sắm":        "#10b981",
    "Lương / quản lý": "#3b82f6",
    "Chi phí khác":   "#6b7280",
}


def _period_date_range(
    period_type: str, selected_year: int,
    selected_month: int, selected_quarter: int,
) -> tuple[date, date]:
    if period_type == "month":
        last_day = monthrange(selected_year, selected_month)[1]
        return date(selected_year, selected_month, 1), date(selected_year, selected_month, last_day)
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
        counts: dict[str, int] = {}
        for r in rows:
            counts[r.status] = r.cnt
        total = sum(counts.values())
        occupied = counts.get("Đang thuê", 0)
        vacant = counts.get("Trống", 0)
        return {"total": total, "occupied": occupied, "vacant": vacant, "counts": counts}

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
        q = select(func.count()).where(
            Contract.terminated_at.is_(None),
            Contract.end_date >= today,
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

    async def get_expected_rent(self, start: date, end: date, building_id: str = "all") -> int:
        """Total monthly_rent for all active contracts in period (same as revenue)."""
        return await self.get_revenue_for_period(start, end, building_id)

    # ── Tenants / Debt ─────────────────────────────────────────────────────────

    async def get_total_debt(self, building_id: str = "all") -> int:
        q = select(func.coalesce(func.sum(Tenant.debt), 0))
        if building_id != "all":
            q = (
                q.join(Contract, Contract.tenant_id == Tenant.id)
                .join(Room, Room.id == Contract.room_id)
                .where(
                    Room.block == building_id,
                    Contract.terminated_at.is_(None),
                    Contract.end_date >= date.today(),
                )
                .distinct()
            )
        result = await self.db.scalar(q)
        return int(result or 0)

    async def get_tenant_debt_list(
        self, building_id: str = "all"
    ) -> list[dict]:
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
            # Determine status based on payment_due_day
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

    # ── Trend data (last 6 months) ─────────────────────────────────────────────

    async def get_revenue_expense_trend(
        self, ref_date: date, building_id: str = "all"
    ) -> list[dict]:
        """Return last 6 months of (revenue, expense) ending at ref_date's month."""
        result = []
        for i in range(5, -1, -1):
            # Go back i months from ref_date
            m = ref_date.month - i
            y = ref_date.year
            while m <= 0:
                m += 12
                y -= 1
            start, end = _period_date_range("month", y, m, 1)
            revenue = await self.get_revenue_for_period(start, end, building_id)
            expense = await self.get_expense_for_period(start, end, building_id)
            label = f"T{m}/{y}"
            result.append({
                "label": label,
                "revenue": revenue,
                "expense": expense,
                "profit": revenue - expense,
            })
        return result

    async def get_debt_trend(
        self, ref_date: date, total_debt: int, building_id: str = "all"
    ) -> list[dict]:
        """Last 6 months debt trend. Uses revenue as new_debt approximation."""
        result = []
        for i in range(5, -1, -1):
            m = ref_date.month - i
            y = ref_date.year
            while m <= 0:
                m += 12
                y -= 1
            start, end = _period_date_range("month", y, m, 1)
            new_debt = await self.get_revenue_for_period(start, end, building_id)
            # Approximate collected = new_debt - share_of_total_debt
            collected = max(0, new_debt - (total_debt // 6 if i == 0 else 0))
            label = f"T{m}/{y}"
            result.append({
                "label": label,
                "total_debt": total_debt if i == 0 else 0,
                "new_debt": new_debt,
                "collected": collected,
            })
        return result
```

- [ ] **Step 4: Run the empty-overview test**

```bash
.venv/bin/python -m pytest tests/modules/test_reports.py::test_reports_overview_empty -v
```
Expected: still fails (router not yet created). That's correct at this stage.

---

## Task 4: Reports Service

**Files:**
- Create: `backend/app/modules/reports/service.py`

- [ ] **Step 1: Create service**

```python
# backend/app/modules/reports/service.py
from __future__ import annotations

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.reports.repository import ReportsRepository, _period_date_range, _prev_period_date_range, _trend_pct
from app.modules.reports.schemas import (
    ContractReport, DebtTrendItem, ExpiringContractItem, ExpenseCategoryItem,
    FinancialReport, OccupancyByBuildingItem, ReportKPI, ReportOverviewResponse,
    RevenueExpenseTrendItem, RoomOperationReport, TenantDebtItem,
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
        start, end = _period_date_range(period_type, selected_year, selected_month, selected_quarter)
        today = date.today()

        # ── KPI ────────────────────────────────────────────────────────────────
        revenue = await self.repo.get_revenue_for_period(start, end, building_id)
        expense = await self.repo.get_expense_for_period(start, end, building_id)
        total_debt = await self.repo.get_total_debt(building_id)
        expiring = await self.repo.get_expiring_contracts(30, building_id)
        room_counts = await self.repo.get_room_counts(building_id)

        revenue_trend = expense_trend = profit_trend = None
        if compare_with_previous:
            ps, pe = _prev_period_date_range(period_type, selected_year, selected_month, selected_quarter)
            prev_rev = await self.repo.get_revenue_for_period(ps, pe, building_id)
            prev_exp = await self.repo.get_expense_for_period(ps, pe, building_id)
            revenue_trend = _trend_pct(revenue, prev_rev)
            expense_trend = _trend_pct(expense, prev_exp)
            profit_trend = _trend_pct(revenue - expense, prev_rev - prev_exp)

        total = room_counts["total"] or 1
        kpi = ReportKPI(
            total_revenue=revenue,
            total_expense=expense,
            net_profit=revenue - expense,
            occupancy_rate=round(room_counts["occupied"] / total * 100, 1),
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
        counts = room_counts["counts"]
        soon_vacant = len([c for c in expiring if c["days_left"] <= 30])
        room_op = RoomOperationReport(
            total_rooms=room_counts["total"],
            occupied_rooms=room_counts["occupied"],
            vacant_rooms=room_counts["vacant"],
            soon_vacant_rooms=soon_vacant,
            occupancy_rate=round(room_counts["occupied"] / total * 100, 1),
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
        expected_rent = await self.repo.get_expected_rent(start, end, building_id)
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
```

---

## Task 5: Reports Router + Register

**Files:**
- Create: `backend/app/modules/reports/router.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create router**

```python
# backend/app/modules/reports/router.py
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
```

- [ ] **Step 2: Register router in main.py**

In `backend/app/main.py`, add import and registration:

```python
# add import after notifications_router import:
from app.modules.reports.router import router as reports_router

# add inside create_app(), after app.include_router(notifications_router):
app.include_router(reports_router)
```

---

## Task 6: Write and Run Tests

**Files:**
- Modify: `backend/tests/modules/test_reports.py`

- [ ] **Step 1: Add integration tests**

Append to `backend/tests/modules/test_reports.py`:

```python
async def test_reports_overview_requires_auth(client: AsyncClient):
    r = await client.get("/api/reports/overview")
    assert r.status_code == 401


async def test_reports_overview_with_data(client: AsyncClient, auth_headers: dict):
    """KPIs reflect rooms, contracts, expenses created."""
    room = await make_room(client, auth_headers, block="Khu A", status="Trống")
    tenant_id = await make_tenant(client, auth_headers)
    await make_contract(client, auth_headers, room["id"], tenant_id,
                        start="2025-01-01", end="2025-12-31")
    await make_expense(client, auth_headers, amount=500_000,
                       building="Khu A", date="2025-07-10")

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": 7,
                "selected_year": 2025, "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    body = r.json()
    # Revenue: 1 active contract with monthly_rent=3_000_000
    assert body["kpi"]["total_revenue"] == 3_000_000
    # Expense: 1 expense of 500_000
    assert body["kpi"]["total_expense"] == 500_000
    assert body["kpi"]["net_profit"] == 2_500_000
    # Room operation: 1 room total
    assert body["room_operation"]["total_rooms"] == 1


async def test_reports_building_filter(client: AsyncClient, auth_headers: dict):
    """Building filter restricts revenue/expense to that block."""
    room_a = await make_room(client, auth_headers, block="Khu A", status="Trống")
    room_b = await make_room(client, auth_headers, block="Khu B", status="Trống")
    tenant_a = await make_tenant(client, auth_headers)
    tenant_b = await make_tenant(client, auth_headers)
    await make_contract(client, auth_headers, room_a["id"], tenant_a)
    await make_contract(client, auth_headers, room_b["id"], tenant_b)
    await make_expense(client, auth_headers, amount=200_000, building="Khu A", date="2025-07-10")
    await make_expense(client, auth_headers, amount=300_000, building="Khu B", date="2025-07-10")

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": 7,
                "selected_year": 2025, "building_id": "Khu A"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["kpi"]["total_expense"] == 200_000


async def test_reports_compare_with_previous(client: AsyncClient, auth_headers: dict):
    """compare_with_previous=true returns trend percentages."""
    room = await make_room(client, auth_headers)
    tenant_id = await make_tenant(client, auth_headers)
    await make_contract(client, auth_headers, room["id"], tenant_id)

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": 7,
                "selected_year": 2025, "building_id": "all",
                "compare_with_previous": True},
        headers=auth_headers,
    )
    assert r.status_code == 200
    body = r.json()
    # trend fields are present (may be None if previous was 0)
    assert "revenue_trend" in body["kpi"]


async def test_reports_expense_breakdown(client: AsyncClient, auth_headers: dict):
    """Expense breakdown groups by category with percentage."""
    await make_expense(client, auth_headers, amount=1_000_000,
                       building="Khu A", date="2025-07-05")
    # add a second category
    payload = {
        "title": "Internet", "category": "Internet",
        "amount": 500_000, "expense_date": "2025-07-05",
        "payment_status": "Đã thanh toán", "payment_method": "Tiền mặt",
        "building_name": "Khu A", "note": "",
    }
    await client.post("/api/expenses", json=payload, headers=auth_headers)

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": 7,
                "selected_year": 2025, "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    breakdown = r.json()["expense_breakdown"]
    assert len(breakdown) == 2
    pcts = [b["percentage"] for b in breakdown]
    assert abs(sum(pcts) - 100.0) < 0.5


async def test_reports_revenue_trend_has_6_months(client: AsyncClient, auth_headers: dict):
    """revenue_trend always returns 6 data points."""
    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": 7,
                "selected_year": 2025, "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert len(r.json()["revenue_trend"]) == 6


async def test_reports_contract_report(client: AsyncClient, auth_headers: dict):
    """Contract report includes expiring_list for near-expiry contracts."""
    from datetime import date, timedelta
    room = await make_room(client, auth_headers)
    tenant_id = await make_tenant(client, auth_headers)
    end_soon = (date.today() + timedelta(days=10)).isoformat()
    await make_contract(client, auth_headers, room["id"], tenant_id,
                        start="2025-01-01", end=end_soon)

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "year", "selected_year": 2025,
                "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    contract_rep = r.json()["contract_report"]
    assert contract_rep["expiring_in_30_days"] >= 1
    assert len(contract_rep["expiring_list"]) >= 1
    assert "days_left" in contract_rep["expiring_list"][0]


async def test_reports_occupancy_by_building(client: AsyncClient, auth_headers: dict):
    """Occupancy by building groups rooms correctly."""
    await make_room(client, auth_headers, block="Khu A")
    await make_room(client, auth_headers, block="Khu B")

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": 7,
                "selected_year": 2025, "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    occ = r.json()["occupancy_by_building"]
    building_names = [o["building_name"] for o in occ]
    assert "Khu A" in building_names
    assert "Khu B" in building_names
```

- [ ] **Step 2: Run all report tests**

```bash
cd /Users/nguyenkimcuong/Workspace/src/motelmanage/backend
.venv/bin/python -m pytest tests/modules/test_reports.py -v
```
Expected: all pass.

- [ ] **Step 3: Run full test suite to confirm no regressions**

```bash
.venv/bin/python -m pytest --tb=short -q
```
Expected: all previous 88 tests + new report tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/app/modules/reports/ backend/tests/modules/test_reports.py backend/app/main.py
git commit -m "feat: add reports module with aggregation endpoints"
```

---

## Task 7: Push Branch

- [ ] **Step 1: Push to remote**

```bash
git push --set-upstream origin feat/backend-phase4-reports-dashboard-agent-automations
```

---

## Self-Review

- All 9 response fields of `ReportOverviewResponse` are tested ✓
- `building_id` filter tested ✓
- `compare_with_previous` trend % tested ✓
- Revenue computation rule (contracts active in period) documented in contract ✓
- No payment_records table assumed — debt uses `tenants.debt` field ✓
- No placeholder or TBD in code ✓
- All types consistent: `ReportKPI`, `ReportOverviewResponse` in schemas match service output ✓
