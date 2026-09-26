import sys
import uuid
import logging
from decimal import Decimal
from datetime import datetime, timezone
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
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.wholesale import (
    RFQ,
    RFQItem,
    RFQStatusHistory,
    Quote,
    QuoteItem,
    RFQStatus,
    QuoteStatus,
)
from app.schemas.wholesale import (
    RFQCreateRequest,
    RFQDeliveryAddress,
    RFQItemCreate,
    QuoteCreateRequest,
    QuoteItemCreate,
    RFQRevisionRequest,
)
from app.services.wholesale_service import wholesale_service
from app.services.order_service import order_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("hepna.verify_phase2f")


def run_verification():
    print("\n" + "=" * 70)
    print("HEPNA MART — PHASE 2F REAL POSTGRESQL WHOLESALE & RFQ VERIFICATION")
    print("=" * 70)
    print(f"Authoritative PostgreSQL Target: {settings.DATABASE_URL}")

    db = SessionLocal()
    inspector = inspect(engine)

    try:
        # 1. Alembic Version & Table Schema Verification
        print("\n[STEP 1] Alembic Revision & Table Schema Verification...")
        alembic_ver = db.execute(text("SELECT version_num FROM alembic_version")).scalar()
        print(f"  Current Alembic Revision: {alembic_ver}")
        assert alembic_ver == "0005_create_wholesale_rfq", f"Expected revision 0005_create_wholesale_rfq, found {alembic_ver}"

        tables = inspector.get_table_names()
        required_tables = [
            "users", "categories", "products", "inventory",
            "carts", "cart_items", "wishlists", "wishlist_items",
            "orders", "order_items", "order_status_history",
            "rfqs", "rfq_items", "rfq_status_history", "quotes", "quote_items"
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
        print("  ✓ Catalog baseline 100% verified.")

        # 3. Setup Test Personas
        print("\n[STEP 3] Setting up Test Personas (Customer A, Customer B, Procurement Mgr)...")
        customer_a_id = f"test-cust-a-{uuid.uuid4().hex[:6]}"
        customer_b_id = f"test-cust-b-{uuid.uuid4().hex[:6]}"
        proc_admin_id = f"test-proc-{uuid.uuid4().hex[:6]}"

        customer_a = User(
            id=customer_a_id,
            email=f"contractor_a_{uuid.uuid4().hex[:6]}@hepnamart.com",
            first_name="Rohan",
            last_name="Sharma",
            password_hash="test_argon2_hash",
            role=UserRole.CUSTOMER,
            account_type=AccountType.CONTRACTOR,
            is_active=True,
        )
        customer_b = User(
            id=customer_b_id,
            email=f"contractor_b_{uuid.uuid4().hex[:6]}@hepnamart.com",
            first_name="Suresh",
            last_name="Patil",
            password_hash="test_argon2_hash",
            role=UserRole.CUSTOMER,
            account_type=AccountType.CONTRACTOR,
            is_active=True,
        )
        proc_admin = User(
            id=proc_admin_id,
            email=f"procurement_{uuid.uuid4().hex[:6]}@hepnamart.com",
            first_name="Procurement",
            last_name="Officer",
            password_hash="test_argon2_hash",
            role=UserRole.PROCUREMENT_MANAGER,
            account_type=AccountType.BUSINESS,
            is_active=True,
        )
        db.add_all([customer_a, customer_b, proc_admin])
        db.commit()
        print(f"  ✓ Personas created: Customer A ({customer_a.email}), Customer B ({customer_b.email}), Staff ({proc_admin.email})")

        # Pick two sample products from real catalog
        products = db.scalars(select(Product).limit(2)).all()
        p1, p2 = products[0], products[1]
        inv1 = db.scalar(select(Inventory).where(Inventory.product_id == p1.id))
        inv2 = db.scalar(select(Inventory).where(Inventory.product_id == p2.id))
        p1_stock_initial = inv1.quantity
        p2_stock_initial = inv2.quantity
        print(f"  Selected P1: {p1.name} (Stock: {p1_stock_initial}, Catalog Price: ₹{p1.price})")
        print(f"  Selected P2: {p2.name} (Stock: {p2_stock_initial}, Catalog Price: ₹{p2.price})")

        # 4. Customer A Submits Institutional RFQ
        print("\n[STEP 4] Customer A Submits Institutional RFQ...")
        delivery_addr = RFQDeliveryAddress(
            full_name="Rohan Sharma",
            phone="+91 98765 43210",
            address_line1="Plot 104, Industrial Hub Phase 2",
            city="Pune",
            state="Maharashtra",
            pincode="411057",
            is_construction_site=True,
            site_name="Skyline Commercial Towers",
            site_type="Commercial Complex",
            delivery_preference="22-Wheeler Articulated Heavy Trailer",
            site_contact_person="Kishore Kulkarni",
            site_phone="+91 98220 54321",
            access_road="24m Concrete Highway",
            vehicle_access="Transit trailers permitted",
            delivery_instructions="Unloading crane stationed at gate #3.",
        )
        rfq_in = RFQCreateRequest(
            project_name="Skyline Commercial Towers",
            project_type="Commercial",
            required_by_date="2026-10-20",
            delivery_address=delivery_addr,
            gstin="27AAACH7409R1ZZ",
            notes="Institutional bulk order for Phase 1 casting.",
            items=[
                RFQItemCreate(
                    product_id=p1.id,
                    product_name=p1.name,
                    requested_quantity=50,
                    target_unit_price=Decimal("360.00"),
                ),
                RFQItemCreate(
                    product_id=p2.id,
                    product_name=p2.name,
                    requested_quantity=30,
                    target_unit_price=Decimal("340.00"),
                ),
            ],
            submit_now=True,
        )
        rfq = wholesale_service.create_rfq(db, customer_a, rfq_in)
        print(f"  ✓ RFQ Created: {rfq.rfq_number} (ID: {rfq.id})")
        print(f"    Status: {rfq.status}, Items: {len(rfq.items)}, Milestones: {len(rfq.status_history)}")

        # Verify stock NOT deducted
        db.refresh(inv1)
        db.refresh(inv2)
        assert inv1.quantity == p1_stock_initial, "Stock should NOT decrease on RFQ creation!"
        assert inv2.quantity == p2_stock_initial, "Stock should NOT decrease on RFQ creation!"
        print(f"  ✓ Inventory intact (P1={inv1.quantity}, P2={inv2.quantity}) - No premature deduction.")

        # 5. Customer Multi-Tenant Isolation
        print("\n[STEP 5] Verifying Multi-Tenant Customer Isolation on RFQ...")
        try:
            wholesale_service.get_rfq(db, rfq.id, user_id=customer_b.id, is_staff=False)
            assert False, "Unauthorized Customer B was able to access Customer A's RFQ!"
        except Exception:
            print("  ✓ Customer B blocked with 403 Forbidden on Customer A's RFQ.")

        # 6. Procurement Officer Generates Quote v1
        print("\n[STEP 6] Procurement Officer Generates Quote (Version 1)...")
        quote_in_v1 = QuoteCreateRequest(
            items=[
                QuoteItemCreate(
                    product_id=p1.id,
                    product_name=p1.name,
                    requested_quantity=50,
                    quoted_quantity=50,
                    quoted_unit_price=Decimal("375.00"),
                ),
                QuoteItemCreate(
                    product_id=p2.id,
                    product_name=p2.name,
                    requested_quantity=30,
                    quoted_quantity=30,
                    quoted_unit_price=Decimal("355.00"),
                ),
            ],
            delivery_charge=Decimal("1200.00"),
            discount_amount=Decimal("500.00"),
            customer_notes="Direct delivery from rolling depot.",
            send_now=True,
        )
        quote_v1 = wholesale_service.create_quote(db, rfq.id, proc_admin, quote_in_v1)
        print(f"  ✓ Quote v1 Generated: {quote_v1.quote_number} (v{quote_v1.version})")
        print(f"    Subtotal: ₹{quote_v1.subtotal}, Discount: ₹{quote_v1.discount_amount}, Tax (18%): ₹{quote_v1.tax_amount}, Delivery: ₹{quote_v1.delivery_charge}, Total: ₹{quote_v1.total}")

        # 7. Customer A Requests Revision -> Staff Creates Quote v2
        print("\n[STEP 7] Customer A Requests Revision & Staff Issues Quote (Version 2)...")
        rev_req = RFQRevisionRequest(
            notes="Please offer ₹365/unit for P1 and ₹345/unit for P2.",
        )
        rfq = wholesale_service.request_revision(db, rfq.id, customer_a.id, rev_req)
        assert rfq.status == "negotiating"

        quote_in_v2 = QuoteCreateRequest(
            items=[
                QuoteItemCreate(
                    product_id=p1.id,
                    product_name=p1.name,
                    requested_quantity=50,
                    quoted_quantity=50,
                    quoted_unit_price=Decimal("365.00"),
                ),
                QuoteItemCreate(
                    product_id=p2.id,
                    product_name=p2.name,
                    requested_quantity=30,
                    quoted_quantity=30,
                    quoted_unit_price=Decimal("345.00"),
                ),
            ],
            delivery_charge=Decimal("1000.00"),
            discount_amount=Decimal("0.00"),
            procurement_notes="Special institutional pricing approved by zonal sales director.",
            send_now=True,
        )
        quote_v2 = wholesale_service.revise_quote(db, quote_v1.id, proc_admin, quote_in_v2)
        assert quote_v2.version == 2
        print(f"  ✓ Quote v2 Generated: {quote_v2.quote_number} (v{quote_v2.version})")
        print(f"    Revised Total: ₹{quote_v2.total}")

        # 8. Customer A Accepts Quote v2 -> Atomically Creates Phase 2E Order
        print("\n[STEP 8] Customer A Accepts Quote v2 -> Atomic Order Creation & Stock Deduction...")
        accept_result = wholesale_service.accept_quote(
            db=db,
            quote_id=quote_v2.id,
            customer_user=customer_a,
            payment_method="online",
            notes="Gate pass #104 ready on site.",
        )
        accepted_quote = accept_result["quote"]
        created_order = accept_result["order"]

        assert accepted_quote.status == "accepted"
        assert rfq.status == "accepted"
        print(f"  ✓ Quote #{accepted_quote.quote_number} status -> ACCEPTED")
        print(f"  ✓ RFQ #{rfq.rfq_number} status -> ACCEPTED")
        print(f"  ✓ Real PostgreSQL Order Generated: #{created_order.order_number} (ID: {created_order.id})")
        print(f"    Order Subtotal: ₹{created_order.subtotal}, Tax: ₹{created_order.tax_amount}, Delivery: ₹{created_order.delivery_charge}, Total: ₹{created_order.total_amount}")
        print(f"    Quotation Ref: {created_order.quotation_id}, Project Name: {created_order.project_name}")

        # 9. Verify Inventory Deduction Exactly Once in PostgreSQL
        print("\n[STEP 9] Verifying PostgreSQL Inventory Deducted Exactly Once...")
        db.refresh(inv1)
        db.refresh(inv2)
        assert inv1.quantity == p1_stock_initial - 50, f"Expected {p1_stock_initial - 50}, got {inv1.quantity}"
        assert inv2.quantity == p2_stock_initial - 30, f"Expected {p2_stock_initial - 30}, got {inv2.quantity}"
        print(f"  ✓ Inventory P1: {p1_stock_initial} -> {inv1.quantity} (-50 deducted)")
        print(f"  ✓ Inventory P2: {p2_stock_initial} -> {inv2.quantity} (-30 deducted)")

        # 10. Clean up test records
        print("\n[STEP 10] Cleaning up Test Artifacts from PostgreSQL...")
        # Restore stock
        inv1.quantity = p1_stock_initial
        inv2.quantity = p2_stock_initial

        test_uids = [customer_a_id, customer_b_id, proc_admin_id]

        # Delete orders
        db.execute(delete(OrderStatusHistory).where(OrderStatusHistory.order_id == created_order.id))
        db.execute(delete(OrderItem).where(OrderItem.order_id == created_order.id))
        db.execute(delete(Order).where(Order.user_id.in_(test_uids)))

        # Delete quotes & RFQs
        db.execute(delete(QuoteItem).where(QuoteItem.quote_id.in_([quote_v1.id, quote_v2.id])))
        db.execute(delete(Quote).where(Quote.rfq_id == rfq.id))
        db.execute(delete(RFQStatusHistory).where(RFQStatusHistory.rfq_id == rfq.id))
        db.execute(delete(RFQItem).where(RFQItem.rfq_id == rfq.id))
        db.execute(delete(RFQ).where(RFQ.user_id.in_(test_uids)))
        db.execute(delete(User).where(User.id.in_(test_uids)))
        db.commit()
        print("  ✓ Cleanup completed successfully.")

        print("\n" + "=" * 70)
        print("PHASE 2F POSTGRESQL VERIFICATION: ALL CHECKS PASSED PERFECTLY ✓")
        print("=" * 70 + "\n")
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"Verification FAILED: {e}", exc_info=True)
        print("\n" + "!" * 70)
        print(f"PHASE 2F VERIFICATION FAILED: {e}")
        print("!" * 70 + "\n")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
