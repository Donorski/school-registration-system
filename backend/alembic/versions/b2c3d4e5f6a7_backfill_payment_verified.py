"""backfill_payment_verified_for_existing_approved_students

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing approved students created before the payment workflow
    # should be treated as already verified so they remain visible
    op.execute(
        "UPDATE students SET payment_status = 'verified' WHERE status = 'APPROVED' AND payment_status = 'unpaid'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE students SET payment_status = 'unpaid' WHERE status = 'APPROVED' AND payment_status = 'verified'"
    )
