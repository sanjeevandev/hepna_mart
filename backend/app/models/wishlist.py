import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, UniqueConstraint, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product


class Wishlist(Base, TimestampMixin):
    """
    Customer saved items wishlist entity.
    Maintains one wishlist per authenticated customer with cascade lifecycle.
    """
    __tablename__ = "wishlists"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", backref="wishlist")
    items: Mapped[List["WishlistItem"]] = relationship(
        "WishlistItem",
        back_populates="wishlist",
        cascade="all, delete-orphan",
        order_by="WishlistItem.created_at",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Wishlist id={self.id} user_id={self.user_id}>"


class WishlistItem(Base):
    """
    Individual product saved in a customer wishlist.
    """
    __tablename__ = "wishlist_items"
    __table_args__ = (
        UniqueConstraint("wishlist_id", "product_id", name="uq_wishlist_product"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    wishlist_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("wishlists.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    wishlist: Mapped["Wishlist"] = relationship("Wishlist", back_populates="items")
    product: Mapped["Product"] = relationship("Product", lazy="joined")

    def __repr__(self) -> str:
        return f"<WishlistItem id={self.id} product_id={self.product_id}>"
