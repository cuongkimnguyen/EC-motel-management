import uuid
from unittest.mock import MagicMock, patch
from httpx import AsyncClient


async def test_get_agent_overview(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/agent/overview", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "today_tasks" in body
    assert "running_automations" in body
    assert "pending_alerts" in body
    assert "overdue_tenants" in body
    assert "expiring_contracts" in body


async def test_get_agent_alerts(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/agent/alerts", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_get_agent_task_history(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/agent/task-history", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "data" in body
    assert "total" in body


async def test_chat_returns_reply_and_session_id(client: AsyncClient, auth_headers: dict):
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text="Xin chào! Tôi có thể giúp gì cho bạn?")]

    mock_client = MagicMock()
    mock_client.messages.create = MagicMock(return_value=mock_message)

    with patch("app.modules.agent.service.anthropic.Anthropic", return_value=mock_client):
        resp = await client.post(
            "/api/agent/chat",
            json={"message": "xin chào"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    body = resp.json()
    assert "session_id" in body
    assert body["reply"]["role"] == "assistant"
    assert "Xin chào" in body["reply"]["content"]


async def test_chat_with_existing_session_id(client: AsyncClient, auth_headers: dict):
    session_id = str(uuid.uuid4())
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text="Phản hồi từ AI")]
    mock_client = MagicMock()
    mock_client.messages.create = MagicMock(return_value=mock_message)

    with patch("app.modules.agent.service.anthropic.Anthropic", return_value=mock_client):
        resp = await client.post(
            "/api/agent/chat",
            json={"message": "hỏi tiếp theo", "session_id": session_id},
            headers=auth_headers,
        )
    assert resp.json()["session_id"] == session_id


async def test_chat_fallback_on_llm_error(client: AsyncClient, auth_headers: dict):
    with patch("app.modules.agent.service.anthropic.Anthropic", side_effect=Exception("API error")):
        resp = await client.post(
            "/api/agent/chat",
            json={"message": "test"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    assert "sự cố" in resp.json()["reply"]["content"]


async def test_agent_requires_auth(client: AsyncClient):
    resp = await client.get("/api/agent/overview")
    assert resp.status_code == 401
