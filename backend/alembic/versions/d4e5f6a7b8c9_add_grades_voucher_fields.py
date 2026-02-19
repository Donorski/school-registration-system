"""add_grades_voucher_fields

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-02-16 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('students', sa.Column('grades_path', sa.String(length=500), nullable=True))
    op.add_column('students', sa.Column('voucher_path', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('students', 'voucher_path')
    op.drop_column('students', 'grades_path')
