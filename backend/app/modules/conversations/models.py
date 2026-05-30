import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Facebook identifiers
    psid: Mapped[str] = mapped_column(Text, nullable=False)
    page_id: Mapped[str] = mapped_column(Text, nullable=False)

    # Customer display
    customer_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(Text, nullable=False, default="Facebook Page")

    # Lead management
    lead_status: Mapped[str] = mapped_column(Text, nullable=False, default="Mới")
    interest_level: Mapped[str] = mapped_column(Text, nullable=False, default="Trung bình")
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    assignee: Mapped[str | None] = mapped_column(Text, nullable=True)
    interested_room: Mapped[str | None] = mapped_column(Text, nullable=True)
    budget: Mapped[int | None] = mapped_column(Integer, nullable=True)
    appointment_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    internal_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Denormalized summary
    last_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_message_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_customer_message_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    unread_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="conversation", lazy="noload"
    )

    __table_args__ = (
        UniqueConstraint("psid", "page_id", name="uq_conversation_psid_page"),
        CheckConstraint(
            "source IN ('Facebook Page', 'Facebook Group', 'Zalo', 'manual')",
            name="ck_conversation_source",
        ),
        CheckConstraint(
            "lead_status IN ('Mới','Đang tư vấn','Quan tâm cao','Đã chốt','Không quan tâm')",
            name="ck_conversation_lead_status",
        ),
        CheckConstraint(
            "interest_level IN ('Thấp','Trung bình','Cao','Rất cao')",
            name="ck_conversation_interest_level",
        ),
        Index("idx_conv_lead_status", "lead_status"),
        Index("idx_conv_last_msg_at", "last_message_at"),
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chat_conversations.id", ondelete="CASCADE"),
        nullable=False,
    )

    meta_mid: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    direction: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(Text, nullable=False, default="text")
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="delivered")
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    sender_type: Mapped[str] = mapped_column(Text, nullable=False, default="customer")
    sender_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    conversation: Mapped["ChatConversation"] = relationship(
        "ChatConversation", back_populates="messages"
    )

    __table_args__ = (
        CheckConstraint(
            "direction IN ('inbound','outbound')", name="ck_message_direction"
        ),
        CheckConstraint(
            "message_type IN ('text','image','audio','file','system')",
            name="ck_message_type",
        ),
        CheckConstraint(
            "status IN ('delivered','sent','failed','read')", name="ck_message_status"
        ),
        CheckConstraint(
            "sender_type IN ('customer','admin','system')", name="ck_message_sender_type"
        ),
        Index("idx_msg_conv_sent", "conversation_id", "sent_at"),
    )
