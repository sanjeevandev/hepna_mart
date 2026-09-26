import pytest
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.user import User, AccountType, UserRole
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.order import Order, OrderItem, OrderStatus
from app.models.wholesale import RFQ, RFQItem, RFQStatusHistory, Quote, QuoteItem, RFQStatus, QuoteStatus


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
        account_type=AccountType.CONTRACTOR if role == UserRole.CUSTOMER else AccountType.BUSINESS,
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
    price: Decimal = Decimal("400.00"),
    mrp: Decimal = Decimal("450.00"),
    stock: int = 500,
) -> Product:
    cat = db.query(Category).first()
    if not cat:
        cat = Category(id="cat-default", name="Building Materials", slug="building-materials", is_active=True)
        db.add(cat)
        db.flush()

    prod = Product(
        id=product_id,
        name=name,
        slug=slug,
        brand="UltraTech",
        category_id=cat.id,
        subcategory="Cement",
        description="Premium grade cement",
        images=["/images/prod1.jpg"],
        price=price,
        mrp=mrp,
        unit="bag",
        is_active=True,
    )
    db.add(prod)
    db.flush()

    inv = Inventory(
        product_id=prod.id,
        quantity=stock,
        reserved_quantity=0,
        low_stock_threshold=10,
    )
    db.add(inv)
    db.commit()
    db.refresh(prod)
    return prod


SAMPLE_RFQ_DELIVERY = {
    "full_name": "Rohan Sharma",
    "phone": "+91 98765 43210",
    "address_line1": "Plot 104, Industrial Hub Phase 2",
    "address_line2": "Near Toll Plaza",
    "city": "Pune",
    "district": "Pune",
    "state": "Maharashtra",
    "pincode": "411057",
    "is_construction_site": True,
    "site_name": "Skyline Commercial Towers",
    "site_type": "Commercial",
    "delivery_preference": "Heavy Trailer (22-Wheel)",
    "site_contact_person": "Kishore Kulkarni",
    "site_phone": "+91 98220 54321",
    "access_road": "24m Concrete Highway Access",
    "vehicle_access": "All-axle articulated trailers permitted",
    "delivery_instructions": "Gate pass #104 mandatory. Offloading crane on site.",
}


# ============================================================================
# 1. RFQ CREATION & VALIDATION
# ============================================================================

def test_unauthenticated_rfq_creation_rejected(client: TestClient, db_session: Session):
    response = client.post(
        "/api/v1/rfqs",
        json={"items": [{"product_name": "Cement", "requested_quantity": 100}], "delivery_address": SAMPLE_RFQ_DELIVERY},
    )
    assert response.status_code == 401


def test_empty_items_rfq_rejected(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "contractor1@hepna.com")
    headers = auth_header_for_user(user)

    response = client.post(
        "/api/v1/rfqs",
        headers=headers,
        json={"items": [], "delivery_address": SAMPLE_RFQ_DELIVERY},
    )
    assert response.status_code == 422


