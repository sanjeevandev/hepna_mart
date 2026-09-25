import os
import sys
import json
import logging
from decimal import Decimal
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("hepna.seed_catalog")


def seed_catalog(db_session=None):
    """
    Deterministically and idempotently seeds categories, products, and inventory.
    """
    json_path = Path(__file__).resolve().parent / "seed_data.json"
    if not json_path.exists():
        logger.error(f"Seed data file not found at: {json_path}")
        return 0, 0, 0

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    categories_data = data.get("categories", [])
    products_data = data.get("products", [])

    close_session = False
    if db_session is None:
        db = SessionLocal()
        close_session = True
    else:
        db = db_session

    try:
        # 1. Seed Categories
        category_slug_to_id = {}
        cats_created = 0
        cats_updated = 0

        for cat_raw in categories_data:
            slug = cat_raw["slug"].strip().lower()
            existing = db.scalar(select(Category).where(Category.slug == slug))

            if existing:
                existing.name = cat_raw["name"]
                existing.description = cat_raw.get("description")
                existing.tagline = cat_raw.get("tagline")
                existing.icon = cat_raw.get("icon")
                existing.image = cat_raw.get("image")
                existing.subcategories = cat_raw.get("subcategories", [])
                category_slug_to_id[slug] = existing.id
                cats_updated += 1
            else:
                cat = Category(
                    id=cat_raw.get("id"),
                    name=cat_raw["name"],
                    slug=slug,
                    description=cat_raw.get("description"),
                    tagline=cat_raw.get("tagline"),
                    icon=cat_raw.get("icon"),
                    image=cat_raw.get("image"),
                    is_active=True,
                    sort_order=len(category_slug_to_id),
                    subcategories=cat_raw.get("subcategories", []),
                )
                db.add(cat)
                db.flush()
                category_slug_to_id[slug] = cat.id
                cats_created += 1

        db.commit()
        logger.info(f"Categories seeded: {cats_created} created, {cats_updated} updated (Total: {len(category_slug_to_id)})")

        # 2. Seed Products & Inventory
        prods_created = 0
        prods_updated = 0
        inv_created = 0
        inv_updated = 0

        for p_raw in products_data:
            cat_slug = p_raw.get("category", "").strip().lower()
            cat_id = category_slug_to_id.get(cat_slug)

            if not cat_id:
                # Fallback check if category is an ID
                cat_match = db.scalar(select(Category).where(Category.id == p_raw.get("category")))
                if cat_match:
                    cat_id = cat_match.id
                else:
                    logger.warning(f"Skipping product '{p_raw.get('name')}' - Category '{cat_slug}' not found.")
                    continue

            p_slug = p_raw["slug"].strip().lower()
            existing_p = db.scalar(select(Product).where(Product.slug == p_slug))

            price_val = Decimal(str(p_raw["price"]))
            mrp_val = Decimal(str(p_raw["mrp"]))
            bulk_price_val = Decimal(str(p_raw["bulkPrice"])) if p_raw.get("bulkPrice") is not None else None
            stock_qty = int(p_raw.get("stock", 100))

            if existing_p:
                existing_p.name = p_raw["name"]
                existing_p.brand = p_raw["brand"]
                existing_p.category_id = cat_id
                existing_p.subcategory = p_raw.get("subcategory")
                existing_p.description = p_raw.get("description")
                existing_p.price = price_val
                existing_p.mrp = mrp_val
                existing_p.discount_percent = int(p_raw.get("discount", 0))
                existing_p.unit = p_raw.get("unit", "Piece")
                existing_p.rating = float(p_raw.get("rating", 4.0))
                existing_p.review_count = int(p_raw.get("reviews", 0))
                existing_p.bulk_price = bulk_price_val
                existing_p.minimum_bulk_quantity = p_raw.get("minimumBulkQuantity")
                existing_p.delivery_available = bool(p_raw.get("deliveryAvailable", True))
                existing_p.is_featured = bool(p_raw.get("featured", False))
                existing_p.is_new = bool(p_raw.get("newArrival", False))
                existing_p.images = p_raw.get("images", [])
                existing_p.specifications = p_raw.get("specifications", [])
                existing_p.features = p_raw.get("features", [])
                product_obj = existing_p
                prods_updated += 1
            else:
                product_obj = Product(
                    id=p_raw.get("id"),
                    name=p_raw["name"],
                    slug=p_slug,
                    sku=f"SKU-{p_raw.get('id', p_slug[:8]).upper()}",
                    brand=p_raw["brand"],
                    category_id=cat_id,
                    subcategory=p_raw.get("subcategory"),
                    description=p_raw.get("description"),
                    price=price_val,
                    mrp=mrp_val,
                    discount_percent=int(p_raw.get("discount", 0)),
                    unit=p_raw.get("unit", "Piece"),
                    rating=float(p_raw.get("rating", 4.0)),
                    review_count=int(p_raw.get("reviews", 0)),
                    bulk_price=bulk_price_val,
                    minimum_bulk_quantity=p_raw.get("minimumBulkQuantity"),
                    delivery_available=bool(p_raw.get("deliveryAvailable", True)),
                    is_featured=bool(p_raw.get("featured", False)),
                    is_new=bool(p_raw.get("newArrival", False)),
                    is_offer=bool(p_raw.get("discount", 0) > 10),
                    is_active=True,
                    images=p_raw.get("images", []),
                    specifications=p_raw.get("specifications", []),
                    features=p_raw.get("features", []),
                )
                db.add(product_obj)
                db.flush()
                prods_created += 1

            # 3. Linked Inventory Record
            existing_inv = db.scalar(select(Inventory).where(Inventory.product_id == product_obj.id))
            if existing_inv:
                existing_inv.quantity = stock_qty
                inv_updated += 1
            else:
                inv = Inventory(
                    product_id=product_obj.id,
                    quantity=stock_qty,
                    reserved_quantity=0,
                    low_stock_threshold=15,
                    warehouse="MAIN",
                )
                db.add(inv)
                inv_created += 1

        db.commit()
        total_cats = len(category_slug_to_id)
        total_prods = prods_created + prods_updated
        total_inv = inv_created + inv_updated

        logger.info(f"Products seeded: {prods_created} created, {prods_updated} updated (Total: {total_prods})")
        logger.info(f"Inventory seeded: {inv_created} created, {inv_updated} updated (Total: {total_inv})")
        return total_cats, total_prods, total_inv

    except Exception as e:
        db.rollback()
        logger.error(f"Error during catalog seeding: {e}", exc_info=True)
        raise
    finally:
        if close_session:
            db.close()


if __name__ == "__main__":
    total_cats, total_prods, total_inv = seed_catalog()
    print(f"\n=======================================================")
    print(f"HEPNA MART CATALOG SEEDING SUMMARY")
    print(f"=======================================================")
    print(f"  Categories : {total_cats}")
    print(f"  Products   : {total_prods}")
    print(f"  Inventory  : {total_inv}")
    print(f"=======================================================\n")
