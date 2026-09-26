import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.user import User, AccountType, UserRole
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentStatus


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
    price: Decimal = Decimal("400.00"),
    mrp: Decimal = Decimal("450.00"),
    stock: int = 50,
    is_active: bool = True,
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
        is_active=is_active,
    )
    db.add(prod)
    db.flush()

    inv = Inventory(
        product_id=prod.id,
        quantity=stock,
        reserved_quantity=0,
        low_stock_threshold=5,
    )
    db.add(inv)
    db.commit()
    db.refresh(prod)
    return prod


SAMPLE_DELIVERY_PAYLOAD = {
    "full_name": "Ramesh Patil",
    "phone": "+91 98765 43210",
    "address_line1": "Plot 42, Green Valley Enclave",
    "address_line2": "Gate #3",
    "city": "Pune",
    "district": "Pune",
    "state": "Maharashtra",
    "pincode": "411045",
    "is_construction_site": True,
    "site_name": "Green Villa Site #42",
    "site_type": "Residential Villa",
    "delivery_preference": "10-Wheeler Tipper",
    "site_contact_person": "Vikram Shinde",
    "site_phone": "+91 98230 11223",
    "delivery_instructions": "Enter via North Commercial Gate.",
}


# ============================================================================
# 1. AUTHENTICATION & ACCESS CONTROL
# ============================================================================

def test_unauthenticated_checkout_rejected(client: TestClient, db_session: Session):
    response = client.post("/api/v1/orders/checkout", json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD})
    assert response.status_code == 401


def test_empty_cart_checkout_rejected(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "empty_cart@hepna.com")
    headers = auth_header_for_user(user)

    response = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


# ============================================================================
# 2. SUCCESSFUL CHECKOUT & INVENTORY DEDUCTION
# ============================================================================

def test_successful_checkout_and_inventory_decrement(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "buyer@hepna.com", first_name="Ramesh", last_name="Patil")
    headers = auth_header_for_user(user)

    p1 = create_test_product(db_session, "prod-cement", "UltraTech OPC 53", "ultratech-opc-53", price=Decimal("380.00"), stock=100)
    p2 = create_test_product(db_session, "prod-steel", "Tata Tiscon 12mm", "tata-tiscon-12mm", price=Decimal("520.00"), stock=50)

    # Add items to cart: 10 bags cement (3800), 5 steel rods (2600) -> subtotal = 6400 (> 5000 free delivery)
    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p1.id, "quantity": 10})
    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p2.id, "quantity": 5})

    # Checkout
    checkout_payload = {
        "delivery_address": SAMPLE_DELIVERY_PAYLOAD,
        "payment_method": "online",
        "project_name": "Green Villa Construction",
    }
    response = client.post("/api/v1/orders/checkout", headers=headers, json=checkout_payload)
    assert response.status_code == 201
    data = response.json()

    assert data["order_number"].startswith("HEP-")
    assert data["status"] == "confirmed"
    assert data["payment_status"] == "pending"
    assert Decimal(str(data["subtotal"])) == Decimal("6400.00")
    # Tax: 6400 * 0.18 = 1152.00
    assert Decimal(str(data["tax_amount"])) == Decimal("1152.00")
    # Subtotal > 5000 -> Free delivery
    assert Decimal(str(data["delivery_charge"])) == Decimal("0.00")
    # Total = 6400 + 1152 = 7552.00
    assert Decimal(str(data["total_amount"])) == Decimal("7552.00")
    assert len(data["items"]) == 2

    # Check inventory was decremented
    inv1 = db_session.query(Inventory).filter_by(product_id=p1.id).first()
    inv2 = db_session.query(Inventory).filter_by(product_id=p2.id).first()
    assert inv1.available_quantity == 90  # 100 - 10
    assert inv2.available_quantity == 45  # 50 - 5

    # Check cart was cleared
    cart_res = client.get("/api/v1/cart", headers=headers)
    assert cart_res.status_code == 200
    assert len(cart_res.json()["items"]) == 0


