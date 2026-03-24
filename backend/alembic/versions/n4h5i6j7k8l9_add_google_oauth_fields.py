"""add google oauth fields to users

Revision ID: n4h5i6j7k8l9
Revises: m3g4h5i6j7k8
Create Date: 2026-03-23

"""
from alembic import op
import sqlalchemy as sa


revision = 'n4h5i6j7k8l9'
down_revision = 'm3g4h5i6j7k8'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('users', 'password_hash', nullable=True)
    op.add_column('users', sa.Column('google_id', sa.String(255), nullable=True))
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)


def downgrade():
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_column('users', 'google_id')
    op.alter_column('users', 'password_hash', nullable=False)
