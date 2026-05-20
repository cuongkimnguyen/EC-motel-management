"""create_rooms

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-19
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rooms",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("floor", sa.String(50), nullable=False),
        sa.Column("block", sa.String(50), nullable=False),
        sa.Column("area", sa.Integer(), nullable=False),
        sa.Column("rent_price", sa.BigInteger(), nullable=False),
        sa.Column("deposit", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("electricity_price", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("water_price", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("service_fee", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_tenants", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(20), nullable=False, server_default="Trống"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("images", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("has_active_post", sa.Boolean(), nullable=False, server_default="false"),
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
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_rooms_status", "rooms", ["status"])
    op.create_index("ix_rooms_block", "rooms", ["block"])


def downgrade() -> None:
    op.drop_index("ix_rooms_block", "rooms")
    op.drop_index("ix_rooms_status", "rooms")
    op.drop_table("rooms")
