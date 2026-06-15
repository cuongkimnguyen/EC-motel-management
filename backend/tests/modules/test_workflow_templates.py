import uuid
from httpx import AsyncClient


async def test_list_workflow_templates_returns_6_builtin(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/workflow-templates", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 6
    names = [t["name"] for t in body]
    assert "Nhắc nhở thanh toán hàng tháng" in names


async def test_use_template_returns_template_detail(client: AsyncClient, auth_headers: dict):
    # First get list to grab an id
    list_resp = await client.get("/api/workflow-templates", headers=auth_headers)
    template_id = list_resp.json()[0]["id"]
    resp = await client.post(f"/api/workflow-templates/{template_id}/use", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == template_id


async def test_use_template_unknown_id_returns_404(client: AsyncClient, auth_headers: dict):
    resp = await client.post(f"/api/workflow-templates/{uuid.uuid4()}/use", headers=auth_headers)
    assert resp.status_code == 404


async def test_list_templates_requires_auth(client: AsyncClient):
    resp = await client.get("/api/workflow-templates")
    assert resp.status_code == 401