def test_delivery_fee_below_free_threshold(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "small_order@hepna.com")
    headers = auth_header_for_user(user)

    p = create_test_product(db_session, "prod-small", "Small Material", "small-mat", price=Decimal("1000.00"), stock=20)

    # 2 units = 2000 subtotal (< 5000 -> 199 delivery)
    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p.id, "quantity": 2})

    response = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD, "payment_method": "cod"},
    )
    assert response.status_code == 201
    data = response.json()
    assert Decimal(str(data["subtotal"])) == Decimal("2000.00")
    assert Decimal(str(data["tax_amount"])) == Decimal("360.00")  # 2000 * 0.18
    assert Decimal(str(data["delivery_charge"])) == Decimal("199.00")
    assert Decimal(str(data["total_amount"])) == Decimal("2559.00")  # 2000 + 360 + 199
    assert data["payment_method"] == "cod"


# ============================================================================
# 3. STOCK CHECKS & ATOMIC TRANSACTION SAFETY
# ============================================================================

def test_insufficient_stock_prevents_checkout(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "overbuy@hepna.com")
    headers = auth_header_for_user(user)

    p = create_test_product(db_session, "prod-scarce", "Scarce Material", "scarce-mat", price=Decimal("500.00"), stock=3)

    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p.id, "quantity": 3})

    # Manually reduce stock before checkout to simulate race condition
    inv = db_session.query(Inventory).filter_by(product_id=p.id).first()
    inv.quantity = 1
    db_session.commit()

    response = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
    )
    assert response.status_code == 400
    assert "insufficient inventory" in response.json()["detail"].lower()

    # Verify inventory is not modified
    db_session.refresh(inv)
    assert inv.available_quantity == 1

    # Verify no order was created
    assert db_session.query(Order).count() == 0


def test_inactive_product_rejected(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "inactive_test@hepna.com")
    headers = auth_header_for_user(user)

    p = create_test_product(db_session, "prod-inactive", "Inactive Tile", "inactive-tile", price=Decimal("300.00"), stock=50, is_active=False)

    # Attempt checkout directly specifying inactive product
    response = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={
            "items": [{"product_id": p.id, "quantity": 5}],
            "delivery_address": SAMPLE_DELIVERY_PAYLOAD,
        },
    )
    assert response.status_code == 400


# ============================================================================
# 4. PARTIAL CHECKOUT (UNPURCHASED CART ITEMS REMAIN)
# ============================================================================

def test_partial_cart_checkout_leaves_unpurchased_items(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "partial_buyer@hepna.com")
    headers = auth_header_for_user(user)

    p1 = create_test_product(db_session, "p-item1", "Item 1", "p-item1", price=Decimal("200.00"), stock=50)
    p2 = create_test_product(db_session, "p-item2", "Item 2", "p-item2", price=Decimal("300.00"), stock=50)

    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p1.id, "quantity": 2})
    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p2.id, "quantity": 1})

    # Checkout ONLY item 1
    response = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={
            "items": [{"product_id": p1.id, "quantity": 2}],
            "delivery_address": SAMPLE_DELIVERY_PAYLOAD,
        },
    )
    assert response.status_code == 201

    # Verify item 2 is STILL in cart
    cart_res = client.get("/api/v1/cart", headers=headers)
    items = cart_res.json()["items"]
    assert len(items) == 1
    assert items[0]["product_id"] == p2.id


# ============================================================================
# 5. CUSTOMER ORDER RETRIEVAL & ISOLATION
# ============================================================================

