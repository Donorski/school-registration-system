"""add_transferee_document_fields

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-02-17 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('students', sa.Column('transfer_credential_path', sa.String(length=500), nullable=True))
    op.add_column('students', sa.Column('good_moral_path', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('students', 'good_moral_path')
    op.drop_column('students', 'transfer_credential_path')
