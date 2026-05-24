import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text(), nullable=False)
    room_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    post_type: Mapped[str] = mapped_column(String(20), nullable=False)
    channel: Mapped[str] = mapped_column(String(30), nullable=False)
    planned_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    posted_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Nháp")
    fb_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    views: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    messages: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    leads: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    converted: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    hashtags: Mapped[str | None] = mapped_column(Text(), nullable=True)
    price: Mapped[int | None] = mapped_column(BigInteger(), nullable=True)
    area: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    assignee: Mapped[str | None] = mapped_column(String(255), nullable=True)
    thumbnail: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
