import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.product import Product


class Inventory(Base, TimestampMixin):
    """
    Inventory entity for warehouse stock management and allocation tracking.
    """
    __tablename__ = "inventory"
    __table_args__ = (
        CheckConstraint("quantity >= 0", name="ck_inventory_quantity_non_negative"),
        CheckConstraint("reserved_quantity >= 0", name="ck_inventory_reserved_non_negative"),
        CheckConstraint("reserved_quantity <= quantity", name="ck_inventory_reserved_le_quantity"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    product_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    reserved_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    low_stock_threshold: Mapped[int] = mapped_column(
        Integer,
        default=10,
        nullable=False,
    )
    warehouse: Mapped[str] = mapped_column(
        String(50),
        default="MAIN",
        nullable=False,
    )
    location: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    # Relationships
    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="inventory",
    )

    @property
    def available_quantity(self) -> int:
        return max(0, self.quantity - self.reserved_quantity)

    @property
    def status(self) -> str:
        avail = self.available_quantity
        if avail <= 0:
            return "out_of_stock"
        if avail <= self.low_stock_threshold:
            return "low_stock"
        return "in_stock"

    def __repr__(self) -> str:
        return f"<Inventory product_id={self.product_id} qty={self.quantity} reserved={self.reserved_quantity}>"
