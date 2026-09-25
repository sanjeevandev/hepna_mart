import uuid
from typing import List, Optional, TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import String, Boolean, Integer, Float, Text, Numeric, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.inventory import Inventory


class Product(Base, TimestampMixin):
    """
    Core Product entity for construction materials, tools, and supplies.
    Uses Numeric(12, 2) for accurate monetary representation.
    """
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    sku: Mapped[Optional[str]] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=True,
    )
    brand: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    category_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    subcategory: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    short_description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    mrp: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    discount_percent: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    unit: Mapped[str] = mapped_column(
        String(30),
        default="Piece",
        nullable=False,
    )
    rating: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    review_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    bulk_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    minimum_bulk_quantity: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    delivery_available: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    is_new: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    is_offer: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    images: Mapped[Optional[list]] = mapped_column(
        JSON,
        default=list,
        nullable=True,
    )
    specifications: Mapped[Optional[list]] = mapped_column(
        JSON,
        default=list,
        nullable=True,
    )
    features: Mapped[Optional[list]] = mapped_column(
        JSON,
        default=list,
        nullable=True,
    )

    # Relationships
    category: Mapped["Category"] = relationship(
        "Category",
        back_populates="products",
    )
    inventory: Mapped[Optional["Inventory"]] = relationship(
        "Inventory",
        back_populates="product",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name} brand={self.brand} price={self.price}>"
