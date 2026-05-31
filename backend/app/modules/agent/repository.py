from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.agent.models import AgentConversation


class AgentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_message(self, **kwargs) -> AgentConversation:
        msg = AgentConversation(**kwargs)
        self.db.add(msg)
        await self.db.flush()
        await self.db.refresh(msg)
        return msg

    async def get_history(self, session_id: str, limit: int = 10) -> list[AgentConversation]:
        """Return the latest `limit` messages in chronological order.

        Query descending to get the N most recent, then reverse so the
        result is oldest-first (natural conversation order for LLM prompt).
        Secondary sort by id ensures deterministic ordering when two messages
        share the same created_at timestamp.
        """
        result = await self.db.execute(
            select(AgentConversation)
            .where(AgentConversation.session_id == session_id)
            .order_by(AgentConversation.created_at.desc(), AgentConversation.id.desc())
            .limit(limit)
        )
        messages = list(result.scalars().all())
        messages.reverse()
        return messages
