"""add_denial_and_payment_rejection_reason

Revision ID: j0e1f2a3b4c5
Revises: i9d0e1f2a3b4
Create Date: 2026-02-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'j0e1f2a3b4c5'
down_revision: Union[str, None] = 'i9d0e1f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('students', sa.Column('denial_reason', sa.Text(), nullable=True))
    op.add_column('students', sa.Column('payment_rejection_reason', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('students', 'denial_reason')
    op.drop_column('students', 'payment_rejection_reason')
