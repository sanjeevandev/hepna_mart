"""create_wholesale_rfq_tables

Revision ID: 0005_create_wholesale_rfq
Revises: 0004_create_orders
Create Date: 2026-09-26 19:46:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0005_create_wholesale_rfq'
down_revision: Union[str, None] = '0004_create_orders'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. RFQs Table
    op.create_table(
        'rfqs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('rfq_number', sa.String(length=32), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=64), nullable=True),
        sa.Column('project_name', sa.String(length=255), nullable=True),
        sa.Column('project_type', sa.String(length=64), nullable=True),
        sa.Column('required_by_date', sa.String(length=64), nullable=True),
        sa.Column('delivery_address', sa.JSON(), nullable=False),
        sa.Column('gstin', sa.String(length=32), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=32), server_default='draft', nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('rfq_number', name='uq_rfqs_rfq_number'),
    )
    op.create_index(op.f('ix_rfqs_id'), 'rfqs', ['id'], unique=False)
    op.create_index(op.f('ix_rfqs_rfq_number'), 'rfqs', ['rfq_number'], unique=True)
    op.create_index(op.f('ix_rfqs_user_id'), 'rfqs', ['user_id'], unique=False)
    op.create_index(op.f('ix_rfqs_status'), 'rfqs', ['status'], unique=False)

    # 2. RFQ Items Table
    op.create_table(
        'rfq_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('rfq_id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=True),
        sa.Column('product_name', sa.String(length=255), nullable=False),
        sa.Column('product_sku', sa.String(length=64), nullable=True),
        sa.Column('brand', sa.String(length=128), nullable=True),
        sa.Column('unit', sa.String(length=32), nullable=True),
        sa.Column('requested_quantity', sa.Integer(), nullable=False),
        sa.Column('target_unit_price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['rfq_id'], ['rfqs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_rfq_items_id'), 'rfq_items', ['id'], unique=False)
    op.create_index(op.f('ix_rfq_items_rfq_id'), 'rfq_items', ['rfq_id'], unique=False)
    op.create_index(op.f('ix_rfq_items_product_id'), 'rfq_items', ['product_id'], unique=False)

    # 3. RFQ Status History Table
    op.create_table(
        'rfq_status_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('rfq_id', sa.String(length=36), nullable=False),
        sa.Column('old_status', sa.String(length=32), nullable=True),
        sa.Column('new_status', sa.String(length=32), nullable=False),
        sa.Column('changed_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['rfq_id'], ['rfqs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_rfq_status_history_id'), 'rfq_status_history', ['id'], unique=False)
    op.create_index(op.f('ix_rfq_status_history_rfq_id'), 'rfq_status_history', ['rfq_id'], unique=False)

    # 4. Quotes Table
    op.create_table(
        'quotes',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('quote_number', sa.String(length=32), nullable=False),
        sa.Column('rfq_id', sa.String(length=36), nullable=False),
        sa.Column('version', sa.Integer(), server_default='1', nullable=False),
        sa.Column('status', sa.String(length=32), server_default='draft', nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('discount_amount', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('tax_amount', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('delivery_charge', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('customer_notes', sa.Text(), nullable=True),
        sa.Column('procurement_notes', sa.Text(), nullable=True),
        sa.Column('created_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['rfq_id'], ['rfqs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('quote_number', name='uq_quotes_quote_number'),
    )
    op.create_index(op.f('ix_quotes_id'), 'quotes', ['id'], unique=False)
    op.create_index(op.f('ix_quotes_quote_number'), 'quotes', ['quote_number'], unique=True)
    op.create_index(op.f('ix_quotes_rfq_id'), 'quotes', ['rfq_id'], unique=False)
    op.create_index(op.f('ix_quotes_status'), 'quotes', ['status'], unique=False)

    # 5. Quote Items Table
    op.create_table(
        'quote_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('quote_id', sa.String(length=36), nullable=False),
        sa.Column('rfq_item_id', sa.String(length=36), nullable=True),
        sa.Column('product_id', sa.String(length=36), nullable=True),
        sa.Column('product_name', sa.String(length=255), nullable=False),
        sa.Column('product_sku', sa.String(length=64), nullable=True),
        sa.Column('brand', sa.String(length=128), nullable=True),
        sa.Column('unit', sa.String(length=32), nullable=True),
        sa.Column('requested_quantity', sa.Integer(), nullable=False),
        sa.Column('quoted_quantity', sa.Integer(), nullable=False),
        sa.Column('catalog_unit_price_at_quote', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('quoted_unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('discount_amount', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('tax_amount', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('line_subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('line_total', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['quote_id'], ['quotes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['rfq_item_id'], ['rfq_items.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_quote_items_id'), 'quote_items', ['id'], unique=False)
    op.create_index(op.f('ix_quote_items_quote_id'), 'quote_items', ['quote_id'], unique=False)
    op.create_index(op.f('ix_quote_items_product_id'), 'quote_items', ['product_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_quote_items_product_id'), table_name='quote_items')
    op.drop_index(op.f('ix_quote_items_quote_id'), table_name='quote_items')
    op.drop_index(op.f('ix_quote_items_id'), table_name='quote_items')
    op.drop_table('quote_items')

    op.drop_index(op.f('ix_quotes_status'), table_name='quotes')
    op.drop_index(op.f('ix_quotes_rfq_id'), table_name='quotes')
    op.drop_index(op.f('ix_quotes_quote_number'), table_name='quotes')
    op.drop_index(op.f('ix_quotes_id'), table_name='quotes')
    op.drop_table('quotes')

    op.drop_index(op.f('ix_rfq_status_history_rfq_id'), table_name='rfq_status_history')
    op.drop_index(op.f('ix_rfq_status_history_id'), table_name='rfq_status_history')
    op.drop_table('rfq_status_history')

    op.drop_index(op.f('ix_rfq_items_product_id'), table_name='rfq_items')
    op.drop_index(op.f('ix_rfq_items_rfq_id'), table_name='rfq_items')
    op.drop_index(op.f('ix_rfq_items_id'), table_name='rfq_items')
    op.drop_table('rfq_items')

    op.drop_index(op.f('ix_rfqs_status'), table_name='rfqs')
    op.drop_index(op.f('ix_rfqs_user_id'), table_name='rfqs')
    op.drop_index(op.f('ix_rfqs_rfq_number'), table_name='rfqs')
    op.drop_index(op.f('ix_rfqs_id'), table_name='rfqs')
    op.drop_table('rfqs')
