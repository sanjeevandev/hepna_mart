import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.user import User, AccountType, UserRole
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus as OrderPaymentStatus
from app.models.payment import (
    Payment,
    PaymentEvent,
    PaymentStatus,
    PaymentMethod,
    PaymentProvider,
    PaymentEventType,
)
from app.services.payment_reconciliation import payment_reconciliation_service


def create_test_user(
    db: Session,
    email: str,
    role: UserRole = UserRole.CUSTOMER,
    first_name: str = "Test",
    last_name: str = "User",
) -> User:
    user = User(
        email=email,
        password_hash=hash_password("ValidPassword123!"),
        first_name=first_name,
        last_name=last_name,
        account_type=AccountType.INDIVIDUAL,
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_header_for_user(user: User) -> dict:
    token = create_access_token(
        subject=user.id,
        role=user.role.value,
        account_type=user.account_type.value,
        extra_claims={"email": user.email, "is_staff": user.is_staff},
    )
    return {"Authorization": f"Bearer {token}"}


def create_test_product(
    db: Session,
    product_id: str,
    name: str,
    slug: str,
    price: Decimal = Decimal("500.00"),
    stock: int = 100,
) -> Product:
    cat = db.query(Category).first()
    if not cat:
        cat = Category(id="cat-default", name="Building Materials", slug="building-materials", is_active=True)
        db.add(cat)
        db.commit()

    prod = Product(
        id=product_id,
        category_id=cat.id,
        name=name,
        slug=slug,
        sku=f"SKU-{product_id}",
        brand="Hepna Brand",
        price=price,
        mrp=price + Decimal("50.00"),
        unit="Piece",
        is_active=True,
    )
    db.add(prod)
    db.commit()

    inv = Inventory(
        product_id=product_id,
        quantity=stock,
        reserved_quantity=0,
        low_stock_threshold=5,
    )
    db.add(inv)
    db.commit()
    db.refresh(prod)
    return prod


def create_test_order(
    db: Session,
    user: User,
    product: Product,
    quantity: int = 2,
    order_status: OrderStatus = OrderStatus.PENDING,
    payment_status: str = "pending",
) -> Order:
    unit_price = product.price
    subtotal = unit_price * Decimal(quantity)
    tax = (subtotal * Decimal("0.18")).quantize(Decimal("0.01"))
    shipping = Decimal("100.00")
    total = subtotal + tax + shipping

    order = Order(
        user_id=user.id,
        order_number=f"ORD-TEST-{user.id[:4]}-{product.id[:4]}",
        status=order_status.value if hasattr(order_status, "value") else str(order_status),
        payment_status=payment_status,
        payment_method="upi",
        customer_name=f"{user.first_name} {user.last_name}",
        customer_email=user.email,
        customer_phone="+919876543210",
        delivery_address={
            "full_name": f"{user.first_name} {user.last_name}",
            "phone_number": "+919876543210",
            "street_address": "123 Construction Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "postal_code": "560001",
            "country": "India",
        },
        subtotal=subtotal,
        tax_amount=tax,
        delivery_charge=shipping,
        discount_amount=Decimal("0.00"),
        total_amount=total,
        currency="INR",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    order_item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        product_name=product.name,
        product_sku=product.sku or "SKU-DEF",
        unit_price=product.price,
        mrp=product.mrp,
        quantity=quantity,
        subtotal=subtotal,
        total=total,
    )
    db.add(order_item)
    db.commit()
    db.refresh(order)
    return order


# ==========================================
# TEST SUITE: Phase 2G Real Payment System
# ==========================================

def test_get_payment_config(client: TestClient):
    """Anonymous/customer can fetch public payment config."""
    response = client.get("/api/v1/payments/config")
    assert response.status_code == 200
    data = response.json()
    assert "upi_id" in data
    assert "upi_display_name" in data
    assert "manual_upi_enabled" in data
    assert data["manual_upi_enabled"] is True


def test_create_upi_payment_customer(client: TestClient, db_session: Session):
    """Customer can create a UPI payment record for their order with server-authoritative amount."""
    user = create_test_user(db_session, "customer_upi@example.com")
    product = create_test_product(db_session, "prod-upi-1", "Cement 50kg", "cement-50kg")
    order = create_test_order(db_session, user, product)

    response = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(user),
    )
    assert response.status_code == 201
    data = response.json()
    assert data["order_id"] == order.id
    assert data["payment_method"] == "upi"
    assert data["provider"] == "manual_upi"
    assert data["payment_status"] == "pending"
    assert float(data["amount"]) == float(order.total_amount)
    assert "payment_reference" in data
    assert data["payment_reference"].startswith("PAY-")


