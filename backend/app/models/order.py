import uuid
from enum import Enum
from typing import List, Optional, TYPE_CHECKING
from decimal import Decimal
from datetime import datetime
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


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    PACKED = "packed"
    DISPATCHED = "shipped"
    OUT_FOR_DELIVERY = "out-for-delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    NOT_APPLICABLE = "not_applicable"


class PaymentMethod(str, Enum):
    COD = "cod"
    ONLINE = "online"
    CARD = "card"
    UPI = "upi"
    NETBANKING = "netbanking"


class Order(Base, TimestampMixin):
    """
    Authoritative customer order entity in HEPNA MART.
    Maintains historical financial totals, status timeline, and site delivery snapshots.
    """
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    order_number: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default=OrderStatus.CONFIRMED.value,
        index=True,
        nullable=False,
    )
    payment_status: Mapped[str] = mapped_column(
        String(32),
        default=PaymentStatus.PENDING.value,
        index=True,
        nullable=False,
    )
    payment_method: Mapped[str] = mapped_column(
        String(64),
        default=PaymentMethod.ONLINE.value,
        nullable=False,
    )
    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    delivery_charge: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
        nullable=False,
    )

    # Customer Information Snapshot
    customer_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    customer_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    customer_phone: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    # Additional Metadata & Snapshot Details
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_delivery: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    delivery_window: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    project_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    quotation_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Construction Site / Delivery Details Snapshot (JSON)
    delivery_address: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", backref="orders")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderItem.created_at",
        lazy="selectin",
    )
    status_history: Mapped[List["OrderStatusHistory"]] = relationship(
        "OrderStatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderStatusHistory.created_at",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} order_number={self.order_number} status={self.status} total={self.total_amount}>"


class OrderItem(Base, TimestampMixin):
    """
    Line item belonging to an order.
    Preserves historical product name, sku, brand, price, unit and taxes at order creation time.
    """
    __tablename__ = "order_items"

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
    product_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    # Historical Product Snapshots
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_sku: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    product_image: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    # Financial & Quantity Values
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    mrp: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product", lazy="joined")

    def __repr__(self) -> str:
        return f"<OrderItem id={self.id} product={self.product_name} qty={self.quantity} total={self.total}>"


class OrderStatusHistory(Base, TimestampMixin):
    """
    Audit log and stage timeline tracking for an order.
    """
    __tablename__ = "order_status_history"

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
    old_status: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    new_status: Mapped[str] = mapped_column(String(32), nullable=False)
    changed_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="status_history")
    changed_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[changed_by_user_id], lazy="joined")

    def __repr__(self) -> str:
        return f"<OrderStatusHistory id={self.id} order_id={self.order_id} new_status={self.new_status}>"
