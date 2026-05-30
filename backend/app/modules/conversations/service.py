from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.core.config import settings
from app.integrations import meta_send_api
from app.modules.conversations.repository import ConversationRepository
from app.modules.conversations.schemas import (
    ChatConversationDetail,
    ChatConversationSummary,
    ChatMessageResponse,
    ConversationStats,
    ConversationUpdate,
)
from app.modules.notifications.repository import NotificationRepository


class ConversationService:
    def __init__(self, db: AsyncSession):
        self.repo = ConversationRepository(db)
        self.notif_repo = NotificationRepository(db)

    async def list_conversations(self, params: PaginationParams, **filters) -> dict:
        convs, total = await self.repo.list_conversations(
            params.page, params.limit, **filters
        )
        data = [ChatConversationSummary.model_validate(c) for c in convs]
        return make_paginated_response(data, total, params)

    async def get_conversation(self, conversation_id: str) -> ChatConversationDetail:
        conv = await self.repo.get_with_messages(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Cuộc hội thoại không tồn tại")
        # Reset unread when admin opens conversation
        if conv.unread_count > 0:
            await self.repo.reset_unread(conv.id)
            conv.unread_count = 0
        # Sort messages by sent_at ascending
        conv.messages.sort(key=lambda m: m.sent_at)
        return ChatConversationDetail.model_validate(conv)

    async def update_conversation(
        self, conversation_id: str, payload: ConversationUpdate
    ) -> ChatConversationDetail:
        conv = await self.repo.get_by_id(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Cuộc hội thoại không tồn tại")
        updates = payload.model_dump(exclude_none=True)
        if updates:
            await self.repo.update_conversation(conv.id, **updates)
        return await self.get_conversation(conversation_id)

    async def send_outbound_message(
        self, conversation_id: str, text: str
    ) -> ChatMessageResponse:
        conv = await self.repo.get_by_id(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Cuộc hội thoại không tồn tại")

        # Determine messaging type based on 24h window
        now = datetime.now(tz=timezone.utc)
        if (
            conv.last_customer_message_at
            and (now - conv.last_customer_message_at) < timedelta(hours=24)
        ):
            messaging_type = "RESPONSE"
            tag = None
        else:
            messaging_type = "MESSAGE_TAG"
            tag = "HUMAN_AGENT"

        # Gate outbound send on token presence — FACEBOOK_WEBHOOK_ENABLED controls inbound only.
        if not settings.FACEBOOK_PAGE_ACCESS_TOKEN:
            raise HTTPException(
                status_code=503,
                detail="Meta Send API chưa được cấu hình (FACEBOOK_PAGE_ACCESS_TOKEN còn trống)",
            )

        meta_mid: str | None = None
        error_detail: str | None = None
        status = "sent"
        try:
            meta_mid = await meta_send_api.send_message(
                psid=conv.psid,
                text=text,
                page_access_token=settings.FACEBOOK_PAGE_ACCESS_TOKEN,
                graph_api_version=settings.META_GRAPH_API_VERSION,
                messaging_type=messaging_type,
                tag=tag,
            )
        except (httpx.HTTPStatusError, httpx.TransportError) as exc:
            error_detail = str(exc)
            status = "failed"

        sent_at = datetime.now(tz=timezone.utc)
        msg = await self.repo.insert_message(
            conversation_id=conv.id,
            direction="outbound",
            content=text,
            meta_mid=meta_mid,
            sent_at=sent_at,
            status=status,
            sender_type="admin",
            error_detail=error_detail,
        )
        await self.repo.update_after_outbound(conv.id, preview=text, sent_at=sent_at)

        if status == "failed":
            raise HTTPException(
                status_code=502,
                detail={"message": "Gửi tin nhắn thất bại", "error": error_detail or ""},
            )

        return ChatMessageResponse.model_validate(msg)

    async def get_stats(self) -> ConversationStats:
        stats = await self.repo.get_stats()
        return ConversationStats(**stats)

    async def process_inbound_message(
        self,
        psid: str,
        page_id: str,
        meta_mid: str,
        text: str | None,
        sent_at: datetime,
    ) -> None:
        """Upsert conversation, insert message, update summary, trigger notification."""
        # Idempotency: skip if mid already processed
        if await self.repo.message_exists_by_mid(meta_mid):
            return

        conv = await self.repo.upsert_conversation(
            psid=psid, page_id=page_id, source="Facebook Page"
        )
        preview = text or "[attachment]"

        await self.repo.insert_message(
            conversation_id=conv.id,
            direction="inbound",
            content=text,
            meta_mid=meta_mid,
            sent_at=sent_at,
            status="delivered",
            sender_type="customer",
        )
        await self.repo.update_after_inbound(conv.id, preview=preview, sent_at=sent_at)

        # Upsert in-app notification — reset_read=True so admin is re-alerted on each new message
        await self.notif_repo.upsert(
            type="new_message",
            reference_id=str(conv.id),
            title="Tin nhắn mới từ Facebook",
            message=preview[:80],
            priority="medium",
            reset_read=True,
        )
