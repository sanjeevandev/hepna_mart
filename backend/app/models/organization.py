import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class OrgRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    PROCUREMENT_MANAGER = "procurement_manager"
    PROJECT_MANAGER = "project_manager"
    SITE_SUPERVISOR = "site_supervisor"
    VIEWER = "viewer"


class Organization(Base, TimestampMixin):
    """
    Authoritative Customer Organization model in HEPNA MART.
    Represents a company or contracting enterprise with collaborative member management.
    """
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"org-{uuid.uuid4().hex[:12]}",
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    slug: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=True,
    )
    business_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Proprietorship",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id])
    members: Mapped[List["OrganizationMember"]] = relationship(
        "OrganizationMember",
        back_populates="organization",
        cascade="all, delete-orphan",
        order_by="OrganizationMember.created_at.asc()",
    )
    invitations: Mapped[List["OrganizationInvitation"]] = relationship(
        "OrganizationInvitation",
        back_populates="organization",
        cascade="all, delete-orphan",
        order_by="OrganizationInvitation.created_at.desc()",
    )

    def __repr__(self) -> str:
        return f"<Organization id={self.id} name={self.name} owner_id={self.owner_id}>"


class OrganizationMember(Base, TimestampMixin):
    """
    Membership association linking a User to an Organization with an assigned OrgRole.
    """
    __tablename__ = "organization_members"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    role: Mapped[OrgRole] = mapped_column(
        SQLEnum(OrgRole, name="org_role_enum", native_enum=False),
        nullable=False,
        default=OrgRole.VIEWER,
        index=True,
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_org_member"),
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="members")
    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<OrganizationMember org_id={self.organization_id} user_id={self.user_id} role={self.role}>"


class OrganizationInvitation(Base, TimestampMixin):
    """
    Invitation to join an Organization with an assigned OrgRole.
    Secured by a cryptographically generated token and bound to recipient email.
    """
    __tablename__ = "organization_invitations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    invited_by_user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )
    role: Mapped[OrgRole] = mapped_column(
        SQLEnum(OrgRole, name="org_role_enum", native_enum=False),
        nullable=False,
        default=OrgRole.VIEWER,
    )
    token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending",
        index=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="invitations")
    invited_by: Mapped["User"] = relationship("User", foreign_keys=[invited_by_user_id])

    @property
    def is_expired(self) -> bool:
        if self.expires_at.tzinfo is None:
            return datetime.now(timezone.utc).replace(tzinfo=None) > self.expires_at
        return datetime.now(timezone.utc) > self.expires_at

    def __repr__(self) -> str:
        return f"<OrganizationInvitation id={self.id} org_id={self.organization_id} email={self.email} status={self.status}>"
