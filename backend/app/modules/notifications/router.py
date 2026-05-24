from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.notifications.schemas import NotificationCount, NotificationResponse
from app.modules.notifications.service import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/count", response_model=NotificationCount)
async def get_count(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await NotificationService(db).get_count()


@router.get("", response_model=dict)
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    read: bool | None = Query(None),
    type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await NotificationService(db).list_notifications(
        PaginationParams(page=page, limit=limit),
        read=read,
        type=type,
    )


@router.patch("/{notif_id}/read", response_model=NotificationResponse)
async def mark_read(
    notif_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await NotificationService(db).mark_read(notif_id)


@router.post("/mark-all-read", response_model=dict)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await NotificationService(db).mark_all_read()
