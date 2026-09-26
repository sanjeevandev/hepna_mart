import logging
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.wishlist import Wishlist, WishlistItem
from app.models.product import Product
from app.models.inventory import Inventory
from app.schemas.cart import CartItemProductSummary
from app.schemas.wishlist import WishlistResponse, WishlistItemResponse

logger = logging.getLogger("hepna.wishlist_service")


class WishlistService:
    """
    Authoritative service managing customer wishlist saved items and guest merge.
    """

    @staticmethod
    def get_or_create_wishlist(db: Session, user_id: str) -> Wishlist:
        """
        Retrieves existing customer wishlist or creates a new empty wishlist.
        """
        wishlist = db.scalar(
            select(Wishlist).where(Wishlist.user_id == user_id)
        )
        if not wishlist:
            wishlist = Wishlist(user_id=user_id)
            db.add(wishlist)
            db.commit()
            db.refresh(wishlist)
        return wishlist

    @classmethod
    def get_wishlist_response(cls, db: Session, user_id: str) -> WishlistResponse:
        """
        Builds a WishlistResponse with joined product data and product_ids list.
        """
        wishlist = cls.get_or_create_wishlist(db, user_id)

        items_response: List[WishlistItemResponse] = []
        product_ids: List[str] = []

        for item in wishlist.items:
            product: Optional[Product] = item.product
            if not product:
                continue

            inv: Optional[Inventory] = product.inventory
            available_stock = inv.available_quantity if inv else 0

            product_summary = CartItemProductSummary(
                id=product.id,
                name=product.name,
                slug=product.slug,
                brand=product.brand,
                price=float(product.price),
                mrp=float(product.mrp),
                discount=product.discount_percent,
                unit=product.unit,
                images=product.images or [],
                stock=available_stock,
                is_active=product.is_active,
            )

            items_response.append(
                WishlistItemResponse(
                    id=item.id,
                    wishlist_id=wishlist.id,
                    product_id=product.id,
                    product=product_summary,
                    created_at=item.created_at,
                )
            )
            product_ids.append(product.id)

        return WishlistResponse(
            id=wishlist.id,
            user_id=wishlist.user_id,
            items=items_response,
            total_items=len(items_response),
            product_ids=product_ids,
        )

    @classmethod
    def add_item(cls, db: Session, user_id: str, product_id: str) -> WishlistResponse:
        """
        Adds a product to customer's wishlist.
        Idempotent: returns existing wishlist if product is already saved.
        """
        product = db.scalar(select(Product).where(Product.id == product_id))
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{product_id}' not found.",
            )

        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' is inactive and cannot be added to wishlist.",
            )

        wishlist = cls.get_or_create_wishlist(db, user_id)

        existing = next((i for i in wishlist.items if i.product_id == product_id), None)
        if not existing:
            new_item = WishlistItem(wishlist_id=wishlist.id, product_id=product.id)
            db.add(new_item)
            db.commit()

        return cls.get_wishlist_response(db, user_id)

    @classmethod
    def remove_item(cls, db: Session, user_id: str, product_id: str) -> WishlistResponse:
        """
        Removes a product from customer's wishlist.
        """
        wishlist = cls.get_or_create_wishlist(db, user_id)
        existing = next((i for i in wishlist.items if i.product_id == product_id), None)
        if existing:
            db.delete(existing)
            db.commit()
        return cls.get_wishlist_response(db, user_id)

    @classmethod
    def merge_guest_wishlist(
        cls,
        db: Session,
        user_id: str,
        product_ids: List[str],
    ) -> WishlistResponse:
        """
        Safely merges guest wishlist product IDs into customer wishlist upon login.
        """
        if not product_ids:
            return cls.get_wishlist_response(db, user_id)

        wishlist = cls.get_or_create_wishlist(db, user_id)
        existing_ids = {i.product_id for i in wishlist.items}

        for pid in product_ids:
            if pid in existing_ids:
                continue

            product = db.scalar(select(Product).where(Product.id == pid))
            if product and product.is_active:
                new_item = WishlistItem(wishlist_id=wishlist.id, product_id=product.id)
                db.add(new_item)
                existing_ids.add(product.id)

        db.commit()
        return cls.get_wishlist_response(db, user_id)


wishlist_service = WishlistService()
