"""create_payment_tables

Revision ID: 0006_create_payments
Revises: 0005_create_wholesale_rfq
Create Date: 2026-09-26 21:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0006_create_payments'
down_revision: Union[str, None] = '0005_create_wholesale_rfq'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Payments Table
    op.create_table(
        'payments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('payment_reference', sa.String(length=64), nullable=True),
        sa.Column('provider_reference', sa.String(length=128), nullable=True),
        sa.Column('provider', sa.String(length=32), server_default='manual_upi', nullable=False),
        sa.Column('payment_method', sa.String(length=32), server_default='upi', nullable=False),
        sa.Column('payment_status', sa.String(length=32), server_default='pending', nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=10), server_default='INR', nullable=False),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('verified_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('amount > 0', name='ck_payments_amount_positive'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['verified_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('payment_reference', name='uq_payments_payment_reference'),
    )
    op.create_index(op.f('ix_payments_id'), 'payments', ['id'], unique=False)
    op.create_index(op.f('ix_payments_order_id'), 'payments', ['order_id'], unique=False)
    op.create_index(op.f('ix_payments_user_id'), 'payments', ['user_id'], unique=False)
    op.create_index(op.f('ix_payments_payment_reference'), 'payments', ['payment_reference'], unique=True)
    op.create_index(op.f('ix_payments_provider_reference'), 'payments', ['provider_reference'], unique=False)
    op.create_index(op.f('ix_payments_payment_status'), 'payments', ['payment_status'], unique=False)

    # 2. Payment Events Table
    op.create_table(
        'payment_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('payment_id', sa.String(length=36), nullable=False),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('old_status', sa.String(length=32), nullable=True),
        sa.Column('new_status', sa.String(length=32), nullable=False),
        sa.Column('provider_event_id', sa.String(length=128), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_by_user_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['payment_id'], ['payments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_payment_events_id'), 'payment_events', ['id'], unique=False)
    op.create_index(op.f('ix_payment_events_payment_id'), 'payment_events', ['payment_id'], unique=False)
    op.create_index(op.f('ix_payment_events_provider_event_id'), 'payment_events', ['provider_event_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_payment_events_provider_event_id'), table_name='payment_events')
    op.drop_index(op.f('ix_payment_events_payment_id'), table_name='payment_events')
    op.drop_index(op.f('ix_payment_events_id'), table_name='payment_events')
    op.drop_table('payment_events')

    op.drop_index(op.f('ix_payments_payment_status'), table_name='payments')
    op.drop_index(op.f('ix_payments_provider_reference'), table_name='payments')
    op.drop_index(op.f('ix_payments_payment_reference'), table_name='payments')
    op.drop_index(op.f('ix_payments_user_id'), table_name='payments')
    op.drop_index(op.f('ix_payments_order_id'), table_name='payments')
    op.drop_index(op.f('ix_payments_id'), table_name='payments')
    op.drop_table('payments')
