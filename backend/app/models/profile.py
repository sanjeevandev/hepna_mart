import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    String,
    Integer,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class BusinessProfile(Base, TimestampMixin):
    """
    PostgreSQL-backed business & tax profile model for HEPNA MART enterprise customers.
    Stores verified GSTIN/PAN and corporate address parameters.
    """
    __tablename__ = "business_profiles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"biz-{uuid.uuid4().hex[:12]}",
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    business_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Private Limited Company",
    )
    gstin: Mapped[Optional[str]] = mapped_column(
        String(15),
        nullable=True,
        index=True,
    )
    pan: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
        index=True,
    )
    registered_address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str] = mapped_column(String(10), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(30), nullable=False)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tax_verification_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="not_provided",
    )
    tax_verification_notes: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", backref="business_profile")


class ContractorProfile(Base, TimestampMixin):
    """
    PostgreSQL-backed contractor credentials and specialization profile model.
    Stores construction experience, specializations, and licensing.
    """
    __tablename__ = "contractor_profiles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"cont-{uuid.uuid4().hex[:12]}",
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialization: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    years_of_experience: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )
    service_area: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="Local District",
    )
    license_number: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    project_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    preferred_materials: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )
    verification_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="not_provided",
    )
    verification_notes: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", backref="contractor_profile")
