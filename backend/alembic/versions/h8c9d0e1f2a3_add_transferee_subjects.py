"""add_transferee_subjects

Revision ID: h8c9d0e1f2a3
Revises: 79d71a1d2b92
Create Date: 2026-02-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'h8c9d0e1f2a3'
down_revision: Union[str, None] = '79d71a1d2b92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('students', sa.Column('transferee_subjects', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('students', 'transferee_subjects')
