"""create project activity and audit logs

Revision ID: 0011_create_project_activity_and_audit_logs
Revises: 0010_create_shared_projects_and_project_members
Create Date: 2026-10-01 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0011_create_project_activity_and_audit_logs'
down_revision = '0010_create_shared_projects_and_project_members'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'project_activity_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('organization_id', sa.String(length=36), nullable=True),
        sa.Column('project_id', sa.String(length=36), nullable=True),
        sa.Column('actor_user_id', sa.String(length=36), nullable=True),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('resource_type', sa.String(length=64), nullable=False),
        sa.Column('resource_id', sa.String(length=64), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['actor_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_project_activity_logs_id'), 'project_activity_logs', ['id'], unique=False)
    op.create_index(op.f('ix_project_activity_logs_organization_id'), 'project_activity_logs', ['organization_id'], unique=False)
    op.create_index(op.f('ix_project_activity_logs_project_id'), 'project_activity_logs', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_activity_logs_actor_user_id'), 'project_activity_logs', ['actor_user_id'], unique=False)
    op.create_index(op.f('ix_project_activity_logs_action'), 'project_activity_logs', ['action'], unique=False)
    op.create_index(op.f('ix_project_activity_logs_created_at'), 'project_activity_logs', ['created_at'], unique=False)
    op.create_index('ix_project_activity_logs_proj_created', 'project_activity_logs', ['project_id', 'created_at'], unique=False)
    op.create_index('ix_project_activity_logs_org_created', 'project_activity_logs', ['organization_id', 'created_at'], unique=False)
    op.create_index('ix_project_activity_logs_actor_created', 'project_activity_logs', ['actor_user_id', 'created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_project_activity_logs_actor_created', table_name='project_activity_logs')
    op.drop_index('ix_project_activity_logs_org_created', table_name='project_activity_logs')
    op.drop_index('ix_project_activity_logs_proj_created', table_name='project_activity_logs')
    op.drop_index(op.f('ix_project_activity_logs_created_at'), table_name='project_activity_logs')
    op.drop_index(op.f('ix_project_activity_logs_action'), table_name='project_activity_logs')
    op.drop_index(op.f('ix_project_activity_logs_actor_user_id'), table_name='project_activity_logs')
    op.drop_index(op.f('ix_project_activity_logs_project_id'), table_name='project_activity_logs')
    op.drop_index(op.f('ix_project_activity_logs_organization_id'), table_name='project_activity_logs')
    op.drop_index(op.f('ix_project_activity_logs_id'), table_name='project_activity_logs')
    op.drop_table('project_activity_logs')
