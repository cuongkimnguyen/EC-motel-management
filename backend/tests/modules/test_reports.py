"""Integration tests for the reports module."""
import random
import string
from datetime import date, timedelta

import pytest
from httpx import AsyncClient

from app.modules.reports.schemas import (
    ContractReport,
    DebtTrendItem,
    ExpenseCategoryItem,
    ExpiringContractItem,
    FinancialReport,
    OccupancyByBuildingItem,
    ReportKPI,
    ReportOverviewResponse,
    RevenueExpenseTrendItem,
    RoomOperationReport,
    TenantDebtItem,
)


# ── schema smoke test ─────────────────────────────────────────────────────────

def test_schema_imports():
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


# ── helpers ───────────────────────────────────────────────────────────────────

async def make_room(client, auth_headers, block="Khu A", status="Trống") -> dict:
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


async def make_contract(
    client, auth_headers, room_id, tenant_id,
    start="2025-01-01", end=None,
    monthly_rent=3_000_000,
) -> dict:
    if end is None:
        end = (date.today() + timedelta(days=365)).isoformat()
    payload = {
        "room_id": room_id, "tenant_id": tenant_id,
        "start_date": start, "end_date": end,
        "monthly_rent": monthly_rent, "deposit": 6_000_000,
        "billing_cycle": 1, "payment_due_day": 5,
    }
    r = await client.post("/api/contracts", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    return r.json()


async def make_expense(
    client, auth_headers,
    amount=500_000, building="Khu A",
    expense_date="2025-07-15", category="Điện nước",
) -> dict:
    payload = {
        "title": "Test expense", "category": category,
        "amount": amount, "expense_date": expense_date,
        "payment_status": "Đã thanh toán", "payment_method": "Tiền mặt",
        "building_name": building, "note": "",
    }
    r = await client.post("/api/expenses", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    return r.json()


# ── tests ─────────────────────────────────────────────────────────────────────

async def test_reports_requires_auth(client: AsyncClient):
    r = await client.get("/api/reports/overview")
    assert r.status_code == 401


async def test_reports_overview_empty(client: AsyncClient, auth_headers: dict):
    """All zeros when no data exists."""
    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": 7,
                "selected_year": 2025, "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["kpi"]["total_revenue"] == 0
    assert body["kpi"]["total_expense"] == 0
    assert body["kpi"]["net_profit"] == 0
    assert body["kpi"]["expiring_contracts"] == 0
    assert body["expense_breakdown"] == []
    assert body["tenant_debt_list"] == []
    assert body["contract_report"]["active_contracts"] == 0
    assert len(body["revenue_trend"]) == 6
    assert len(body["debt_trend"]) == 6


async def test_reports_overview_with_data(client: AsyncClient, auth_headers: dict):
    """KPIs reflect rooms, contracts, expenses created."""
    today = date.today()
    room = await make_room(client, auth_headers, block="Khu A", status="Trống")
    tenant_id = await make_tenant(client, auth_headers)
    await make_contract(client, auth_headers, room["id"], tenant_id,
                        monthly_rent=3_000_000)
    expense_date = today.strftime("%Y-%m-10")
    await make_expense(client, auth_headers, amount=500_000,
                       building="Khu A", expense_date=expense_date)

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": today.month,
                "selected_year": today.year, "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["kpi"]["total_revenue"] == 3_000_000
    assert body["kpi"]["total_expense"] == 500_000
    assert body["kpi"]["net_profit"] == 2_500_000
    assert body["room_operation"]["total_rooms"] == 1
    assert body["contract_report"]["active_contracts"] == 1


async def test_reports_building_filter(client: AsyncClient, auth_headers: dict):
    """building_id filter restricts revenue and expense to that block."""
    today = date.today()
    room_a = await make_room(client, auth_headers, block="Khu A")
    room_b = await make_room(client, auth_headers, block="Khu B")
    t_a = await make_tenant(client, auth_headers)
    t_b = await make_tenant(client, auth_headers)
    # contracts active this month
    await make_contract(client, auth_headers, room_a["id"], t_a, monthly_rent=3_000_000)
    await make_contract(client, auth_headers, room_b["id"], t_b, monthly_rent=4_000_000)
    # expenses this month
    this_month = today.strftime("%Y-%m-10")
    await make_expense(client, auth_headers, amount=200_000, building="Khu A",
                       expense_date=this_month)
    await make_expense(client, auth_headers, amount=300_000, building="Khu B",
                       expense_date=this_month)

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": today.month,
                "selected_year": today.year, "building_id": "Khu A"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["kpi"]["total_revenue"] == 3_000_000
    assert body["kpi"]["total_expense"] == 200_000


async def test_reports_compare_with_previous(client: AsyncClient, auth_headers: dict):
    """compare_with_previous=true returns trend percentage fields."""
    room = await make_room(client, auth_headers)
    t = await make_tenant(client, auth_headers)
    await make_contract(client, auth_headers, room["id"], t)

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": 7,
                "selected_year": 2025, "building_id": "all",
                "compare_with_previous": "true"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    body = r.json()
    # trend fields exist in kpi (may be None if previous period had 0 revenue)
    assert "revenue_trend" in body["kpi"]
    assert "expense_trend" in body["kpi"]
    assert "profit_trend" in body["kpi"]


async def test_reports_expense_breakdown_categories(client: AsyncClient, auth_headers: dict):
    """Expense breakdown groups by category and percentages sum to ~100."""
    await make_expense(client, auth_headers, amount=1_000_000,
                       expense_date="2025-07-05", category="Điện nước")
    await make_expense(client, auth_headers, amount=500_000,
                       expense_date="2025-07-05", category="Internet")

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": 7,
                "selected_year": 2025, "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    breakdown = r.json()["expense_breakdown"]
    assert len(breakdown) == 2
    total_pct = sum(b["percentage"] for b in breakdown)
    assert abs(total_pct - 100.0) < 0.5
    # each item has a color field
    assert all("color" in b for b in breakdown)


async def test_reports_revenue_trend_has_6_months(client: AsyncClient, auth_headers: dict):
    """revenue_trend always returns 6 data points."""
    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "month", "selected_month": 7,
                "selected_year": 2025, "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    trend = r.json()["revenue_trend"]
    assert len(trend) == 6
    # each item has required fields
    for item in trend:
        assert "label" in item
        assert "revenue" in item
        assert "expense" in item
        assert "profit" in item


async def test_reports_contract_expiring_list(client: AsyncClient, auth_headers: dict):
    """expiring_list populated for contracts ending within 30 days."""
    room = await make_room(client, auth_headers)
    t = await make_tenant(client, auth_headers)
    end_soon = (date.today() + timedelta(days=10)).isoformat()
    await make_contract(client, auth_headers, room["id"], t,
                        start="2025-01-01", end=end_soon)

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "year", "selected_year": 2025,
                "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    cr = r.json()["contract_report"]
    assert cr["expiring_in_30_days"] >= 1
    assert len(cr["expiring_list"]) >= 1
    item = cr["expiring_list"][0]
    assert "days_left" in item
    assert "tenant_name" in item
    assert "end_date" in item


async def test_reports_occupancy_by_building(client: AsyncClient, auth_headers: dict):
    """occupancy_by_building groups rooms by block."""
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
    names = [o["building_name"] for o in occ]
    assert "Khu A" in names
    assert "Khu B" in names
    for o in occ:
        assert o["total_rooms"] >= 1
        assert 0.0 <= o["occupancy_rate"] <= 100.0


async def test_reports_quarter_period(client: AsyncClient, auth_headers: dict):
    """Quarter period type works and captures 3-month expense window."""
    await make_expense(client, auth_headers, amount=300_000,
                       expense_date="2025-04-15")  # Q2 2025
    await make_expense(client, auth_headers, amount=200_000,
                       expense_date="2025-01-15")  # Q1 2025

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "quarter", "selected_quarter": 2,
                "selected_year": 2025, "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["kpi"]["total_expense"] == 300_000  # only Q2


async def test_reports_year_period(client: AsyncClient, auth_headers: dict):
    """Year period captures full-year expenses."""
    await make_expense(client, auth_headers, amount=100_000, expense_date="2025-01-10")
    await make_expense(client, auth_headers, amount=200_000, expense_date="2025-12-20")
    await make_expense(client, auth_headers, amount=999_000, expense_date="2024-12-31")  # prior year

    r = await client.get(
        "/api/reports/overview",
        params={"period_type": "year", "selected_year": 2025, "building_id": "all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["kpi"]["total_expense"] == 300_000  # 100k + 200k only
