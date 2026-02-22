"""add_academic_calendar

Revision ID: i9d0e1f2a3b4
Revises: h8c9d0e1f2a3
Create Date: 2026-02-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'i9d0e1f2a3b4'
down_revision: Union[str, None] = 'h8c9d0e1f2a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'academic_calendar',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('school_year', sa.String(length=20), nullable=False),
        sa.Column('semester', sa.String(length=10), nullable=False),
        sa.Column('enrollment_start', sa.Date(), nullable=True),
        sa.Column('enrollment_end', sa.Date(), nullable=True),
        sa.Column('is_open', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('academic_calendar')
