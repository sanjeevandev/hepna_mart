"""create business and contractor profiles

Revision ID: 0008_create_business_and_contractor_profiles
Revises: 0007_create_projects_and_estimates
Create Date: 2026-10-01 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0008_create_business_and_contractor_profiles'
down_revision = '0007_create_projects_and_estimates'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. business_profiles table
    op.create_table(
        'business_profiles',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('business_name', sa.String(length=255), nullable=False),
        sa.Column('business_type', sa.String(length=100), nullable=False, server_default='Private Limited Company'),
        sa.Column('gstin', sa.String(length=15), nullable=True),
        sa.Column('pan', sa.String(length=10), nullable=True),
        sa.Column('registered_address', sa.String(length=500), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('pincode', sa.String(length=10), nullable=False),
        sa.Column('contact_person', sa.String(length=255), nullable=False),
        sa.Column('contact_phone', sa.String(length=30), nullable=False),
        sa.Column('contact_email', sa.String(length=255), nullable=True),
        sa.Column('tax_verification_status', sa.String(length=32), nullable=False, server_default='not_provided'),
        sa.Column('tax_verification_notes', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_business_profiles_user_id'),
    )
    op.create_index(op.f('ix_business_profiles_id'), 'business_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_business_profiles_user_id'), 'business_profiles', ['user_id'], unique=True)
    op.create_index(op.f('ix_business_profiles_gstin'), 'business_profiles', ['gstin'], unique=False)
    op.create_index(op.f('ix_business_profiles_pan'), 'business_profiles', ['pan'], unique=False)

    # 2. contractor_profiles table
    op.create_table(
        'contractor_profiles',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('business_name', sa.String(length=255), nullable=False),
        sa.Column('specialization', sa.JSON(), nullable=False),
        sa.Column('years_of_experience', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('service_area', sa.String(length=255), nullable=False, server_default='Local District'),
        sa.Column('license_number', sa.String(length=100), nullable=True),
        sa.Column('project_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('preferred_materials', sa.JSON(), nullable=False),
        sa.Column('verification_status', sa.String(length=32), nullable=False, server_default='not_provided'),
        sa.Column('verification_notes', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_contractor_profiles_user_id'),
    )
    op.create_index(op.f('ix_contractor_profiles_id'), 'contractor_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_contractor_profiles_user_id'), 'contractor_profiles', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_contractor_profiles_user_id'), table_name='contractor_profiles')
    op.drop_index(op.f('ix_contractor_profiles_id'), table_name='contractor_profiles')
    op.drop_table('contractor_profiles')

    op.drop_index(op.f('ix_business_profiles_pan'), table_name='business_profiles')
    op.drop_index(op.f('ix_business_profiles_gstin'), table_name='business_profiles')
    op.drop_index(op.f('ix_business_profiles_user_id'), table_name='business_profiles')
    op.drop_index(op.f('ix_business_profiles_id'), table_name='business_profiles')
    op.drop_table('business_profiles')
