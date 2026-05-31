"""Create workflow_templates, automations, agent_task_history, agent_conversations

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "workflow_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("trigger", sa.String(255), nullable=False),
        sa.Column("outcome", sa.String(255), nullable=False),
        sa.Column("module", sa.String(30), nullable=False),
        sa.Column("estimated_time", sa.String(50), nullable=False),
        sa.Column("is_builtin", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "automations",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("trigger_type", sa.String(20), nullable=False),
        sa.Column("frequency", sa.String(20)),
        sa.Column("run_time", sa.String(10)),
        sa.Column("module", sa.String(30), nullable=False),
        sa.Column("condition", sa.Text),
        sa.Column("action", sa.Text, nullable=False),
        sa.Column("notify_recipient", sa.String(255)),
        sa.Column("notify_channel", sa.String(20)),
        sa.Column("status", sa.String(20), nullable=False, server_default="'draft'"),
        sa.Column("is_enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_run_at", sa.TIMESTAMP(timezone=True)),
        sa.Column("next_run_at", sa.TIMESTAMP(timezone=True)),
        sa.Column("run_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True)),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_automations_status", "automations", ["status"])
    op.create_index("idx_automations_module", "automations", ["module"])

    op.create_table(
        "agent_task_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("task_type", sa.String(30), nullable=False),
        sa.Column("trigger_source", sa.String(30), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("result_summary", sa.Text),
        sa.Column("module", sa.String(30), nullable=False),
        sa.Column("automation_id", postgresql.UUID(as_uuid=True)),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["automation_id"], ["automations.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_task_history_status", "agent_task_history", ["status"])
    op.create_index("idx_task_history_created_at", "agent_task_history", ["created_at"])

    op.create_table(
        "agent_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("session_id", sa.String(100), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("message_type", sa.String(30), nullable=False, server_default="'text'"),
        sa.Column("related_module", sa.String(30)),
        sa.Column("suggested_actions", postgresql.JSONB),
        sa.Column("list_items", postgresql.JSONB),
        sa.Column("user_id", postgresql.UUID(as_uuid=True)),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_agent_conv_session_id", "agent_conversations", ["session_id"])


def downgrade() -> None:
    op.drop_index("idx_agent_conv_session_id", table_name="agent_conversations")
    op.drop_table("agent_conversations")
    op.drop_index("idx_task_history_created_at", table_name="agent_task_history")
    op.drop_index("idx_task_history_status", table_name="agent_task_history")
    op.drop_table("agent_task_history")
    op.drop_index("idx_automations_module", table_name="automations")
    op.drop_index("idx_automations_status", table_name="automations")
    op.drop_table("automations")
    op.drop_table("workflow_templates")