def test_create_cod_payment_customer(client: TestClient, db_session: Session):
    """Customer can create a COD payment record for their order."""
    user = create_test_user(db_session, "customer_cod@example.com")
    product = create_test_product(db_session, "prod-cod-1", "Steel Bars", "steel-bars")
    order = create_test_order(db_session, user, product)

    response = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "cod"},
        headers=auth_header_for_user(user),
    )
    assert response.status_code == 201
    data = response.json()
    assert data["payment_method"] == "cod"
    assert data["provider"] == "cod"
    assert data["payment_status"] == "pending"


def test_create_payment_forbidden_for_other_user(client: TestClient, db_session: Session):
    """User B cannot create payment for User A's order."""
    user_a = create_test_user(db_session, "user_a@example.com")
    user_b = create_test_user(db_session, "user_b@example.com")
    product = create_test_product(db_session, "prod-forbid-1", "Bricks", "bricks")
    order_a = create_test_order(db_session, user_a, product)

    response = client.post(
        "/api/v1/payments/create",
        json={"order_id": order_a.id, "payment_method": "upi"},
        headers=auth_header_for_user(user_b),
    )
    assert response.status_code == 403


def test_create_payment_nonexistent_order(client: TestClient, db_session: Session):
    """Returns 404 for non-existent order ID."""
    user = create_test_user(db_session, "user_404@example.com")
    response = client.post(
        "/api/v1/payments/create",
        json={"order_id": "non-existent-order-id", "payment_method": "upi"},
        headers=auth_header_for_user(user),
    )
    assert response.status_code == 404


def test_submit_upi_reference_success(client: TestClient, db_session: Session):
    """Customer submits UTR reference -> transitions to awaiting_verification, updates order status."""
    user = create_test_user(db_session, "customer_submit@example.com")
    product = create_test_product(db_session, "prod-sub-1", "Sand", "sand")
    order = create_test_order(db_session, user, product)

    # 1. Create payment
    create_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(user),
    )
    payment_id = create_res.json()["id"]

    # 2. Submit UPI UTR
    submit_res = client.post(
        f"/api/v1/payments/{payment_id}/submit-upi",
        json={"utr_reference": "UTR123456789012"},
        headers=auth_header_for_user(user),
    )
    assert submit_res.status_code == 200
    data = submit_res.json()
    assert data["payment_status"] == "awaiting_verification"
    assert data["provider_reference"] == "UTR123456789012"

    # Verify order status was synced to awaiting_verification
    db_session.refresh(order)
    assert order.payment_status == "awaiting_verification"


def test_submit_upi_reference_empty_or_short(client: TestClient, db_session: Session):
    """Submitting empty or too short UTR is rejected with 400 or 422."""
    user = create_test_user(db_session, "customer_short_utr@example.com")
    product = create_test_product(db_session, "prod-short-1", "Sand 2", "sand-2")
    order = create_test_order(db_session, user, product)

    create_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(user),
    )
    payment_id = create_res.json()["id"]

    # Short UTR
    submit_res = client.post(
        f"/api/v1/payments/{payment_id}/submit-upi",
        json={"utr_reference": "12"},
        headers=auth_header_for_user(user),
    )
    assert submit_res.status_code in (400, 422)


