"""Tests for the notifications module."""
from datetime import date, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.rooms.models import Room
from app.modules.tenants.models import Tenant
from app.modules.contracts.models import Contract


# ── helpers ──────────────────────────────────────────────────────────────────

async def make_room(client: AsyncClient, auth_headers: dict, status: str = "Trống") -> dict:
    payload = {
        "code": f"P-{status[:3]}-{id(status)}",
        "name": f"Phòng test {status}",
        "floor": "Tầng 1",
        "block": "Khu A",
        "area": 20,
        "rent_price": 3_000_000,
        "deposit": 6_000_000,
        "electricity_price": 3500,
        "water_price": 15000,
        "service_fee": 100_000,
        "max_tenants": 2,
        "status": status,
    }
    resp = await client.post("/api/rooms", json=payload, headers=auth_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def make_tenant(client: AsyncClient, auth_headers: dict) -> str:
    payload = {
        "full_name": "Tenant Test",
        "phone": "0901234567",
        "cccd": "123456789012",
        "gender": "Nam",
        "date_of_birth": "1990-01-01",
        "permanent_address": "123 Đường ABC, Hà Nội",
    }
    resp = await client.post("/api/tenants", json=payload, headers=auth_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


async def make_contract(
    client: AsyncClient, auth_headers: dict, room_id: str, tenant_id: str,
    end_date: str
) -> str:
    payload = {
        "room_id": room_id,
        "tenant_id": tenant_id,
        "start_date": "2024-01-01",
        "end_date": end_date,
        "monthly_rent": 3_000_000,
        "deposit": 6_000_000,
        "billing_cycle": 1,
        "payment_due_day": 5,
    }
    resp = await client.post("/api/contracts", json=payload, headers=auth_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


# ── tests ─────────────────────────────────────────────────────────────────────

async def test_get_count_requires_auth(client: AsyncClient):
    resp = await client.get("/api/notifications/count")
    assert resp.status_code == 401


async def test_list_notifications_requires_auth(client: AsyncClient):
    resp = await client.get("/api/notifications")
    assert resp.status_code == 401


async def test_get_count_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/notifications/count", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["unread"] == 0


async def test_list_notifications_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/notifications", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"] == []
    assert body["total"] == 0


async def test_vacant_room_notification_created(client: AsyncClient, auth_headers: dict):
    """A vacant room with no active post should generate a vacant_room notification."""
    await make_room(client, auth_headers, status="Trống")

    resp = await client.get("/api/notifications", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    types = [n["type"] for n in body["data"]]
    assert "vacant_room" in types


async def test_maintenance_room_notification_created(client: AsyncClient, auth_headers: dict):
    """A room under maintenance should generate a maintenance notification."""
    await make_room(client, auth_headers, status="Bảo trì")

    resp = await client.get("/api/notifications", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    types = [n["type"] for n in body["data"]]
    assert "maintenance" in types


async def test_contract_expiry_notification_created(client: AsyncClient, auth_headers: dict):
    """A contract expiring within 30 days should generate a contract_expiry notification."""
    room = await make_room(client, auth_headers, status="Đã thuê")
    tenant_id = await make_tenant(client, auth_headers)
    end_date = (date.today() + timedelta(days=10)).isoformat()
    await make_contract(client, auth_headers, room["id"], tenant_id, end_date)

    resp = await client.get("/api/notifications", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    types = [n["type"] for n in body["data"]]
    assert "contract_expiry" in types


async def test_count_reflects_unread_notifications(client: AsyncClient, auth_headers: dict):
    """Unread count should match the number of auto-generated notifications."""
    await make_room(client, auth_headers, status="Trống")
    await make_room(client, auth_headers, status="Bảo trì")

    resp = await client.get("/api/notifications/count", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["unread"] >= 2


async def test_mark_notification_read(client: AsyncClient, auth_headers: dict):
    """PATCH /{id}/read should flip read=True and preserve it on next refresh."""
    await make_room(client, auth_headers, status="Trống")

    list_resp = await client.get("/api/notifications", headers=auth_headers)
    notif = list_resp.json()["data"][0]
    notif_id = notif["id"]
    assert notif["read"] is False

    patch_resp = await client.patch(f"/api/notifications/{notif_id}/read", headers=auth_headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["read"] is True

    # After another refresh, read state must be preserved
    list_resp2 = await client.get("/api/notifications", headers=auth_headers)
    notif2 = next(n for n in list_resp2.json()["data"] if n["id"] == notif_id)
    assert notif2["read"] is True


async def test_mark_all_read(client: AsyncClient, auth_headers: dict):
    """POST /mark-all-read should set all notifications to read=True."""
    await make_room(client, auth_headers, status="Trống")
    await make_room(client, auth_headers, status="Bảo trì")

    # Trigger refresh so notifications are created in the DB first
    pre_count = await client.get("/api/notifications/count", headers=auth_headers)
    assert pre_count.json()["unread"] >= 2

    mark_resp = await client.post("/api/notifications/mark-all-read", headers=auth_headers)
    assert mark_resp.status_code == 200
    assert mark_resp.json()["ok"] is True

    count_resp = await client.get("/api/notifications/count", headers=auth_headers)
    assert count_resp.json()["unread"] == 0


async def test_mark_read_not_found(client: AsyncClient, auth_headers: dict):
    """PATCH with nonexistent ID should return 404."""
    import uuid
    fake_id = str(uuid.uuid4())
    resp = await client.patch(f"/api/notifications/{fake_id}/read", headers=auth_headers)
    assert resp.status_code == 404


async def test_filter_by_type(client: AsyncClient, auth_headers: dict):
    """GET /api/notifications?type=maintenance should only return maintenance notifications."""
    await make_room(client, auth_headers, status="Trống")
    await make_room(client, auth_headers, status="Bảo trì")

    resp = await client.get("/api/notifications?type=maintenance", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert all(n["type"] == "maintenance" for n in body["data"])
    assert body["total"] >= 1


async def test_filter_unread(client: AsyncClient, auth_headers: dict):
    """GET /api/notifications?read=false should only return unread notifications."""
    await make_room(client, auth_headers, status="Trống")
    await make_room(client, auth_headers, status="Bảo trì")

    # Trigger refresh so notifications are created in DB first
    pre = await client.get("/api/notifications", headers=auth_headers)
    assert pre.json()["total"] >= 2

    # Mark all read
    await client.post("/api/notifications/mark-all-read", headers=auth_headers)

    resp = await client.get("/api/notifications?read=false", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 0
    assert body["data"] == []
