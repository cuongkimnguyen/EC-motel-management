"""In-process APScheduler with AsyncIOScheduler.

Jobs:
  - sync_contract_expiry: nightly 01:00 — updates contract statuses + fires notifications
  - publish_scheduled_posts: every 5 min — marks past-planned-date posts as published

NOTE: MVP runs single uvicorn worker. For multi-worker, replace with Celery Beat.
"""
import logging
from datetime import date, datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler(timezone="Asia/Ho_Chi_Minh")


async def sync_contract_expiry_statuses() -> None:
    """Batch-update contract statuses; refresh notification cache."""
    from sqlalchemy import update
    from app.modules.contracts.models import Contract
    import app.modules.notifications.service as ns

    async with AsyncSessionLocal() as db:
        today = date.today()
        warning_date = today + timedelta(days=30)

        # Promote active → sắp hết hạn
        await db.execute(
            update(Contract)
            .where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= warning_date,
                Contract.status == "Đang hiệu lực",
            )
            .values(status="Sắp hết hạn")
        )

        # Mark expired
        await db.execute(
            update(Contract)
            .where(
                Contract.terminated_at.is_(None),
                Contract.end_date < today,
                Contract.status.in_(["Đang hiệu lực", "Sắp hết hạn"]),
            )
            .values(status="Đã hết hạn")
        )

        await db.commit()

        # Force notification refresh
        ns._last_refresh_at = None
        from app.modules.notifications.service import NotificationService
        notif_svc = NotificationService(db)
        await notif_svc._refresh()

    logger.info("Contract expiry sync completed for %s", today)


async def publish_scheduled_posts() -> None:
    """Mark 'Đã lên lịch' posts whose planned_date ≤ now as 'Đã đăng'."""
    from sqlalchemy import select
    from app.modules.posts.models import Post

    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Post).where(
                Post.status == "Đã lên lịch",
                Post.planned_date <= now,
            )
        )
        posts = result.scalars().all()
        for post in posts:
            post.status = "Đã đăng"
            post.posted_date = now
        if posts:
            await db.commit()
            logger.info("Auto-published %d scheduled posts", len(posts))


def setup_scheduler() -> None:
    scheduler.add_job(
        sync_contract_expiry_statuses,
        trigger="cron",
        hour=1,
        minute=0,
        id="contract_expiry_sync",
        replace_existing=True,
    )
    scheduler.add_job(
        publish_scheduled_posts,
        trigger="interval",
        minutes=5,
        id="publish_scheduled_posts",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler started: %d jobs registered", len(scheduler.get_jobs()))
