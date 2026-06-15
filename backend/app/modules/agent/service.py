import uuid
from datetime import date, timedelta, timezone, datetime

import anthropic
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.agent.context_builder import AgentContextBuilder
from app.modules.agent.models import AgentConversation
from app.modules.agent.repository import AgentRepository
from app.modules.agent.schemas import (
    AgentAlertItem,
    AgentChatRequest,
    AgentChatResponse,
    AgentConversationResponse,
    AgentOverview,
)
from app.modules.automations.models import Automation, AgentTaskHistory
from app.modules.contracts.models import Contract
from app.modules.notifications.models import Notification
from app.modules.tenants.models import Tenant


class AgentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AgentRepository(db)

    async def chat(self, payload: AgentChatRequest, user_id: str) -> AgentChatResponse:
        session_id = payload.session_id or str(uuid.uuid4())

        # Persist user message
        await self.repo.create_message(
            session_id=session_id,
            role="user",
            content=payload.message,
            message_type="text",
            user_id=user_id,
        )

        # Load conversation history (for context)
        history = await self.repo.get_history(session_id, limit=20)

        # Build system prompt from live data
        system_prompt = await AgentContextBuilder(self.db).build()

        # Build message list for Anthropic (all except the last which is current user msg)
        prior_messages = [
            {"role": m.role, "content": m.content}
            for m in history[:-1]
        ]
        prior_messages.append({"role": "user", "content": payload.message})

        # Call Anthropic Claude
        try:
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=system_prompt,
                messages=prior_messages,
            )
            reply_content = response.content[0].text
        except Exception:
            reply_content = "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau."

        # Persist assistant reply
        assistant_msg = await self.repo.create_message(
            session_id=session_id,
            role="assistant",
            content=reply_content,
            message_type="text",
            user_id=user_id,
        )

        return AgentChatResponse(
            reply=AgentConversationResponse.model_validate(assistant_msg),
            session_id=session_id,
        )

    async def get_overview(self) -> AgentOverview:
        today = date.today()
        warning_date = today + timedelta(days=30)

        result = await self.db.execute(
            select(func.count()).select_from(AgentTaskHistory).where(
                func.date(AgentTaskHistory.created_at) == today
            )
        )
        today_tasks = result.scalar() or 0

        result = await self.db.execute(
            select(func.count()).select_from(Automation).where(
                Automation.status == "active",
                Automation.is_enabled.is_(True),
            )
        )
        running_automations = result.scalar() or 0

        result = await self.db.execute(
            select(func.count()).select_from(Notification).where(Notification.read.is_(False))
        )
        pending_alerts = result.scalar() or 0

        result = await self.db.execute(
            select(func.count()).select_from(Tenant).where(Tenant.debt > 0)
        )
        overdue_tenants = result.scalar() or 0

        result = await self.db.execute(
            select(func.count()).select_from(Contract).where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= warning_date,
            )
        )
        expiring_contracts = result.scalar() or 0

        return AgentOverview(
            today_tasks=today_tasks,
            running_automations=running_automations,
            pending_alerts=pending_alerts,
            ai_assisted=today_tasks,
            overdue_tenants=overdue_tenants,
            expiring_contracts=expiring_contracts,
        )

    async def get_alerts(self) -> list[AgentAlertItem]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.read.is_(False))
            .order_by(Notification.created_at.desc())
            .limit(20)
        )
        return [
            AgentAlertItem(
                id=str(n.id),
                type=n.type,
                title=n.title,
                message=n.message,
                priority=n.priority,
                reference_id=str(n.reference_id) if n.reference_id else None,
                reference_type=None,  # Notification model has no reference_type column yet
                created_at=n.created_at,
            )
            for n in result.scalars().all()
        ]

    async def get_task_history(self, page: int, limit: int) -> dict:
        from app.common.pagination import PaginationParams, make_paginated_response
        from app.modules.automations.schemas import TaskHistoryResponse

        offset = (page - 1) * limit
        result = await self.db.execute(
            select(AgentTaskHistory)
            .order_by(AgentTaskHistory.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        items = result.scalars().all()
        count_result = await self.db.execute(select(func.count()).select_from(AgentTaskHistory))
        total = count_result.scalar() or 0
        data = [TaskHistoryResponse.model_validate(i) for i in items]
        return make_paginated_response(data, total, PaginationParams(page=page, limit=limit))
