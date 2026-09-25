import math
import logging
from decimal import Decimal
from typing import List, Optional, Tuple, Any
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.category import Category
from app.models.inventory import Inventory
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductListItem,
    ProductDetailResponse,
    ProductListResponse,
)
from app.schemas.category import CategoryResponse

logger = logging.getLogger("hepna.product_service")


class ProductService:
    @staticmethod
    def _to_list_item(p: Product, category: Optional[Category] = None, inventory: Optional[Inventory] = None) -> ProductListItem:
        cat_name = category.name if category else (p.category.name if p.category else None)
        cat_slug = category.slug if category else (p.category.slug if p.category else None)
        stock_val = inventory.quantity if inventory else (p.inventory.quantity if p.inventory else 0)

        return ProductListItem(
            id=p.id,
            name=p.name,
            slug=p.slug,
            sku=p.sku,
            brand=p.brand,
            category_id=p.category_id,
            category_slug=cat_slug,
            category_name=cat_name,
            subcategory=p.subcategory,
            description=p.description,
            price=p.price,
            mrp=p.mrp,
            discount_percent=p.discount_percent,
            unit=p.unit,
            rating=p.rating,
            review_count=p.review_count,
            bulk_price=p.bulk_price,
            minimum_bulk_quantity=p.minimum_bulk_quantity,
            delivery_available=p.delivery_available,
            is_featured=p.is_featured,
            is_new=p.is_new,
            is_offer=p.is_offer,
            is_active=p.is_active,
            images=p.images or [],
            specifications=p.specifications or [],
            features=p.features or [],
            stock=stock_val,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )

    @classmethod
    def list_products(
        cls,
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,       # Category ID or Slug
        brand: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        rating: Optional[float] = None,
        in_stock: Optional[bool] = None,
        featured: Optional[bool] = None,
        is_new: Optional[bool] = None,
        offer: Optional[bool] = None,
        active_only: bool = True,
        sort: str = "popular",
        page: int = 1,
        page_size: int = 24,
    ) -> ProductListResponse:
        """
        Queries products with full filtering, sorting, and pagination.
        """
        page = max(1, page)
        page_size = max(1, min(100, page_size))

        query = (
            select(Product, Category, Inventory)
            .join(Category, Product.category_id == Category.id)
            .outerjoin(Inventory, Product.id == Inventory.product_id)
        )

        filters = []
        if active_only:
            filters.append(Product.is_active.is_(True))

        if search:
            search_term = f"%{search.strip()}%"
            filters.append(
                or_(
                    Product.name.ilike(search_term),
                    Product.brand.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.subcategory.ilike(search_term),
                )
            )

        if category:
            cat_val = category.strip().lower()
            filters.append(
                or_(
                    Category.slug == cat_val,
                    Category.id == category.strip(),
                    Product.category_id == category.strip(),
                )
            )

        if brand:
            filters.append(Product.brand.ilike(brand.strip()))

        if min_price is not None:
            filters.append(Product.price >= min_price)

        if max_price is not None:
            filters.append(Product.price <= max_price)

        if rating is not None:
            filters.append(Product.rating >= rating)

        if in_stock is True:
            filters.append(
                and_(
                    Inventory.quantity.isnot(None),
                    Inventory.quantity > 0,
                )
            )

        if featured is not None:
            filters.append(Product.is_featured.is_(featured))

        if is_new is not None:
            filters.append(Product.is_new.is_(is_new))

        if offer is not None:
            filters.append(Product.is_offer.is_(offer))

        if filters:
            query = query.where(and_(*filters))

        # Count total matching rows
        count_query = select(func.count()).select_from(query.order_by(None).subquery())
        total = db.scalar(count_query) or 0
        total_pages = math.ceil(total / page_size) if total > 0 else 1

        # Sorting logic
        if sort == "price_asc":
            query = query.order_by(Product.price.asc())
        elif sort == "price_desc":
            query = query.order_by(Product.price.desc())
        elif sort == "rating_desc":
            query = query.order_by(Product.rating.desc(), Product.review_count.desc())
        elif sort == "newest":
            query = query.order_by(Product.created_at.desc())
        elif sort == "name_asc":
            query = query.order_by(Product.name.asc())
        elif sort == "discount_desc":
            query = query.order_by(Product.discount_percent.desc())
        else:  # popular / default
            query = query.order_by(Product.is_featured.desc(), Product.review_count.desc(), Product.rating.desc())

        # Pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        rows = db.execute(query).all()

        items = [cls._to_list_item(p, cat, inv) for p, cat, inv in rows]

        return ProductListResponse(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    def get_product_by_id(db: Session, product_id: str) -> Optional[Product]:
        return db.scalar(
            select(Product)
            .options(joinedload(Product.category), joinedload(Product.inventory))
            .where(Product.id == product_id)
        )

    @staticmethod
    def get_product_by_slug(db: Session, slug: str) -> Optional[Product]:
        return db.scalar(
            select(Product)
            .options(joinedload(Product.category), joinedload(Product.inventory))
            .where(Product.slug == slug.lower().strip())
        )

    @classmethod
    def get_product_detail(cls, db: Session, slug_or_id: str) -> Optional[ProductDetailResponse]:
        product = db.scalar(
            select(Product)
            .options(joinedload(Product.category), joinedload(Product.inventory))
            .where(
                or_(
                    Product.slug == slug_or_id.lower().strip(),
                    Product.id == slug_or_id,
                )
            )
        )
        if not product:
            return None

        base_item = cls._to_list_item(product)
        inv = product.inventory
        cat_resp = CategoryResponse.model_validate(product.category) if product.category else None

        return ProductDetailResponse(
            **base_item.model_dump(),
            category=cat_resp,
            available_stock=inv.available_quantity if inv else 0,
            reserved_stock=inv.reserved_quantity if inv else 0,
        )

    @staticmethod
    def create_product(db: Session, payload: ProductCreate) -> Product:
        product = Product(
            name=payload.name,
            slug=payload.slug.lower().strip(),
            sku=payload.sku,
            brand=payload.brand,
            category_id=payload.category_id,
            subcategory=payload.subcategory,
            description=payload.description,
            short_description=payload.short_description,
            price=payload.price,
            mrp=payload.mrp,
            discount_percent=payload.discount_percent,
            unit=payload.unit,
            rating=payload.rating,
            review_count=payload.review_count,
            bulk_price=payload.bulk_price,
            minimum_bulk_quantity=payload.minimum_bulk_quantity,
            delivery_available=payload.delivery_available,
            is_featured=payload.is_featured,
            is_new=payload.is_new,
            is_offer=payload.is_offer,
            is_active=payload.is_active,
            images=payload.images or [],
            specifications=payload.specifications or [],
            features=payload.features or [],
        )
        db.add(product)
        db.flush()  # obtain product.id

        # Automatically create linked Inventory entry
        inventory = Inventory(
            product_id=product.id,
            quantity=payload.initial_stock or 0,
            reserved_quantity=0,
            low_stock_threshold=10,
            warehouse="MAIN",
        )
        db.add(inventory)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def update_product(
        db: Session,
        product: Product,
        payload: ProductUpdate,
    ) -> Product:
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(product, key, value)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete_product(db: Session, product: Product, hard_delete: bool = False) -> bool:
        if hard_delete:
            db.delete(product)
        else:
            product.is_active = False
        db.commit()
        return True
