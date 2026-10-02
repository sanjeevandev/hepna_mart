"""create project notifications

Revision ID: 0012_create_project_notifications
Revises: 0011_create_project_activity_and_audit_logs
Create Date: 2026-10-01 23:10:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0012_create_project_notifications'
down_revision = '0011_create_project_activity_and_audit_logs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'project_notifications',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('recipient_user_id', sa.String(length=36), nullable=False),
        sa.Column('organization_id', sa.String(length=36), nullable=True),
        sa.Column('project_id', sa.String(length=36), nullable=True),
        sa.Column('activity_log_id', sa.String(length=36), nullable=True),
        sa.Column('notification_type', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['recipient_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['activity_log_id'], ['project_activity_logs.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_project_notifications_id'), 'project_notifications', ['id'], unique=False)
    op.create_index(op.f('ix_project_notifications_recipient_user_id'), 'project_notifications', ['recipient_user_id'], unique=False)
    op.create_index(op.f('ix_project_notifications_organization_id'), 'project_notifications', ['organization_id'], unique=False)
    op.create_index(op.f('ix_project_notifications_project_id'), 'project_notifications', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_notifications_activity_log_id'), 'project_notifications', ['activity_log_id'], unique=False)
    op.create_index(op.f('ix_project_notifications_notification_type'), 'project_notifications', ['notification_type'], unique=False)
    op.create_index(op.f('ix_project_notifications_is_read'), 'project_notifications', ['is_read'], unique=False)
    op.create_index(op.f('ix_project_notifications_created_at'), 'project_notifications', ['created_at'], unique=False)
    
    # Compound indexes for fast filtered listing and unread count
    op.create_index('ix_proj_notif_recipient_created', 'project_notifications', ['recipient_user_id', 'created_at'], unique=False)
    op.create_index('ix_proj_notif_recipient_read_created', 'project_notifications', ['recipient_user_id', 'is_read', 'created_at'], unique=False)
    op.create_index('ix_proj_notif_project_created', 'project_notifications', ['project_id', 'created_at'], unique=False)
    op.create_index('ix_proj_notif_org_created', 'project_notifications', ['organization_id', 'created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_proj_notif_org_created', table_name='project_notifications')
    op.drop_index('ix_proj_notif_project_created', table_name='project_notifications')
    op.drop_index('ix_proj_notif_recipient_read_created', table_name='project_notifications')
    op.drop_index('ix_proj_notif_recipient_created', table_name='project_notifications')
    op.drop_index(op.f('ix_project_notifications_created_at'), table_name='project_notifications')
    op.drop_index(op.f('ix_project_notifications_is_read'), table_name='project_notifications')
    op.drop_index(op.f('ix_project_notifications_notification_type'), table_name='project_notifications')
    op.drop_index(op.f('ix_project_notifications_activity_log_id'), table_name='project_notifications')
    op.drop_index(op.f('ix_project_notifications_project_id'), table_name='project_notifications')
    op.drop_index(op.f('ix_project_notifications_organization_id'), table_name='project_notifications')
    op.drop_index(op.f('ix_project_notifications_recipient_user_id'), table_name='project_notifications')
    op.drop_index(op.f('ix_project_notifications_id'), table_name='project_notifications')
    op.drop_table('project_notifications')
