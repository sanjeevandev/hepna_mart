import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.cart import (
    CartResponse,
    AddCartItemRequest,
    UpdateCartItemRequest,
    MergeCartRequest,
)
from app.services.cart_service import cart_service

logger = logging.getLogger("hepna.api.cart")

router = APIRouter(prefix="/cart", tags=["Customer Cart"])


@router.get(
    "",
    response_model=CartResponse,
    summary="Get customer cart",
    description="Returns the authenticated customer's shopping cart with live inventory stock and dynamic GST/delivery calculations.",
)
def get_cart(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return cart_service.get_cart_response(db, current_user.id)


@router.post(
    "/items",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
    summary="Add product to cart",
    description="Adds a specified quantity of a product to the authenticated customer's cart or increments quantity if already present.",
)
def add_cart_item(
    payload: AddCartItemRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return cart_service.add_item(
        db=db,
        user_id=current_user.id,
        product_id=payload.product_id,
        quantity=payload.quantity,
    )


@router.patch(
    "/items/{product_id}",
    response_model=CartResponse,
    summary="Update cart item quantity",
    description="Updates the target quantity for an existing product line item in the customer's cart.",
)
def update_cart_item_quantity(
    product_id: str,
    payload: UpdateCartItemRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return cart_service.update_item_quantity(
        db=db,
        user_id=current_user.id,
        product_id=product_id,
        quantity=payload.quantity,
    )


@router.delete(
    "/items/{product_id}",
    response_model=CartResponse,
    summary="Remove item from cart",
    description="Removes a specific product line item from the authenticated customer's cart.",
)
def remove_cart_item(
    product_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return cart_service.remove_item(
        db=db,
        user_id=current_user.id,
        product_id=product_id,
    )


@router.delete(
    "",
    response_model=CartResponse,
    summary="Clear entire cart",
    description="Empties all product line items from the authenticated customer's cart.",
)
def clear_cart(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return cart_service.clear_cart(db, current_user.id)


@router.post(
    "/merge",
    response_model=CartResponse,
    summary="Merge guest cart items",
    description="Safely merges guest cart items into the customer's persistent cart upon login, capping to available stock.",
)
def merge_guest_cart(
    payload: MergeCartRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return cart_service.merge_guest_cart(
        db=db,
        user_id=current_user.id,
        guest_items=payload.items,
    )
