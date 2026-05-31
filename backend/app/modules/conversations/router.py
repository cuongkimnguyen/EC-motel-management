from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.conversations.schemas import (
    ChatConversationDetail,
    ChatMessageResponse,
    ConversationStats,
    ConversationUpdate,
    SendMessageRequest,
)
from app.modules.conversations.service import ConversationService

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


def get_service(db: AsyncSession = Depends(get_db)) -> ConversationService:
    return ConversationService(db)


@router.get("/stats", response_model=ConversationStats)
async def get_stats(
    _=Depends(require_admin),
    svc: ConversationService = Depends(get_service),
):
    return await svc.get_stats()


@router.get("", response_model=dict)
async def list_conversations(
    lead_status: str | None = Query(None),
    assignee: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _=Depends(require_admin),
    svc: ConversationService = Depends(get_service),
):
    params = PaginationParams(page=page, limit=limit)
    return await svc.list_conversations(
        params, lead_status=lead_status, assignee=assignee, search=search
    )


@router.get("/{conversation_id}", response_model=ChatConversationDetail)
async def get_conversation(
    conversation_id: str,
    _=Depends(require_admin),
    svc: ConversationService = Depends(get_service),
):
    return await svc.get_conversation(conversation_id)


@router.patch("/{conversation_id}", response_model=ChatConversationDetail)
async def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    _=Depends(require_admin),
    svc: ConversationService = Depends(get_service),
):
    return await svc.update_conversation(conversation_id, payload)


@router.post("/{conversation_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    conversation_id: str,
    payload: SendMessageRequest,
    _=Depends(require_admin),
    svc: ConversationService = Depends(get_service),
):
    return await svc.send_outbound_message(conversation_id, payload.text)
