from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.cart import CartItemProductSummary


class WishlistItemResponse(BaseModel):
    """
    Detailed wishlist item response including joined product summary.
    """
    id: str
    wishlist_id: str
    product_id: str
    product: CartItemProductSummary
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WishlistResponse(BaseModel):
    """
    Customer wishlist response containing item details and convenient product_ids array.
    """
    id: str
    user_id: str
    items: List[WishlistItemResponse] = Field(default_factory=list)
    total_items: int = 0
    product_ids: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class MergeWishlistRequest(BaseModel):
    """
    Payload for merging guest wishlist product IDs into authenticated user wishlist.
    """
    product_ids: List[str] = Field(default_factory=list)
