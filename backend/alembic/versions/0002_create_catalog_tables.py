"""create_catalog_tables

Revision ID: 0002_create_catalog
Revises: 0001_create_users
Create Date: 2026-09-25 19:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0002_create_catalog'
down_revision: Union[str, None] = '0001_create_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tagline', sa.String(length=255), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('image', sa.String(length=500), nullable=True),
        sa.Column('parent_id', sa.String(length=36), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('subcategories', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['categories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=False)
    op.create_index(op.f('ix_categories_slug'), 'categories', ['slug'], unique=True)
    op.create_index(op.f('ix_categories_parent_id'), 'categories', ['parent_id'], unique=False)
    op.create_index(op.f('ix_categories_is_active'), 'categories', ['is_active'], unique=False)

    # 2. Products table
    op.create_table(
        'products',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('sku', sa.String(length=50), nullable=True),
        sa.Column('brand', sa.String(length=100), nullable=False),
        sa.Column('category_id', sa.String(length=36), nullable=False),
        sa.Column('subcategory', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('short_description', sa.String(length=500), nullable=True),
        sa.Column('price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('mrp', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('discount_percent', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('unit', sa.String(length=30), nullable=False, server_default='Piece'),
        sa.Column('rating', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('review_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('bulk_price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('minimum_bulk_quantity', sa.Integer(), nullable=True),
        sa.Column('delivery_available', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_new', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_offer', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('images', sa.JSON(), nullable=True),
        sa.Column('specifications', sa.JSON(), nullable=True),
        sa.Column('features', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_products_id'), 'products', ['id'], unique=False)
    op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)
    op.create_index(op.f('ix_products_slug'), 'products', ['slug'], unique=True)
    op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=True)
    op.create_index(op.f('ix_products_brand'), 'products', ['brand'], unique=False)
    op.create_index(op.f('ix_products_category_id'), 'products', ['category_id'], unique=False)
    op.create_index(op.f('ix_products_subcategory'), 'products', ['subcategory'], unique=False)
    op.create_index(op.f('ix_products_is_featured'), 'products', ['is_featured'], unique=False)
    op.create_index(op.f('ix_products_is_new'), 'products', ['is_new'], unique=False)
    op.create_index(op.f('ix_products_is_offer'), 'products', ['is_offer'], unique=False)
    op.create_index(op.f('ix_products_is_active'), 'products', ['is_active'], unique=False)

    # 3. Inventory table
    op.create_table(
        'inventory',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reserved_quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('low_stock_threshold', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('warehouse', sa.String(length=50), nullable=False, server_default='MAIN'),
        sa.Column('location', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('quantity >= 0', name='ck_inventory_quantity_non_negative'),
        sa.CheckConstraint('reserved_quantity >= 0', name='ck_inventory_reserved_non_negative'),
        sa.CheckConstraint('reserved_quantity <= quantity', name='ck_inventory_reserved_le_quantity'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_id', name='uq_inventory_product_id'),
    )
    op.create_index(op.f('ix_inventory_id'), 'inventory', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_product_id'), 'inventory', ['product_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_inventory_product_id'), table_name='inventory')
    op.drop_index(op.f('ix_inventory_id'), table_name='inventory')
    op.drop_table('inventory')

    op.drop_index(op.f('ix_products_is_active'), table_name='products')
    op.drop_index(op.f('ix_products_is_offer'), table_name='products')
    op.drop_index(op.f('ix_products_is_new'), table_name='products')
    op.drop_index(op.f('ix_products_is_featured'), table_name='products')
    op.drop_index(op.f('ix_products_subcategory'), table_name='products')
    op.drop_index(op.f('ix_products_category_id'), table_name='products')
    op.drop_index(op.f('ix_products_brand'), table_name='products')
    op.drop_index(op.f('ix_products_sku'), table_name='products')
    op.drop_index(op.f('ix_products_slug'), table_name='products')
    op.drop_index(op.f('ix_products_name'), table_name='products')
    op.drop_index(op.f('ix_products_id'), table_name='products')
    op.drop_table('products')

    op.drop_index(op.f('ix_categories_is_active'), table_name='categories')
    op.drop_index(op.f('ix_categories_parent_id'), table_name='categories')
    op.drop_index(op.f('ix_categories_slug'), table_name='categories')
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')
