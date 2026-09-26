import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.wishlist import WishlistResponse, MergeWishlistRequest
from app.services.wishlist_service import wishlist_service

logger = logging.getLogger("hepna.api.wishlist")

router = APIRouter(prefix="/wishlist", tags=["Customer Wishlist"])


@router.get(
    "",
    response_model=WishlistResponse,
    summary="Get customer wishlist",
    description="Returns the authenticated customer's saved wishlist items with joined product summaries.",
)
def get_wishlist(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return wishlist_service.get_wishlist_response(db, current_user.id)


@router.post(
    "/merge",
    response_model=WishlistResponse,
    summary="Merge guest wishlist",
    description="Safely merges guest wishlist product IDs into customer wishlist upon login.",
)
def merge_guest_wishlist(
    payload: MergeWishlistRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return wishlist_service.merge_guest_wishlist(
        db=db,
        user_id=current_user.id,
        product_ids=payload.product_ids,
    )


@router.post(
    "/{product_id}",
    response_model=WishlistResponse,
    status_code=status.HTTP_200_OK,
    summary="Add product to wishlist",
    description="Saves a product to the customer's wishlist idempotently.",
)
def add_wishlist_item(
    product_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return wishlist_service.add_item(
        db=db,
        user_id=current_user.id,
        product_id=product_id,
    )


@router.delete(
    "/{product_id}",
    response_model=WishlistResponse,
    summary="Remove product from wishlist",
    description="Removes a product from the customer's wishlist.",
)
def remove_wishlist_item(
    product_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return wishlist_service.remove_item(
        db=db,
        user_id=current_user.id,
        product_id=product_id,
    )

