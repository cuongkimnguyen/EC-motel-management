from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.posts.repository import PostRepository
from app.modules.posts.schemas import (
    PostCreate,
    PostResponse,
    PostSchedule,
    PostStats,
    PostUpdate,
)
from app.modules.rooms.repository import RoomRepository


class PostService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PostRepository(db)
        self.room_repo = RoomRepository(db)

    async def _to_response(self, post) -> PostResponse:
        resp = PostResponse.model_validate(post)
        if post.room_id:
            room = await self.room_repo.get_by_id(post.room_id)
            if room:
                resp.room_code = room.code
        return resp

    async def _sync_room_active_post(self, room_id) -> None:
        """Update room.has_active_post based on count of published posts."""
        if room_id is None:
            return
        count = await self.repo.count_published_for_room(room_id)
        room = await self.room_repo.get_by_id(room_id)
        if room:
            await self.room_repo.update(room, has_active_post=(count > 0))

    async def list_posts(self, params: PaginationParams, **filters) -> dict:
        posts, total = await self.repo.list_posts(params.page, params.limit, **filters)
        # Batch-load all referenced rooms in one query to avoid N+1.
        room_ids = list({p.room_id for p in posts if p.room_id})
        room_map = await self.room_repo.get_by_ids(room_ids)
        data = []
        for p in posts:
            resp = PostResponse.model_validate(p)
            if p.room_id and p.room_id in room_map:
                resp.room_code = room_map[p.room_id].code
            data.append(resp)
        return make_paginated_response(data, total, params)

    async def get_stats(self) -> PostStats:
        return PostStats(**await self.repo.get_stats())

    async def get_post(self, post_id: str) -> PostResponse:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        return await self._to_response(post)

    async def create_post(self, payload: PostCreate) -> PostResponse:
        post = await self.repo.create(status="Nháp", **payload.model_dump())
        return await self._to_response(post)

    async def update_post(self, post_id: str, payload: PostUpdate) -> PostResponse:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        if post.status in ("Đã đăng", "Đã lên lịch"):
            raise HTTPException(status_code=409, detail="Không thể sửa bài đăng đã đăng hoặc đã lên lịch")
        updates = payload.model_dump(exclude_none=True)
        post = await self.repo.update(post, **updates)
        return await self._to_response(post)

    async def delete_post(self, post_id: str) -> None:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        room_id = post.room_id
        was_published = post.status == "Đã đăng"
        await self.repo.delete(post)
        if was_published and room_id:
            await self._sync_room_active_post(room_id)

    async def publish_post(self, post_id: str) -> PostResponse:
        from app.core.config import settings
        from app.integrations.facebook_graph import publish_page_post

        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        if post.status == "Đã đăng":
            raise HTTPException(status_code=409, detail="Bài đăng đã được đăng rồi")

        fb_link: str | None = None
        final_status = "Đã đăng"

        is_fb_channel = post.channel in ("Facebook Page", "Facebook Group")
        if is_fb_channel and settings.FACEBOOK_WEBHOOK_ENABLED and settings.FACEBOOK_PAGE_ACCESS_TOKEN:
            try:
                fb_post_id = await publish_page_post(
                    message=post.content,
                    page_id=settings.FACEBOOK_PAGE_ID,
                    page_access_token=settings.FACEBOOK_PAGE_ACCESS_TOKEN,
                    graph_api_version=settings.META_GRAPH_API_VERSION,
                )
                fb_link = f"https://www.facebook.com/{fb_post_id}"
            except Exception:
                final_status = "Lỗi"

        post = await self.repo.update(
            post,
            status=final_status,
            posted_date=datetime.now(timezone.utc) if final_status == "Đã đăng" else post.posted_date,
            fb_link=fb_link,
        )
        await self._sync_room_active_post(post.room_id)
        return await self._to_response(post)

    async def schedule_post(self, post_id: str, payload: PostSchedule) -> PostResponse:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        if post.status == "Đã đăng":
            raise HTTPException(status_code=409, detail="Bài đăng đã được đăng rồi")
        post = await self.repo.update(
            post,
            status="Đã lên lịch",
            planned_date=payload.scheduled_at,
        )
        return await self._to_response(post)

    async def duplicate_post(self, post_id: str) -> PostResponse:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        new_post = await self.repo.create(
            title=f"[Bản sao] {post.title}",
            content=post.content,
            room_id=post.room_id,
            post_type=post.post_type,
            channel=post.channel,
            hashtags=post.hashtags,
            price=post.price,
            area=post.area,
            assignee=post.assignee,
            thumbnail=post.thumbnail,
            status="Nháp",
        )
        return await self._to_response(new_post)
