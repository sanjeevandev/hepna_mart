"""create project comments

Revision ID: 0013_create_project_comments
Revises: 0012_create_project_notifications
Create Date: 2026-10-02 15:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0013_create_project_comments'
down_revision = '0012_create_project_notifications'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'project_comments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_edited', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_project_comments_id', 'project_comments', ['id'], unique=False)
    op.create_index('ix_project_comments_project_id', 'project_comments', ['project_id'], unique=False)
    op.create_index('ix_project_comments_user_id', 'project_comments', ['user_id'], unique=False)
    op.create_index('ix_project_comments_proj_created', 'project_comments', ['project_id', 'created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_project_comments_proj_created', table_name='project_comments')
    op.drop_index('ix_project_comments_user_id', table_name='project_comments')
    op.drop_index('ix_project_comments_project_id', table_name='project_comments')
    op.drop_index('ix_project_comments_id', table_name='project_comments')
    op.drop_table('project_comments')
