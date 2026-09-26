import sys
import uuid
import logging
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select, inspect, func, delete
from app.core.database import SessionLocal, engine
from app.core.config import settings
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.cart import Cart, CartItem
from app.models.wishlist import Wishlist, WishlistItem
from app.services.cart_service import cart_service
from app.services.wishlist_service import wishlist_service
from app.schemas.cart import MergeCartItemRequest

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("hepna.verify_phase2d")


def run_verification():
    print("\n" + "=" * 65)
    print("HEPNA MART — PHASE 2D REAL POSTGRESQL VERIFICATION")
    print("=" * 65)
    print(f"Target Database URL: {settings.DATABASE_URL}")

    db = SessionLocal()
    inspector = inspect(engine)

    try:
        # 1. Database Connection & Schema Verification
        print("\n[STEP 1] Database Tables & Schema Check...")
        tables = inspector.get_table_names()
        required_tables = ["users", "categories", "products", "inventory", "carts", "cart_items", "wishlists", "wishlist_items"]
        for table in required_tables:
            assert table in tables, f"Missing table: {table}"
            cols = [c["name"] for c in inspector.get_columns(table)]
            print(f"  ✓ Table '{table}' verified ({len(cols)} columns: {', '.join(cols[:5])}...)")

        # 2. Existing Catalog Integrity
        print("\n[STEP 2] Catalog Baseline Verification...")
        cat_count = db.scalar(select(func.count()).select_from(Category))
        prod_count = db.scalar(select(func.count()).select_from(Product))
        inv_count = db.scalar(select(func.count()).select_from(Inventory))
        
        print(f"  Categories in DB: {cat_count} (Expected: 12)")
        print(f"  Products in DB:   {prod_count} (Expected: 62)")
        print(f"  Inventory in DB:  {inv_count} (Expected: 62)")
        assert cat_count == 12, f"Expected 12 categories, found {cat_count}"
        assert prod_count == 62, f"Expected 62 products, found {prod_count}"
        assert inv_count == 62, f"Expected 62 inventory records, found {inv_count}"
        print("  ✓ Catalog integrity fully verified.")

        # 3. Setup Test Users
        print("\n[STEP 3] Setting up Test Users...")
        test_user_a_id = f"test-usr-a-{uuid.uuid4().hex[:8]}"
        test_user_b_id = f"test-usr-b-{uuid.uuid4().hex[:8]}"

        user_a = User(
            id=test_user_a_id,
            email=f"tester_a_{uuid.uuid4().hex[:6]}@hepnamart.com",
            first_name="Tester",
            last_name="Alpha",
            password_hash="test_argon2_hash",
            role="customer",
            account_type="individual",
            is_active=True,
        )
        user_b = User(
            id=test_user_b_id,
            email=f"tester_b_{uuid.uuid4().hex[:6]}@hepnamart.com",
            first_name="Tester",
            last_name="Beta",
            password_hash="test_argon2_hash",
            role="customer",
            account_type="individual",
            is_active=True,
        )
        db.add(user_a)
        db.add(user_b)
        db.commit()
        print(f"  ✓ Created Test User A ({user_a.id}) and User B ({user_b.id})")

        # Fetch sample products
        sample_prods = db.scalars(select(Product).limit(3)).all()
        p1, p2, p3 = sample_prods[0], sample_prods[1], sample_prods[2]
        print(f"  Sample Products selected for test:")
        print(f"    P1: {p1.name} (ID: {p1.id}, Price: ₹{p1.price})")
        print(f"    P2: {p2.name} (ID: {p2.id}, Price: ₹{p2.price})")
        print(f"    P3: {p3.name} (ID: {p3.id}, Price: ₹{p3.price})")

        # 4. Cart Operations Test
        print("\n[STEP 4] Testing Real PostgreSQL Cart Operations...")
        # Add P1 to User A cart
        cart_res = cart_service.add_item(db, user_a.id, p1.id, quantity=2)
        assert len(cart_res.items) == 1
        assert cart_res.items[0].quantity == 2
        assert cart_res.total_items == 2
        print(f"  ✓ Added P1 (qty 2) -> Total items: {cart_res.total_items}, Subtotal: ₹{cart_res.subtotal}")

        # Update quantity
        cart_res = cart_service.update_item_quantity(db, user_a.id, p1.id, quantity=5)
        assert cart_res.items[0].quantity == 5
        assert cart_res.total_items == 5
        print(f"  ✓ Updated P1 qty to 5 -> Total items: {cart_res.total_items}")

        # Guest cart merge test
        guest_items = [
            MergeCartItemRequest(product_id=p1.id, quantity=3),
            MergeCartItemRequest(product_id=p2.id, quantity=2),
        ]
        cart_res = cart_service.merge_guest_cart(db, user_a.id, guest_items)
        assert len(cart_res.items) == 2
        p1_item = next(i for i in cart_res.items if i.product_id == p1.id)
        p2_item = next(i for i in cart_res.items if i.product_id == p2.id)
        assert p1_item.quantity == 8  # 5 + 3
        assert p2_item.quantity == 2
        print(f"  ✓ Merged guest cart -> P1 qty: {p1_item.quantity}, P2 qty: {p2_item.quantity}")
        print(f"    Subtotal: ₹{cart_res.subtotal}, GST (18%): ₹{cart_res.tax}, Delivery: ₹{cart_res.delivery_charge}, Total: ₹{cart_res.total}")

        # 5. Wishlist Operations Test
        print("\n[STEP 5] Testing Real PostgreSQL Wishlist Operations...")
        # Add P1 and P3 to wishlist
        wl_res = wishlist_service.add_item(db, user_a.id, p1.id)
        assert p1.id in wl_res.product_ids
        print(f"  ✓ Added P1 to Wishlist -> Item IDs: {wl_res.product_ids}")

        # Guest wishlist merge test
        wl_res = wishlist_service.merge_guest_wishlist(db, user_a.id, [p2.id, p3.id])
        assert len(wl_res.product_ids) == 3
        assert p1.id in wl_res.product_ids
        assert p2.id in wl_res.product_ids
        assert p3.id in wl_res.product_ids
        print(f"  ✓ Merged guest wishlist -> {len(wl_res.product_ids)} items present")

        # 6. User Isolation Verification
        print("\n[STEP 6] Testing Multi-User Isolation...")
        user_b_cart = cart_service.get_cart_response(db, user_b.id)
        user_b_wl = wishlist_service.get_wishlist_response(db, user_b.id)
        assert len(user_b_cart.items) == 0
        assert len(user_b_wl.product_ids) == 0
        print("  ✓ User B cart & wishlist are completely isolated and empty.")

        # 7. Item Removal & Clear Cart Verification
        print("\n[STEP 7] Testing Deletion & Cart Clearing...")
        cart_res = cart_service.remove_item(db, user_a.id, p1.id)
        assert len(cart_res.items) == 1
        print("  ✓ Removed P1 from User A cart.")

        cart_res = cart_service.clear_cart(db, user_a.id)
        assert len(cart_res.items) == 0
        print("  ✓ Cleared User A cart completely.")

        wl_res = wishlist_service.remove_item(db, user_a.id, p2.id)
        assert p2.id not in wl_res.product_ids
        print("  ✓ Removed P2 from User A wishlist.")

        # 8. Cleanup Test Users
        print("\n[STEP 8] Cleaning up Test Data...")
        db.execute(delete(CartItem).where(CartItem.cart_id.in_(
            select(Cart.id).where(Cart.user_id.in_([test_user_a_id, test_user_b_id]))
        )))
        db.execute(delete(Cart).where(Cart.user_id.in_([test_user_a_id, test_user_b_id])))
        db.execute(delete(WishlistItem).where(WishlistItem.wishlist_id.in_(
            select(Wishlist.id).where(Wishlist.user_id.in_([test_user_a_id, test_user_b_id]))
        )))
        db.execute(delete(Wishlist).where(Wishlist.user_id.in_([test_user_a_id, test_user_b_id])))
        db.execute(delete(User).where(User.id.in_([test_user_a_id, test_user_b_id])))
        db.commit()
        print("  ✓ Test users and related test records successfully cleaned up.")

        print("\n" + "=" * 65)
        print("PHASE 2D REAL POSTGRESQL VERIFICATION: ALL CHECKS PASSED ✓")
        print("=" * 65 + "\n")
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"Verification FAILED: {e}", exc_info=True)
        print("\n" + "!" * 65)
        print(f"PHASE 2D VERIFICATION FAILED: {e}")
        print("!" * 65 + "\n")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