def test_customer_can_list_and_view_own_order(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "owner@hepna.com")
    headers = auth_header_for_user(user)

    p = create_test_product(db_session, "prod-bricks", "AAC Blocks", "aac-blocks", price=Decimal("60.00"), stock=500)
    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p.id, "quantity": 100})

    co_res = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
    )
    order_id = co_res.json()["id"]

    # List orders
    list_res = client.get("/api/v1/orders", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["total_count"] == 1
    assert list_res.json()["orders"][0]["id"] == order_id

    # Get single order
    get_res = client.get(f"/api/v1/orders/{order_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == order_id
    assert len(get_res.json()["status_history"]) >= 1


def test_customer_cannot_view_or_cancel_another_customers_order(client: TestClient, db_session: Session):
    user_a = create_test_user(db_session, "usera@hepna.com")
    user_b = create_test_user(db_session, "userb@hepna.com")

    headers_a = auth_header_for_user(user_a)
    headers_b = auth_header_for_user(user_b)

    p = create_test_product(db_session, "p-iso", "Pipe", "p-pipe", price=Decimal("150.00"), stock=100)
    client.post("/api/v1/cart/items", headers=headers_a, json={"product_id": p.id, "quantity": 5})

    co_res = client.post(
        "/api/v1/orders/checkout",
        headers=headers_a,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
    )
    order_a_id = co_res.json()["id"]

    # User B tries to view User A's order -> 403
    view_res = client.get(f"/api/v1/orders/{order_a_id}", headers=headers_b)
    assert view_res.status_code == 403

    # User B tries to cancel User A's order -> 403
    cancel_res = client.post(
        f"/api/v1/orders/{order_a_id}/cancel",
        headers=headers_b,
        json={"reason": "Malicious cancellation attempt"},
    )
    assert cancel_res.status_code == 403


# ============================================================================
# 6. ORDER CANCELLATION & STOCK RESTORATION
# ============================================================================

def test_order_cancellation_restores_inventory(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "canceller@hepna.com")
    headers = auth_header_for_user(user)

    p = create_test_product(db_session, "p-cancel", "Paint 20L", "paint-20l", price=Decimal("2500.00"), stock=10)
    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p.id, "quantity": 4})

    co_res = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
    )
    order_id = co_res.json()["id"]

    # Inventory was 10 - 4 = 6
    inv = db_session.query(Inventory).filter_by(product_id=p.id).first()
    assert inv.available_quantity == 6

    # Cancel order
    cancel_res = client.post(
        f"/api/v1/orders/{order_id}/cancel",
        headers=headers,
        json={"reason": "Project timeline delayed by architect"},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Verify inventory is restored to 10
    db_session.refresh(inv)
    assert inv.available_quantity == 10


def test_cannot_cancel_shipped_or_delivered_order(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "shipped_test@hepna.com")
    headers = auth_header_for_user(user)

    p = create_test_product(db_session, "p-ship", "Plaster", "p-plaster", price=Decimal("400.00"), stock=20)
    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p.id, "quantity": 2})

    co_res = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
    )
    order_id = co_res.json()["id"]

    # Manually set order to shipped
    order = db_session.query(Order).filter_by(id=order_id).first()
    order.status = "shipped"
    db_session.commit()

    cancel_res = client.post(
        f"/api/v1/orders/{order_id}/cancel",
        headers=headers,
        json={"reason": "Too late to cancel"},
    )
    assert cancel_res.status_code == 400
    assert "cannot be cancelled" in cancel_res.json()["detail"].lower()


# ============================================================================
# 7. REORDER FUNCTIONALITY
# ============================================================================

def test_reorder_uses_current_price_and_availability(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "reorder_user@hepna.com")
    headers = auth_header_for_user(user)

    p = create_test_product(db_session, "p-reorder", "Tiles Box", "tiles-box", price=Decimal("450.00"), stock=20)
    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p.id, "quantity": 5})

    co_res = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
    )
    order_id = co_res.json()["id"]

    # Change product price in catalog to 500.00
    p.price = Decimal("500.00")
    db_session.commit()

    # Reorder
    reorder_res = client.post(f"/api/v1/orders/{order_id}/reorder", headers=headers)
    assert reorder_res.status_code == 200
    assert reorder_res.json()["added_count"] == 1

    # Verify cart has the item with CURRENT price
    cart_res = client.get("/api/v1/cart", headers=headers)
    items = cart_res.json()["items"]
    assert len(items) == 1
    assert Decimal(str(items[0]["product"]["price"])) == Decimal("500.00")


# ============================================================================
# 8. STAFF / ADMIN RBAC & ORDER STATUS LIFECYCLE
# ============================================================================

