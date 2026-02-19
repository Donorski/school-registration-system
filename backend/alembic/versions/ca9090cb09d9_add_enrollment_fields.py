"""add_enrollment_fields

Revision ID: ca9090cb09d9
Revises: ee5d8b6c4f7e
Create Date: 2026-02-12 09:46:08.956006

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ca9090cb09d9'
down_revision: Union[str, None] = 'ee5d8b6c4f7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    enrollmenttype = sa.Enum('NEW_ENROLLEE', 'TRANSFEREE', 'RE_ENROLLEE', name='enrollmenttype')
    enrollmenttype.create(op.get_bind(), checkfirst=True)
    op.add_column('students', sa.Column('enrollment_type', enrollmenttype, nullable=True))
    op.add_column('students', sa.Column('enrollment_date', sa.Date(), nullable=True))
    op.add_column('students', sa.Column('place_of_birth', sa.String(length=255), nullable=True))
    op.add_column('students', sa.Column('nationality', sa.String(length=100), nullable=True))
    op.add_column('students', sa.Column('civil_status', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('students', 'civil_status')
    op.drop_column('students', 'nationality')
    op.drop_column('students', 'place_of_birth')
    op.drop_column('students', 'enrollment_date')
    op.drop_column('students', 'enrollment_type')
    sa.Enum(name='enrollmenttype').drop(op.get_bind(), checkfirst=True)
