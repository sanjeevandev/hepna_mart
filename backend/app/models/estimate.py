import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Integer,
    Numeric,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.project import Project


class Estimate(Base, TimestampMixin):
    """
    Authoritative construction cost estimate model in HEPNA MART.
    Maintains parametric calculator inputs, itemized material breakdown snapshots,
    and historical pricing calculation state.
    """
    __tablename__ = "estimates"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"EST-{uuid.uuid4().hex[:6].upper()}",
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    project_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("projects.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    project_type: Mapped[str] = mapped_column(String(64), nullable=False, default="House")
    built_up_area: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("1500.00"))
    area_unit: Mapped[str] = mapped_column(String(32), nullable=False, default="sq.ft")
    floors: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    quality: Mapped[str] = mapped_column(String(32), nullable=False, default="standard")
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="Pune")
    project_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    inputs: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    materials: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    subtotal_at_estimate: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    tax_at_estimate: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    delivery_at_estimate: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    total_at_estimate: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))

    validity_days: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    price_snapshot_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", backref="estimates")
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="estimates")
