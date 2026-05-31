"""create chat_conversations and chat_messages tables

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, UUID

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_conversations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("psid", sa.Text, nullable=False),
        sa.Column("page_id", sa.Text, nullable=False),
        sa.Column("customer_name", sa.Text, nullable=True),
        sa.Column("source", sa.Text, nullable=False, server_default="Facebook Page"),
        sa.Column("lead_status", sa.Text, nullable=False, server_default="Mới"),
        sa.Column("interest_level", sa.Text, nullable=False, server_default="Trung bình"),
        sa.Column("tags", ARRAY(sa.Text), nullable=False, server_default="{}"),
        sa.Column("assignee", sa.Text, nullable=True),
        sa.Column("interested_room", sa.Text, nullable=True),
        sa.Column("budget", sa.Integer, nullable=True),
        sa.Column("appointment_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("internal_note", sa.Text, nullable=True),
        sa.Column("phone", sa.Text, nullable=True),
        sa.Column("last_message", sa.Text, nullable=True),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_customer_message_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("unread_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("psid", "page_id", name="uq_conversation_psid_page"),
        sa.CheckConstraint(
            "source IN ('Facebook Page', 'Facebook Group', 'Zalo', 'manual')",
            name="ck_conversation_source",
        ),
        sa.CheckConstraint(
            "lead_status IN ('Mới','Đang tư vấn','Quan tâm cao','Đã chốt','Không quan tâm')",
            name="ck_conversation_lead_status",
        ),
        sa.CheckConstraint(
            "interest_level IN ('Thấp','Trung bình','Cao','Rất cao')",
            name="ck_conversation_interest_level",
        ),
    )
    op.create_index("idx_conv_lead_status", "chat_conversations", ["lead_status"])
    op.create_index(
        "idx_conv_last_msg_at", "chat_conversations", ["last_message_at"],
        postgresql_ops={"last_message_at": "DESC NULLS LAST"},
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "conversation_id",
            UUID(as_uuid=True),
            sa.ForeignKey("chat_conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("meta_mid", sa.Text, unique=True, nullable=True),
        sa.Column("direction", sa.Text, nullable=False),
        sa.Column("message_type", sa.Text, nullable=False, server_default="text"),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("attachment_url", sa.Text, nullable=True),
        sa.Column("status", sa.Text, nullable=False, server_default="delivered"),
        sa.Column("error_detail", sa.Text, nullable=True),
        sa.Column("sender_type", sa.Text, nullable=False, server_default="customer"),
        sa.Column("sender_name", sa.Text, nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("direction IN ('inbound','outbound')", name="ck_message_direction"),
        sa.CheckConstraint(
            "message_type IN ('text','image','audio','file','system')", name="ck_message_type"
        ),
        sa.CheckConstraint(
            "status IN ('delivered','sent','failed','read')", name="ck_message_status"
        ),
        sa.CheckConstraint(
            "sender_type IN ('customer','admin','system')", name="ck_message_sender_type"
        ),
    )
    op.create_index("idx_msg_conv_sent", "chat_messages", ["conversation_id", "sent_at"])


def downgrade() -> None:
    op.drop_index("idx_msg_conv_sent", "chat_messages")
    op.drop_table("chat_messages")
    op.drop_index("idx_conv_last_msg_at", "chat_conversations")
    op.drop_index("idx_conv_lead_status", "chat_conversations")
    op.drop_table("chat_conversations")
