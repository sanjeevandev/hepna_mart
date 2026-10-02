"""create_projects_and_estimates

Revision ID: 0007_create_projects
Revises: 0006_create_payments
Create Date: 2026-10-01 12:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0007_create_projects'
down_revision: Union[str, None] = '0006_create_payments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Projects Table
    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('project_type', sa.String(length=64), server_default='House', nullable=False),
        sa.Column('built_up_area', sa.Numeric(precision=12, scale=2), server_default='1500.00', nullable=False),
        sa.Column('area_unit', sa.String(length=32), server_default='sq.ft', nullable=False),
        sa.Column('floors', sa.Integer(), server_default='1', nullable=False),
        sa.Column('stage', sa.String(length=64), server_default='Foundation', nullable=False),
        sa.Column('city', sa.String(length=100), server_default='Pune', nullable=False),
        sa.Column('pincode', sa.String(length=10), server_default='411001', nullable=False),
        sa.Column('completed_stages', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_projects_id'), 'projects', ['id'], unique=False)
    op.create_index(op.f('ix_projects_user_id'), 'projects', ['user_id'], unique=False)

    # 2. Project Materials Table (BOQ)
    op.create_table(
        'project_materials',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=12, scale=2), server_default='1.00', nullable=False),
        sa.Column('unit', sa.String(length=32), server_default='Piece', nullable=False),
        sa.Column('purchased_quantity', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('wastage_percent', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('stage', sa.String(length=64), nullable=True),
        sa.Column('price_at_addition', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_project_materials_id'), 'project_materials', ['id'], unique=False)
    op.create_index(op.f('ix_project_materials_project_id'), 'project_materials', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_materials_product_id'), 'project_materials', ['product_id'], unique=False)

    # 3. Estimates Table
    op.create_table(
        'estimates',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=True),
        sa.Column('project_type', sa.String(length=64), server_default='House', nullable=False),
        sa.Column('built_up_area', sa.Numeric(precision=12, scale=2), server_default='1500.00', nullable=False),
        sa.Column('area_unit', sa.String(length=32), server_default='sq.ft', nullable=False),
        sa.Column('floors', sa.Integer(), server_default='1', nullable=False),
        sa.Column('quality', sa.String(length=32), server_default='standard', nullable=False),
        sa.Column('city', sa.String(length=100), server_default='Pune', nullable=False),
        sa.Column('project_name', sa.String(length=255), nullable=True),
        sa.Column('inputs', sa.JSON(), nullable=False),
        sa.Column('materials', sa.JSON(), nullable=False),
        sa.Column('subtotal_at_estimate', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('tax_at_estimate', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('delivery_at_estimate', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('total_at_estimate', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('validity_days', sa.Integer(), server_default='7', nullable=False),
        sa.Column('price_snapshot_timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_estimates_id'), 'estimates', ['id'], unique=False)
    op.create_index(op.f('ix_estimates_user_id'), 'estimates', ['user_id'], unique=False)
    op.create_index(op.f('ix_estimates_project_id'), 'estimates', ['project_id'], unique=False)


def downgrade() -> None:
    op.drop_table('estimates')
    op.drop_table('project_materials')
    op.drop_table('projects')