def test_successful_rfq_creation_and_snapshots(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "builder_sharma@hepna.com", first_name="Rohan", last_name="Sharma")
    headers = auth_header_for_user(user)

    p1 = create_test_product(db_session, "p-cem-53", "UltraTech 53 OPC", "ultratech-53-opc", price=Decimal("380.00"), stock=1000)
    p2 = create_test_product(db_session, "p-steel-12", "Tata Tiscon 12mm", "tata-tiscon-12mm", price=Decimal("520.00"), stock=500)

    payload = {
        "project_name": "Skyline Commercial Towers",
        "project_type": "Commercial",
        "required_by_date": "2026-10-15",
        "gstin": "27AAACH7409R1ZZ",
        "notes": "Direct mill delivery required.",
        "delivery_address": SAMPLE_RFQ_DELIVERY,
        "items": [
            {
                "product_id": p1.id,
                "product_name": p1.name,
                "requested_quantity": 400,
                "target_unit_price": 360.00,
                "notes": "Packed in moisture-proof 50kg bags",
            },
            {
                "product_id": p2.id,
                "product_name": p2.name,
                "requested_quantity": 20,
                "target_unit_price": 500.00,
                "notes": "12m standard lengths",
            },
        ],
        "submit_now": True,
    }

    response = client.post("/api/v1/rfqs", headers=headers, json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["rfq_number"].startswith("RFQ-")
    assert data["status"] == "submitted"
    assert data["project_name"] == "Skyline Commercial Towers"
    assert data["gstin"] == "27AAACH7409R1ZZ"
    assert len(data["items"]) == 2
    assert len(data["status_history"]) == 1
    assert data["status_history"][0]["new_status"] == "submitted"

    # Verify inventory is NOT decremented upon RFQ creation
    inv1 = db_session.query(Inventory).filter_by(product_id=p1.id).first()
    assert inv1.available_quantity == 1000


# ============================================================================
# 2. CUSTOMER ISOLATION & ACCESS CONTROL
# ============================================================================

def test_customer_isolation_on_rfq_and_quotes(client: TestClient, db_session: Session):
    user_a = create_test_user(db_session, "usera_wholesale@hepna.com")
    user_b = create_test_user(db_session, "userb_wholesale@hepna.com")
    admin = create_test_user(db_session, "proc_admin@hepna.com", role=UserRole.PROCUREMENT_MANAGER)

    headers_a = auth_header_for_user(user_a)
    headers_b = auth_header_for_user(user_b)
    headers_admin = auth_header_for_user(admin)

    p = create_test_product(db_session, "p-sand", "River Sand", "river-sand", price=Decimal("1200.00"), stock=200)

    # User A creates RFQ
    rfq_res = client.post(
        "/api/v1/rfqs",
        headers=headers_a,
        json={
            "project_name": "User A Villa",
            "delivery_address": SAMPLE_RFQ_DELIVERY,
            "items": [{"product_id": p.id, "product_name": p.name, "requested_quantity": 50}],
        },
    )
    rfq_id = rfq_res.json()["id"]

    # Admin generates Quote for User A's RFQ
    quote_res = client.post(
        f"/api/v1/admin/rfqs/{rfq_id}/quotes",
        headers=headers_admin,
        json={
            "items": [
                {
                    "product_id": p.id,
                    "product_name": p.name,
                    "requested_quantity": 50,
                    "quoted_quantity": 50,
                    "quoted_unit_price": 1100.00,
                }
            ],
            "delivery_charge": 500.00,
        },
    )
    quote_id = quote_res.json()["id"]

    # User B attempts to access User A's RFQ -> 403
    res_rfq_b = client.get(f"/api/v1/rfqs/{rfq_id}", headers=headers_b)
    assert res_rfq_b.status_code == 403

    # User B attempts to access User A's Quote -> 403
    res_quote_b = client.get(f"/api/v1/quotes/{quote_id}", headers=headers_b)
    assert res_quote_b.status_code == 403

    # User B attempts to accept User A's Quote -> 403
    res_accept_b = client.post(f"/api/v1/quotes/{quote_id}/accept", headers=headers_b)
    assert res_accept_b.status_code == 403

    # User A CAN access their own RFQ and Quote
    assert client.get(f"/api/v1/rfqs/{rfq_id}", headers=headers_a).status_code == 200
    assert client.get(f"/api/v1/quotes/{quote_id}", headers=headers_a).status_code == 200


# ============================================================================
# 3. RBAC & PROCUREMENT PERMISSIONS
# ============================================================================

def test_procurement_rbac_enforcement(client: TestClient, db_session: Session):
    customer = create_test_user(db_session, "cust_rbac_rfq@hepna.com")
    procurement_mgr = create_test_user(db_session, "proc_mgr@hepna.com", role=UserRole.PROCUREMENT_MANAGER)

    headers_cust = auth_header_for_user(customer)
    headers_proc = auth_header_for_user(procurement_mgr)

    # Customer cannot access admin RFQ list
    assert client.get("/api/v1/admin/rfqs", headers=headers_cust).status_code == 403

    # Procurement manager CAN access admin RFQ list
    assert client.get("/api/v1/admin/rfqs", headers=headers_proc).status_code == 200


# ============================================================================
# 4. SERVER-SIDE QUOTE FINANCIAL CALCULATIONS
# ============================================================================

def test_quote_financial_calculations(client: TestClient, db_session: Session):
    customer = create_test_user(db_session, "cust_calc@hepna.com")
    admin = create_test_user(db_session, "admin_calc@hepna.com", role=UserRole.ADMIN)

    headers_cust = auth_header_for_user(customer)
    headers_admin = auth_header_for_user(admin)

    p1 = create_test_product(db_session, "p-blocks", "AAC Blocks 8-inch", "aac-blocks-8", price=Decimal("65.00"), stock=5000)
    p2 = create_test_product(db_session, "p-adhesive", "Block Joint Mortar", "block-joint-mortar", price=Decimal("450.00"), stock=500)

    # Customer submits RFQ: 1000 blocks and 50 bags mortar
    rfq_res = client.post(
        "/api/v1/rfqs",
        headers=headers_cust,
        json={
            "project_name": "Commercial Complex Blockwork",
            "delivery_address": SAMPLE_RFQ_DELIVERY,
            "items": [
                {"product_id": p1.id, "product_name": p1.name, "requested_quantity": 1000},
                {"product_id": p2.id, "product_name": p2.name, "requested_quantity": 50},
            ],
        },
    )
    rfq_id = rfq_res.json()["id"]

    # Admin quotes:
    # 1000 blocks @ ₹60.00 (subtotal = 60,000)
    # 50 mortar @ ₹400.00 (subtotal = 20,000)
    # Total items subtotal = 80,000
    # Discount = 2,000 -> Taxable = 78,000
    # 18% GST on 78,000 = 14,040.00
    # Delivery charge = 1,500.00
    # Total = 80,000 - 2,000 + 14,040 + 1,500 = 93,540.00
    quote_res = client.post(
        f"/api/v1/admin/rfqs/{rfq_id}/quotes",
        headers=headers_admin,
        json={
            "items": [
                {
                    "product_id": p1.id,
                    "product_name": p1.name,
                    "requested_quantity": 1000,
                    "quoted_quantity": 1000,
                    "quoted_unit_price": 60.00,
                },
                {
                    "product_id": p2.id,
                    "product_name": p2.name,
                    "requested_quantity": 50,
                    "quoted_quantity": 50,
                    "quoted_unit_price": 400.00,
                },
            ],
            "discount_amount": 2000.00,
            "delivery_charge": 1500.00,
            "send_now": True,
        },
    )
    assert quote_res.status_code == 201
    qdata = quote_res.json()

    assert Decimal(str(qdata["subtotal"])) == Decimal("80000.00")
    assert Decimal(str(qdata["discount_amount"])) == Decimal("2000.00")
    assert Decimal(str(qdata["delivery_charge"])) == Decimal("1500.00")
    assert Decimal(str(qdata["tax_amount"])) == Decimal("14400.00")  # 80,000 * 0.18 = 14400
    assert Decimal(str(qdata["total"])) == Decimal("93900.00")  # 80000 - 2000 + 14400 + 1500
    assert qdata["version"] == 1
    assert qdata["status"] == "sent"

    # Verify inventory is STILL not decremented upon quote creation
    inv1 = db_session.query(Inventory).filter_by(product_id=p1.id).first()
    assert inv1.available_quantity == 5000


# ============================================================================
# 5. QUOTATION REVISION & NEGOTIATION
# ============================================================================

def test_quote_revision_and_version_tracking(client: TestClient, db_session: Session):
    customer = create_test_user(db_session, "cust_rev@hepna.com")
    admin = create_test_user(db_session, "admin_rev@hepna.com", role=UserRole.ADMIN)

    headers_cust = auth_header_for_user(customer)
    headers_admin = auth_header_for_user(admin)

    p = create_test_product(db_session, "p-rev", "TMT 16mm Rebar", "tmt-16mm", price=Decimal("600.00"), stock=1000)

    rfq_res = client.post(
        "/api/v1/rfqs",
        headers=headers_cust,
        json={
            "project_name": "Horizon Residential Tower",
            "delivery_address": SAMPLE_RFQ_DELIVERY,
            "items": [{"product_id": p.id, "product_name": p.name, "requested_quantity": 100}],
        },
    )
    rfq_id = rfq_res.json()["id"]

    # Initial Quote (v1) @ 580.00
    q1_res = client.post(
        f"/api/v1/admin/rfqs/{rfq_id}/quotes",
        headers=headers_admin,
        json={
            "items": [
                {
                    "product_id": p.id,
                    "product_name": p.name,
                    "requested_quantity": 100,
                    "quoted_quantity": 100,
                    "quoted_unit_price": 580.00,
                }
            ],
            "send_now": True,
        },
    )
    q1_id = q1_res.json()["id"]
    assert q1_res.json()["version"] == 1

    # Customer requests revision
    rev_req = client.post(
        f"/api/v1/rfqs/{rfq_id}/request-revision",
        headers=headers_cust,
        json={"notes": "Please offer ₹550/unit for volume of 100 MT."},
    )
    assert rev_req.status_code == 200
    assert rev_req.json()["status"] == "negotiating"

    # Admin creates revision Quote (v2) @ 560.00
    q2_res = client.post(
        f"/api/v1/admin/quotes/{q1_id}/revise",
        headers=headers_admin,
        json={
            "items": [
                {
                    "product_id": p.id,
                    "product_name": p.name,
                    "requested_quantity": 100,
                    "quoted_quantity": 100,
                    "quoted_unit_price": 560.00,
                }
            ],
            "procurement_notes": "Best price offered from rolling mill.",
            "send_now": True,
        },
    )
    assert q2_res.status_code == 201
    assert q2_res.json()["version"] == 2
    assert Decimal(str(q2_res.json()["subtotal"])) == Decimal("56000.00")

    # Verify both Quote versions exist in RFQ quotes history
    quotes_list_res = client.get(f"/api/v1/rfqs/{rfq_id}/quotes", headers=headers_cust)
    assert quotes_list_res.status_code == 200
    versions = [q["version"] for q in quotes_list_res.json()]
    assert 1 in versions and 2 in versions


# ============================================================================
# 6. QUOTE ACCEPTANCE & CONVERSION TO REAL PHASE 2E ORDER
# ============================================================================

def test_quote_acceptance_creates_order_and_deducts_inventory_once(client: TestClient, db_session: Session):
    customer = create_test_user(db_session, "cust_accept@hepna.com", first_name="Vijay", last_name="Mhatre")
    admin = create_test_user(db_session, "admin_accept@hepna.com", role=UserRole.ADMIN)

    headers_cust = auth_header_for_user(customer)
    headers_admin = auth_header_for_user(admin)

    p1 = create_test_product(db_session, "p-cem-acc", "ACC Suraksha Cement", "acc-suraksha", price=Decimal("390.00"), stock=300)
    p2 = create_test_product(db_session, "p-pipe-acc", "Supreme PVC 4-inch", "supreme-pvc-4", price=Decimal("250.00"), stock=200)

    # 1. Customer creates RFQ
    rfq_res = client.post(
        "/api/v1/rfqs",
        headers=headers_cust,
        json={
            "project_name": "Mhatre Villa Project",
            "project_type": "Villa",
            "delivery_address": SAMPLE_RFQ_DELIVERY,
            "items": [
                {"product_id": p1.id, "product_name": p1.name, "requested_quantity": 100},
                {"product_id": p2.id, "product_name": p2.name, "requested_quantity": 40},
            ],
        },
    )
    rfq_id = rfq_res.json()["id"]

    # 2. Admin creates Quote:
    # 100 cement @ 370 = 37,000
    # 40 pipe @ 230 = 9,200
    # Subtotal = 46,200. Tax (18%) = 8,316. Delivery = 500. Total = 55,016.
    q_res = client.post(
        f"/api/v1/admin/rfqs/{rfq_id}/quotes",
        headers=headers_admin,
        json={
            "items": [
                {
                    "product_id": p1.id,
                    "product_name": p1.name,
                    "requested_quantity": 100,
                    "quoted_quantity": 100,
                    "quoted_unit_price": 370.00,
                },
                {
                    "product_id": p2.id,
                    "product_name": p2.name,
                    "requested_quantity": 40,
                    "quoted_quantity": 40,
                    "quoted_unit_price": 230.00,
                },
            ],
            "delivery_charge": 500.00,
            "send_now": True,
        },
    )
    quote_id = q_res.json()["id"]
    quote_number = q_res.json()["quote_number"]

    # 3. Customer accepts quote
    accept_res = client.post(
        f"/api/v1/quotes/{quote_id}/accept?payment_method=online&notes=Deliver+on+Monday+morning",
        headers=headers_cust,
    )
    assert accept_res.status_code == 200
    res_data = accept_res.json()

    assert res_data["quote"]["status"] == "accepted"
    order_data = res_data["order"]
    assert order_data["quotation_id"] == quote_number
    assert order_data["project_name"] == "Mhatre Villa Project"
    assert order_data["status"] == "confirmed"
    assert Decimal(str(order_data["subtotal"])) == Decimal("46200.00")
    assert Decimal(str(order_data["total_amount"])) == Decimal("55016.00")
    assert len(order_data["items"]) == 2

    # 4. Verify inventory is decremented EXACTLY ONCE
    inv1 = db_session.query(Inventory).filter_by(product_id=p1.id).first()
    inv2 = db_session.query(Inventory).filter_by(product_id=p2.id).first()
    assert inv1.available_quantity == 200  # 300 - 100
    assert inv2.available_quantity == 160  # 200 - 40

    # 5. Accepting an already accepted quote must be rejected
    repeat_accept = client.post(f"/api/v1/quotes/{quote_id}/accept", headers=headers_cust)
    assert repeat_accept.status_code == 400

    # Inventory remains 200 and 160 (no double deduction)
    assert inv1.available_quantity == 200
    assert inv2.available_quantity == 160


# ============================================================================
# 7. QUOTE REJECTION & EXPIRATION
# ============================================================================

def test_quote_rejection(client: TestClient, db_session: Session):
    customer = create_test_user(db_session, "cust_reject@hepna.com")
    admin = create_test_user(db_session, "admin_reject@hepna.com", role=UserRole.ADMIN)

    headers_cust = auth_header_for_user(customer)
    headers_admin = auth_header_for_user(admin)

    p = create_test_product(db_session, "p-rej", "Steel Rods", "steel-rods", price=Decimal("500.00"), stock=500)

    rfq_res = client.post(
        "/api/v1/rfqs",
        headers=headers_cust,
        json={
            "project_name": "Rejected RFQ Test",
            "delivery_address": SAMPLE_RFQ_DELIVERY,
            "items": [{"product_id": p.id, "product_name": p.name, "requested_quantity": 20}],
        },
    )
    rfq_id = rfq_res.json()["id"]

    q_res = client.post(
        f"/api/v1/admin/rfqs/{rfq_id}/quotes",
        headers=headers_admin,
        json={
            "items": [{"product_id": p.id, "product_name": p.name, "requested_quantity": 20, "quoted_quantity": 20, "quoted_unit_price": 490.00}],
            "send_now": True,
        },
    )
    quote_id = q_res.json()["id"]

    # Customer rejects quote
    rej_res = client.post(
        f"/api/v1/quotes/{quote_id}/reject",
        headers=headers_cust,
        json={"reason": "Budget constraints; client postponed construction."},
    )
    assert rej_res.status_code == 200
    assert rej_res.json()["status"] == "rejected"

    # RFQ status is also rejected
    rfq_detail = client.get(f"/api/v1/rfqs/{rfq_id}", headers=headers_cust).json()
    assert rfq_detail["status"] == "rejected"


def test_quote_expiration(client: TestClient, db_session: Session):
    customer = create_test_user(db_session, "cust_exp@hepna.com")
    admin = create_test_user(db_session, "admin_exp@hepna.com", role=UserRole.ADMIN)

    headers_cust = auth_header_for_user(customer)
    headers_admin = auth_header_for_user(admin)

    p = create_test_product(db_session, "p-exp", "Waterproofing Chemical", "waterproof-chem", price=Decimal("1500.00"), stock=100)

    rfq_res = client.post(
        "/api/v1/rfqs",
        headers=headers_cust,
        json={
            "project_name": "Basement Waterproofing",
            "delivery_address": SAMPLE_RFQ_DELIVERY,
            "items": [{"product_id": p.id, "product_name": p.name, "requested_quantity": 10}],
        },
    )
    rfq_id = rfq_res.json()["id"]

    q_res = client.post(
        f"/api/v1/admin/rfqs/{rfq_id}/quotes",
        headers=headers_admin,
        json={
            "items": [{"product_id": p.id, "product_name": p.name, "requested_quantity": 10, "quoted_quantity": 10, "quoted_unit_price": 1400.00}],
            "send_now": True,
        },
    )
    quote_id = q_res.json()["id"]

    # Admin expires quote
    exp_res = client.post(f"/api/v1/admin/quotes/{quote_id}/expire", headers=headers_admin)
    assert exp_res.status_code == 200
    assert exp_res.json()["status"] == "expired"

    # Expired quote cannot be accepted
    accept_exp = client.post(f"/api/v1/quotes/{quote_id}/accept", headers=headers_cust)
    assert accept_exp.status_code == 400


# ============================================================================
# 8. RFQ CANCELLATION & STATE TRANSITIONS
# ============================================================================

def test_rfq_cancellation(client: TestClient, db_session: Session):
    customer = create_test_user(db_session, "cust_cancel_rfq@hepna.com")
    headers_cust = auth_header_for_user(customer)

    p = create_test_product(db_session, "p-canc", "Gravel Sand", "gravel-sand", price=Decimal("1200.00"), stock=500)

    rfq_res = client.post(
        "/api/v1/rfqs",
        headers=headers_cust,
        json={
            "project_name": "Cancelled Project",
            "delivery_address": SAMPLE_RFQ_DELIVERY,
            "items": [{"product_id": p.id, "product_name": p.name, "requested_quantity": 50}],
        },
    )
    rfq_id = rfq_res.json()["id"]

    canc_res = client.post(f"/api/v1/rfqs/{rfq_id}/cancel?reason=Client+cancelled+contract", headers=headers_cust)
    assert canc_res.status_code == 200
    assert canc_res.json()["status"] == "cancelled"


def test_invalid_rfq_transition_rejected(client: TestClient, db_session: Session):
    admin = create_test_user(db_session, "admin_trans_rfq@hepna.com", role=UserRole.ADMIN)
    customer = create_test_user(db_session, "cust_trans_rfq@hepna.com")

    headers_admin = auth_header_for_user(admin)
    headers_cust = auth_header_for_user(customer)

    p = create_test_product(db_session, "p-trans-rfq", "River Sand", "river-sand-trans", price=Decimal("1000.00"), stock=500)

    rfq_res = client.post(
        "/api/v1/rfqs",
        headers=headers_cust,
        json={
            "project_name": "Transition Test",
            "delivery_address": SAMPLE_RFQ_DELIVERY,
            "items": [{"product_id": p.id, "product_name": p.name, "requested_quantity": 20}],
        },
    )
    rfq_id = rfq_res.json()["id"]

    # Submitted directly to Accepted is invalid
    invalid_patch = client.patch(
        f"/api/v1/admin/rfqs/{rfq_id}/status",
        headers=headers_admin,
        json={"status": "accepted"},
    )
    assert invalid_patch.status_code == 400
    assert "invalid rfq status transition" in invalid_patch.json()["detail"].lower()
