from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.contracts.models import Contract, EXPIRY_WARNING_DAYS
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationCount, NotificationResponse
from app.modules.rooms.models import Room

# Throttle: skip refresh if last run was within this many seconds (per process).
_REFRESH_TTL_SECONDS: int = 300
_last_refresh_at: datetime | None = None


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def _refresh(self) -> None:
        """Scan contracts and rooms; upsert active notifications; delete stale ones.

        Throttled to at most once per _REFRESH_TTL_SECONDS to avoid write
        side-effects on every read request.
        """
        global _last_refresh_at
        now = datetime.now(timezone.utc)
        if _last_refresh_at is not None and (now - _last_refresh_at).total_seconds() < _REFRESH_TTL_SECONDS:
            return
        _last_refresh_at = now

        today = date.today()
        warning_date = today + timedelta(days=EXPIRY_WARNING_DAYS)
        active_keys: list[tuple[str, str]] = []

        # contract_expiry: non-terminated contracts expiring within 30 days
        result = await self.db.execute(
            select(Contract).where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= warning_date,
            )
        )
        for c in result.scalars().all():
            days_left = (c.end_date - today).days
            priority = "high" if days_left <= 7 else "medium"
            ref = str(c.id)
            await self.repo.upsert(
                type="contract_expiry",
                reference_id=ref,
                title="Hợp đồng sắp hết hạn",
                message=f"Hợp đồng {c.code} hết hạn sau {days_left} ngày",
                priority=priority,
            )
            active_keys.append(("contract_expiry", ref))

        # vacant_room: empty rooms with no active marketing post
        result = await self.db.execute(
            select(Room).where(
                Room.status == "Trống",
                Room.has_active_post.is_(False),
            )
        )
        for room in result.scalars().all():
            ref = str(room.id)
            await self.repo.upsert(
                type="vacant_room",
                reference_id=ref,
                title="Phòng trống chưa có bài đăng",
                message=f"Phòng {room.code} ({room.name}) đang trống, chưa có bài đăng marketing",
                priority="high",
            )
            active_keys.append(("vacant_room", ref))

        # maintenance: rooms under maintenance
        result = await self.db.execute(
            select(Room).where(Room.status == "Bảo trì")
        )
        for room in result.scalars().all():
            ref = str(room.id)
            await self.repo.upsert(
                type="maintenance",
                reference_id=ref,
                title="Phòng đang bảo trì",
                message=f"Phòng {room.code} ({room.name}) đang trong trạng thái bảo trì",
                priority="low",
            )
            active_keys.append(("maintenance", ref))

        await self.repo.delete_stale(active_keys)

    async def list_notifications(
        self,
        params: PaginationParams,
        read: bool | None = None,
        type: str | None = None,
    ) -> dict:
        await self._refresh()
        notifications, total = await self.repo.list_notifications(
            params.page, params.limit, read=read, type=type
        )
        data = [NotificationResponse.model_validate(n) for n in notifications]
        return make_paginated_response(data, total, params)

    async def get_count(self) -> NotificationCount:
        await self._refresh()
        return NotificationCount(unread=await self.repo.count_unread())

    async def mark_read(self, notif_id: str) -> NotificationResponse:
        notif = await self.repo.mark_read(notif_id)
        if not notif:
            raise HTTPException(status_code=404, detail="Thông báo không tồn tại")
        return NotificationResponse.model_validate(notif)

    async def mark_all_read(self) -> dict:
        await self.repo.mark_all_read()
        return {"ok": True}

    async def send_payment_reminders(self) -> int:
        """Send payment reminder emails to all tenants with outstanding debt.

        Returns number of emails successfully dispatched.
        """
        from app.integrations.email import send_email
        from app.modules.tenants.models import Tenant
        from app.modules.contracts.models import Contract

        result = await self.db.execute(
            select(Tenant).where(Tenant.debt > 0)
        )
        tenants = result.scalars().all()

        sent = 0
        for tenant in tenants:
            if not getattr(tenant, "email", None):
                continue

            contract_result = await self.db.execute(
                select(Contract).where(
                    Contract.tenant_id == tenant.id,
                    Contract.terminated_at.is_(None),
                    Contract.end_date >= date.today(),
                ).limit(1)
            )
            contract = contract_result.scalar_one_or_none()
            room_code = "N/A"
            if contract:
                from app.modules.rooms.models import Room
                room_result = await self.db.execute(
                    select(Room).where(Room.id == contract.room_id)
                )
                room = room_result.scalar_one_or_none()
                if room:
                    room_code = room.code

            await send_email(
                to=tenant.email,
                subject=f"[MotelManage] Nhac nho thanh toan — {room_code}",
                template="payment_reminder.html",
                context={
                    "tenant_name": tenant.full_name,
                    "room_code": room_code,
                    "billing_period": date.today().strftime("%Y-%m"),
                    "amount_due": tenant.debt,
                    "due_date": f"ngay 5 thang {date.today().month + 1}",
                },
            )
            sent += 1

        return sent

    async def send_expiry_warnings(self) -> int:
        """Send contract expiry warning emails for contracts expiring within 30 days.

        Returns number of emails dispatched.
        """
        from app.integrations.email import send_email
        from app.modules.contracts.models import Contract
        from app.modules.tenants.models import Tenant

        today = date.today()
        warning_date = today + timedelta(days=30)

        result = await self.db.execute(
            select(Contract).where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= warning_date,
            )
        )
        contracts = result.scalars().all()

        sent = 0
        for contract in contracts:
            tenant_result = await self.db.execute(
                select(Tenant).where(Tenant.id == contract.tenant_id)
            )
            tenant = tenant_result.scalar_one_or_none()
            if not tenant or not getattr(tenant, "email", None):
                continue

            room_code = ""
            from app.modules.rooms.models import Room
            room_result = await self.db.execute(
                select(Room).where(Room.id == contract.room_id)
            )
            room = room_result.scalar_one_or_none()
            if room:
                room_code = room.code

            days_left = (contract.end_date - today).days
            await send_email(
                to=tenant.email,
                subject=f"[MotelManage] Hop dong {contract.code} sap het han",
                template="contract_expiry.html",
                context={
                    "tenant_name": tenant.full_name,
                    "contract_code": contract.code,
                    "room_code": room_code,
                    "end_date": str(contract.end_date),
                    "days_left": days_left,
                },
            )
            sent += 1

        return sent
