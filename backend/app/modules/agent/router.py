from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.modules.agent.schemas import AgentChatRequest, AgentChatResponse, AgentOverview, AgentAlertItem
from app.modules.agent.service import AgentService

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/chat", response_model=AgentChatResponse)
async def agent_chat(
    payload: AgentChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await AgentService(db).chat(payload, user_id=str(current_user.id))


@router.get("/overview", response_model=AgentOverview)
async def agent_overview(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await AgentService(db).get_overview()


@router.get("/alerts", response_model=list[AgentAlertItem])
async def agent_alerts(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await AgentService(db).get_alerts()


@router.get("/task-history", response_model=dict)
async def agent_task_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await AgentService(db).get_task_history(page=page, limit=limit)
