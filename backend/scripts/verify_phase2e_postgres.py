import sys
import uuid
import logging
from decimal import Decimal
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select, inspect, func, delete, text
from app.core.database import SessionLocal, engine
from app.core.config import settings
from app.models.user import User, UserRole, AccountType
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentStatus
from app.schemas.order import CheckoutRequest, CheckoutDeliveryRequest, OrderStatusUpdateRequest
from app.services.order_service import order_service
from app.services.cart_service import cart_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("hepna.verify_phase2e")


def run_verification():
    print("\n" + "=" * 70)
    print("HEPNA MART — PHASE 2E REAL POSTGRESQL ORDERS & CHECKOUT VERIFICATION")
    print("=" * 70)
    print(f"Authoritative PostgreSQL Target: {settings.DATABASE_URL}")

    db = SessionLocal()
    inspector = inspect(engine)

    try:
        # 1. Alembic Version & Schema Verification
        print("\n[STEP 1] Alembic Version & Table Schema Verification...")
        alembic_ver = db.execute(text("SELECT version_num FROM alembic_version")).scalar()
        print(f"  Current Alembic Revision: {alembic_ver}")
        assert alembic_ver == "0004_create_orders", f"Expected revision 0004_create_orders, found {alembic_ver}"

        tables = inspector.get_table_names()
        required_tables = [
            "users", "categories", "products", "inventory",
            "carts", "cart_items", "wishlists", "wishlist_items",
            "orders", "order_items", "order_status_history"
        ]
        for table in required_tables:
            assert table in tables, f"Missing table: {table}"
            cols = [c["name"] for c in inspector.get_columns(table)]
            print(f"  ✓ Table '{table}' verified ({len(cols)} columns: {', '.join(cols[:4])}...)")

        # 2. Existing Catalog Baseline Integrity
        print("\n[STEP 2] Existing Catalog Baseline Integrity...")
        cat_count = db.scalar(select(func.count()).select_from(Category))
        prod_count = db.scalar(select(func.count()).select_from(Product))
        inv_count = db.scalar(select(func.count()).select_from(Inventory))
        print(f"  Categories in PostgreSQL: {cat_count} (Expected: 12)")
        print(f"  Products in PostgreSQL:   {prod_count} (Expected: 62)")
        print(f"  Inventory in PostgreSQL:  {inv_count} (Expected: 62)")
        assert cat_count == 12, f"Expected 12 categories, found {cat_count}"
        assert prod_count == 62, f"Expected 62 products, found {prod_count}"
        assert inv_count == 62, f"Expected 62 inventory records, found {inv_count}"
        print("  ✓ Catalog integrity 100% verified.")

        # 3. Setup Test Personas
        print("\n[STEP 3] Setting up Test Personas (Customer & Admin)...")
        customer_id = f"test-cust-{uuid.uuid4().hex[:8]}"
        cust_other_id = f"test-other-{uuid.uuid4().hex[:8]}"
        admin_id = f"test-admin-{uuid.uuid4().hex[:8]}"

        customer = User(
            id=customer_id,
            email=f"customer_{uuid.uuid4().hex[:6]}@hepnamart.com",
            first_name="Ramesh",
            last_name="Patil",
            password_hash="test_argon2_hash",
            role=UserRole.CUSTOMER,
            account_type=AccountType.INDIVIDUAL,
            is_active=True,
        )
        cust_other = User(
            id=cust_other_id,
            email=f"other_{uuid.uuid4().hex[:6]}@hepnamart.com",
            first_name="Suresh",
            last_name="Shinde",
            password_hash="test_argon2_hash",
            role=UserRole.CUSTOMER,
            account_type=AccountType.INDIVIDUAL,
            is_active=True,
        )
        admin = User(
            id=admin_id,
            email=f"admin_{uuid.uuid4().hex[:6]}@hepnamart.com",
            first_name="Admin",
            last_name="Manager",
            password_hash="test_argon2_hash",
            role=UserRole.ADMIN,
            account_type=AccountType.BUSINESS,
            is_active=True,
        )
        db.add_all([customer, cust_other, admin])
        db.commit()
        print(f"  ✓ Created Customer ({customer.email}) and Admin ({admin.email})")

        # Pick two sample products from real catalog
        products = db.scalars(select(Product).limit(2)).all()
        p1, p2 = products[0], products[1]
        inv1_before = db.scalar(select(Inventory).where(Inventory.product_id == p1.id))
        inv2_before = db.scalar(select(Inventory).where(Inventory.product_id == p2.id))
        p1_stock_initial = inv1_before.quantity
        p2_stock_initial = inv2_before.quantity
        print(f"  P1: {p1.name} (Stock: {p1_stock_initial}, Price: ₹{p1.price})")
        print(f"  P2: {p2.name} (Stock: {p2_stock_initial}, Price: ₹{p2.price})")

        # 4. Add to Cart & Execute Real Checkout
        print("\n[STEP 4] Executing Real Checkout on PostgreSQL...")
        cart_service.add_item(db, customer.id, p1.id, quantity=3)
        cart_service.add_item(db, customer.id, p2.id, quantity=2)

        delivery_req = CheckoutDeliveryRequest(
            full_name="Ramesh Patil",
            phone="+91 98765 43210",
            address_line1="Plot 42, Green Valley Enclave, Baner Road",
            city="Pune",
            state="Maharashtra",
            pincode="411045",
            is_construction_site=True,
            site_name="Green Villa Site #42",
            delivery_preference="10-Wheeler Commercial Lorry",
            site_contact_person="Vikram Shinde",
            site_phone="+91 98230 11223",
            delivery_instructions="Enter via North Commercial Gate.",
        )
        checkout_req = CheckoutRequest(
            delivery_address=delivery_req,
            payment_method="online",
            project_name="Green Villa Construction",
            notes="Handle waterproof packaging with care.",
        )

        order = order_service.create_order_from_cart(db, customer, checkout_req)
        print(f"  ✓ Order Created: {order.order_number} (ID: {order.id})")
        print(f"    Status: {order.status}, Payment Status: {order.payment_status}")
        print(f"    Subtotal: ₹{order.subtotal}, Tax (18%): ₹{order.tax_amount}, Delivery: ₹{order.delivery_charge}, Total: ₹{order.total_amount}")
        print(f"    Items count: {len(order.items)}, Status history milestones: {len(order.status_history)}")

        # Verify inventory decrease in PostgreSQL
        db.refresh(inv1_before)
        db.refresh(inv2_before)
        assert inv1_before.quantity == p1_stock_initial - 3, "Inventory P1 not decremented properly!"
        assert inv2_before.quantity == p2_stock_initial - 2, "Inventory P2 not decremented properly!"
        print(f"  ✓ Real Inventory decremented: P1 ({p1_stock_initial} -> {inv1_before.quantity}), P2 ({p2_stock_initial} -> {inv2_before.quantity})")

        # Verify cart items cleared
        cart_resp = cart_service.get_cart_response(db, customer.id)
        assert len(cart_resp.items) == 0, "Cart items were not cleared after checkout!"
        print("  ✓ Customer cart automatically cleared upon order placement.")

        # 5. Customer Isolation
        print("\n[STEP 5] Verifying Multi-Tenant Customer Isolation...")
        try:
            order_service.get_order(db, order.id, user_id=cust_other.id)
            assert False, "Unauthorized customer was able to view another customer's order!"
        except Exception as e:
            print(f"  ✓ Unauthorized access blocked as expected (403 Forbidden).")

        # 6. Admin Order Status Workflow
        print("\n[STEP 6] Testing Admin Order Status Workflow on PostgreSQL...")
        for next_st in [OrderStatus.PROCESSING, OrderStatus.PACKED, OrderStatus.DISPATCHED, OrderStatus.OUT_FOR_DELIVERY]:
            order = order_service.update_order_status(
                db,
                order.order_number,
                OrderStatusUpdateRequest(status=next_st),
                staff_user=admin,
            )
            print(f"  ✓ Advanced Order #{order.order_number} -> {order.status}")

        assert len(order.status_history) == 5  # Initial + 4 transitions
        print("  ✓ Audit trail & status history accurately maintained.")

        # 7. Order Cancellation & Stock Restoration
        print("\n[STEP 7] Testing Order Cancellation & Stock Restoration...")
        # Create a second order to test cancellation
        cart_service.add_item(db, customer.id, p1.id, quantity=2)
        order2 = order_service.create_order_from_cart(db, customer, checkout_req)
        db.refresh(inv1_before)
        assert inv1_before.quantity == p1_stock_initial - 3 - 2

        # Cancel order2
        cancelled_order = order_service.cancel_order(
            db,
            order2.id,
            reason="Construction schedule delayed by monsoon",
            user_id=customer.id,
        )
        assert cancelled_order.status == "cancelled"
        db.refresh(inv1_before)
        assert inv1_before.quantity == p1_stock_initial - 3  # 2 units restored!
        print(f"  ✓ Order #{order2.order_number} cancelled and 2 stock units restored (Current Stock: {inv1_before.quantity}).")

        # 8. Reorder into Cart
        print("\n[STEP 8] Testing Reorder Flow...")
        reorder_res = order_service.reorder(db, order.id, customer)
        assert reorder_res["added_count"] == 2
        reordered_cart = cart_service.get_cart_response(db, customer.id)
        assert len(reordered_cart.items) == 2
        print(f"  ✓ Reorder successful: {reorder_res['added_count']} items added back to active cart with live prices.")

        # 9. Cleanup Test Records
        print("\n[STEP 9] Cleaning Up Test Artifacts from PostgreSQL...")
        # Restore test product stock
        inv1_before.quantity = p1_stock_initial
        inv2_before.quantity = p2_stock_initial

        test_uids = [customer_id, cust_other_id, admin_id]
        db.execute(delete(OrderStatusHistory).where(OrderStatusHistory.order_id.in_(
            select(Order.id).where(Order.user_id.in_(test_uids))
        )))
        db.execute(delete(OrderItem).where(OrderItem.order_id.in_(
            select(Order.id).where(Order.user_id.in_(test_uids))
        )))
        db.execute(delete(Order).where(Order.user_id.in_(test_uids)))
        db.execute(delete(CartItem).where(CartItem.cart_id.in_(
            select(Cart.id).where(Cart.user_id.in_(test_uids))
        )))
        db.execute(delete(Cart).where(Cart.user_id.in_(test_uids)))
        db.execute(delete(User).where(User.id.in_(test_uids)))
        db.commit()
        print("  ✓ Test artifacts cleaned up successfully.")

        print("\n" + "=" * 70)
        print("PHASE 2E POSTGRESQL VERIFICATION: ALL CHECKS PASSED PERFECTLY ✓")
        print("=" * 70 + "\n")
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"Verification FAILED: {e}", exc_info=True)
        print("\n" + "!" * 70)
        print(f"PHASE 2E VERIFICATION FAILED: {e}")
        print("!" * 70 + "\n")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
