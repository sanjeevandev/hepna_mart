"""create_cart_wishlist_tables

Revision ID: 0003_create_cart_wishlist
Revises: 0002_create_catalog
Create Date: 2026-09-25 22:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0003_create_cart_wishlist'
down_revision: Union[str, None] = '0002_create_catalog'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Carts table
    op.create_table(
        'carts',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_carts_user_id'),
    )
    op.create_index(op.f('ix_carts_id'), 'carts', ['id'], unique=False)
    op.create_index(op.f('ix_carts_user_id'), 'carts', ['user_id'], unique=True)

    # 2. Cart Items table
    op.create_table(
        'cart_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('cart_id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('price_at_addition', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('quantity > 0', name='ck_cart_item_quantity_positive'),
        sa.ForeignKeyConstraint(['cart_id'], ['carts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cart_id', 'product_id', name='uq_cart_product'),
    )
    op.create_index(op.f('ix_cart_items_id'), 'cart_items', ['id'], unique=False)
    op.create_index(op.f('ix_cart_items_cart_id'), 'cart_items', ['cart_id'], unique=False)
    op.create_index(op.f('ix_cart_items_product_id'), 'cart_items', ['product_id'], unique=False)

    # 3. Wishlists table
    op.create_table(
        'wishlists',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_wishlists_user_id'),
    )
    op.create_index(op.f('ix_wishlists_id'), 'wishlists', ['id'], unique=False)
    op.create_index(op.f('ix_wishlists_user_id'), 'wishlists', ['user_id'], unique=True)

    # 4. Wishlist Items table
    op.create_table(
        'wishlist_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('wishlist_id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['wishlist_id'], ['wishlists.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('wishlist_id', 'product_id', name='uq_wishlist_product'),
    )
    op.create_index(op.f('ix_wishlist_items_id'), 'wishlist_items', ['id'], unique=False)
    op.create_index(op.f('ix_wishlist_items_wishlist_id'), 'wishlist_items', ['wishlist_id'], unique=False)
    op.create_index(op.f('ix_wishlist_items_product_id'), 'wishlist_items', ['product_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_wishlist_items_product_id'), table_name='wishlist_items')
    op.drop_index(op.f('ix_wishlist_items_wishlist_id'), table_name='wishlist_items')
    op.drop_index(op.f('ix_wishlist_items_id'), table_name='wishlist_items')
    op.drop_table('wishlist_items')

    op.drop_index(op.f('ix_wishlists_user_id'), table_name='wishlists')
    op.drop_index(op.f('ix_wishlists_id'), table_name='wishlists')
    op.drop_table('wishlists')

    op.drop_index(op.f('ix_cart_items_product_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_cart_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_id'), table_name='cart_items')
    op.drop_table('cart_items')

    op.drop_index(op.f('ix_carts_user_id'), table_name='carts')
    op.drop_index(op.f('ix_carts_id'), table_name='carts')
    op.drop_table('carts')
