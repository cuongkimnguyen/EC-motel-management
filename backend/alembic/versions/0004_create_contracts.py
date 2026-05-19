"""create_contracts

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-19
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "contracts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column(
            "room_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("rooms.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("monthly_rent", sa.BigInteger(), nullable=False),
        sa.Column("deposit", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("billing_cycle", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("payment_due_day", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("terminated_at", sa.Date(), nullable=True),
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
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_contracts_room_id", "contracts", ["room_id"])
    op.create_index("ix_contracts_tenant_id", "contracts", ["tenant_id"])
    op.create_index("ix_contracts_end_date", "contracts", ["end_date"])
    op.create_index("ix_contracts_terminated_at", "contracts", ["terminated_at"])


def downgrade() -> None:
    op.drop_index("ix_contracts_terminated_at", "contracts")
    op.drop_index("ix_contracts_end_date", "contracts")
    op.drop_index("ix_contracts_tenant_id", "contracts")
    op.drop_index("ix_contracts_room_id", "contracts")
    op.drop_table("contracts")
