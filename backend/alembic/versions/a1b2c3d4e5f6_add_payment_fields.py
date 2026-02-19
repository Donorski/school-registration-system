"""add_payment_fields

Revision ID: a1b2c3d4e5f6
Revises: ca9090cb09d9
Create Date: 2026-02-13 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'ca9090cb09d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('students', sa.Column('payment_receipt_path', sa.String(length=500), nullable=True))
    op.add_column('students', sa.Column('payment_status', sa.String(length=30), server_default='unpaid', nullable=False))
    op.add_column('students', sa.Column('payment_verified_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('students', 'payment_verified_at')
    op.drop_column('students', 'payment_status')
    op.drop_column('students', 'payment_receipt_path')
