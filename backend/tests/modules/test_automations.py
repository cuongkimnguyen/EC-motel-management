import uuid
from httpx import AsyncClient

AUTOMATION_PAYLOAD = {
    "name": "Nhắc nhở thanh toán",
    "description": "Nhắc hàng tháng",
    "trigger_type": "schedule",
    "frequency": "monthly",
    "run_time": "08:00",
    "module": "tenants",
    "action": "Gửi thông báo cho khách thuê chưa thanh toán",
    "enable_immediately": True,
}


async def test_create_automation(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/automations", json=AUTOMATION_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == AUTOMATION_PAYLOAD["name"]
    assert body["status"] == "active"
    assert body["is_enabled"] is True


async def test_list_automations_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/automations", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


async def test_list_automations_with_filter(client: AsyncClient, auth_headers: dict):
    await client.post("/api/automations", json=AUTOMATION_PAYLOAD, headers=auth_headers)
    resp = await client.get("/api/automations?module=tenants", headers=auth_headers)
    assert resp.json()["total"] == 1
    resp2 = await client.get("/api/automations?module=rooms", headers=auth_headers)
    assert resp2.json()["total"] == 0


async def test_get_automation_by_id(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/automations", json=AUTOMATION_PAYLOAD, headers=auth_headers)
    auto_id = create_resp.json()["id"]
    resp = await client.get(f"/api/automations/{auto_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == auto_id


async def test_get_automation_unknown_id_returns_404(client: AsyncClient, auth_headers: dict):
    resp = await client.get(f"/api/automations/{uuid.uuid4()}", headers=auth_headers)
    assert resp.status_code == 404


async def test_update_automation(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/automations", json=AUTOMATION_PAYLOAD, headers=auth_headers)
    auto_id = create_resp.json()["id"]
    resp = await client.put(f"/api/automations/{auto_id}", json={"name": "Updated name"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated name"


async def test_toggle_automation_disables(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/automations", json=AUTOMATION_PAYLOAD, headers=auth_headers)
    auto_id = create_resp.json()["id"]
    resp = await client.patch(f"/api/automations/{auto_id}/toggle", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["is_enabled"] is False
    assert resp.json()["status"] == "paused"


async def test_toggle_automation_re_enables(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/automations", json=AUTOMATION_PAYLOAD, headers=auth_headers)
    auto_id = create_resp.json()["id"]
    await client.patch(f"/api/automations/{auto_id}/toggle", headers=auth_headers)
    resp = await client.patch(f"/api/automations/{auto_id}/toggle", headers=auth_headers)
    assert resp.json()["is_enabled"] is True
    assert resp.json()["status"] == "active"


async def test_run_automation_creates_task_history(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/automations", json=AUTOMATION_PAYLOAD, headers=auth_headers)
    auto_id = create_resp.json()["id"]
    resp = await client.post(f"/api/automations/{auto_id}/run", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"


async def test_automation_logs(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/automations", json=AUTOMATION_PAYLOAD, headers=auth_headers)
    auto_id = create_resp.json()["id"]
    await client.post(f"/api/automations/{auto_id}/run", headers=auth_headers)
    resp = await client.get(f"/api/automations/{auto_id}/logs", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


async def test_delete_automation(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/automations", json=AUTOMATION_PAYLOAD, headers=auth_headers)
    auto_id = create_resp.json()["id"]
    del_resp = await client.delete(f"/api/automations/{auto_id}", headers=auth_headers)
    assert del_resp.status_code == 204
    get_resp = await client.get(f"/api/automations/{auto_id}", headers=auth_headers)
    assert get_resp.status_code == 404