def test_submit_duplicate_upi_reference_rejected(client: TestClient, db_session: Session):
    """Submitting a duplicate UTR already used by another payment is rejected with 400."""
    user1 = create_test_user(db_session, "customer_dup1@example.com")
    user2 = create_test_user(db_session, "customer_dup2@example.com")
    product = create_test_product(db_session, "prod-dup-1", "Paint", "paint")

    order1 = create_test_order(db_session, user1, product)
    order2 = create_test_order(db_session, user2, product)

    # User 1 creates payment and submits UTR
    p1_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order1.id, "payment_method": "upi"},
        headers=auth_header_for_user(user1),
    )
    p1_id = p1_res.json()["id"]
    client.post(
        f"/api/v1/payments/{p1_id}/submit-upi",
        json={"utr_reference": "DUPLICATE_UTR_999"},
        headers=auth_header_for_user(user1),
    )

    # User 2 creates payment and attempts to submit same UTR
    p2_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order2.id, "payment_method": "upi"},
        headers=auth_header_for_user(user2),
    )
    p2_id = p2_res.json()["id"]
    dup_res = client.post(
        f"/api/v1/payments/{p2_id}/submit-upi",
        json={"utr_reference": "DUPLICATE_UTR_999"},
        headers=auth_header_for_user(user2),
    )
    assert dup_res.status_code == 400
    assert "already been submitted" in dup_res.json()["detail"].lower()


def test_customer_cannot_verify_own_payment(client: TestClient, db_session: Session):
    """Customer role cannot access admin verification endpoint (HTTP 403)."""
    user = create_test_user(db_session, "customer_unauth@example.com")
    product = create_test_product(db_session, "prod-unauth-1", "Tiles", "tiles")
    order = create_test_order(db_session, user, product)

    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(user),
    )
    p_id = p_res.json()["id"]

    verify_res = client.post(
        f"/api/v1/admin/payments/{p_id}/verify",
        json={"notes": "Customer trying to self-verify"},
        headers=auth_header_for_user(user),
    )
    assert verify_res.status_code == 403


def test_admin_verify_manual_upi_payment(client: TestClient, db_session: Session):
    """Admin verifies manual UPI payment: updates payment to verified, order to paid."""
    admin = create_test_user(db_session, "admin_verifier@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_verified@example.com")
    product = create_test_product(db_session, "prod-ver-1", "Gravel", "gravel")
    order = create_test_order(db_session, customer, product)

    # 1. Customer creates & submits UTR
    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]

    client.post(
        f"/api/v1/payments/{payment_id}/submit-upi",
        json={"utr_reference": "UTR_VALID_8888"},
        headers=auth_header_for_user(customer),
    )

    # 2. Admin verifies
    verify_res = client.post(
        f"/api/v1/admin/payments/{payment_id}/verify",
        json={"notes": "Checked bank statement and credited"},
        headers=auth_header_for_user(admin),
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["payment_status"] == "verified"
    assert data["verified_by_user_id"] == admin.id
    assert data["verified_at"] is not None

    # Verify Order is updated to paid
    db_session.refresh(order)
    assert order.payment_status == "paid"

    # Verify PaymentEvent was logged
    events = db_session.query(PaymentEvent).filter(PaymentEvent.payment_id == payment_id).all()
    event_types = [e.event_type for e in events]
    assert PaymentEventType.PAYMENT_VERIFIED.value in event_types


def test_verify_payment_idempotency(client: TestClient, db_session: Session):
    """Verifying an already verified payment is idempotent and does not error."""
    admin = create_test_user(db_session, "admin_idem@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_idem@example.com")
    product = create_test_product(db_session, "prod-idem-1", "Wire", "wire")
    order = create_test_order(db_session, customer, product)

    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]
    client.post(
        f"/api/v1/payments/{payment_id}/submit-upi",
        json={"utr_reference": "UTR_IDEM_111"},
        headers=auth_header_for_user(customer),
    )

    # First verification
    v1 = client.post(
        f"/api/v1/admin/payments/{payment_id}/verify",
        json={"notes": "First check"},
        headers=auth_header_for_user(admin),
    )
    assert v1.status_code == 200
    assert v1.json()["payment_status"] == "verified"

    # Second verification (idempotent call)
    v2 = client.post(
        f"/api/v1/admin/payments/{payment_id}/verify",
        json={"notes": "Second check"},
        headers=auth_header_for_user(admin),
    )
    assert v2.status_code == 200
    assert v2.json()["payment_status"] == "verified"


