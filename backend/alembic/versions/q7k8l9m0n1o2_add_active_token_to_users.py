"""add active_token to users

Revision ID: q7k8l9m0n1o2
Revises: p6j7k8l9m0n1
Create Date: 2026-04-24

"""
from alembic import op
import sqlalchemy as sa


revision = 'q7k8l9m0n1o2'
down_revision = 'p6j7k8l9m0n1'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('active_token', sa.String(512), nullable=True))


def downgrade():
    op.drop_column('users', 'active_token')
