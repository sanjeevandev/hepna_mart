import logging
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.orm import Session, joinedload

from app.models.inventory import Inventory
from app.models.product import Product
from app.models.category import Category
from app.schemas.inventory import InventoryUpdate, InventoryListItem, InventoryResponse

logger = logging.getLogger("hepna.inventory_service")


class InventoryService:
    @staticmethod
    def list_inventory(
        db: Session,
        low_stock_only: bool = False,
        warehouse: Optional[str] = None,
    ) -> List[InventoryListItem]:
        """
        Fetches inventory records with product metadata.
        """
        query = (
            select(Inventory, Product, Category)
            .join(Product, Inventory.product_id == Product.id)
            .join(Category, Product.category_id == Category.id)
            .order_by(Product.name.asc())
        )

        filters = []
        if warehouse:
            filters.append(Inventory.warehouse == warehouse.strip())

        if filters:
            query = query.where(and_(*filters))

        rows = db.execute(query).all()
        items = []

        for inv, prod, cat in rows:
            if low_stock_only and inv.status != "low_stock" and inv.status != "out_of_stock":
                continue

            item = InventoryListItem(
                id=inv.id,
                product_id=inv.product_id,
                quantity=inv.quantity,
                reserved_quantity=inv.reserved_quantity,
                available_quantity=inv.available_quantity,
                low_stock_threshold=inv.low_stock_threshold,
                warehouse=inv.warehouse,
                location=inv.location,
                status=inv.status,
                created_at=inv.created_at,
                updated_at=inv.updated_at,
                product_name=prod.name,
                product_slug=prod.slug,
                product_sku=prod.sku,
                category_name=cat.name,
                category_slug=cat.slug,
            )
            items.append(item)

        return items

    @staticmethod
    def get_inventory_by_product_id(db: Session, product_id: str) -> Optional[Inventory]:
        return db.scalar(
            select(Inventory)
            .options(joinedload(Inventory.product))
            .where(Inventory.product_id == product_id)
        )

    @staticmethod
    def update_inventory(
        db: Session,
        inventory: Inventory,
        payload: InventoryUpdate,
    ) -> Inventory:
        update_data = payload.model_dump(exclude_unset=True)

        new_qty = update_data.get("quantity", inventory.quantity)
        new_reserved = update_data.get("reserved_quantity", inventory.reserved_quantity)

        if new_reserved > new_qty:
            raise ValueError(f"Reserved quantity ({new_reserved}) cannot exceed total stock ({new_qty}).")

        for key, value in update_data.items():
            setattr(inventory, key, value)

        db.commit()
        db.refresh(inventory)
        return inventory
