"""create_posts

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("post_type", sa.String(20), nullable=False),
        sa.Column("channel", sa.String(30), nullable=False),
        sa.Column("planned_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("posted_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="Nháp"),
        sa.Column("fb_link", sa.String(500), nullable=True),
        sa.Column("views", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("messages", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("leads", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("converted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("hashtags", sa.Text(), nullable=True),
        sa.Column("price", sa.BigInteger(), nullable=True),
        sa.Column("area", sa.Integer(), nullable=True),
        sa.Column("assignee", sa.String(255), nullable=True),
        sa.Column("thumbnail", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_posts_status", "posts", ["status"])
    op.create_index("ix_posts_room_id", "posts", ["room_id"])
    op.create_index("ix_posts_channel", "posts", ["channel"])


def downgrade() -> None:
    op.drop_index("ix_posts_channel", "posts")
    op.drop_index("ix_posts_room_id", "posts")
    op.drop_index("ix_posts_status", "posts")
    op.drop_table("posts")
