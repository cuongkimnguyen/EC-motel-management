"""Integration tests for Facebook webhook endpoint."""
import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.conversations.models import ChatConversation, ChatMessage
from app.modules.notifications.models import Notification


# ── helpers ───────────────────────────────────────────────────────────────────

def _make_webhook_body(
    psid: str = "12345",
    page_id: str = "67890",
    mid: str = "mid.test001",
    text: str = "Cho hỏi phòng còn không?",
    timestamp: int | None = None,
) -> dict:
    if timestamp is None:
        timestamp = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
    return {
        "object": "page",
        "entry": [
            {
                "id": page_id,
                "messaging": [
                    {
                        "sender": {"id": psid},
                        "recipient": {"id": page_id},
                        "timestamp": timestamp,
                        "message": {
                            "mid": mid,
                            "text": text,
                        },
                    }
                ],
            }
        ],
    }


# ── webhook verification (GET) ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_webhook_verify_wrong_token(client: AsyncClient):
    r = await client.get(
        "/api/webhooks/facebook",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "wrong_token_xyz",
            "hub.challenge": "abc123",
        },
    )
    assert r.status_code == 403


# ── webhook inbound message processing (POST) ─────────────────────────────────

@pytest.mark.asyncio
async def test_webhook_post_returns_200_immediately(client: AsyncClient):
    body = _make_webhook_body()
    r = await client.post(
        "/api/webhooks/facebook",
        json=body,
        headers={"X-Hub-Signature-256": "sha256=fakesig"},
    )
    # FACEBOOK_WEBHOOK_ENABLED=false skips HMAC check
    assert r.status_code == 200
    assert r.json() == "EVENT_RECEIVED"


@pytest.mark.asyncio
async def test_webhook_creates_conversation_and_message(
    client: AsyncClient, db: AsyncSession
):
    mid = f"mid.{uuid.uuid4().hex}"
    body = _make_webhook_body(psid="user_001", page_id="page_001", mid=mid, text="xin chào")

    r = await client.post("/api/webhooks/facebook", json=body)
    assert r.status_code == 200

    # BackgroundTasks complete synchronously in ASGITransport test client
    convs = await db.execute(
        select(ChatConversation).where(ChatConversation.psid == "user_001")
    )
    conv = convs.scalar_one_or_none()
    assert conv is not None
    assert conv.page_id == "page_001"
    assert conv.unread_count == 1

    msgs = await db.execute(
        select(ChatMessage).where(ChatMessage.meta_mid == mid)
    )
    msg = msgs.scalar_one_or_none()
    assert msg is not None
    assert msg.content == "xin chào"
    assert msg.direction == "inbound"


@pytest.mark.asyncio
async def test_webhook_deduplication(client: AsyncClient, db: AsyncSession):
    """Same mid delivered twice → only one ChatMessage row."""
    mid = f"mid.{uuid.uuid4().hex}"
    body = _make_webhook_body(mid=mid)

    await client.post("/api/webhooks/facebook", json=body)
    await client.post("/api/webhooks/facebook", json=body)

    msgs = await db.execute(
        select(ChatMessage).where(ChatMessage.meta_mid == mid)
    )
    assert len(msgs.scalars().all()) == 1


@pytest.mark.asyncio
async def test_webhook_upserts_conversation_on_second_message(
    client: AsyncClient, db: AsyncSession
):
    """Two messages from same PSID → single conversation with unread_count=2."""
    psid = "user_upsert_test"
    page_id = "page_upsert_test"

    await client.post(
        "/api/webhooks/facebook",
        json=_make_webhook_body(psid=psid, page_id=page_id, mid="mid.a1"),
    )
    await client.post(
        "/api/webhooks/facebook",
        json=_make_webhook_body(psid=psid, page_id=page_id, mid="mid.a2", text="hello again"),
    )

    convs = await db.execute(
        select(ChatConversation).where(
            ChatConversation.psid == psid, ChatConversation.page_id == page_id
        )
    )
    all_convs = convs.scalars().all()
    assert len(all_convs) == 1
    assert all_convs[0].unread_count == 2


@pytest.mark.asyncio
async def test_webhook_creates_notification(client: AsyncClient, db: AsyncSession):
    """Inbound message should create a new_message notification."""
    mid = f"mid.{uuid.uuid4().hex}"
    body = _make_webhook_body(mid=mid, psid="notif_user")

    await client.post("/api/webhooks/facebook", json=body)

    notifs = await db.execute(
        select(Notification).where(Notification.type == "new_message")
    )
    notif = notifs.scalar_one_or_none()
    assert notif is not None
    assert notif.read is False


@pytest.mark.asyncio
async def test_webhook_second_message_resets_notification_unread(
    client: AsyncClient, db: AsyncSession
):
    """Second inbound on same conversation → still one notification, read=False."""
    psid = "notif_reset_user"
    page_id = "notif_reset_page"

    await client.post(
        "/api/webhooks/facebook",
        json=_make_webhook_body(psid=psid, page_id=page_id, mid="mid.b1"),
    )

    # Admin marks it read
    notif_result = await db.execute(
        select(Notification).where(Notification.type == "new_message")
    )
    notif = notif_result.scalar_one()
    notif.read = True
    await db.commit()

    # Second message arrives
    await client.post(
        "/api/webhooks/facebook",
        json=_make_webhook_body(psid=psid, page_id=page_id, mid="mid.b2", text="are you there?"),
    )

    # Expire identity map so we read fresh from DB (background task committed via a different session)
    db.expire_all()
    notifs = await db.execute(
        select(Notification).where(Notification.type == "new_message")
    )
    all_notifs = notifs.scalars().all()
    assert len(all_notifs) == 1  # still one, upserted
    assert all_notifs[0].read is False  # reset to unread


@pytest.mark.asyncio
async def test_webhook_ignores_echo_messages(client: AsyncClient, db: AsyncSession):
    """is_echo=True messages (our own outbound echoed back) should be ignored."""
    body = {
        "object": "page",
        "entry": [
            {
                "id": "page_echo",
                "messaging": [
                    {
                        "sender": {"id": "page_echo"},
                        "recipient": {"id": "user_echo"},
                        "timestamp": 1716000000000,
                        "message": {
                            "mid": "mid.echo001",
                            "text": "Reply from page",
                            "is_echo": True,
                        },
                    }
                ],
            }
        ],
    }
    r = await client.post("/api/webhooks/facebook", json=body)
    assert r.status_code == 200

    msgs = await db.execute(select(ChatMessage))
    assert msgs.scalars().all() == []


@pytest.mark.asyncio
async def test_webhook_ignores_non_page_object(client: AsyncClient, db: AsyncSession):
    body = {"object": "user", "entry": []}
    r = await client.post("/api/webhooks/facebook", json=body)
    assert r.status_code == 200
    msgs = await db.execute(select(ChatMessage))
    assert msgs.scalars().all() == []
