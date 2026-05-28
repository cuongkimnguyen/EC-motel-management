import uuid
from datetime import datetime

from sqlalchemy import func, or_, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.conversations.models import ChatConversation, ChatMessage


class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert_conversation(
        self, psid: str, page_id: str, source: str = "Facebook Page"
    ) -> ChatConversation:
        """Insert conversation or touch updated_at on conflict; return the row."""
        stmt = (
            pg_insert(ChatConversation)
            .values(id=uuid.uuid4(), psid=psid, page_id=page_id, source=source)
            .on_conflict_do_update(
                constraint="uq_conversation_psid_page",
                set_={"updated_at": func.now()},
            )
        )
        await self.db.execute(stmt)
        await self.db.flush()
        result = await self.db.execute(
            select(ChatConversation).where(
                ChatConversation.psid == psid,
                ChatConversation.page_id == page_id,
            )
        )
        return result.scalar_one()

    async def insert_message(
        self,
        conversation_id: uuid.UUID,
        direction: str,
        content: str | None = None,
        meta_mid: str | None = None,
        sent_at: datetime | None = None,
        status: str = "delivered",
        sender_type: str = "customer",
        error_detail: str | None = None,
        sender_name: str | None = None,
    ) -> ChatMessage:
        msg = ChatMessage(
            conversation_id=conversation_id,
            direction=direction,
            content=content,
            meta_mid=meta_mid,
            sent_at=sent_at or datetime.utcnow(),
            status=status,
            sender_type=sender_type,
            error_detail=error_detail,
            sender_name=sender_name,
        )
        self.db.add(msg)
        await self.db.flush()
        await self.db.refresh(msg)
        return msg

    async def message_exists_by_mid(self, meta_mid: str) -> bool:
        result = await self.db.execute(
            select(ChatMessage.id).where(ChatMessage.meta_mid == meta_mid)
        )
        return result.scalar_one_or_none() is not None

    async def update_after_inbound(
        self, conversation_id: uuid.UUID, preview: str, sent_at: datetime
    ) -> None:
        await self.db.execute(
            update(ChatConversation)
            .where(ChatConversation.id == conversation_id)
            .values(
                last_message=preview[:200],
                last_message_at=sent_at,
                last_customer_message_at=sent_at,
                unread_count=ChatConversation.unread_count + 1,
                updated_at=func.now(),
            )
        )
        await self.db.flush()

    async def update_after_outbound(
        self, conversation_id: uuid.UUID, preview: str, sent_at: datetime
    ) -> None:
        await self.db.execute(
            update(ChatConversation)
            .where(ChatConversation.id == conversation_id)
            .values(
                last_message=preview[:200],
                last_message_at=sent_at,
                updated_at=func.now(),
            )
        )
        await self.db.flush()

    async def get_by_id(self, conversation_id: str | uuid.UUID) -> ChatConversation | None:
        result = await self.db.execute(
            select(ChatConversation).where(ChatConversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def get_with_messages(
        self, conversation_id: str | uuid.UUID
    ) -> ChatConversation | None:
        result = await self.db.execute(
            select(ChatConversation)
            .options(selectinload(ChatConversation.messages))
            .where(ChatConversation.id == conversation_id)
        )
        return result.scalar_one_or_none()

    async def reset_unread(self, conversation_id: uuid.UUID) -> None:
        await self.db.execute(
            update(ChatConversation)
            .where(ChatConversation.id == conversation_id)
            .values(unread_count=0)
        )
        await self.db.flush()

    async def update_conversation(
        self, conversation_id: uuid.UUID, **fields
    ) -> ChatConversation | None:
        await self.db.execute(
            update(ChatConversation)
            .where(ChatConversation.id == conversation_id)
            .values(**fields, updated_at=func.now())
        )
        await self.db.flush()
        return await self.get_by_id(conversation_id)

    async def list_conversations(
        self,
        page: int,
        limit: int,
        lead_status: str | None = None,
        assignee: str | None = None,
        search: str | None = None,
    ) -> tuple[list[ChatConversation], int]:
        q = select(ChatConversation)
        if lead_status:
            q = q.where(ChatConversation.lead_status == lead_status)
        if assignee:
            q = q.where(ChatConversation.assignee == assignee)
        if search:
            pattern = f"%{search}%"
            q = q.where(
                or_(
                    ChatConversation.customer_name.ilike(pattern),
                    ChatConversation.phone.ilike(pattern),
                    ChatConversation.last_message.ilike(pattern),
                )
            )
        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0
        q = (
            q.order_by(ChatConversation.last_message_at.desc().nulls_last())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def get_stats(self) -> dict:
        total = await self.db.scalar(select(func.count()).select_from(ChatConversation)) or 0
        unread = (
            await self.db.scalar(
                select(func.count()).where(ChatConversation.unread_count > 0)
            )
            or 0
        )
        rows = await self.db.execute(
            select(ChatConversation.lead_status, func.count())
            .group_by(ChatConversation.lead_status)
        )
        by_lead_status = {row[0]: row[1] for row in rows.all()}
        return {"total": total, "unread": unread, "by_lead_status": by_lead_status}
