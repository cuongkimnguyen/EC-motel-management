"""Integration tests for the dashboard and activity log modules."""
import random
import string
from datetime import date, timedelta

import pytest
from httpx import AsyncClient

from app.modules.dashboard.schemas import DashboardStats


# ── schema smoke test ─────────────────────────────────────────────────────────

def test_dashboard_stats_schema():
    stats = DashboardStats(
        total_rooms=10,
        occupied_rooms=6,
        vacant_rooms=3,
        reserved_rooms=1,
        maintenance_rooms=0,
        occupancy_rate=60.0,
        vacancy_rate=30.0,
        active_contracts=6,
        expiring_contracts=1,
        expiring_in_7_days=0,
        expiring_in_30_days=1,
        current_month_revenue=18_000_000,
        current_month_expenses=2_000_000,
        current_month_profit=16_000_000,
        overdue_amount=0,
        expected_revenue=18_000_000,
        vacant_without_post=2,
    )
    assert stats.current_month_profit == 16_000_000
    assert stats.occupancy_rate == 60.0


# ── helpers ───────────────────────────────────────────────────────────────────

async def make_room(client, auth_headers, status="Trống") -> dict:
    code = "D-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    payload = {
        "code": code, "name": f"Phòng {code}", "floor": "Tầng 1",
        "block": "Khu A", "area": 20, "rent_price": 3_000_000,
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


async def make_contract(client, auth_headers, room_id, tenant_id, monthly_rent=3_000_000) -> dict:
    end = (date.today() + timedelta(days=365)).isoformat()
    payload = {
        "room_id": room_id, "tenant_id": tenant_id,
        "start_date": "2025-01-01", "end_date": end,
        "monthly_rent": monthly_rent, "deposit": 6_000_000,
        "billing_cycle": 1, "payment_due_day": 5,
    }
    r = await client.post("/api/contracts", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    return r.json()


# ── dashboard/stats tests ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_stats_requires_auth(client: AsyncClient):
    r = await client.get("/api/dashboard/stats")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_stats_empty_db(client: AsyncClient, auth_headers: dict):
    r = await client.get("/api/dashboard/stats", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total_rooms"] == 0
    assert data["occupied_rooms"] == 0
    assert data["occupancy_rate"] == 0.0
    assert data["active_contracts"] == 0
    assert data["overdue_amount"] == 0
    assert data["vacant_without_post"] == 0


@pytest.mark.asyncio
async def test_stats_with_rooms(client: AsyncClient, auth_headers: dict):
    # 2 occupied, 1 vacant, 1 maintenance
    r1 = await make_room(client, auth_headers, status="Đang thuê")
    r2 = await make_room(client, auth_headers, status="Đang thuê")
    r3 = await make_room(client, auth_headers, status="Trống")
    await make_room(client, auth_headers, status="Bảo trì")

    r = await client.get("/api/dashboard/stats", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total_rooms"] == 4
    assert data["occupied_rooms"] == 2
    assert data["vacant_rooms"] == 1
    assert data["maintenance_rooms"] == 1
    assert data["occupancy_rate"] == 50.0


@pytest.mark.asyncio
async def test_stats_active_contracts(client: AsyncClient, auth_headers: dict):
    room = await make_room(client, auth_headers)
    tenant_id = await make_tenant(client, auth_headers)
    await make_contract(client, auth_headers, room["id"], tenant_id, monthly_rent=4_000_000)

    r = await client.get("/api/dashboard/stats", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["active_contracts"] == 1
    assert data["expected_revenue"] == 4_000_000


@pytest.mark.asyncio
async def test_stats_expiring_contracts(client: AsyncClient, auth_headers: dict):
    """A contract ending in 5 days should appear in expiring_in_7_days and expiring_in_30_days."""
    room = await make_room(client, auth_headers)
    tenant_id = await make_tenant(client, auth_headers)
    end_soon = (date.today() + timedelta(days=5)).isoformat()
    payload = {
        "room_id": room["id"], "tenant_id": tenant_id,
        "start_date": "2025-01-01", "end_date": end_soon,
        "monthly_rent": 3_000_000, "deposit": 6_000_000,
        "billing_cycle": 1, "payment_due_day": 5,
    }
    r_c = await client.post("/api/contracts", json=payload, headers=auth_headers)
    assert r_c.status_code == 201

    r = await client.get("/api/dashboard/stats", headers=auth_headers)
    data = r.json()
    assert data["expiring_in_7_days"] >= 1
    assert data["expiring_in_30_days"] >= 1


@pytest.mark.asyncio
async def test_stats_vacant_without_post(client: AsyncClient, auth_headers: dict):
    # Rooms default has_active_post=False, so vacant rooms should appear
    await make_room(client, auth_headers, status="Trống")
    await make_room(client, auth_headers, status="Trống")
    await make_room(client, auth_headers, status="Đang thuê")

    r = await client.get("/api/dashboard/stats", headers=auth_headers)
    data = r.json()
    assert data["vacant_without_post"] == 2


# ── dashboard/activity tests ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_activity_requires_auth(client: AsyncClient):
    r = await client.get("/api/dashboard/activity")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_activity_empty(client: AsyncClient, auth_headers: dict):
    r = await client.get("/api/dashboard/activity", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "data" in data
    assert data["data"] == []


@pytest.mark.asyncio
async def test_activity_records_room_creation(client: AsyncClient, auth_headers: dict):
    await make_room(client, auth_headers)
    r = await client.get("/api/dashboard/activity", headers=auth_headers)
    assert r.status_code == 200
    entries = r.json()["data"]
    assert len(entries) >= 1
    event_types = [e["event_type"] for e in entries]
    assert "room_created" in event_types


@pytest.mark.asyncio
async def test_activity_records_tenant_creation(client: AsyncClient, auth_headers: dict):
    await make_tenant(client, auth_headers)
    r = await client.get("/api/dashboard/activity", headers=auth_headers)
    entries = r.json()["data"]
    event_types = [e["event_type"] for e in entries]
    assert "tenant_created" in event_types


@pytest.mark.asyncio
async def test_activity_records_contract_created_and_terminated(
    client: AsyncClient, auth_headers: dict
):
    room = await make_room(client, auth_headers)
    tenant_id = await make_tenant(client, auth_headers)
    contract = await make_contract(client, auth_headers, room["id"], tenant_id)

    # Terminate
    term_payload = {"termination_date": date.today().isoformat(), "reason": "Test"}
    r_t = await client.post(
        f"/api/contracts/{contract['id']}/terminate",
        json=term_payload, headers=auth_headers,
    )
    assert r_t.status_code == 200

    r = await client.get("/api/dashboard/activity", headers=auth_headers)
    event_types = [e["event_type"] for e in r.json()["data"]]
    assert "contract_created" in event_types
    assert "contract_terminated" in event_types


@pytest.mark.asyncio
async def test_activity_limit_param(client: AsyncClient, auth_headers: dict):
    # Create 5 rooms to generate 5 activity entries
    for _ in range(5):
        await make_room(client, auth_headers)

    r = await client.get("/api/dashboard/activity?limit=3", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()["data"]) == 3


@pytest.mark.asyncio
async def test_activity_invalid_limit(client: AsyncClient, auth_headers: dict):
    r = await client.get("/api/dashboard/activity?limit=0", headers=auth_headers)
    assert r.status_code == 422

    r = await client.get("/api/dashboard/activity?limit=51", headers=auth_headers)
    assert r.status_code == 422
