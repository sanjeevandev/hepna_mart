import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.project import Project
    from app.models.organization import Organization


class ProjectAction:
    PROJECT_CREATED = "PROJECT_CREATED"
    PROJECT_UPDATED = "PROJECT_UPDATED"
    PROJECT_DELETED = "PROJECT_DELETED"
    PROJECT_TRANSFERRED = "PROJECT_TRANSFERRED"
    PROJECT_MOVED_TO_ORGANIZATION = "PROJECT_MOVED_TO_ORGANIZATION"
    PROJECT_MOVED_TO_PERSONAL = "PROJECT_MOVED_TO_PERSONAL"
    
    BOQ_MATERIAL_ADDED = "BOQ_MATERIAL_ADDED"
    BOQ_MATERIAL_UPDATED = "BOQ_MATERIAL_UPDATED"
    BOQ_MATERIAL_REMOVED = "BOQ_MATERIAL_REMOVED"
    BOQ_PRICING_REFRESHED = "BOQ_PRICING_REFRESHED"
    
    PURCHASED_QUANTITY_UPDATED = "PURCHASED_QUANTITY_UPDATED"
    PROCUREMENT_NOTE_UPDATED = "PROCUREMENT_NOTE_UPDATED"
    
    PROJECT_STAGE_UPDATED = "PROJECT_STAGE_UPDATED"
    
    PROJECT_MEMBER_ADDED = "PROJECT_MEMBER_ADDED"
    PROJECT_MEMBER_ROLE_UPDATED = "PROJECT_MEMBER_ROLE_UPDATED"
    PROJECT_MEMBER_REMOVED = "PROJECT_MEMBER_REMOVED"
    
    ESTIMATE_TRANSFERRED_TO_BOQ = "ESTIMATE_TRANSFERRED_TO_BOQ"


class ProjectActivityLog(Base):
    """
    Append-only audit and activity history log for project workspaces.
    Captures WHO performed WHAT action on WHICH resource and WHEN with structured metadata.
    """
    __tablename__ = "project_activity_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"act-{uuid.uuid4().hex[:12]}",
        index=True,
    )
    organization_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    project_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("projects.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    actor_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    metadata_: Mapped[Dict[str, Any]] = mapped_column(
        "metadata",
        JSON,
        nullable=False,
        default=dict,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    __table_args__ = (
        Index("ix_project_activity_logs_proj_created", "project_id", "created_at"),
        Index("ix_project_activity_logs_org_created", "organization_id", "created_at"),
        Index("ix_project_activity_logs_actor_created", "actor_user_id", "created_at"),
    )

    # Relationships
    actor: Mapped[Optional["User"]] = relationship("User")
    project: Mapped[Optional["Project"]] = relationship("Project")
    organization: Mapped[Optional["Organization"]] = relationship("Organization")

    def __repr__(self) -> str:
        return f"<ProjectActivityLog id={self.id} action={self.action} project_id={self.project_id} actor={self.actor_user_id}>"
