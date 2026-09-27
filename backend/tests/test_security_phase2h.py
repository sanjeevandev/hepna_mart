import pytest
import jwt
from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings, Settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
    JWT_ALGORITHM,
)
from app.core.rate_limiter import rate_limiter
from app.core.audit import log_audit_event, AuditEventType
from app.models.user import User, UserRole, AccountType
from app.models.product import Product
from app.models.category import Category
from app.models.inventory import Inventory
from app.models.order import Order, OrderStatus, PaymentStatus as OrderPaymentStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus


# ==============================================================================
# 1. HTTP Security Headers & Correlation ID Tests
# ==============================================================================

def test_security_headers_present_on_all_responses(client: TestClient):
    """
    Verifies that defensive security headers are returned on all endpoints.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "frame-ancestors 'none'" in response.headers.get("Content-Security-Policy", "")


def test_correlation_id_generated_and_propagated(client: TestClient):
    """
    Verifies that X-Request-ID is generated if missing and propagated if provided.
    """
    # Auto-generation
    r1 = client.get("/")
    assert r1.status_code == 200
    req_id_1 = r1.headers.get("X-Request-ID")
    assert req_id_1 is not None and len(req_id_1) > 0

    # Propagation
    custom_id = "trace-test-id-998877"
    r2 = client.get("/", headers={"X-Request-ID": custom_id})
    assert r2.status_code == 200
    assert r2.headers.get("X-Request-ID") == custom_id


def test_payload_size_limit_blocks_oversized_requests(client: TestClient):
    """
    Verifies that requests exceeding MAX_REQUEST_SIZE_BYTES are rejected with 413 Payload Too Large.
    """
    oversized_length = str(settings.MAX_REQUEST_SIZE_BYTES + 1024)
    response = client.post(
        "/api/v1/auth/login",
        headers={"Content-Length": oversized_length, "Content-Type": "application/json"},
        content=b"{}",
    )
    assert response.status_code == 413
    assert "exceeds maximum allowed limit" in response.json()["detail"]


# ==============================================================================
# 2. Rate Limiting Tests (HTTP 429)
# ==============================================================================

def test_rate_limiter_blocks_rapid_login_attempts(client: TestClient):
    """
    Verifies that exceeding the login rate limit triggers HTTP 429 Too Many Requests.
    """
    rate_limiter.reset()

    # Send requests up to the max limit
    for _ in range(settings.RATE_LIMIT_LOGIN_MAX_REQUESTS):
        r = client.post("/api/v1/auth/login", json={"email": "ratelimit@test.com", "password": "wrong"})
        assert r.status_code in [401, 400]

    # The next request must be blocked by rate limiting
    blocked_response = client.post(
        "/api/v1/auth/login",
        json={"email": "ratelimit@test.com", "password": "wrong"},
    )
    assert blocked_response.status_code == 429
    assert "Rate limit exceeded" in blocked_response.json()["detail"]
    assert "Retry-After" in blocked_response.headers
    assert "X-RateLimit-Limit" in blocked_response.headers
    rate_limiter.reset()


def test_rate_limiter_blocks_rapid_registration_attempts(client: TestClient):
    """
    Verifies that exceeding the registration rate limit triggers HTTP 429.
    """
    rate_limiter.reset()

    for i in range(settings.RATE_LIMIT_REGISTER_MAX_REQUESTS):
        r = client.post("/api/v1/auth/register", json={
            "email": f"rate.user.{i}@example.com",
            "password": "Password123!",
            "first_name": "Test",
            "last_name": "Rate",
        })
        assert r.status_code == 201

    blocked_response = client.post("/api/v1/auth/register", json={
        "email": "rate.user.blocked@example.com",
        "password": "Password123!",
        "first_name": "Test",
        "last_name": "Rate",
    })
    assert blocked_response.status_code == 429
    assert "Rate limit exceeded" in blocked_response.json()["detail"]
    rate_limiter.reset()


# ==============================================================================
# 3. Cryptographic Token & Hashing Security Tests
# ==============================================================================

def test_argon2id_password_hashing_security():
    """
    Verifies Argon2id password hashing adheres to RFC 9106 standards.
    """
    raw_pw = "SuperSecurePassword#2026"
    hashed = hash_password(raw_pw)

    assert hashed.startswith("$argon2id$")
    assert verify_password(raw_pw, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False

    # Password length validation
    with pytest.raises(ValueError):
        hash_password("short")


def test_jwt_tampered_signature_rejected(client: TestClient, db_session: Session):
    """
    Verifies that a tampered JWT token signature is rejected with HTTP 401.
    """
    user = User(
        email="tamper@test.com",
        password_hash=hash_password("Password123!"),
        first_name="Tamper",
        last_name="Test",
        role=UserRole.CUSTOMER,
        account_type=AccountType.INDIVIDUAL,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token(subject=user.id, role="customer", account_type="individual")

    # Tamper with the signature portion of the JWT
    parts = token.split(".")
    tampered_signature = parts[2][:-4] + "wxyz"
    tampered_token = f"{parts[0]}.{parts[1]}.{tampered_signature}"

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tampered_token}"},
    )
    assert response.status_code == 401


def test_jwt_wrong_secret_or_algorithm_rejected():
    """
    Verifies that tokens signed with wrong secrets or invalid algorithms are rejected.
    """
    # 1. Signed with foreign secret
    fake_token = jwt.encode(
        {"sub": "usr_fake_001", "role": "admin", "type": "access"},
        "wrong_foreign_secret_key_1234567890",
        algorithm="HS256",
    )
    assert decode_access_token(fake_token) is None

    # 2. None algorithm attack
    none_alg_token = jwt.encode(
        {"sub": "usr_fake_002", "role": "admin", "type": "access"},
        "",
        algorithm="none",
    )
    assert decode_access_token(none_alg_token) is None


# ==============================================================================
# 4. Customer Data Isolation & RBAC Gatekeeper Tests
# ==============================================================================

def test_customer_data_isolation_on_orders_and_payments(client: TestClient, db_session: Session):
    """
    Verifies that Customer A cannot view or manipulate Customer B's orders or payments.
    """
    # Create Customer A
    user_a = User(
        email="customer.a@example.com",
        password_hash=hash_password("Password123!"),
        first_name="Customer",
        last_name="A",
        role=UserRole.CUSTOMER,
        account_type=AccountType.INDIVIDUAL,
        is_active=True,
    )
    # Create Customer B
    user_b = User(
        email="customer.b@example.com",
        password_hash=hash_password("Password123!"),
        first_name="Customer",
        last_name="B",
        role=UserRole.CUSTOMER,
        account_type=AccountType.INDIVIDUAL,
        is_active=True,
    )
    db_session.add_all([user_a, user_b])
    db_session.commit()

    # Create Order owned by Customer A
    order_a = Order(
        order_number="ORD-SEC-001",
        user_id=user_a.id,
        customer_name="Customer A",
        customer_email=user_a.email,
        customer_phone="9876543210",
        subtotal=1000.0,
        tax_amount=180.0,
        delivery_charge=199.0,
        total_amount=1379.0,
        status=OrderStatus.PENDING.value,
        payment_status=OrderPaymentStatus.PENDING.value,
        delivery_address={
            "full_name": "Customer A",
            "phone": "9876543210",
            "address_line1": "123 Street",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "pincode": "600001",
        },
    )
    db_session.add(order_a)
    db_session.commit()

    # Create Payment owned by Customer A
    payment_a = Payment(
        order_id=order_a.id,
        user_id=user_a.id,
        payment_reference="PAY-SEC-001",
        payment_method=PaymentMethod.UPI.value,
        payment_status=PaymentStatus.PENDING.value,
        amount=1379.0,
    )
    db_session.add(payment_a)
    db_session.commit()

    # Generate token for Customer B
    token_b = create_access_token(subject=user_b.id, role="customer", account_type="individual")

    # Customer B attempts to view Customer A's order -> forbidden / not found
    r_order = client.get(
        f"/api/v1/orders/{order_a.id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert r_order.status_code in [403, 404]

    # Customer B attempts to view Customer A's payment -> forbidden / not found
    r_pay = client.get(
        f"/api/v1/payments/{payment_a.id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert r_pay.status_code in [403, 404]



def test_customer_cannot_access_staff_payment_verification(client: TestClient, db_session: Session):
    """
    Verifies that customer accounts are strictly forbidden from staff payment verification.
    """
    cust_user = User(
        email="hacker.payment@example.com",
        password_hash=hash_password("Password123!"),
        first_name="Hacker",
        last_name="Customer",
        role=UserRole.CUSTOMER,
        account_type=AccountType.INDIVIDUAL,
        is_active=True,
    )
    db_session.add(cust_user)
    db_session.commit()

    token = create_access_token(subject=cust_user.id, role="customer", account_type="individual")

    # Attempt to list admin payments
    r_list = client.get(
        "/api/v1/admin/payments",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r_list.status_code == 403

    # Attempt to verify payment
    r_verify = client.post(
        "/api/v1/admin/payments/dummy-id/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r_verify.status_code == 403


# ==============================================================================
# 5. Production Configuration Validation & Audit Logging Tests
# ==============================================================================

def test_production_config_validation():
    """
    Verifies that Settings.validate_production_settings() fails fast on insecure defaults in production.
    """
    # 1. Insecure secret key in production
    bad_settings = Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        SECRET_KEY="dev_insecure_secret_key_please_change_in_production_9918237192",
    )
    with pytest.raises(ValueError, match="SECURITY RISK: SECRET_KEY"):
        bad_settings.validate_production_settings()

    # 2. DEBUG=True in production
    bad_debug_settings = Settings(
        ENVIRONMENT="production",
        DEBUG=True,
        SECRET_KEY="A_Very_Strong_And_Secure_Random_Production_Secret_Key_2026!",
    )
    with pytest.raises(ValueError, match="SECURITY RISK: DEBUG"):
        bad_debug_settings.validate_production_settings()

    # 3. Secure production settings pass
    good_settings = Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        SECRET_KEY="A_Very_Strong_And_Secure_Random_Production_Secret_Key_2026!",
        ENABLE_DEV_SEED_USERS=False,
    )
    good_settings.validate_production_settings()  # No exception raised


def test_structured_audit_logging_redacts_passwords():
    """
    Verifies that log_audit_event automatically redacts sensitive keywords from log details.
    """
    audit = log_audit_event(
        event_type=AuditEventType.AUTH_LOGIN_FAILURE,
        target_type="user",
        target_id="test@example.com",
        details={
            "password": "CleartextPassword123!",
            "secret_key": "raw_token_xyz",
            "safe_field": "test_data",
        },
    )
    assert audit["details"]["password"] == "[REDACTED]"
    assert audit["details"]["secret_key"] == "[REDACTED]"
    assert audit["details"]["safe_field"] == "test_data"
