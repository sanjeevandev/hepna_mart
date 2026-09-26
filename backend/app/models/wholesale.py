import uuid
from enum import Enum
from typing import List, Optional, TYPE_CHECKING
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import (
    String,
    Integer,
    Numeric,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product


class RFQStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    QUOTED = "quoted"
    NEGOTIATING = "negotiating"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class QuoteStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    NEGOTIATING = "negotiating"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class RFQ(Base, TimestampMixin):
    """
    Authoritative Request For Quotation (RFQ) model in HEPNA MART.
    Tracks institutional inquiries, bulk material lists, site constraints, and negotiation timeline.
    """
    __tablename__ = "rfqs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    rfq_number: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    project_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    project_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    project_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    required_by_date: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    delivery_address: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )
    gstin: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32),
        default=RFQStatus.DRAFT.value,
        index=True,
        nullable=False,
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", backref="rfqs")
    items: Mapped[List["RFQItem"]] = relationship(
        "RFQItem",
        back_populates="rfq",
        cascade="all, delete-orphan",
        order_by="RFQItem.created_at",
        lazy="selectin",
    )
    status_history: Mapped[List["RFQStatusHistory"]] = relationship(
        "RFQStatusHistory",
        back_populates="rfq",
        cascade="all, delete-orphan",
        order_by="RFQStatusHistory.created_at",
        lazy="selectin",
    )
    quotes: Mapped[List["Quote"]] = relationship(
        "Quote",
        back_populates="rfq",
        cascade="all, delete-orphan",
        order_by="Quote.created_at.desc()",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<RFQ id={self.id} rfq_number={self.rfq_number} status={self.status}>"


class RFQItem(Base):
    """
    Individual line item in an RFQ request.
    Stores requested materials, desired quantities, target rates, and product snapshot.
    """
    __tablename__ = "rfq_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    rfq_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("rfqs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    # Historical Product Snapshots
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_sku: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    # Quantity & Target Rate
    requested_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    target_unit_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    rfq: Mapped["RFQ"] = relationship("RFQ", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product", lazy="joined")

    def __repr__(self) -> str:
        return f"<RFQItem id={self.id} product={self.product_name} qty={self.requested_quantity}>"


class RFQStatusHistory(Base):
    """
    Audit log tracking milestone progress and state changes for an RFQ.
    """
    __tablename__ = "rfq_status_history"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    rfq_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("rfqs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    old_status: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    new_status: Mapped[str] = mapped_column(String(32), nullable=False)
    changed_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    rfq: Mapped["RFQ"] = relationship("RFQ", back_populates="status_history")
    changed_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[changed_by_user_id], lazy="joined")

    def __repr__(self) -> str:
        return f"<RFQStatusHistory id={self.id} rfq_id={self.rfq_id} new_status={self.new_status}>"


class Quote(Base, TimestampMixin):
    """
    Authoritative quotation record prepared by Procurement Managers in response to an RFQ.
    Supports revisions, validity dates, GST & delivery fee breakdowns.
    """
    __tablename__ = "quotes"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    quote_number: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
    )
    rfq_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("rfqs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32),
        default=QuoteStatus.DRAFT.value,
        index=True,
        nullable=False,
    )

    # Financial breakdown (Strictly calculated server-side using Decimal)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    delivery_charge: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    valid_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    customer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    procurement_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    rfq: Mapped["RFQ"] = relationship("RFQ", back_populates="quotes")
    items: Mapped[List["QuoteItem"]] = relationship(
        "QuoteItem",
        back_populates="quote",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    created_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by_user_id], lazy="joined")

    def __repr__(self) -> str:
        return f"<Quote id={self.id} quote_number={self.quote_number} version={self.version} total={self.total}>"


class QuoteItem(Base):
    """
    Line item for a quotation.
    Preserves agreed unit rates, quoted quantities, line taxes and line totals at quotation time.
    """
    __tablename__ = "quote_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    quote_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("quotes.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    rfq_item_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("rfq_items.id", ondelete="SET NULL"),
        nullable=True,
    )
    product_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Snapshot fields
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_sku: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    # Quantities & Pricing
    requested_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    quoted_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    catalog_unit_price_at_quote: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quoted_unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    line_subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Relationships
    quote: Mapped["Quote"] = relationship("Quote", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product", lazy="joined")
    rfq_item: Mapped[Optional["RFQItem"]] = relationship("RFQItem", lazy="joined")

    def __repr__(self) -> str:
        return f"<QuoteItem id={self.id} product={self.product_name} qty={self.quoted_quantity} rate={self.quoted_unit_price}>"
