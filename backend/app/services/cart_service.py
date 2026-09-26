import logging
from typing import List, Optional
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.inventory import Inventory
from app.schemas.cart import (
    CartResponse,
    CartItemResponse,
    CartItemProductSummary,
    MergeCartItemRequest,
)

logger = logging.getLogger("hepna.cart_service")


class CartService:
    """
    Authoritative service managing customer cart lifecycle, stock checks,
    price change tracking, and safe guest-to-customer merging.
    """

    @staticmethod
    def get_or_create_cart(db: Session, user_id: str) -> Cart:
        """
        Retrieves existing customer cart or creates a new empty cart.
        """
        cart = db.scalar(
            select(Cart).where(Cart.user_id == user_id)
        )
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
        return cart

    @classmethod
    def get_cart_response(cls, db: Session, user_id: str) -> CartResponse:
        """
        Builds a comprehensive CartResponse with joined product data,
        live selling prices, GST tax calculations, and price-change flags.
        """
        cart = cls.get_or_create_cart(db, user_id)
        
        items_response: List[CartItemResponse] = []
        subtotal: float = 0.0
        total_items: int = 0
        has_price_changes: bool = False

        for item in cart.items:
            product: Optional[Product] = item.product
            if not product:
                continue

            # Check stock
            inv: Optional[Inventory] = product.inventory
            available_stock = inv.available_quantity if inv else 0

            current_price = float(product.price)
            price_at_addition = float(item.price_at_addition)
            has_changed = (price_at_addition != current_price)
            if has_changed:
                has_price_changes = True

            line_subtotal = round(current_price * item.quantity, 2)
            subtotal += line_subtotal
            total_items += item.quantity

            product_summary = CartItemProductSummary(
                id=product.id,
                name=product.name,
                slug=product.slug,
                brand=product.brand,
                price=current_price,
                mrp=float(product.mrp),
                discount=product.discount_percent,
                unit=product.unit,
                images=product.images or [],
                stock=available_stock,
                is_active=product.is_active,
            )

            items_response.append(
                CartItemResponse(
                    id=item.id,
                    cart_id=cart.id,
                    product_id=product.id,
                    quantity=item.quantity,
                    price_at_addition=price_at_addition,
                    current_price=current_price,
                    has_price_changed=has_changed,
                    price_change_amount=round(current_price - price_at_addition, 2),
                    subtotal=line_subtotal,
                    product=product_summary,
                    created_at=item.created_at,
                    updated_at=item.updated_at,
                )
            )

        subtotal = round(subtotal, 2)
        tax = round(subtotal * settings.GST_RATE, 2)
        delivery_charge = 0.0 if (subtotal > settings.FREE_DELIVERY_THRESHOLD or subtotal == 0.0) else settings.STANDARD_DELIVERY_FEE
        total = round(subtotal + tax + delivery_charge, 2)

        return CartResponse(
            id=cart.id,
            user_id=cart.user_id,
            items=items_response,
            total_items=total_items,
            subtotal=subtotal,
            tax=tax,
            delivery_charge=delivery_charge,
            total=total,
            has_price_changes=has_price_changes,
        )

    @classmethod
    def add_item(
        cls,
        db: Session,
        user_id: str,
        product_id: str,
        quantity: int = 1,
    ) -> CartResponse:
        """
        Adds a product to customer's cart or increments quantity if already present.
        Captures price_at_addition and enforces available stock checks.
        """
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be at least 1.",
            )

        product = db.scalar(select(Product).where(Product.id == product_id))
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' not found.",
            )

        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' is inactive and cannot be added to cart.",
            )

        inv = product.inventory
        available_stock = inv.available_quantity if inv else 0

        cart = cls.get_or_create_cart(db, user_id)

        # Check existing item
        existing_item: Optional[CartItem] = next(
            (i for i in cart.items if i.product_id == product_id), None
        )

        if existing_item:
            new_quantity = existing_item.quantity + quantity
            if new_quantity > available_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Requested quantity ({new_quantity}) exceeds available stock ({available_stock}) for '{product.name}'.",
                )
            existing_item.quantity = new_quantity
        else:
            if quantity > available_stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Requested quantity ({quantity}) exceeds available stock ({available_stock}) for '{product.name}'.",
                )
            new_item = CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=quantity,
                price_at_addition=product.price,
            )
            db.add(new_item)

        db.commit()
        return cls.get_cart_response(db, user_id)

    @classmethod
    def update_item_quantity(
        cls,
        db: Session,
        user_id: str,
        product_id: str,
        quantity: int,
    ) -> CartResponse:
        """
        Updates the target quantity for an item in customer's cart.
        """
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be at least 1. To remove the item, please delete it.",
            )

        cart = cls.get_or_create_cart(db, user_id)
        item = next((i for i in cart.items if i.product_id == product_id), None)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' not found in your cart.",
            )

        product = item.product
        inv = product.inventory if product else None
        available_stock = inv.available_quantity if inv else 0

        if quantity > available_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested quantity ({quantity}) exceeds available stock ({available_stock}) for '{product.name}'.",
            )

        item.quantity = quantity
        db.commit()
        return cls.get_cart_response(db, user_id)

    @classmethod
    def remove_item(
        cls,
        db: Session,
        user_id: str,
        product_id: str,
    ) -> CartResponse:
        """
        Removes an item from customer's cart.
        """
        cart = cls.get_or_create_cart(db, user_id)
        item = next((i for i in cart.items if i.product_id == product_id), None)
        if item:
            db.delete(item)
            db.commit()
        return cls.get_cart_response(db, user_id)

    @classmethod
    def clear_cart(cls, db: Session, user_id: str) -> CartResponse:
        """
        Clears all items from customer's cart.
        """
        cart = cls.get_or_create_cart(db, user_id)
        for item in cart.items:
            db.delete(item)
        db.commit()
        return cls.get_cart_response(db, user_id)

    @classmethod
    def merge_guest_cart(
        cls,
        db: Session,
        user_id: str,
        guest_items: List[MergeCartItemRequest],
    ) -> CartResponse:
        """
        Safely merges guest cart items into authenticated user cart upon login.
        Consolidates duplicates and caps to available inventory without dropping lines.
        """
        if not guest_items:
            return cls.get_cart_response(db, user_id)

        cart = cls.get_or_create_cart(db, user_id)

        for guest_item in guest_items:
            product = db.scalar(select(Product).where(Product.id == guest_item.product_id))
            if not product or not product.is_active:
                continue

            inv = product.inventory
            available_stock = inv.available_quantity if inv else 0
            if available_stock <= 0:
                continue

            existing_item = next(
                (i for i in cart.items if i.product_id == product.id), None
            )

            if existing_item:
                target_qty = min(existing_item.quantity + guest_item.quantity, available_stock)
                existing_item.quantity = target_qty
            else:
                target_qty = min(guest_item.quantity, available_stock)
                if target_qty > 0:
                    new_item = CartItem(
                        cart_id=cart.id,
                        product_id=product.id,
                        quantity=target_qty,
                        price_at_addition=product.price,
                    )
                    db.add(new_item)

        db.commit()
        return cls.get_cart_response(db, user_id)


cart_service = CartService()
