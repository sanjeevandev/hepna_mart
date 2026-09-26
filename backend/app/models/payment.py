import uuid
from enum import Enum
from typing import List, Optional, TYPE_CHECKING
from decimal import Decimal
from datetime import datetime
from sqlalchemy import (
    String,
    Numeric,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.order import Order


class PaymentStatus(str, Enum):
    PENDING = "pending"
    AWAITING_VERIFICATION = "awaiting_verification"
    VERIFIED = "verified"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    UPI = "upi"
    COD = "cod"
    CARD = "card"
    NETBANKING = "netbanking"


class PaymentProvider(str, Enum):
    MANUAL_UPI = "manual_upi"
    COD = "cod"
    RAZORPAY = "razorpay"
    CASHFREE = "cashfree"
    PHONEPE = "phonepe"


class PaymentEventType(str, Enum):
    PAYMENT_CREATED = "PAYMENT_CREATED"
    PAYMENT_SUBMITTED = "PAYMENT_SUBMITTED"
    PAYMENT_VERIFIED = "PAYMENT_VERIFIED"
    PAYMENT_REJECTED = "PAYMENT_REJECTED"
    PAYMENT_CANCELLED = "PAYMENT_CANCELLED"
    PAYMENT_REFUNDED = "PAYMENT_REFUNDED"
    RECONCILIATION_SYNC = "RECONCILIATION_SYNC"


class Payment(Base, TimestampMixin):
    """
    Authoritative payment record in HEPNA MART.
    Linked to an authoritative customer order.
    """
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_payments_amount_positive"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    order_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    payment_reference: Mapped[Optional[str]] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=True,
    )
    provider_reference: Mapped[Optional[str]] = mapped_column(
        String(128),
        index=True,
        nullable=True,
    )
    provider: Mapped[str] = mapped_column(
        String(32),
        default=PaymentProvider.MANUAL_UPI.value,
        nullable=False,
    )
    payment_method: Mapped[str] = mapped_column(
        String(32),
        default=PaymentMethod.UPI.value,
        nullable=False,
    )
    payment_status: Mapped[str] = mapped_column(
        String(32),
        default=PaymentStatus.PENDING.value,
        index=True,
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
        nullable=False,
    )
    failure_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    verified_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], backref="payments", lazy="selectin")
    verified_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[verified_by_user_id], lazy="selectin")
    order: Mapped["Order"] = relationship("Order", backref="payments", lazy="selectin")
    events: Mapped[List["PaymentEvent"]] = relationship(
        "PaymentEvent",
        back_populates="payment",
        cascade="all, delete-orphan",
        order_by="PaymentEvent.created_at",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Payment id={self.id} ref={self.payment_reference} status={self.payment_status} amount={self.amount}>"


class PaymentEvent(Base):
    """
    Immutable audit log for payment lifecycle state changes.
    """
    __tablename__ = "payment_events"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    payment_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("payments.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    old_status: Mapped[Optional[str]] = mapped_column(
        String(32),
        nullable=True,
    )
    new_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )
    provider_event_id: Mapped[Optional[str]] = mapped_column(
        String(128),
        index=True,
        nullable=True,
    )
    metadata_payload: Mapped[Optional[dict]] = mapped_column(
        "metadata",
        JSON,
        nullable=True,
    )
    created_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    payment: Mapped["Payment"] = relationship("Payment", back_populates="events")
    created_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by_user_id], lazy="joined")

    def __repr__(self) -> str:
        return f"<PaymentEvent id={self.id} type={self.event_type} {self.old_status}->{self.new_status}>"
