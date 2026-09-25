from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import Permission
from app.api.dependencies import require_permission
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryListItem,
)
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryListItem])
def list_categories(
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    """
    Public endpoint: Retrieves all catalog categories with real-time product counts.
    """
    return CategoryService.list_categories(db=db, active_only=active_only)


@router.get("/slug/{slug}", response_model=CategoryResponse)
def get_category_by_slug(
    slug: str,
    db: Session = Depends(get_db),
):
    """
    Public endpoint: Fetches a single category by its URL slug.
    """
    category = CategoryService.get_category_by_slug(db=db, slug=slug)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with slug '{slug}' not found.",
        )
    return category


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category_by_id(
    category_id: str,
    db: Session = Depends(get_db),
):
    """
    Public endpoint: Fetches a category by its ID.
    """
    category = CategoryService.get_category_by_id(db=db, category_id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id '{category_id}' not found.",
        )
    return category


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Permission.CATEGORIES_MANAGE))],
)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
):
    """
    Staff-only endpoint: Creates a new category. Protected by CATEGORIES_MANAGE permission.
    """
    existing = CategoryService.get_category_by_slug(db=db, slug=payload.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category with slug '{payload.slug}' already exists.",
        )
    return CategoryService.create_category(db=db, payload=payload)


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    dependencies=[Depends(require_permission(Permission.CATEGORIES_MANAGE))],
)
def update_category(
    category_id: str,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
):
    """
    Staff-only endpoint: Updates category metadata. Protected by CATEGORIES_MANAGE permission.
    """
    category = CategoryService.get_category_by_id(db=db, category_id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id '{category_id}' not found.",
        )

    if payload.slug and payload.slug != category.slug:
        existing = CategoryService.get_category_by_slug(db=db, slug=payload.slug)
        if existing and existing.id != category_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category with slug '{payload.slug}' already exists.",
            )

    return CategoryService.update_category(db=db, category=category, payload=payload)


@router.delete(
    "/{category_id}",
    dependencies=[Depends(require_permission(Permission.CATEGORIES_MANAGE))],
)
def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
):
    """
    Staff-only endpoint: Safely deletes or deactivates a category. Protected by CATEGORIES_MANAGE.
    """
    category = CategoryService.get_category_by_id(db=db, category_id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id '{category_id}' not found.",
        )

    deleted, message = CategoryService.delete_category(db=db, category=category)
    return {"detail": message, "deleted": deleted}
