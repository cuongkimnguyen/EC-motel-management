from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.posts.schemas import PostCreate, PostResponse, PostSchedule, PostStats, PostUpdate
from app.modules.posts.service import PostService

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("/stats", response_model=PostStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).get_stats()


@router.get("", response_model=dict)
async def list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    channel: str | None = Query(None),
    post_type: str | None = Query(None),
    room_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).list_posts(
        PaginationParams(page=page, limit=limit),
        search=search,
        status=status,
        channel=channel,
        post_type=post_type,
        room_id=room_id,
    )


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).get_post(post_id)


@router.post("", response_model=PostResponse, status_code=201)
async def create_post(
    payload: PostCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).create_post(payload)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    payload: PostUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).update_post(post_id, payload)


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await PostService(db).delete_post(post_id)


@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).publish_post(post_id)


@router.post("/{post_id}/schedule", response_model=PostResponse)
async def schedule_post(
    post_id: str,
    payload: PostSchedule,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).schedule_post(post_id, payload)


@router.post("/{post_id}/duplicate", response_model=PostResponse, status_code=201)
async def duplicate_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).duplicate_post(post_id)
