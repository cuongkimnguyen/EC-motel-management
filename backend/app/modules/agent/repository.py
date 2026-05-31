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
        result = await self.db.execute(
            select(AgentConversation)
            .where(AgentConversation.session_id == session_id)
            .order_by(AgentConversation.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())
