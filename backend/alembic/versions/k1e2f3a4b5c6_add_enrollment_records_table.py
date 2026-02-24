"""add_enrollment_records_table

Revision ID: k1e2f3a4b5c6
Revises: j0e1f2a3b4c5
Create Date: 2026-02-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'k1e2f3a4b5c6'
down_revision: Union[str, None] = 'j0e1f2a3b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'enrollment_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('school_year', sa.String(length=20), nullable=True),
        sa.Column('semester', sa.String(length=20), nullable=True),
        sa.Column('grade_level', sa.String(length=20), nullable=True),
        sa.Column('strand', sa.String(length=50), nullable=True),
        sa.Column('enrollment_type', sa.String(length=30), nullable=True),
        sa.Column('student_number', sa.String(length=20), nullable=True),
        sa.Column('subjects_snapshot', sa.JSON(), nullable=True),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_enrollment_records_id'), 'enrollment_records', ['id'], unique=False)
    op.create_index(op.f('ix_enrollment_records_student_id'), 'enrollment_records', ['student_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_enrollment_records_student_id'), table_name='enrollment_records')
    op.drop_index(op.f('ix_enrollment_records_id'), table_name='enrollment_records')
    op.drop_table('enrollment_records')