def test_admin_list_and_update_order_status(client: TestClient, db_session: Session):
    customer = create_test_user(db_session, "cust_rbac@hepna.com")
    admin = create_test_user(db_session, "admin_user@hepna.com", role=UserRole.ADMIN)

    cust_headers = auth_header_for_user(customer)
    admin_headers = auth_header_for_user(admin)

    p = create_test_product(db_session, "p-admin", "Gravel Sand", "gravel-sand", price=Decimal("1200.00"), stock=30)
    client.post("/api/v1/cart/items", headers=cust_headers, json={"product_id": p.id, "quantity": 3})

    co_res = client.post(
        "/api/v1/orders/checkout",
        headers=cust_headers,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
    )
    order_id = co_res.json()["id"]

    # Customer cannot access admin endpoint
    forbidden_res = client.get("/api/v1/admin/orders", headers=cust_headers)
    assert forbidden_res.status_code == 403

    # Admin lists orders
    admin_list = client.get("/api/v1/admin/orders", headers=admin_headers)
    assert admin_list.status_code == 200
    assert admin_list.json()["total_count"] >= 1

    # Admin advances status: confirmed -> processing -> packed -> shipped -> out-for-delivery -> delivered
    for next_st in ["processing", "packed", "shipped", "out-for-delivery", "delivered"]:
        status_res = client.patch(
            f"/api/v1/admin/orders/{order_id}/status",
            headers=admin_headers,
            json={"status": next_st},
        )
        assert status_res.status_code == 200
        assert status_res.json()["status"] == next_st

    # Check status history records
    detail_res = client.get(f"/api/v1/admin/orders/{order_id}", headers=admin_headers)
    history = detail_res.json()["status_history"]
    assert len(history) == 6  # 1 initial confirmed + 5 transitions


def test_invalid_status_transition_rejected(client: TestClient, db_session: Session):
    admin = create_test_user(db_session, "admin_trans@hepna.com", role=UserRole.ADMIN)
    admin_headers = auth_header_for_user(admin)

    customer = create_test_user(db_session, "cust_trans@hepna.com")
    cust_headers = auth_header_for_user(customer)

    p = create_test_product(db_session, "p-trans", "Timber", "timber-mat", price=Decimal("600.00"), stock=20)
    client.post("/api/v1/cart/items", headers=cust_headers, json={"product_id": p.id, "quantity": 1})

    co_res = client.post(
        "/api/v1/orders/checkout",
        headers=cust_headers,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
    )
    order_id = co_res.json()["id"]

    # Confirmed directly to delivered is invalid
    invalid_res = client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=admin_headers,
        json={"status": "delivered"},
    )
    assert invalid_res.status_code == 400
    assert "invalid status transition" in invalid_res.json()["detail"].lower()


# ============================================================================
# 9. HISTORICAL SNAPSHOTS & ADVANCED VERIFICATIONS
# ============================================================================

def test_order_historical_snapshot_preserved_after_product_update(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "snapshot_tester@hepna.com")
    headers = auth_header_for_user(user)

    p = create_test_product(db_session, "p-snap", "Original Cement 50kg", "orig-cement", price=Decimal("350.00"), stock=50)
    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p.id, "quantity": 4})

    co_res = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
    )
    order_id = co_res.json()["id"]

    # Now modify product name and price in the catalog database
    p.name = "Renamed Premium Cement 50kg v2"
    p.price = Decimal("480.00")
    db_session.commit()

    # Retrieve historical order
    order_res = client.get(f"/api/v1/orders/{order_id}", headers=headers)
    assert order_res.status_code == 200
    item = order_res.json()["items"][0]

    # Historical name and price MUST remain identical to order time
    assert item["product_name"] == "Original Cement 50kg"
    assert Decimal(str(item["unit_price"])) == Decimal("350.00")
    assert Decimal(str(item["subtotal"])) == Decimal("1400.00")


def test_order_number_uniqueness_and_format(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "uniq_orders@hepna.com")
    headers = auth_header_for_user(user)

    p = create_test_product(db_session, "p-uniq", "Bulk Wire", "bulk-wire", price=Decimal("100.00"), stock=1000)

    order_numbers = set()
    for _ in range(5):
        client.post("/api/v1/cart/items", headers=headers, json={"product_id": p.id, "quantity": 2})
        res = client.post(
            "/api/v1/orders/checkout",
            headers=headers,
            json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
        )
        assert res.status_code == 201
        num = res.json()["order_number"]
        assert num.startswith("HEP-")
        assert num not in order_numbers
        order_numbers.add(num)

    assert len(order_numbers) == 5


