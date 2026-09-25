import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Enum as SQLEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class AccountType(str, Enum):
    INDIVIDUAL = "individual"
    CONTRACTOR = "contractor"
    BUSINESS = "business"


class UserRole(str, Enum):
    CUSTOMER = "customer"
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    PROCUREMENT_MANAGER = "procurement_manager"
    INVENTORY_MANAGER = "inventory_manager"
    ORDER_MANAGER = "order_manager"
    SUPPORT_STAFF = "support_staff"


class User(Base, TimestampMixin):
    """
    Authoritative User entity for HEPNA MART.
    Maintains strict separation between customer AccountType and internal UserRole.
    """
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True,
    )
    company_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    account_type: Mapped[AccountType] = mapped_column(
        SQLEnum(AccountType, name="account_type_enum", native_enum=False),
        nullable=False,
        default=AccountType.INDIVIDUAL,
        index=True,
    )
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role_enum", native_enum=False),
        nullable=False,
        default=UserRole.CUSTOMER,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_staff(self) -> bool:
        return self.role != UserRole.CUSTOMER

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
