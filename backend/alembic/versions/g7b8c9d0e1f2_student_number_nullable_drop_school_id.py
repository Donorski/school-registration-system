"""make student_number nullable and drop school_id

Revision ID: g7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-02-18 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g7b8c9d0e1f2'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('students', 'student_number',
                     existing_type=sa.String(length=20),
                     nullable=True)
    op.drop_column('students', 'school_id')


def downgrade() -> None:
    op.add_column('students', sa.Column('school_id', sa.String(length=50), nullable=True))
    op.alter_column('students', 'student_number',
                     existing_type=sa.String(length=20),
                     nullable=False)
