"""Integration tests for the conversations (leads) admin API."""
import uuid
from datetime import datetime, timezone, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.conversations.models import ChatConversation, ChatMessage


# ── helpers ───────────────────────────────────────────────────────────────────

async def seed_conversation(
    db: AsyncSession,
    psid: str = "test_psid_001",
    page_id: str = "test_page_001",
    lead_status: str = "Mới",
    unread_count: int = 0,
    last_customer_message_at: datetime | None = None,
) -> ChatConversation:
    conv = ChatConversation(
        psid=psid,
        page_id=page_id,
        source="Facebook Page",
        lead_status=lead_status,
        unread_count=unread_count,
        last_customer_message_at=last_customer_message_at,
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


async def seed_message(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    direction: str = "inbound",
    content: str = "xin chào",
    meta_mid: str | None = None,
) -> ChatMessage:
    msg = ChatMessage(
        conversation_id=conversation_id,
        direction=direction,
        content=content,
        meta_mid=meta_mid or f"mid.{uuid.uuid4().hex}",
        status="delivered",
        sender_type="customer" if direction == "inbound" else "admin",
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


# ── auth guard ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_requires_auth(client: AsyncClient):
    r = await client.get("/api/conversations")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_stats_requires_auth(client: AsyncClient):
    r = await client.get("/api/conversations/stats")
    assert r.status_code == 401


# ── list conversations ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_empty(client: AsyncClient, auth_headers: dict):
    r = await client.get("/api/conversations", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["data"] == []


@pytest.mark.asyncio
async def test_list_returns_conversations(
    client: AsyncClient, auth_headers: dict, db: AsyncSession
):
    await seed_conversation(db, psid="p1", lead_status="Mới")
    await seed_conversation(db, psid="p2", lead_status="Đang tư vấn")

    r = await client.get("/api/conversations", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 2


@pytest.mark.asyncio
async def test_list_filter_by_lead_status(
    client: AsyncClient, auth_headers: dict, db: AsyncSession
):
    await seed_conversation(db, psid="p1", lead_status="Mới")
    await seed_conversation(db, psid="p2", lead_status="Đã chốt")

    r = await client.get(
        "/api/conversations?lead_status=Đã chốt", headers=auth_headers
    )
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["data"][0]["lead_status"] == "Đã chốt"


# ── get conversation detail ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_conversation_detail(
    client: AsyncClient, auth_headers: dict, db: AsyncSession
):
    conv = await seed_conversation(db, unread_count=3)
    await seed_message(db, conv.id, content="xin chào")

    r = await client.get(f"/api/conversations/{conv.id}", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == str(conv.id)
    assert len(data["messages"]) == 1
    assert data["messages"][0]["content"] == "xin chào"
    # unread should be reset to 0 after admin opens
    assert data["unread_count"] == 0


@pytest.mark.asyncio
async def test_get_conversation_not_found(client: AsyncClient, auth_headers: dict):
    r = await client.get(f"/api/conversations/{uuid.uuid4()}", headers=auth_headers)
    assert r.status_code == 404


# ── patch conversation ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_patch_lead_status(
    client: AsyncClient, auth_headers: dict, db: AsyncSession
):
    conv = await seed_conversation(db)
    assert conv.lead_status == "Mới"

    r = await client.patch(
        f"/api/conversations/{conv.id}",
        json={"lead_status": "Quan tâm cao"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["lead_status"] == "Quan tâm cao"


@pytest.mark.asyncio
async def test_patch_multiple_fields(
    client: AsyncClient, auth_headers: dict, db: AsyncSession
):
    conv = await seed_conversation(db)

    r = await client.patch(
        f"/api/conversations/{conv.id}",
        json={
            "customer_name": "Nguyễn Văn A",
            "phone": "0901234567",
            "tags": ["quan tâm", "căn hộ nhỏ"],
            "budget": 3_000_000,
        },
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["customer_name"] == "Nguyễn Văn A"
    assert data["phone"] == "0901234567"
    assert "quan tâm" in data["tags"]
    assert data["budget"] == 3_000_000


# ── outbound send (mocked) ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_send_message_success(
    client: AsyncClient, auth_headers: dict, db: AsyncSession, monkeypatch
):
    conv = await seed_conversation(
        db,
        last_customer_message_at=datetime.now(tz=timezone.utc) - timedelta(hours=1),
    )
    captured: dict = {}

    async def mock_send(psid, text, page_access_token, graph_api_version, messaging_type, tag):
        captured["messaging_type"] = messaging_type
        captured["tag"] = tag
        return "mid.mock123"

    monkeypatch.setattr("app.modules.conversations.service.meta_send_api.send_message", mock_send)
    # Enable webhook so service actually calls mock_send
    monkeypatch.setattr("app.modules.conversations.service.settings.FACEBOOK_WEBHOOK_ENABLED", True)

    r = await client.post(
        f"/api/conversations/{conv.id}/messages",
        json={"text": "Phòng còn trống!"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["direction"] == "outbound"
    assert data["status"] == "sent"
    assert data["content"] == "Phòng còn trống!"
    # Within 24h → should use RESPONSE type
    assert captured["messaging_type"] == "RESPONSE"
    assert captured["tag"] is None


@pytest.mark.asyncio
async def test_send_message_uses_human_agent_tag_when_window_expired(
    client: AsyncClient, auth_headers: dict, db: AsyncSession, monkeypatch
):
    conv = await seed_conversation(
        db,
        last_customer_message_at=datetime.now(tz=timezone.utc) - timedelta(hours=25),
    )
    captured: dict = {}

    async def mock_send(psid, text, page_access_token, graph_api_version, messaging_type, tag):
        captured["messaging_type"] = messaging_type
        captured["tag"] = tag
        return "mid.mock456"

    monkeypatch.setattr("app.modules.conversations.service.meta_send_api.send_message", mock_send)
    monkeypatch.setattr("app.modules.conversations.service.settings.FACEBOOK_WEBHOOK_ENABLED", True)

    r = await client.post(
        f"/api/conversations/{conv.id}/messages",
        json={"text": "Vẫn còn phòng!"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert captured["messaging_type"] == "MESSAGE_TAG"
    assert captured["tag"] == "HUMAN_AGENT"


@pytest.mark.asyncio
async def test_send_message_failed_returns_502(
    client: AsyncClient, auth_headers: dict, db: AsyncSession, monkeypatch
):
    import httpx as _httpx

    conv = await seed_conversation(
        db,
        last_customer_message_at=datetime.now(tz=timezone.utc) - timedelta(hours=1),
    )

    async def mock_send_fail(*args, **kwargs):
        request = _httpx.Request("POST", "https://graph.facebook.com")
        response = _httpx.Response(500, request=request)
        raise _httpx.HTTPStatusError("server error", request=request, response=response)

    monkeypatch.setattr("app.modules.conversations.service.meta_send_api.send_message", mock_send_fail)
    monkeypatch.setattr("app.modules.conversations.service.settings.FACEBOOK_WEBHOOK_ENABLED", True)

    r = await client.post(
        f"/api/conversations/{conv.id}/messages",
        json={"text": "Will fail"},
        headers=auth_headers,
    )
    assert r.status_code == 502


# ── stats ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_stats_empty(client: AsyncClient, auth_headers: dict):
    r = await client.get("/api/conversations/stats", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["unread"] == 0
    assert data["by_lead_status"] == {}


@pytest.mark.asyncio
async def test_stats_with_data(
    client: AsyncClient, auth_headers: dict, db: AsyncSession
):
    await seed_conversation(db, psid="p1", lead_status="Mới", unread_count=2)
    await seed_conversation(db, psid="p2", lead_status="Mới", unread_count=0)
    await seed_conversation(db, psid="p3", lead_status="Đã chốt", unread_count=1)

    r = await client.get("/api/conversations/stats", headers=auth_headers)
    data = r.json()
    assert data["total"] == 3
    assert data["unread"] == 2  # p1 and p3
    assert data["by_lead_status"]["Mới"] == 2
    assert data["by_lead_status"]["Đã chốt"] == 1
