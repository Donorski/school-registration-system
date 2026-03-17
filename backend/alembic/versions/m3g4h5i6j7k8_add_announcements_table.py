"""add announcements table

Revision ID: m3g4h5i6j7k8
Revises: l2f3g4b5c6d7
Create Date: 2026-03-17

"""
from alembic import op
import sqlalchemy as sa

revision = 'm3g4h5i6j7k8'
down_revision = 'l2f3g4b5c6d7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'announcements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('expires_at', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_announcements_id', 'announcements', ['id'])
    op.create_index('ix_announcements_created_at', 'announcements', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_announcements_created_at', table_name='announcements')
    op.drop_index('ix_announcements_id', table_name='announcements')
    op.drop_table('announcements')
