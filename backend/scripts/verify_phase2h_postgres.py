#!/usr/bin/env python3
"""
==============================================================================
HEPNA MART — Phase 2H Production Hardening & PostgreSQL Security Verification
==============================================================================
Verifies security posture, authoritative database schemas, catalog integrity,
password hashing schemes, and audit readiness against live PostgreSQL 'hepna_mart'.
==============================================================================
"""

import sys
import os
import logging
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# Setup root path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.core.rate_limiter import rate_limiter
from app.core.audit import log_audit_event, AuditEventType
from app.models.user import User, UserRole

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("hepna.verify_phase2h")


def run_verification():
    print("==================================================================")
    print("  HEPNA MART — Phase 2H PostgreSQL & Security Verification")
    print("==================================================================")

    db_url = settings.DATABASE_URL
    print(f"Connecting to authoritative database: {db_url}")
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    passed_checks = 0
    total_checks = 0

    def check(name: str, condition: bool, details: str = ""):
        nonlocal passed_checks, total_checks
        total_checks += 1
        status = "✅ PASS" if condition else "❌ FAIL"
        if condition:
            passed_checks += 1
            print(f"[{status}] {name}")
            if details:
                print(f"       ↳ {details}")
        else:
            print(f"[{status}] {name}")
            if details:
                print(f"       ↳ ERROR: {details}")

    try:
        # 1. Database Connection & Engine
        result = session.execute(text("SELECT current_database(), current_user, version();")).fetchone()
        check("PostgreSQL Live Connection", result is not None, f"DB: {result[0]}, User: {result[1]}")

        # 2. Alembic Migration History
        version_row = session.execute(text("SELECT version_num FROM alembic_version;")).fetchone()
        check("Alembic Current Migration", version_row is not None, f"Revision: {version_row[0] if version_row else 'None'}")

        # 3. Catalog Data Integrity (12 Categories, 62 Products, 62 Inventory)
        cat_count = session.execute(text("SELECT count(*) FROM categories;")).scalar()
        check("Catalog Categories Count", cat_count == 12, f"Found {cat_count} categories (Expected: 12)")

        prod_count = session.execute(text("SELECT count(*) FROM products;")).scalar()
        check("Catalog Products Count", prod_count == 62, f"Found {prod_count} products (Expected: 62)")

        inv_count = session.execute(text("SELECT count(*) FROM inventory;")).scalar()
        check("Catalog Inventory Records Count", inv_count == 62, f"Found {inv_count} inventory records (Expected: 62)")

        # 4. Inventory Integrity (No negative stock, reserved_quantity <= quantity)
        invalid_inv = session.execute(text(
            "SELECT count(*) FROM inventory WHERE quantity < 0 OR reserved_quantity < 0 OR reserved_quantity > quantity;"
        )).scalar()
        check("Inventory Quantitative Consistency", invalid_inv == 0, f"Violations found: {invalid_inv}")

        # 5. User Security & Argon2id Password Hashing
        users = session.execute(text("SELECT id, email, role, password_hash FROM users;")).fetchall()
        invalid_hashes = [u[1] for u in users if not (u[3] and (u[3].startswith("$argon2") or u[3].startswith("$2b$") or u[3].startswith("$2a$") or u[3].startswith("$2y$")))]
        argon_or_bcrypt = (len(invalid_hashes) == 0)
        check("User Password Hashing Algorithm (Argon2id/bcrypt)", argon_or_bcrypt, f"Validated {len(users)} registered user records (Invalid: {invalid_hashes})")

        # 6. Database Table Schemas & Foreign Keys
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        required_tables = {
            "users", "categories", "products", "inventory", "cart_items",
            "wishlist_items", "orders", "order_items", "rfqs",
            "rfq_items", "quotes", "quote_items", "payments", "payment_events"
        }
        missing_tables = required_tables - tables
        check("Authoritative Database Schema Completeness", len(missing_tables) == 0, f"Missing: {missing_tables if missing_tables else 'None'}")



        # 7. Payment System Verification
        payment_count = session.execute(text("SELECT count(*) FROM payments;")).scalar()
        check("Payment Ledger Table Active", payment_count is not None, f"Payment records count: {payment_count}")

        # 8. Cryptographic Token Generation & Verification
        test_sub = "usr_sec_verify_001"
        token = create_access_token(subject=test_sub, role="customer", account_type="individual")
        payload = decode_access_token(token)
        token_valid = (payload is not None and payload.get("sub") == test_sub and payload.get("type") == "access")
        check("JWT Cryptographic Signing & Validation", token_valid, f"Subject: {payload.get('sub') if payload else 'Failed'}")

        # 9. Password Hashing Verification
        test_pw = "SecureP@ssw0rd!2026"
        hashed = hash_password(test_pw)
        pw_verified = verify_password(test_pw, hashed)
        check("Argon2id Password Hashing Verification", pw_verified and hashed.startswith("$argon2"), "Argon2id RFC 9106 verified")

        # 10. Sliding Window Rate Limiter
        rate_limiter.reset()
        r1, rem1, _ = rate_limiter.check("test:ip", max_requests=2, window_seconds=10)
        r2, rem2, _ = rate_limiter.check("test:ip", max_requests=2, window_seconds=10)
        r3, rem3, retry = rate_limiter.check("test:ip", max_requests=2, window_seconds=10)
        rate_limiter.reset()
        rate_limiter_working = (r1 is True and r2 is True and r3 is False and retry > 0)
        check("In-Memory Sliding Window Rate Limiter", rate_limiter_working, "2 req limit blocked 3rd request with retry-after header")

        # 11. Structured Audit Logger
        audit_record = log_audit_event(
            event_type=AuditEventType.AUTH_LOGIN_SUCCESS,
            target_type="verification",
            target_id="test_001",
            actor_id="admin_001",
            actor_role="admin",
            details={"test": "pass", "password": "supersecretpassword"},
        )
        audit_working = (audit_record["details"]["password"] == "[REDACTED]" and audit_record["status"] == "SUCCESS")
        check("Structured Security Audit Logging & PII Redaction", audit_working, "Password field safely masked to [REDACTED]")

        # 12. Production Config Validator
        settings.ENVIRONMENT = "development"
        dev_valid = True
        try:
            settings.validate_production_settings()
        except ValueError:
            dev_valid = False
        check("Production Configuration Validator", dev_valid, "Development validation passed without false alarms")

    finally:
        session.close()

    print("==================================================================")
    print(f"  Verification Result: {passed_checks}/{total_checks} Checks Passed")
    if passed_checks == total_checks:
        print("  Status: ✅ ALL PHASE 2H CHECKS PASSED SUCCESSFULLY")
        print("==================================================================")
        return 0
    else:
        print("  Status: ❌ SOME CHECKS FAILED")
        print("==================================================================")
        return 1


if __name__ == "__main__":
    sys.exit(run_verification())
