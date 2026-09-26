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
from app.models.wishlist import Wishlist, WishlistItem


def create_test_user(db: Session, email: str, role: UserRole = UserRole.CUSTOMER) -> User:
    user = User(
        email=email,
        password_hash=hash_password("ValidPassword123!"),
        first_name="Test",
        last_name="Customer",
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
    price: Decimal = Decimal("390.00"),
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
        price=price,
        mrp=price + Decimal("50.00"),
        discount_percent=10,
        unit="Bag",
        is_active=is_active,
    )
    db.add(prod)
    db.flush()

    inv = Inventory(
        product_id=prod.id,
        quantity=stock,
        warehouse="MAIN",
    )
    db.add(inv)
    db.commit()
    db.refresh(prod)
    return prod


# =========================================================================
# 1. CART TESTS (01 - 11)
# =========================================================================

def test_01_authenticated_user_can_create_and_get_empty_cart(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "cust1@hepnamart.com")
    headers = auth_header_for_user(user)

    res = client.get("/api/v1/cart", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == user.id
    assert data["items"] == []
    assert data["total_items"] == 0
    assert data["subtotal"] == 0.0
    assert data["total"] == 0.0


def test_02_unauthenticated_cart_request_returns_401(client: TestClient):
    res = client.get("/api/v1/cart")
    assert res.status_code == 401


def test_03_add_product_to_cart(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "cust3@hepnamart.com")
    prod = create_test_product(db_session, "prod-c1", "OPC 53 Cement", "opc-53-cement", price=Decimal("380.00"), stock=100)
    headers = auth_header_for_user(user)

    payload = {"product_id": prod.id, "quantity": 5}
    res = client.post("/api/v1/cart/items", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["total_items"] == 5
    assert data["items"][0]["product_id"] == prod.id
    assert data["items"][0]["quantity"] == 5
    assert data["items"][0]["price_at_addition"] == 380.0
    assert data["items"][0]["current_price"] == 380.0
    assert data["items"][0]["subtotal"] == 1900.0


def test_04_add_same_product_twice_increments_quantity(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "cust4@hepnamart.com")
    prod = create_test_product(db_session, "prod-c2", "PPC Cement", "ppc-cement", price=Decimal("360.00"), stock=100)
    headers = auth_header_for_user(user)

    # 1st addition
    client.post("/api/v1/cart/items", json={"product_id": prod.id, "quantity": 3}, headers=headers)
    # 2nd addition
    res = client.post("/api/v1/cart/items", json={"product_id": prod.id, "quantity": 4}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["total_items"] == 7
    assert data["items"][0]["quantity"] == 7
    assert data["items"][0]["subtotal"] == 7 * 360.0


def test_05_update_cart_item_quantity(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "cust5@hepnamart.com")
    prod = create_test_product(db_session, "prod-c3", "Steel Rod 12mm", "steel-12mm", price=Decimal("500.00"), stock=50)
    headers = auth_header_for_user(user)

    client.post("/api/v1/cart/items", json={"product_id": prod.id, "quantity": 2}, headers=headers)
    res = client.patch(f"/api/v1/cart/items/{prod.id}", json={"quantity": 10}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["items"][0]["quantity"] == 10
    assert data["total_items"] == 10


def test_06_invalid_quantity_rejected(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "cust6@hepnamart.com")
    prod = create_test_product(db_session, "prod-c4", "PVC Pipe 1in", "pvc-pipe-1in", stock=50)
    headers = auth_header_for_user(user)

    res = client.post("/api/v1/cart/items", json={"product_id": prod.id, "quantity": 0}, headers=headers)
    assert res.status_code == 422  # Pydantic ge=1 validation


def test_07_insufficient_stock_rejected_with_message(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "cust7@hepnamart.com")
    prod = create_test_product(db_session, "prod-c5", "White Cement", "white-cement", stock=5)
    headers = auth_header_for_user(user)

    res = client.post("/api/v1/cart/items", json={"product_id": prod.id, "quantity": 10}, headers=headers)
    assert res.status_code == 400
    assert "exceeds available stock" in res.json()["detail"]


def test_08_inactive_product_rejected_from_cart(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "cust8@hepnamart.com")
    prod = create_test_product(db_session, "prod-c6", "Discontinued Item", "discontinued", is_active=False)
    headers = auth_header_for_user(user)

    res = client.post("/api/v1/cart/items", json={"product_id": prod.id, "quantity": 1}, headers=headers)
    assert res.status_code == 400
    assert "inactive" in res.json()["detail"]


def test_09_remove_item_from_cart(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "cust9@hepnamart.com")
    p1 = create_test_product(db_session, "prod-c7a", "Item A", "item-a", stock=20)
    p2 = create_test_product(db_session, "prod-c7b", "Item B", "item-b", stock=20)
    headers = auth_header_for_user(user)

    client.post("/api/v1/cart/items", json={"product_id": p1.id, "quantity": 2}, headers=headers)
    client.post("/api/v1/cart/items", json={"product_id": p2.id, "quantity": 3}, headers=headers)

    res = client.delete(f"/api/v1/cart/items/{p1.id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == p2.id
    assert data["total_items"] == 3


def test_10_clear_entire_cart(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "cust10@hepnamart.com")
    p1 = create_test_product(db_session, "prod-c8a", "Item X", "item-x", stock=20)
    p2 = create_test_product(db_session, "prod-c8b", "Item Y", "item-y", stock=20)
    headers = auth_header_for_user(user)

    client.post("/api/v1/cart/items", json={"product_id": p1.id, "quantity": 1}, headers=headers)
    client.post("/api/v1/cart/items", json={"product_id": p2.id, "quantity": 2}, headers=headers)

    res = client.delete("/api/v1/cart", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 0
    assert data["total_items"] == 0


def test_11_user_cart_isolation_a_cannot_access_b(client: TestClient, db_session: Session):
    user_a = create_test_user(db_session, "user.a@hepnamart.com")
    user_b = create_test_user(db_session, "user.b@hepnamart.com")
    prod = create_test_product(db_session, "prod-c9", "Isolated Item", "iso-item", stock=50)

    headers_a = auth_header_for_user(user_a)
    headers_b = auth_header_for_user(user_b)

    # User A adds item
    client.post("/api/v1/cart/items", json={"product_id": prod.id, "quantity": 5}, headers=headers_a)

    # User B checks cart (must be empty)
    res_b = client.get("/api/v1/cart", headers=headers_b)
    assert res_b.status_code == 200
    assert len(res_b.json()["items"]) == 0
    assert res_b.json()["total_items"] == 0


# =========================================================================
# 2. WISHLIST TESTS (12 - 18)
# =========================================================================

def test_12_wishlist_create_and_get(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "wish1@hepnamart.com")
    headers = auth_header_for_user(user)

    res = client.get("/api/v1/wishlist", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == user.id
    assert data["items"] == []
    assert data["product_ids"] == []


def test_13_wishlist_add_product(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "wish2@hepnamart.com")
    prod = create_test_product(db_session, "prod-w1", "Vitrified Tile", "vitrified-tile", stock=200)
    headers = auth_header_for_user(user)

    res = client.post(f"/api/v1/wishlist/{prod.id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["product_ids"] == [prod.id]
    assert data["items"][0]["product"]["name"] == "Vitrified Tile"


def test_14_wishlist_duplicate_add_is_idempotent(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "wish3@hepnamart.com")
    prod = create_test_product(db_session, "prod-w2", "Emulsion Paint", "emulsion-paint", stock=50)
    headers = auth_header_for_user(user)

    # 1st add
    client.post(f"/api/v1/wishlist/{prod.id}", headers=headers)
    # 2nd add (duplicate)
    res = client.post(f"/api/v1/wishlist/{prod.id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["product_ids"] == [prod.id]


def test_15_wishlist_remove_product(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "wish4@hepnamart.com")
    prod = create_test_product(db_session, "prod-w3", "Door Lock", "door-lock", stock=30)
    headers = auth_header_for_user(user)

    client.post(f"/api/v1/wishlist/{prod.id}", headers=headers)
    res = client.delete(f"/api/v1/wishlist/{prod.id}", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["items"]) == 0
    assert res.json()["product_ids"] == []


def test_16_inactive_product_wishlist_rejected(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "wish5@hepnamart.com")
    prod = create_test_product(db_session, "prod-w4", "Inactive Tile", "inactive-tile", is_active=False)
    headers = auth_header_for_user(user)

    res = client.post(f"/api/v1/wishlist/{prod.id}", headers=headers)
    assert res.status_code == 400
    assert "inactive" in res.json()["detail"]


def test_17_user_wishlist_isolation(client: TestClient, db_session: Session):
    user_a = create_test_user(db_session, "wisha@hepnamart.com")
    user_b = create_test_user(db_session, "wishb@hepnamart.com")
    prod = create_test_product(db_session, "prod-w5", "Special Light", "special-light")

    headers_a = auth_header_for_user(user_a)
    headers_b = auth_header_for_user(user_b)

    client.post(f"/api/v1/wishlist/{prod.id}", headers=headers_a)

    res_b = client.get("/api/v1/wishlist", headers=headers_b)
    assert res_b.status_code == 200
    assert len(res_b.json()["items"]) == 0


def test_18_guest_requests_to_wishlist_return_401(client: TestClient):
    res = client.get("/api/v1/wishlist")
    assert res.status_code == 401


# =========================================================================
# 3. PRICING & GUEST MERGE ADVANCED TESTS (19 - 22)
# =========================================================================

def test_19_current_product_price_returned_and_totals_computed(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "price1@hepnamart.com")
    # Subtotal: 20 * 300 = 6000 (subtotal > 5000 -> delivery = Free)
    prod = create_test_product(db_session, "prod-pr1", "Cement", "cement-calc", price=Decimal("300.00"), stock=100)
    headers = auth_header_for_user(user)

    res = client.post("/api/v1/cart/items", json={"product_id": prod.id, "quantity": 20}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["subtotal"] == 6000.0
    assert data["tax"] == round(6000.0 * 0.18, 2)
    assert data["delivery_charge"] == 0.0
    assert data["total"] == 6000.0 + round(6000.0 * 0.18, 2)


def test_20_price_at_addition_preserved_and_price_changed_flagged(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "price2@hepnamart.com")
    prod = create_test_product(db_session, "prod-pr2", "Dynamic Cement", "dyn-cement", price=Decimal("350.00"), stock=100)
    headers = auth_header_for_user(user)

    # Add at ₹350
    client.post("/api/v1/cart/items", json={"product_id": prod.id, "quantity": 2}, headers=headers)

    # Product price changes in catalog to ₹390
    prod.price = Decimal("390.00")
    db_session.commit()

    res = client.get("/api/v1/cart", headers=headers)
    assert res.status_code == 200
    data = res.json()
    item = data["items"][0]
    assert item["price_at_addition"] == 350.0
    assert item["current_price"] == 390.0
    assert item["has_price_changed"] is True
    assert item["price_change_amount"] == 40.0
    assert data["has_price_changes"] is True
    # Live subtotal uses current selling price ₹390
    assert item["subtotal"] == 780.0


def test_21_guest_cart_merge_with_stock_capping(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "merge1@hepnamart.com")
    # P1: stock 5
    p1 = create_test_product(db_session, "prod-m1", "Limited Cement", "lim-cement", price=Decimal("400.00"), stock=5)
    # P2: stock 20
    p2 = create_test_product(db_session, "prod-m2", "Available Tile", "avail-tile", price=Decimal("200.00"), stock=20)
    headers = auth_header_for_user(user)

    # User already has 2 of P1 on server
    client.post("/api/v1/cart/items", json={"product_id": p1.id, "quantity": 2}, headers=headers)

    # Guest cart payload has: P1 qty 10 (which would exceed stock of 5), and P2 qty 4
    merge_payload = {
        "items": [
            {"product_id": p1.id, "quantity": 10},
            {"product_id": p2.id, "quantity": 4},
        ]
    }
    res = client.post("/api/v1/cart/merge", json=merge_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 2

    # P1 is capped at max available stock 5
    p1_item = next(i for i in data["items"] if i["product_id"] == p1.id)
    assert p1_item["quantity"] == 5

    # P2 is added with 4
    p2_item = next(i for i in data["items"] if i["product_id"] == p2.id)
    assert p2_item["quantity"] == 4


def test_22_guest_wishlist_merge_idempotency(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "merge2@hepnamart.com")
    p1 = create_test_product(db_session, "prod-mw1", "Item W1", "item-w1")
    p2 = create_test_product(db_session, "prod-mw2", "Item W2", "item-w2")
    headers = auth_header_for_user(user)

    # User already has P1 in wishlist
    client.post(f"/api/v1/wishlist/{p1.id}", headers=headers)

    # Guest wishlist has P1 and P2
    merge_payload = {"product_ids": [p1.id, p2.id]}
    res = client.post("/api/v1/wishlist/merge", json=merge_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 2
    assert set(data["product_ids"]) == {p1.id, p2.id}
