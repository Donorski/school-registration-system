"""add school_settings table

Revision ID: p6j7k8l9m0n1
Revises: o5i6j7k8l9m0
Create Date: 2026-04-07

"""
from alembic import op
import sqlalchemy as sa


revision = 'p6j7k8l9m0n1'
down_revision = 'o5i6j7k8l9m0'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'school_settings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('school_name', sa.String(200), nullable=False, server_default=''),
        sa.Column('school_logo_url', sa.Text(), nullable=True),
    )
    # Insert the singleton row
    op.execute("INSERT INTO school_settings (id, school_name) VALUES (1, '')")


def downgrade():
    op.drop_table('school_settings')
