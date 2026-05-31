from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.contracts.models import Contract
from app.modules.rooms.models import Room
from app.modules.tenants.models import Tenant


class AgentContextBuilder:
    """Builds a Vietnamese-language system prompt from live DB data."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def build(self) -> str:
        today = date.today()
        warning_date = today + timedelta(days=30)

        # Room stats
        result = await self.db.execute(select(Room))
        rooms = result.scalars().all()
        total_rooms = len(rooms)
        vacant = sum(1 for r in rooms if r.status == "Trống")
        occupied = sum(1 for r in rooms if r.status == "Đang thuê")
        maintenance = sum(1 for r in rooms if r.status == "Bảo trì")

        # Expiring contracts
        result = await self.db.execute(
            select(Contract).where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= warning_date,
            )
        )
        expiring = result.scalars().all()

        # Tenants with debt
        result = await self.db.execute(select(Tenant).where(Tenant.debt > 0))
        debt_tenants = result.scalars().all()
        total_debt = sum(t.debt for t in debt_tenants)

        lines = [
            "Bạn là trợ lý AI của hệ thống quản lý nhà trọ MotelManage.",
            "Hãy trả lời ngắn gọn, chính xác bằng tiếng Việt.",
            "Dữ liệu thời gian thực:",
            "",
            "== PHÒNG ==",
            f"Tổng: {total_rooms} | Đang thuê: {occupied} | Trống: {vacant} | Bảo trì: {maintenance}",
            "",
            "== HỢP ĐỒNG SẮP HẾT HẠN (30 ngày) ==",
        ]
        for c in expiring[:5]:
            days = (c.end_date - today).days
            lines.append(f"- {c.code}: còn {days} ngày")
        if not expiring:
            lines.append("- Không có hợp đồng sắp hết hạn")

        lines += [
            "",
            "== CÔNG NỢ ==",
            f"Số khách nợ: {len(debt_tenants)} | Tổng: {total_debt:,}đ",
        ]

        return "\n".join(lines)
