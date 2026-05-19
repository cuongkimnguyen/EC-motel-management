from httpx import AsyncClient

TENANT_PAYLOAD = {
    "full_name": "Nguyễn Văn A",
    "phone": "0901234567",
    "cccd": "001234567890",
    "gender": "Nam",
    "date_of_birth": "1995-03-15",
    "permanent_address": "45 Phố Huế, Hà Nội",
    "occupation": "Kỹ sư",
}


async def test_list_tenants_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/tenants", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"] == []
    assert body["total"] == 0


async def test_create_tenant(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["full_name"] == "Nguyễn Văn A"
    assert body["phone"] == "0901234567"
    assert body["status"] == "Đã trả phòng"
    assert body["current_room_id"] is None
    assert "password_hash" not in body


async def test_create_tenant_invalid_phone_returns_422(client: AsyncClient, auth_headers: dict):
    bad = {**TENANT_PAYLOAD, "phone": "1234567890"}  # doesn't start with 0
    resp = await client.post("/api/tenants", json=bad, headers=auth_headers)
    assert resp.status_code == 422


async def test_create_tenant_duplicate_phone_returns_409(client: AsyncClient, auth_headers: dict):
    await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    dup = {**TENANT_PAYLOAD, "cccd": "999999999999"}
    resp = await client.post("/api/tenants", json=dup, headers=auth_headers)
    assert resp.status_code == 409
    assert "điện thoại" in resp.json()["detail"]


async def test_create_tenant_duplicate_cccd_returns_409(client: AsyncClient, auth_headers: dict):
    await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    dup = {**TENANT_PAYLOAD, "phone": "0987654321"}
    resp = await client.post("/api/tenants", json=dup, headers=auth_headers)
    assert resp.status_code == 409
    assert "CCCD" in resp.json()["detail"]


async def test_update_tenant(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    tenant_id = create_resp.json()["id"]
    resp = await client.put(
        f"/api/tenants/{tenant_id}",
        json={"full_name": "Nguyễn Văn An", "occupation": "Senior Engineer"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Nguyễn Văn An"


async def test_delete_tenant_no_contract(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    tenant_id = create_resp.json()["id"]
    resp = await client.delete(f"/api/tenants/{tenant_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_list_tenants_requires_auth(client: AsyncClient):
    resp = await client.get("/api/tenants")
    assert resp.status_code == 401
