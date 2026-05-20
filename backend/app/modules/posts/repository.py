import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.posts.models import Post


class PostRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, post_id: str | uuid.UUID) -> Post | None:
        result = await self.db.execute(select(Post).where(Post.id == post_id))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Post:
        post = Post(**kwargs)
        self.db.add(post)
        await self.db.flush()
        await self.db.refresh(post)
        return post

    async def update(self, post: Post, **kwargs) -> Post:
        for key, value in kwargs.items():
            setattr(post, key, value)
        await self.db.flush()
        await self.db.refresh(post)
        return post

    async def delete(self, post: Post) -> None:
        await self.db.delete(post)
        await self.db.flush()

    async def count_published_for_room(self, room_id: uuid.UUID) -> int:
        """Count posts with status=Đã đăng for a given room (for has_active_post sync)."""
        result = await self.db.execute(
            select(func.count()).where(
                Post.room_id == room_id,
                Post.status == "Đã đăng",
            )
        )
        return result.scalar() or 0

    async def list_posts(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        status: str | None = None,
        channel: str | None = None,
        post_type: str | None = None,
        room_id: str | None = None,
    ) -> tuple[list[Post], int]:
        q = select(Post)
        if search:
            q = q.where(Post.title.ilike(f"%{search}%"))
        if status:
            q = q.where(Post.status == status)
        if channel:
            q = q.where(Post.channel == channel)
        if post_type:
            q = q.where(Post.post_type == post_type)
        if room_id:
            q = q.where(Post.room_id == room_id)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0
        q = q.order_by(Post.created_at.desc()).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def get_stats(self) -> dict:
        rows = await self.db.execute(
            select(
                Post.status,
                func.count().label("cnt"),
                func.coalesce(func.sum(Post.views), 0).label("views"),
                func.coalesce(func.sum(Post.leads), 0).label("leads"),
            ).group_by(Post.status)
        )
        published = scheduled = draft = error = total_views = total_leads = total = 0
        for row in rows:
            total += row.cnt
            total_views += int(row.views)
            total_leads += int(row.leads)
            if row.status == "Đã đăng":
                published = row.cnt
            elif row.status == "Đã lên lịch":
                scheduled = row.cnt
            elif row.status == "Nháp":
                draft = row.cnt
            elif row.status == "Lỗi":
                error = row.cnt
        return {
            "total": total,
            "published": published,
            "scheduled": scheduled,
            "draft": draft,
            "error": error,
            "total_views": total_views,
            "total_leads": total_leads,
        }
