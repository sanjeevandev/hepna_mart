import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Integer,
    Numeric,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    Enum as SQLEnum,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.organization import OrgRole

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product
    from app.models.estimate import Estimate
    from app.models.organization import Organization


class Project(Base, TimestampMixin):
    """
    Authoritative construction project workspace model in HEPNA MART.
    Can be a personal project (organization_id=NULL) or an organization-bound shared workspace.
    Contains itemized BOQ materials, linked estimates, and collaborative project members.
    """
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"proj-{uuid.uuid4().hex[:12]}",
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
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
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    project_type: Mapped[str] = mapped_column(String(64), nullable=False, default="House")
    built_up_area: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("1500.00"))
    area_unit: Mapped[str] = mapped_column(String(32), nullable=False, default="sq.ft")
    floors: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    stage: Mapped[str] = mapped_column(String(64), nullable=False, default="Foundation")
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="Pune")
    pincode: Mapped[str] = mapped_column(String(10), nullable=False, default="411001")
    completed_stages: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", backref="projects")
    organization: Mapped[Optional["Organization"]] = relationship("Organization")
    materials: Mapped[List["ProjectMaterial"]] = relationship(
        "ProjectMaterial",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ProjectMaterial.added_at.desc()",
    )
    estimates: Mapped[List["Estimate"]] = relationship(
        "Estimate",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    members: Mapped[List["ProjectMember"]] = relationship(
        "ProjectMember",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ProjectMember.created_at.asc()",
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} name={self.name} org_id={self.organization_id} user_id={self.user_id}>"


class ProjectMember(Base, TimestampMixin):
    """
    Project-level membership association linking a User to a specific Project with an assigned OrgRole.
    Must belong to the owning Organization.
    """
    __tablename__ = "project_members"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    project_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("projects.id", ondelete="CASCADE"),
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
        UniqueConstraint("project_id", "user_id", name="uq_project_member"),
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="members")
    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<ProjectMember project_id={self.project_id} user_id={self.user_id} role={self.role}>"


class ProjectMaterial(Base, TimestampMixin):
    """
    Itemized Bill of Quantities (BOQ) material row linked to a Project.
    Stores required vs purchased quantities, wastage allowances, and price snapshot at addition.
    """
    __tablename__ = "project_materials"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    project_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("projects.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("1.00"))
    unit: Mapped[str] = mapped_column(String(32), nullable=False, default="Piece")
    purchased_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    wastage_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("0.00"))
    stage: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    price_at_addition: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="materials")
    product: Mapped["Product"] = relationship("Product")
