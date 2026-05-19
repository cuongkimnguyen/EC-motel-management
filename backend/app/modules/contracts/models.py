import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    room_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    start_date: Mapped[date] = mapped_column(Date(), nullable=False)
    end_date: Mapped[date] = mapped_column(Date(), nullable=False)
    monthly_rent: Mapped[int] = mapped_column(BigInteger(), nullable=False)
    deposit: Mapped[int] = mapped_column(BigInteger(), nullable=False, default=0)
    billing_cycle: Mapped[int] = mapped_column(Integer(), nullable=False, default=1)
    payment_due_day: Mapped[int] = mapped_column(Integer(), nullable=False, default=5)
    terminated_at: Mapped[date | None] = mapped_column(Date(), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    @property
    def status(self) -> str:
        if self.terminated_at is not None:
            return "Đã chấm dứt"
        today = date.today()
        if self.end_date < today:
            return "Đã hết hạn"
        if (self.end_date - today).days <= 30:
            return "Sắp hết hạn"
        return "Đang hiệu lực"

    @property
    def days_until_expiry(self) -> int | None:
        if self.terminated_at is not None:
            return None
        today = date.today()
        return max(0, (self.end_date - today).days)
