from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import Permission
from app.api.dependencies import require_permission
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductDetailResponse,
    ProductListResponse,
)
from app.services.product_service import ProductService
from app.services.category_service import CategoryService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
def list_products(
    search: Optional[str] = Query(None, description="Search term for name, brand, description"),
    category: Optional[str] = Query(None, description="Category slug or ID filter"),
    brand: Optional[str] = Query(None, description="Brand name filter"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price filter"),
    rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum rating filter"),
    in_stock: Optional[bool] = Query(None, description="Only products with stock > 0"),
    featured: Optional[bool] = Query(None, description="Filter featured products"),
    is_new: Optional[bool] = Query(None, alias="new", description="Filter new arrival products"),
    offer: Optional[bool] = Query(None, description="Filter special offer products"),
    active_only: bool = Query(True, description="Filter active products only"),
    sort: str = Query("popular", description="Sort order: popular, price_asc, price_desc, rating_desc, newest, name_asc, discount_desc"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(24, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
):
    """
    Public endpoint: Returns a paginated list of catalog products with full filter criteria.
    """
    return ProductService.list_products(
        db=db,
        search=search,
        category=category,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        rating=rating,
        in_stock=in_stock,
        featured=featured,
        is_new=is_new,
        offer=offer,
        active_only=active_only,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.get("/slug/{slug}", response_model=ProductDetailResponse)
def get_product_by_slug(
    slug: str,
    db: Session = Depends(get_db),
):
    """
    Public endpoint: Fetches full product details by URL slug.
    """
    product = ProductService.get_product_detail(db=db, slug_or_id=slug)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with slug '{slug}' not found.",
        )
    return product


@router.get("/{product_id}", response_model=ProductDetailResponse)
def get_product_by_id(
    product_id: str,
    db: Session = Depends(get_db),
):
    """
    Public endpoint: Fetches full product details by unique product ID.
    """
    product = ProductService.get_product_detail(db=db, slug_or_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id '{product_id}' not found.",
        )
    return product


@router.post(
    "",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Permission.PRODUCTS_CREATE))],
)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
):
    """
    Staff-only endpoint: Creates a new product and initializes stock. Protected by PRODUCTS_CREATE.
    """
    # 1. Validate Category exists
    category = CategoryService.get_category_by_id(db=db, category_id=payload.category_id)
    if not category:
        # Check by slug fallback
        category = CategoryService.get_category_by_slug(db=db, slug=payload.category_id)
        if category:
            payload.category_id = category.id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with id/slug '{payload.category_id}' does not exist.",
            )

    # 2. Check slug uniqueness
    existing_slug = db.scalar(select(Product).where(Product.slug == payload.slug.lower().strip()))
    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with slug '{payload.slug}' already exists.",
        )

    # 3. Check SKU uniqueness if provided
    if payload.sku:
        existing_sku = db.scalar(select(Product).where(Product.sku == payload.sku.strip()))
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{payload.sku}' already exists.",
            )

    product = ProductService.create_product(db=db, payload=payload)
    return ProductService.get_product_detail(db=db, slug_or_id=product.id)


@router.put(
    "/{product_id}",
    response_model=ProductDetailResponse,
    dependencies=[Depends(require_permission(Permission.PRODUCTS_UPDATE))],
)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
):
    """
    Staff-only endpoint: Updates product details. Protected by PRODUCTS_UPDATE.
    """
    product = ProductService.get_product_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id '{product_id}' not found.",
        )

    if payload.category_id and payload.category_id != product.category_id:
        category = CategoryService.get_category_by_id(db=db, category_id=payload.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{payload.category_id}' does not exist.",
            )

    if payload.slug and payload.slug != product.slug:
        existing_slug = db.scalar(select(Product).where(Product.slug == payload.slug.lower().strip()))
        if existing_slug and existing_slug.id != product_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with slug '{payload.slug}' already exists.",
            )

    if payload.sku and payload.sku != product.sku:
        existing_sku = db.scalar(select(Product).where(Product.sku == payload.sku.strip()))
        if existing_sku and existing_sku.id != product_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{payload.sku}' already exists.",
            )

    ProductService.update_product(db=db, product=product, payload=payload)
    return ProductService.get_product_detail(db=db, slug_or_id=product_id)


@router.delete(
    "/{product_id}",
    dependencies=[Depends(require_permission(Permission.PRODUCTS_DELETE))],
)
def delete_product(
    product_id: str,
    hard_delete: bool = False,
    db: Session = Depends(get_db),
):
    """
    Staff-only endpoint: Deactivates (or deletes) a product. Protected by PRODUCTS_DELETE.
    """
    product = ProductService.get_product_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id '{product_id}' not found.",
        )

    ProductService.delete_product(db=db, product=product, hard_delete=hard_delete)
    action = "deleted" if hard_delete else "deactivated"
    return {"detail": f"Product '{product.name}' {action} successfully.", "deleted": True}
