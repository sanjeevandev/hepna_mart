from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import Permission
from app.api.dependencies import require_permission
from app.schemas.inventory import (
    InventoryUpdate,
    InventoryResponse,
    InventoryListItem,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get(
    "",
    response_model=List[InventoryListItem],
    dependencies=[Depends(require_permission(Permission.INVENTORY_VIEW))],
)
def list_inventory(
    low_stock_only: bool = Query(False, description="Filter for low stock or out of stock items"),
    warehouse: Optional[str] = Query(None, description="Warehouse filter"),
    db: Session = Depends(get_db),
):
    """
    Staff-only endpoint: Lists inventory records across warehouse locations with product metadata.
    """
    return InventoryService.list_inventory(
        db=db,
        low_stock_only=low_stock_only,
        warehouse=warehouse,
    )


@router.get(
    "/low-stock",
    response_model=List[InventoryListItem],
    dependencies=[Depends(require_permission(Permission.INVENTORY_VIEW))],
)
def list_low_stock(
    warehouse: Optional[str] = Query(None, description="Warehouse filter"),
    db: Session = Depends(get_db),
):
    """
    Staff-only endpoint: Shortcut for retrieving all inventory needing replenishment.
    """
    return InventoryService.list_inventory(
        db=db,
        low_stock_only=True,
        warehouse=warehouse,
    )


@router.get(
    "/{product_id}",
    response_model=InventoryResponse,
    dependencies=[Depends(require_permission(Permission.INVENTORY_VIEW))],
)
def get_inventory_by_product_id(
    product_id: str,
    db: Session = Depends(get_db),
):
    """
    Staff-only endpoint: Fetches inventory level for a single product.
    """
    inventory = InventoryService.get_inventory_by_product_id(db=db, product_id=product_id)
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory record for product '{product_id}' not found.",
        )
    return inventory


@router.put(
    "/{product_id}",
    response_model=InventoryResponse,
    dependencies=[Depends(require_permission(Permission.INVENTORY_UPDATE))],
)
def update_inventory(
    product_id: str,
    payload: InventoryUpdate,
    db: Session = Depends(get_db),
):
    """
    Staff-only endpoint: Updates stock count, reservations, or thresholds for a product.
    """
    inventory = InventoryService.get_inventory_by_product_id(db=db, product_id=product_id)
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory record for product '{product_id}' not found.",
        )

    try:
        return InventoryService.update_inventory(db=db, inventory=inventory, payload=payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
