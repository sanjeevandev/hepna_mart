import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.product import Product


class Category(Base, TimestampMixin):
    """
    Product Category model supporting hierarchical classification for construction materials.
    """
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    slug: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    tagline: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    icon: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    image: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    parent_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    subcategories: Mapped[Optional[list]] = mapped_column(
        JSON,
        default=list,
        nullable=True,
    )

    # Relationships
    parent: Mapped[Optional["Category"]] = relationship(
        "Category",
        remote_side="Category.id",
        back_populates="children",
    )
    children: Mapped[List["Category"]] = relationship(
        "Category",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
    products: Mapped[List["Product"]] = relationship(
        "Product",
        back_populates="category",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name} slug={self.slug}>"
