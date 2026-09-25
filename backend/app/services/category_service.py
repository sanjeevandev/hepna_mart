import logging
from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryListItem

logger = logging.getLogger("hepna.category_service")


class CategoryService:
    @staticmethod
    def list_categories(
        db: Session,
        active_only: bool = True,
    ) -> List[CategoryListItem]:
        """
        Retrieves categories ordered by sort_order and name, annotated with actual product count.
        """
        # Count products per category
        count_subq = (
            select(
                Product.category_id,
                func.count(Product.id).label("product_count"),
            )
            .where(Product.is_active.is_(True) if active_only else True)
            .group_by(Product.category_id)
            .subquery()
        )

        query = (
            select(
                Category,
                func.coalesce(count_subq.c.product_count, 0).label("product_count"),
            )
            .outerjoin(count_subq, Category.id == count_subq.c.category_id)
            .order_by(Category.sort_order.asc(), Category.name.asc())
        )

        if active_only:
            query = query.where(Category.is_active.is_(True))

        results = db.execute(query).all()
        items = []
        for cat, p_count in results:
            item = CategoryListItem(
                id=cat.id,
                name=cat.name,
                slug=cat.slug,
                description=cat.description,
                tagline=cat.tagline,
                icon=cat.icon,
                image=cat.image,
                parent_id=cat.parent_id,
                is_active=cat.is_active,
                sort_order=cat.sort_order,
                subcategories=cat.subcategories or [],
                product_count=p_count,
            )
            items.append(item)
        return items

    @staticmethod
    def get_category_by_id(db: Session, category_id: str) -> Optional[Category]:
        return db.scalar(select(Category).where(Category.id == category_id))

    @staticmethod
    def get_category_by_slug(db: Session, slug: str) -> Optional[Category]:
        return db.scalar(select(Category).where(Category.slug == slug.lower().strip()))

    @staticmethod
    def create_category(db: Session, payload: CategoryCreate) -> Category:
        category = Category(
            name=payload.name,
            slug=payload.slug.lower().strip(),
            description=payload.description,
            tagline=payload.tagline,
            icon=payload.icon,
            image=payload.image,
            parent_id=payload.parent_id,
            is_active=payload.is_active,
            sort_order=payload.sort_order,
            subcategories=payload.subcategories or [],
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def update_category(
        db: Session,
        category: Category,
        payload: CategoryUpdate,
    ) -> Category:
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(category, key, value)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete_category(db: Session, category: Category) -> Tuple[bool, str]:
        """
        Deletes a category if it contains no products. If it has products, safely deactivates it.
        """
        product_count = db.scalar(
            select(func.count(Product.id)).where(Product.category_id == category.id)
        )
        if product_count and product_count > 0:
            category.is_active = False
            db.commit()
            return False, f"Category has {product_count} products and was deactivated instead of deleted."

        db.delete(category)
        db.commit()
        return True, "Category deleted successfully."
