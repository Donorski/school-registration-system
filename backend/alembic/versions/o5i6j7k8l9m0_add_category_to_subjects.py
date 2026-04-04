"""add category field to subjects

Revision ID: o5i6j7k8l9m0
Revises: n4h5i6j7k8l9
Create Date: 2026-04-04

"""
from alembic import op
import sqlalchemy as sa


revision = 'o5i6j7k8l9m0'
down_revision = 'n4h5i6j7k8l9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('subjects', sa.Column('category', sa.String(50), nullable=True))
    op.create_index('ix_subjects_category', 'subjects', ['category'])


def downgrade():
    op.drop_index('ix_subjects_category', table_name='subjects')
    op.drop_column('subjects', 'category')
