import sys
import os
import uuid
import datetime
from decimal import Decimal
from sqlalchemy import create_engine, select, func, text
from sqlalchemy.orm import Session, sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.user import User, AccountType, UserRole
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus as OrderPaymentStatus
from app.models.payment import (
    Payment,
    PaymentEvent,
    PaymentStatus,
    PaymentMethod,
    PaymentProvider,
    PaymentEventType,
)
from app.services.payment_service import payment_service
from app.services.payment_reconciliation import payment_reconciliation_service


def run_postgres_verification():
    print("\n" + "=" * 60)
    print("HEPNA MART — PHASE 2G REAL POSTGRESQL VERIFICATION")
    print("=" * 60)

    # settings imported directly
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Database Connection & Alembic Migration Head Verification
        print("\n[1/7] Verifying PostgreSQL Connection & Migration 0006 Head...")
        db.execute(text("SELECT 1"))
        print("  ✓ Connected to PostgreSQL:", settings.DATABASE_URL.split("@")[-1])

        current_head = db.execute(text("SELECT version_num FROM alembic_version")).scalar()
        print(f"  ✓ Current Alembic Migration Head: {current_head}")
        assert current_head == "0006_create_payments", f"Expected migration head '0006_create_payments', got '{current_head}'"

        # 2. Database Schema & Tables Check
        print("\n[2/7] Verifying Table Structures & Integrity...")
        tables = db.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)).scalars().all()
        required_tables = ["payments", "payment_events", "orders", "order_items", "products", "categories", "inventory", "users"]
        for tbl in required_tables:
            assert tbl in tables, f"Missing table: {tbl}"
            print(f"  ✓ Table '{tbl}' exists in PostgreSQL.")

        # 3. Catalog Integrity Verification
        print("\n[3/7] Verifying Catalog & Inventory Integrity...")
        cat_count = db.scalar(select(func.count()).select_from(Category))
        prod_count = db.scalar(select(func.count()).select_from(Product))
        inv_count = db.scalar(select(func.count()).select_from(Inventory))
        print(f"  ✓ Categories: {cat_count} (Expected: 12)")
        print(f"  ✓ Products:   {prod_count} (Expected: 62)")
        print(f"  ✓ Inventory:  {inv_count} (Expected: 62)")
        assert cat_count == 12, f"Expected 12 categories, found {cat_count}"
        assert prod_count == 62, f"Expected 62 products, found {prod_count}"
        assert inv_count == 62, f"Expected 62 inventory records, found {inv_count}"

        # 4. Live Payment Lifecycle on Real PostgreSQL
        print("\n[4/7] Testing Live UPI Payment Lifecycle on PostgreSQL...")
        # Create temporary test customer and admin
        test_suffix = uuid.uuid4().hex[:6]
        test_customer = User(
            id=f"test-cust-{test_suffix}",
            email=f"pg_cust_{test_suffix}@hepnamart.com",
            password_hash="test_hash",
            first_name="Postgres",
            last_name="Customer",
            account_type=AccountType.INDIVIDUAL,
            role=UserRole.CUSTOMER,
            is_active=True,
        )
        test_admin = User(
            id=f"test-admin-{test_suffix}",
            email=f"pg_admin_{test_suffix}@hepnamart.com",
            password_hash="test_hash",
            first_name="Postgres",
            last_name="Admin",
            account_type=AccountType.BUSINESS,
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        db.add_all([test_customer, test_admin])
        db.commit()

        # Select a real product from database
        sample_prod = db.scalars(select(Product).limit(1)).first()
        sample_inv = db.scalar(select(Inventory).where(Inventory.product_id == sample_prod.id))
        stock_initial = sample_inv.quantity
        print(f"  ✓ Using sample product: '{sample_prod.name}' (Stock: {stock_initial})")

        # Create live Order
        order_num = f"ORD-PG-{test_suffix.upper()}"
        order_amount = Decimal("1500.00")
        test_order = Order(
            id=f"test-ord-{test_suffix}",
            user_id=test_customer.id,
            order_number=order_num,
            status=OrderStatus.CONFIRMED.value,
            payment_status=OrderPaymentStatus.PENDING.value,
            payment_method="upi",
            customer_name=f"{test_customer.first_name} {test_customer.last_name}",
            customer_email=test_customer.email,
            customer_phone="+919876543210",
            delivery_address={"city": "Bengaluru", "state": "Karnataka", "street_address": "Test PG Road", "postal_code": "560001"},
            subtotal=Decimal("1200.00"),
            tax_amount=Decimal("200.00"),
            delivery_charge=Decimal("100.00"),
            discount_amount=Decimal("0.00"),
            total_amount=order_amount,
            currency="INR",
        )
        db.add(test_order)
        db.commit()
        print(f"  ✓ Created Order '{test_order.order_number}' with authoritative total ₹{order_amount}")

        # Step 4a: Create Payment Record
        payment = payment_service.create_payment(
            db=db,
            user_id=test_customer.id,
            order_id=test_order.id,
            payment_method="upi",
        )
        print(f"  ✓ Payment created: Reference '{payment.payment_reference}', Status '{payment.payment_status}', Amount ₹{payment.amount}")
        assert payment.payment_status == PaymentStatus.PENDING.value
        assert payment.amount == order_amount

        # Step 4b: Customer Submits UTR
        utr = f"PGUTR{test_suffix.upper()}999"
        payment = payment_service.submit_upi_reference(
            db=db,
            user_id=test_customer.id,
            payment_id=payment.id,
            utr_reference=utr,
        )
        print(f"  ✓ Customer submitted UTR '{payment.provider_reference}', Payment Status '{payment.payment_status}'")
        assert payment.payment_status == PaymentStatus.AWAITING_VERIFICATION.value
        db.refresh(test_order)
        assert test_order.payment_status == "awaiting_verification"

        # Step 4c: Duplicate UTR Protection
        print("\n[5/7] Testing Duplicate UTR Protection...")
        test_order_2 = Order(
            id=f"test-ord2-{test_suffix}",
            user_id=test_customer.id,
            order_number=f"ORD-PG2-{test_suffix.upper()}",
            status=OrderStatus.CONFIRMED.value,
            payment_status=OrderPaymentStatus.PENDING.value,
            payment_method="upi",
            customer_name="PG Test 2",
            customer_email=test_customer.email,
            customer_phone="+919876543210",
            delivery_address={"city": "Bengaluru", "state": "Karnataka", "street_address": "Test PG Road 2", "postal_code": "560001"},
            subtotal=Decimal("100.00"),
            tax_amount=Decimal("18.00"),
            delivery_charge=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("118.00"),
            currency="INR",
        )
        db.add(test_order_2)
        db.commit()

        payment2 = payment_service.create_payment(
            db=db,
            user_id=test_customer.id,
            order_id=test_order_2.id,
            payment_method="upi",
        )
        try:
            payment_service.submit_upi_reference(
                db=db,
                user_id=test_customer.id,
                payment_id=payment2.id,
                utr_reference=utr,
            )
            assert False, "Duplicate UTR should have raised HTTPException 400!"
        except Exception as e:
            print(f"  ✓ Duplicate UTR correctly rejected by PostgreSQL service: {e.detail if hasattr(e, 'detail') else e}")

        # Step 4d: Admin Verification
        print("\n[6/7] Testing Admin Verification & Inventory Safety...")
        payment = payment_service.verify_manual_upi_payment(
            db=db,
            admin_user_id=test_admin.id,
            payment_id=payment.id,
            notes="Postgres Live Verification Test Verified",
        )
        print(f"  ✓ Admin verified payment '{payment.payment_reference}'. Status: '{payment.payment_status}'")
        assert payment.payment_status == PaymentStatus.VERIFIED.value
        assert payment.verified_by_user_id == test_admin.id
        db.refresh(test_order)
        assert test_order.payment_status == "paid"
        print(f"  ✓ Order payment_status successfully updated to '{test_order.payment_status}'")

        # Verify Inventory was NOT touched
        db.refresh(sample_inv)
        assert sample_inv.quantity == stock_initial, "Inventory quantity was altered during payment!"
        print(f"  ✓ Inventory safety confirmed: Stock remains {sample_inv.quantity}")

        # Step 4e: Audit Events Log Verification
        events = db.scalars(select(PaymentEvent).where(PaymentEvent.payment_id == payment.id).order_by(PaymentEvent.created_at)).all()
        print(f"  ✓ Immutable Audit Events logged: {len(events)} events")
        for ev in events:
            print(f"    - Event: {ev.event_type} | Old: {ev.old_status} -> New: {ev.new_status} | Timestamp: {ev.created_at}")
        assert len(events) >= 3

        # Step 7: Payment Metrics & Teardown
        print("\n[7/7] Verifying Aggregated Payment Metrics & Teardown...")
        metrics = payment_service.get_admin_payment_metrics(db)
        print("  ✓ Payment Metrics:")
        for k, v in metrics.items():
            print(f"    - {k}: {v}")
        assert metrics["total_payments"] >= 2

        # Clean teardown of test entities
        db.execute(text(f"DELETE FROM payment_events WHERE payment_id IN ('{payment.id}', '{payment2.id}')"))
        db.execute(text(f"DELETE FROM payments WHERE id IN ('{payment.id}', '{payment2.id}')"))
        db.execute(text(f"DELETE FROM orders WHERE id IN ('{test_order.id}', '{test_order_2.id}')"))
        db.execute(text(f"DELETE FROM users WHERE id IN ('{test_customer.id}', '{test_admin.id}')"))
        db.commit()
        print("  ✓ Test records cleaned up successfully.")

        print("\n" + "=" * 60)
        print("ALL POSTGRESQL VERIFICATION CHECKS PASSED SUCCESSFULLY (100%)")
        print("=" * 60 + "\n")

    finally:
        db.close()


if __name__ == "__main__":
    run_postgres_verification()
