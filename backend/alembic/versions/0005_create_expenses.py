"""create_expenses

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "expenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("amount", sa.BigInteger(), nullable=False),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("payment_status", sa.String(30), nullable=False, server_default="Chưa thanh toán"),
        sa.Column("payment_method", sa.String(20), nullable=False, server_default="Tiền mặt"),
        sa.Column("building_name", sa.String(50), nullable=False, server_default="Khu A"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("receipt_image", sa.String(500), nullable=True),
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
    op.create_index("ix_expenses_expense_date", "expenses", ["expense_date"])
    op.create_index("ix_expenses_category", "expenses", ["category"])
    op.create_index("ix_expenses_payment_status", "expenses", ["payment_status"])
    op.create_index("ix_expenses_building_name", "expenses", ["building_name"])


def downgrade() -> None:
    op.drop_index("ix_expenses_building_name", "expenses")
    op.drop_index("ix_expenses_payment_status", "expenses")
    op.drop_index("ix_expenses_category", "expenses")
    op.drop_index("ix_expenses_expense_date", "expenses")
    op.drop_table("expenses")
