"""create_tenants

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-19
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("cccd", sa.String(20), nullable=False),
        sa.Column("gender", sa.String(10), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column("permanent_address", sa.Text(), nullable=False),
        sa.Column(
            "current_room_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("rooms.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("occupation", sa.String(255), nullable=True),
        sa.Column("license_plate", sa.String(50), nullable=True),
        sa.Column("debt", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(30), nullable=False, server_default="Đã trả phòng"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("phone"),
        sa.UniqueConstraint("cccd"),
    )
    op.create_index("ix_tenants_status", "tenants", ["status"])
    op.create_index("ix_tenants_current_room_id", "tenants", ["current_room_id"])


def downgrade() -> None:
    op.drop_index("ix_tenants_current_room_id", "tenants")
    op.drop_index("ix_tenants_status", "tenants")
    op.drop_table("tenants")
