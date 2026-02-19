"""add_notifications_table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-02-13 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column(
            'type',
            sa.Enum(
                'application_approved', 'application_denied',
                'payment_verified', 'payment_rejected',
                'subjects_assigned', 'new_form_submitted',
                'new_receipt_uploaded', 'student_approved',
                name='notificationtype',
            ),
            nullable=False,
        ),
        sa.Column('is_read', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )
    op.create_index('ix_notifications_id', 'notifications', ['id'])
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_index('ix_notifications_id', table_name='notifications')
    op.drop_table('notifications')
    op.execute("DROP TYPE IF EXISTS notificationtype")
