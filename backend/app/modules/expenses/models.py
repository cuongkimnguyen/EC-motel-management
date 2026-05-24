import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Boolean, Date, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[int] = mapped_column(BigInteger(), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date(), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(30), nullable=False, default="Chưa thanh toán")
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False, default="Tiền mặt")
    building_name: Mapped[str] = mapped_column(String(50), nullable=False, default="Khu A")
    note: Mapped[str | None] = mapped_column(Text(), nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    receipt_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