def test_cannot_verify_pending_without_submission(client: TestClient, db_session: Session):
    """Admin cannot verify a payment that is in pending state (customer hasn't submitted UTR)."""
    admin = create_test_user(db_session, "admin_nopay@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_nopay@example.com")
    product = create_test_product(db_session, "prod-nopay-1", "Pipes", "pipes")
    order = create_test_order(db_session, customer, product)

    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]

    v_res = client.post(
        f"/api/v1/admin/payments/{payment_id}/verify",
        json={"notes": "Should fail"},
        headers=auth_header_for_user(admin),
    )
    assert v_res.status_code == 400
    assert "awaiting_verification" in v_res.json()["detail"]


def test_admin_reject_manual_upi_payment(client: TestClient, db_session: Session):
    """Admin rejects UPI payment with reason: updates payment to failed and order to failed."""
    admin = create_test_user(db_session, "admin_rejector@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_rejected@example.com")
    product = create_test_product(db_session, "prod-rej-1", "Glass", "glass")
    order = create_test_order(db_session, customer, product)

    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]
    client.post(
        f"/api/v1/payments/{payment_id}/submit-upi",
        json={"utr_reference": "UTR_FAKE_777"},
        headers=auth_header_for_user(customer),
    )

    reject_res = client.post(
        f"/api/v1/admin/payments/{payment_id}/reject",
        json={"reason": "Invalid UTR, no transaction found on bank statement."},
        headers=auth_header_for_user(admin),
    )
    assert reject_res.status_code == 200
    data = reject_res.json()
    assert data["payment_status"] == "failed"
    assert "Invalid UTR" in data["failure_reason"]

    db_session.refresh(order)
    assert order.payment_status == "failed"


def test_reject_without_reason_rejected(client: TestClient, db_session: Session):
    """Rejecting payment without reason is rejected with 400 or 422."""
    admin = create_test_user(db_session, "admin_noreason@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_noreason@example.com")
    product = create_test_product(db_session, "prod-noreas-1", "Wood", "wood")
    order = create_test_order(db_session, customer, product)

    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]

    reject_res = client.post(
        f"/api/v1/admin/payments/{payment_id}/reject",
        json={"reason": ""},
        headers=auth_header_for_user(admin),
    )
    assert reject_res.status_code in (400, 422)


def test_cannot_reject_verified_payment(client: TestClient, db_session: Session):
    """Verified payment cannot be rejected (must be refunded instead)."""
    admin = create_test_user(db_session, "admin_ver_rej@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_ver_rej@example.com")
    product = create_test_product(db_session, "prod-ver-rej-1", "Iron", "iron")
    order = create_test_order(db_session, customer, product)

    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]
    client.post(
        f"/api/v1/payments/{payment_id}/submit-upi",
        json={"utr_reference": "UTR_TO_VERIFY_FIRST"},
        headers=auth_header_for_user(customer),
    )
    client.post(
        f"/api/v1/admin/payments/{payment_id}/verify",
        json={"notes": "Approved"},
        headers=auth_header_for_user(admin),
    )

    # Attempt rejection
    rej_res = client.post(
        f"/api/v1/admin/payments/{payment_id}/reject",
        json={"reason": "Trying to reject verified"},
        headers=auth_header_for_user(admin),
    )
    assert rej_res.status_code == 400
    assert "cannot reject a verified payment" in rej_res.json()["detail"].lower()


def test_cancel_pending_payment(client: TestClient, db_session: Session):
    """Customer can cancel pending payment."""
    customer = create_test_user(db_session, "cust_cancel@example.com")
    product = create_test_product(db_session, "prod-canc-1", "Roofing Sheets", "roofing")
    order = create_test_order(db_session, customer, product)

    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]

    cancel_res = client.post(
        f"/api/v1/payments/{payment_id}/cancel",
        json={"reason": "Customer changed payment method"},
        headers=auth_header_for_user(customer),
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["payment_status"] == "cancelled"


def test_admin_create_refund_record(client: TestClient, db_session: Session):
    """Admin issues refund record for verified payment."""
    admin = create_test_user(db_session, "admin_refund@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_refund@example.com")
    product = create_test_product(db_session, "prod-ref-1", "Copper Rod", "copper-rod")
    order = create_test_order(db_session, customer, product)

    # Create & verify payment
    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]
    client.post(
        f"/api/v1/payments/{payment_id}/submit-upi",
        json={"utr_reference": "UTR_TO_REFUND"},
        headers=auth_header_for_user(customer),
    )
    client.post(
        f"/api/v1/admin/payments/{payment_id}/verify",
        json={"notes": "Approved initially"},
        headers=auth_header_for_user(admin),
    )

    # Issue refund
    refund_res = client.post(
        f"/api/v1/admin/payments/{payment_id}/refund",
        json={"reason": "Customer requested order cancellation before dispatch"},
        headers=auth_header_for_user(admin),
    )
    assert refund_res.status_code == 200
    assert refund_res.json()["payment_status"] == "refunded"

    db_session.refresh(order)
    assert order.payment_status == "refunded"


