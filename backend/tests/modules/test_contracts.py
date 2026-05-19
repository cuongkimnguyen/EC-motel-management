from datetime import date, timedelta

from httpx import AsyncClient


ROOM_PAYLOAD = {
    "code": "C101",
    "name": "Phòng C101",
    "floor": "Tầng 1",
    "block": "Khu C",
    "area": 25,
    "rent_price": 3_500_000,
    "deposit": 7_000_000,
    "electricity_price": 3500,
    "water_price": 15000,
    "service_fee": 100_000,
    "max_tenants": 2,
}

TENANT_PAYLOAD = {
    "full_name": "Trần Thị B",
    "phone": "0912345678",
    "cccd": "098765432109",
    "gender": "Nữ",
    "date_of_birth": "1998-06-20",
    "permanent_address": "12 Nguyễn Huệ, TP.HCM",
}


def future_date(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


async def create_room_and_tenant(client, auth_headers):
    room_resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    tenant_resp = await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    return room_resp.json()["id"], tenant_resp.json()["id"]


async def test_create_contract_updates_room_and_tenant(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    payload = {
        "room_id": room_id,
        "tenant_id": tenant_id,
        "start_date": future_date(0),
        "end_date": future_date(365),
        "monthly_rent": 3_500_000,
        "deposit": 7_000_000,
        "billing_cycle": 1,
        "payment_due_day": 5,
    }
    resp = await client.post("/api/contracts", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "Đang hiệu lực"
    assert body["days_until_expiry"] is not None
    assert body["room_code"] == "C101"
    assert body["tenant_name"] == "Trần Thị B"
    assert body["code"].startswith("HĐ-")

    room_resp = await client.get("/api/rooms", headers=auth_headers)
    our_room = next(r for r in room_resp.json()["data"] if r["id"] == room_id)
    assert our_room["status"] == "Đang thuê"

    tenant_resp = await client.get("/api/tenants", headers=auth_headers)
    our_tenant = next(t for t in tenant_resp.json()["data"] if t["id"] == tenant_id)
    assert our_tenant["current_room_id"] == room_id
    assert our_tenant["status"] == "Đang thuê"


async def test_create_contract_on_occupied_room_returns_409(
    client: AsyncClient, auth_headers: dict
):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    payload = {
        "room_id": room_id,
        "tenant_id": tenant_id,
        "start_date": future_date(0),
        "end_date": future_date(365),
        "monthly_rent": 3_500_000,
        "deposit": 7_000_000,
        "billing_cycle": 1,
        "payment_due_day": 5,
    }
    await client.post("/api/contracts", json=payload, headers=auth_headers)

    second_tenant = await client.post(
        "/api/tenants",
        json={**TENANT_PAYLOAD, "phone": "0998877665", "cccd": "111111111111"},
        headers=auth_headers,
    )
    payload2 = {**payload, "tenant_id": second_tenant.json()["id"]}
    resp = await client.post("/api/contracts", json=payload2, headers=auth_headers)
    assert resp.status_code == 409


async def test_list_contracts_with_status_filter(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(365),
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )

    resp = await client.get("/api/contracts?status=Đang+hiệu+lực", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    resp2 = await client.get("/api/contracts?status=Đã+chấm+dứt", headers=auth_headers)
    assert resp2.json()["total"] == 0


async def test_terminate_contract_frees_room_and_tenant(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    create_resp = await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(365),
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )
    contract_id = create_resp.json()["id"]

    resp = await client.post(
        f"/api/contracts/{contract_id}/terminate",
        json={"termination_date": future_date(1), "reason": "Khách chuyển đi"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Đã chấm dứt"
    assert resp.json()["days_until_expiry"] is None

    room_resp = await client.get("/api/rooms", headers=auth_headers)
    our_room = next(r for r in room_resp.json()["data"] if r["id"] == room_id)
    assert our_room["status"] == "Trống"

    tenant_resp = await client.get("/api/tenants", headers=auth_headers)
    our_tenant = next(t for t in tenant_resp.json()["data"] if t["id"] == tenant_id)
    assert our_tenant["status"] == "Đã trả phòng"
    assert our_tenant["current_room_id"] is None


async def test_renew_contract(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    create_resp = await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(30),
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )
    contract_id = create_resp.json()["id"]

    renew_resp = await client.post(
        f"/api/contracts/{contract_id}/renew",
        json={
            "new_start_date": future_date(31),
            "new_end_date": future_date(365),
            "monthly_rent": 3_600_000,
            "deposit": 7_200_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )
    assert renew_resp.status_code == 200
    body = renew_resp.json()
    assert "old_contract" in body
    assert "new_contract" in body
    assert body["new_contract"]["monthly_rent"] == 3_600_000
    assert body["new_contract"]["code"] != body["old_contract"]["code"]


async def test_delete_active_contract_returns_409(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    create_resp = await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(365),
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )
    contract_id = create_resp.json()["id"]
    resp = await client.delete(f"/api/contracts/{contract_id}", headers=auth_headers)
    assert resp.status_code == 409


async def test_delete_terminated_contract(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    create_resp = await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(365),
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )
    contract_id = create_resp.json()["id"]

    await client.post(
        f"/api/contracts/{contract_id}/terminate",
        json={"termination_date": future_date(1)},
        headers=auth_headers,
    )
    resp = await client.delete(f"/api/contracts/{contract_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_list_contracts_requires_auth(client: AsyncClient):
    resp = await client.get("/api/contracts")
    assert resp.status_code == 401