def test_delivery_snapshot_preservation(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "site_snap@hepna.com")
    headers = auth_header_for_user(user)

    p = create_test_product(db_session, "p-site-snap", "Ready Mix Concrete", "rmc-concrete", price=Decimal("4500.00"), stock=20)
    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p.id, "quantity": 2})

    custom_delivery = {
        **SAMPLE_DELIVERY_PAYLOAD,
        "site_name": "Apex Commercial Phase 2",
        "vehicle_access": "Transit Mixer Permitted",
        "access_road": "18m Tar Highway Access",
        "delivery_instructions": "Gate pass #89 required at entry.",
    }

    co_res = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={
            "delivery_address": custom_delivery,
            "project_name": "Apex Commercial Towers",
            "notes": "Urgent morning delivery required before slab casting.",
        },
    )
    assert co_res.status_code == 201
    order_data = co_res.json()

    assert order_data["project_name"] == "Apex Commercial Towers"
    assert order_data["notes"] == "Urgent morning delivery required before slab casting."
    assert order_data["delivery_address"]["site_name"] == "Apex Commercial Phase 2"
    assert order_data["delivery_address"]["vehicle_access"] == "Transit Mixer Permitted"
    assert order_data["delivery_address"]["delivery_instructions"] == "Gate pass #89 required at entry."


def test_admin_order_search_filtering(client: TestClient, db_session: Session):
    admin = create_test_user(db_session, "search_admin@hepna.com", role=UserRole.ADMIN)
    admin_headers = auth_header_for_user(admin)

    cust1 = create_test_user(db_session, "mahesh@patilinfra.com", first_name="Mahesh", last_name="Patil")
    cust2 = create_test_user(db_session, "suresh@shindeconst.com", first_name="Suresh", last_name="Shinde")

    p = create_test_product(db_session, "p-search", "River Sand", "river-sand", price=Decimal("1500.00"), stock=100)

    # Order 1 by Mahesh
    client.post("/api/v1/cart/items", headers=auth_header_for_user(cust1), json={"product_id": p.id, "quantity": 2})
    res1 = client.post(
        "/api/v1/orders/checkout",
        headers=auth_header_for_user(cust1),
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD, "project_name": "Patil Horizon Project"},
    )
    order1_num = res1.json()["order_number"]

    # Order 2 by Suresh
    client.post("/api/v1/cart/items", headers=auth_header_for_user(cust2), json={"product_id": p.id, "quantity": 1})
    res2 = client.post(
        "/api/v1/orders/checkout",
        headers=auth_header_for_user(cust2),
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD, "project_name": "Shinde Industrial Warehouse"},
    )
    order2_num = res2.json()["order_number"]

    # Search by Mahesh
    search_res = client.get("/api/v1/admin/orders?search=Mahesh", headers=admin_headers)
    assert search_res.status_code == 200
    orders = search_res.json()["orders"]
    assert any(o["order_number"] == order1_num for o in orders)
    assert not any(o["order_number"] == order2_num for o in orders)

    # Search by project name
    search_proj = client.get("/api/v1/admin/orders?search=Shinde Industrial", headers=admin_headers)
    assert search_proj.status_code == 200
    orders_proj = search_proj.json()["orders"]
    assert any(o["order_number"] == order2_num for o in orders_proj)


def test_reorder_skips_out_of_stock_products(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "oos_reorder@hepna.com")
    headers = auth_header_for_user(user)

    p1 = create_test_product(db_session, "p-re1", "In Stock Item", "p-re1", price=Decimal("100.00"), stock=10)
    p2 = create_test_product(db_session, "p-re2", "Soon Out of Stock", "p-re2", price=Decimal("200.00"), stock=5)

    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p1.id, "quantity": 2})
    client.post("/api/v1/cart/items", headers=headers, json={"product_id": p2.id, "quantity": 3})

    co_res = client.post(
        "/api/v1/orders/checkout",
        headers=headers,
        json={"delivery_address": SAMPLE_DELIVERY_PAYLOAD},
    )
    order_id = co_res.json()["id"]

    # Make p2 out of stock
    inv2 = db_session.query(Inventory).filter_by(product_id=p2.id).first()
    inv2.quantity = 0
    db_session.commit()

    # Reorder
    reorder_res = client.post(f"/api/v1/orders/{order_id}/reorder", headers=headers)
    assert reorder_res.status_code == 200
    data = reorder_res.json()
    assert data["added_count"] == 1
    assert "Soon Out of Stock" in data["unavailable_items"]