def test_inventory_safety_no_double_deduction(client: TestClient, db_session: Session):
    """Ensure stock levels are untouched by payment transitions."""
    admin = create_test_user(db_session, "admin_stock@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_stock@example.com")
    product = create_test_product(db_session, "prod-stock-1", "Safety Helmets", "helmets", stock=50)
    order = create_test_order(db_session, customer, product, quantity=5)

    inv_before = db_session.query(Inventory).filter(Inventory.product_id == product.id).first()
    stock_before = inv_before.quantity

    # Perform full payment lifecycle
    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]
    client.post(
        f"/api/v1/payments/{payment_id}/submit-upi",
        json={"utr_reference": "UTR_STOCK_TEST"},
        headers=auth_header_for_user(customer),
    )
    client.post(
        f"/api/v1/admin/payments/{payment_id}/verify",
        json={"notes": "Stock safety test"},
        headers=auth_header_for_user(admin),
    )

    inv_after = db_session.query(Inventory).filter(Inventory.product_id == product.id).first()
    assert inv_after.quantity == stock_before, "Payment verification must NOT decrement inventory!"


def test_admin_list_payments_and_filtering(client: TestClient, db_session: Session):
    """Admin can list and filter payment records."""
    admin = create_test_user(db_session, "admin_list@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_list@example.com")
    product = create_test_product(db_session, "prod-list-1", "Electrical Cable", "cable")
    order = create_test_order(db_session, customer, product)

    client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )

    list_res = client.get(
        "/api/v1/admin/payments?status=pending",
        headers=auth_header_for_user(admin),
    )
    assert list_res.status_code == 200
    data = list_res.json()
    assert "payments" in data
    assert "total" in data
    assert data["total"] >= 1


def test_admin_payment_metrics(client: TestClient, db_session: Session):
    """Admin can retrieve aggregated payment metrics."""
    admin = create_test_user(db_session, "admin_metrics@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_metrics@example.com")
    product = create_test_product(db_session, "prod-met-1", "Water Pipe", "water-pipe")
    order = create_test_order(db_session, customer, product)

    client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )

    metrics_res = client.get(
        "/api/v1/admin/payments/metrics",
        headers=auth_header_for_user(admin),
    )
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert "pending_verification" in metrics
    assert "verified_today" in metrics
    assert "failed_payments" in metrics
    assert "total_payments" in metrics


def test_reconciliation_detects_and_resolves_mismatches(client: TestClient, db_session: Session):
    """PaymentReconciliationService detects mismatch between Payment and Order, and resolves it."""
    admin = create_test_user(db_session, "admin_recon@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_recon@example.com")
    product = create_test_product(db_session, "prod-recon-1", "Grout", "grout")
    order = create_test_order(db_session, customer, product)

    # Create payment and manually simulate an out-of-sync state
    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]

    # Set payment to VERIFIED directly in DB without updating order
    payment = db_session.query(Payment).filter(Payment.id == payment_id).first()
    payment.payment_status = PaymentStatus.VERIFIED.value
    order.payment_status = "pending"
    db_session.commit()

    # Check reconciliation detection
    recon_res = client.get(
        "/api/v1/admin/payments/reconciliation",
        headers=auth_header_for_user(admin),
    )
    assert recon_res.status_code == 200
    discrepancies = recon_res.json()
    assert len(discrepancies) >= 1
    assert any(d["payment_id"] == payment_id for d in discrepancies)

    # Reconcile payment
    sync_res = client.post(
        f"/api/v1/admin/payments/{payment_id}/reconcile",
        headers=auth_header_for_user(admin),
    )
    assert sync_res.status_code == 200
    assert sync_res.json()["reconciled"] is True

    # Order should now be synced to paid
    db_session.refresh(order)
    assert order.payment_status == "paid"


