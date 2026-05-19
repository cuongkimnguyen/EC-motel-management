import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    floor: Mapped[str] = mapped_column(String(50), nullable=False)
    block: Mapped[str] = mapped_column(String(50), nullable=False)
    area: Mapped[int] = mapped_column(Integer(), nullable=False)
    rent_price: Mapped[int] = mapped_column(BigInteger(), nullable=False)
    deposit: Mapped[int] = mapped_column(BigInteger(), nullable=False, default=0)
    electricity_price: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    water_price: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    service_fee: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    max_tenants: Mapped[int] = mapped_column(Integer(), nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Trống")
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    images: Mapped[list] = mapped_column(JSONB(), nullable=False, default=list)
    has_active_post: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
