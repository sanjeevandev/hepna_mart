import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import (
    require_authenticated_user,
    require_permission,
)
from app.core.rbac import Permission
from app.models.user import User
from app.schemas.order import (
    CheckoutRequest,
    OrderResponse,
    OrderListResponse,
    OrderStatusUpdateRequest,
    CancelOrderRequest,
    ReorderResponse,
)
from app.services.order_service import order_service

logger = logging.getLogger("hepna.api.orders")

# Customer-facing router
router = APIRouter(prefix="/orders", tags=["Customer Orders & Fulfillment"])

# Staff management router
admin_router = APIRouter(prefix="/admin/orders", tags=["Staff Orders Management"])


# ============================================================================
# CUSTOMER ENDPOINTS
# ============================================================================

@router.post(
    "/checkout",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Order from Cart (Checkout)",
    description="Processes atomic checkout from authenticated customer's cart, calculates authoritative pricing, verifies inventory with row locks, and decrements stock.",
)
def checkout(
    payload: CheckoutRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return order_service.create_order_from_cart(
        db=db,
        user=current_user,
        checkout_in=payload,
    )


@router.get(
    "",
    response_model=OrderListResponse,
    summary="List Customer Orders",
    description="Returns paginated list of orders belonging to the authenticated customer.",
)
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    orders, total_count = order_service.list_user_orders(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return OrderListResponse(orders=orders, total_count=total_count)


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get Order Details",
    description="Fetches full details, snapshots, and stage timeline for a customer's specific order.",
)
def get_order(
    order_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return order_service.get_order(
        db=db,
        order_id_or_number=order_id,
        user_id=current_user.id,
    )


@router.post(
    "/{order_id}/cancel",
    response_model=OrderResponse,
    summary="Cancel Order",
    description="Cancels an eligible order (pending, confirmed, or processing) and releases reserved stock back to warehouse inventory.",
)
def cancel_order(
    order_id: str,
    payload: CancelOrderRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return order_service.cancel_order(
        db=db,
        order_id_or_number=order_id,
        reason=payload.reason,
        user_id=current_user.id,
    )


@router.post(
    "/{order_id}/reorder",
    response_model=ReorderResponse,
    summary="Reorder Items to Cart",
    description="Adds available products from a previous order into the current shopping cart using live catalog prices.",
)
def reorder_items(
    order_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return order_service.reorder(
        db=db,
        order_id_or_number=order_id,
        user=current_user,
    )


# ============================================================================
# STAFF / ADMIN ENDPOINTS
# ============================================================================

@admin_router.get(
    "",
    response_model=OrderListResponse,
    summary="Staff List All Orders",
    description="Provides platform-wide order listing with status filters and full-text search. Requires 'orders.view' permission.",
)
def admin_list_orders(
    status: Optional[str] = Query(None, description="Filter by OrderStatus e.g. confirmed, shipped"),
    search: Optional[str] = Query(None, description="Search by Order ID, customer, site name, or project"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(require_permission(Permission.ORDERS_VIEW)),
    db: Session = Depends(get_db),
):
    orders, total_count = order_service.list_admin_orders(
        db=db,
        status_filter=status,
        search=search,
        skip=skip,
        limit=limit,
    )
    return OrderListResponse(orders=orders, total_count=total_count)


@admin_router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Staff Get Order Details",
    description="Returns complete operational details for any order on the platform. Requires 'orders.view' permission.",
)
def admin_get_order(
    order_id: str,
    current_user: User = Depends(require_permission(Permission.ORDERS_VIEW)),
    db: Session = Depends(get_db),
):
    return order_service.get_order(
        db=db,
        order_id_or_number=order_id,
        is_staff=True,
    )


@admin_router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="Staff Update Order Status",
    description="Advances order through fulfillment stages and records audit milestone history. Requires 'orders.update' permission.",
)
def admin_update_order_status(
    order_id: str,
    payload: OrderStatusUpdateRequest,
    current_user: User = Depends(require_permission(Permission.ORDERS_UPDATE)),
    db: Session = Depends(get_db),
):
    return order_service.update_order_status(
        db=db,
        order_id_or_number=order_id,
        update_in=payload,
        staff_user=current_user,
    )