def test_customer_get_order_payment(client: TestClient, db_session: Session):
    """Customer can fetch payment information for their order."""
    customer = create_test_user(db_session, "cust_fetch_pay@example.com")
    product = create_test_product(db_session, "prod-fetch-1", "Putty", "putty")
    order = create_test_order(db_session, customer, product)

    client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )

    fetch_res = client.get(
        f"/api/v1/payments/order/{order.id}",
        headers=auth_header_for_user(customer),
    )
    assert fetch_res.status_code == 200
    data = fetch_res.json()
    assert data["order_id"] == order.id
    assert data["payment_method"] == "upi"


def test_unauthorized_staff_cannot_verify_payment(client: TestClient, db_session: Session):
    """Staff user without PAYMENTS_VERIFY permission cannot verify a payment."""
    unauth_staff = create_test_user(db_session, "viewer_staff@example.com", role=UserRole.CUSTOMER)
    customer = create_test_user(db_session, "cust_rbac@example.com")
    product = create_test_product(db_session, "prod-rbac-1", "Granite", "granite")
    order = create_test_order(db_session, customer, product)

    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]
    client.post(
        f"/api/v1/payments/{payment_id}/submit-upi",
        json={"utr_reference": "UTR_RBAC_CHECK"},
        headers=auth_header_for_user(customer),
    )

    verify_res = client.post(
        f"/api/v1/admin/payments/{payment_id}/verify",
        json={"notes": "Attempt without permission"},
        headers=auth_header_for_user(unauth_staff),
    )
    assert verify_res.status_code == 403


def test_customer_cannot_cancel_verified_payment(client: TestClient, db_session: Session):
    """Customer cannot cancel a verified payment."""
    admin = create_test_user(db_session, "admin_cancel_ver@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_cancel_ver@example.com")
    product = create_test_product(db_session, "prod-canc-ver-1", "Marble", "marble")
    order = create_test_order(db_session, customer, product)

    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]
    client.post(
        f"/api/v1/payments/{payment_id}/submit-upi",
        json={"utr_reference": "UTR_CANNOT_CANCEL"},
        headers=auth_header_for_user(customer),
    )
    client.post(
        f"/api/v1/admin/payments/{payment_id}/verify",
        json={"notes": "Verified"},
        headers=auth_header_for_user(admin),
    )

    cancel_res = client.post(
        f"/api/v1/payments/{payment_id}/cancel",
        json={"reason": "Trying to cancel verified"},
        headers=auth_header_for_user(customer),
    )
    assert cancel_res.status_code == 400
    assert "cannot cancel a verified payment" in cancel_res.json()["detail"].lower()


def test_admin_refund_custom_amount(client: TestClient, db_session: Session):
    """Admin can issue partial or custom amount refund."""
    admin = create_test_user(db_session, "admin_pref@example.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_pref@example.com")
    product = create_test_product(db_session, "prod-pref-1", "Basalt", "basalt")
    order = create_test_order(db_session, customer, product)

    p_res = client.post(
        "/api/v1/payments/create",
        json={"order_id": order.id, "payment_method": "upi"},
        headers=auth_header_for_user(customer),
    )
    payment_id = p_res.json()["id"]
    client.post(
        f"/api/v1/payments/{payment_id}/submit-upi",
        json={"utr_reference": "UTR_CUSTOM_REFUND"},
        headers=auth_header_for_user(customer),
    )
    client.post(
        f"/api/v1/admin/payments/{payment_id}/verify",
        json={"notes": "Verified"},
        headers=auth_header_for_user(admin),
    )

    refund_res = client.post(
        f"/api/v1/admin/payments/{payment_id}/refund",
        json={"reason": "Damaged goods return", "amount": 200.00},
        headers=auth_header_for_user(admin),
    )
    assert refund_res.status_code == 200
    data = refund_res.json()
    assert data["payment_status"] == "refunded"

    # Check event metadata has refund_amount
    events = db_session.query(PaymentEvent).filter(PaymentEvent.payment_id == payment_id).all()
    refund_event = next(e for e in events if e.event_type == PaymentEventType.PAYMENT_REFUNDED.value)
    assert float(refund_event.metadata_payload.get("refund_amount")) == 200.00
