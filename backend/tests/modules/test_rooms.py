from httpx import AsyncClient


ROOM_PAYLOAD = {
    "code": "P101",
    "name": "Phòng 101",
    "floor": "Tầng 1",
    "block": "Khu A",
    "area": 25,
    "rent_price": 3_500_000,
    "deposit": 7_000_000,
    "electricity_price": 3500,
    "water_price": 15000,
    "service_fee": 100_000,
    "max_tenants": 2,
    "status": "Trống",
    "description": "Test room",
}


async def test_list_rooms_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/rooms", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"] == []
    assert body["total"] == 0
    assert body["page"] == 1


async def test_create_room(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["code"] == "P101"
    assert body["status"] == "Trống"
    assert body["current_tenants"] == 0
    assert "id" in body


async def test_create_room_duplicate_code_returns_409(client: AsyncClient, auth_headers: dict):
    await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 409


async def test_list_rooms_with_status_filter(client: AsyncClient, auth_headers: dict):
    await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    resp = await client.get("/api/rooms?status=Trống", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    resp2 = await client.get("/api/rooms?status=Bảo+trì", headers=auth_headers)
    assert resp2.json()["total"] == 0


async def test_update_room(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    room_id = create_resp.json()["id"]
    resp = await client.put(
        f"/api/rooms/{room_id}",
        json={"name": "Phòng 101 Updated", "area": 30},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Phòng 101 Updated"
    assert resp.json()["area"] == 30


async def test_delete_room_vacant(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    room_id = create_resp.json()["id"]
    resp = await client.delete(f"/api/rooms/{room_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_update_room_status(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    room_id = create_resp.json()["id"]
    resp = await client.patch(
        f"/api/rooms/{room_id}/status",
        json={"status": "Bảo trì", "reason": "Sửa chữa"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Bảo trì"


async def test_list_rooms_requires_auth(client: AsyncClient):
    resp = await client.get("/api/rooms")
    assert resp.status_code == 401
