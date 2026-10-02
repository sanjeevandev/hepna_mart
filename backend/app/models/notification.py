import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlalchemy import (
    String,
    Text,
    Boolean,
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
    from app.models.activity import ProjectActivityLog


class ProjectNotification(Base):
    """
    User-specific persistent in-app notification record for project activity and alerts.
    """
    __tablename__ = "project_notifications"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"notif-{uuid.uuid4().hex[:12]}",
        index=True,
    )
    recipient_user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
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
    activity_log_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("project_activity_logs.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    notification_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[Dict[str, Any]] = mapped_column(
        "metadata",
        JSON,
        nullable=False,
        default=dict,
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    __table_args__ = (
        Index("ix_proj_notif_recipient_created", "recipient_user_id", "created_at"),
        Index("ix_proj_notif_recipient_read_created", "recipient_user_id", "is_read", "created_at"),
        Index("ix_proj_notif_project_created", "project_id", "created_at"),
        Index("ix_proj_notif_org_created", "organization_id", "created_at"),
    )

    # Relationships
    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_user_id])
    project: Mapped[Optional["Project"]] = relationship("Project", foreign_keys=[project_id])
    organization: Mapped[Optional["Organization"]] = relationship("Organization", foreign_keys=[organization_id])
    activity_log: Mapped[Optional["ProjectActivityLog"]] = relationship("ProjectActivityLog", foreign_keys=[activity_log_id])

    def __repr__(self) -> str:
        return f"<ProjectNotification id={self.id} recipient={self.recipient_user_id} type={self.notification_type} read={self.is_read}>"
