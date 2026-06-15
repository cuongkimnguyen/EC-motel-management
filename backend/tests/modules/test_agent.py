import uuid
from unittest.mock import MagicMock, patch
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.agent.models import AgentConversation


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


async def test_history_window_returns_latest_n_messages(db: AsyncSession, admin_user):
    """Regression: get_history() must return the LATEST limit messages, not the first N.

    With 25 messages and limit=20, the result must be messages 5–24 (indices 5-24),
    NOT messages 0–19. The returned list must still be in chronological order (oldest first).
    """
    from datetime import datetime, timezone, timedelta
    from app.modules.agent.repository import AgentRepository

    session_id = str(uuid.uuid4())
    repo = AgentRepository(db)
    base_time = datetime.now(timezone.utc)

    # Insert 25 messages with explicit, distinct created_at values so ordering is stable
    for i in range(25):
        db.add(AgentConversation(
            session_id=session_id,
            role="user",
            content=f"message-{i}",
            message_type="text",
            user_id=admin_user.id,
            created_at=base_time + timedelta(seconds=i),
        ))
    await db.flush()

    history = await repo.get_history(session_id, limit=20)

    assert len(history) == 20
    # Must be the LATEST 20 (messages 5–24), returned oldest-first
    contents = [m.content for m in history]
    assert contents[0] == "message-5"
    assert contents[-1] == "message-24"
    # message-0 through message-4 must NOT be in the window
    assert "message-0" not in contents
    assert "message-4" not in contents
