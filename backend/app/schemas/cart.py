from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CartItemProductSummary(BaseModel):
    """
    Joined product summary metadata for cart responses.
    Provides complete display information without duplicating data in PostgreSQL.
    """
    id: str
    name: str
    slug: str
    brand: str
    price: float
    mrp: float
    discount: int = Field(default=0, alias="discount_percent")
    unit: str = "Piece"
    images: List[str] = Field(default_factory=list)
    stock: int = 0
    is_active: bool = True

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class CartItemResponse(BaseModel):
    """
    Detailed cart item response containing line-item calculation,
    historical price-at-addition snapshot, and live price comparison.
    """
    id: str
    cart_id: str
    product_id: str
    quantity: int
    price_at_addition: float
    current_price: float
    has_price_changed: bool = False
    price_change_amount: float = 0.0
    subtotal: float
    product: CartItemProductSummary
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    """
    Authoritative customer cart response.
    Computes GST (18%) and Free Site Delivery (> ₹5,000) dynamically.
    """
    id: str
    user_id: str
    items: List[CartItemResponse] = Field(default_factory=list)
    total_items: int = 0
    subtotal: float = 0.0
    tax: float = 0.0
    delivery_charge: float = 0.0
    total: float = 0.0
    has_price_changes: bool = False

    model_config = ConfigDict(from_attributes=True)


class AddCartItemRequest(BaseModel):
    """
    Payload for adding a product to cart.
    """
    product_id: str = Field(..., description="ID of the product to add")
    quantity: int = Field(default=1, ge=1, description="Quantity to add (must be at least 1)")


class UpdateCartItemRequest(BaseModel):
    """
    Payload for updating item quantity in cart.
    """
    quantity: int = Field(..., ge=1, description="New target quantity (must be at least 1)")


class MergeCartItemRequest(BaseModel):
    """
    Individual item in guest cart merge payload.
    """
    product_id: str
    quantity: int = Field(..., ge=1)


class MergeCartRequest(BaseModel):
    """
    Payload for merging guest cart items into authenticated user cart.
    """
    items: List[MergeCartItemRequest] = Field(default_factory=list)
