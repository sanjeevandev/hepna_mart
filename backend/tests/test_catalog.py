import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.user import User, AccountType, UserRole
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from scripts.seed_catalog import seed_catalog


def create_test_user(db: Session, role: UserRole = UserRole.CUSTOMER, email: str = "test@example.com") -> User:
    user = User(
        email=email,
        password_hash=hash_password("ValidPassword123!"),
        first_name="Test",
        last_name="User",
        account_type=AccountType.BUSINESS if role != UserRole.CUSTOMER else AccountType.INDIVIDUAL,
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


# =========================================================================
# 1. CATEGORY TESTS (1 - 6)
# =========================================================================

def test_01_list_categories_public(client: TestClient, db_session: Session):
    cat = Category(id="cat-test-1", name="Cement", slug="cement", description="All cement", is_active=True)
    db_session.add(cat)
    db_session.commit()

    res = client.get("/api/v1/categories")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["slug"] == "cement"


def test_02_get_category_by_id(client: TestClient, db_session: Session):
    cat = Category(id="cat-id-1", name="Plumbing", slug="plumbing", is_active=True)
    db_session.add(cat)
    db_session.commit()

    res = client.get(f"/api/v1/categories/{cat.id}")
    assert res.status_code == 200
    assert res.json()["name"] == "Plumbing"


def test_03_get_category_by_slug(client: TestClient, db_session: Session):
    cat = Category(id="cat-slug-1", name="Electrical", slug="electrical", is_active=True)
    db_session.add(cat)
    db_session.commit()

    res = client.get(f"/api/v1/categories/slug/{cat.slug}")
    assert res.status_code == 200
    assert res.json()["name"] == "Electrical"


def test_04_create_category_admin(client: TestClient, db_session: Session):
    admin = create_test_user(db_session, role=UserRole.ADMIN, email="admin.cat@hepnamart.com")
    headers = auth_header_for_user(admin)

    payload = {
        "name": "Roofing Sheets",
        "slug": "roofing-sheets",
        "description": "Metal and PVC roofing sheets",
        "tagline": "Protect your build",
        "icon": "Home",
    }
    res = client.post("/api/v1/categories", json=payload, headers=headers)
    assert res.status_code == 201
    assert res.json()["slug"] == "roofing-sheets"


def test_05_update_category_admin(client: TestClient, db_session: Session):
    admin = create_test_user(db_session, role=UserRole.ADMIN, email="admin.updatecat@hepnamart.com")
    headers = auth_header_for_user(admin)

    cat = Category(id="cat-up-1", name="Flooring Old", slug="flooring-old", is_active=True)
    db_session.add(cat)
    db_session.commit()

    res = client.put(f"/api/v1/categories/{cat.id}", json={"name": "Flooring Premium"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Flooring Premium"


def test_06_duplicate_category_slug_rejected(client: TestClient, db_session: Session):
    admin = create_test_user(db_session, role=UserRole.ADMIN, email="admin.dupslug@hepnamart.com")
    headers = auth_header_for_user(admin)

    cat = Category(id="cat-dup-1", name="Hardware", slug="hardware", is_active=True)
    db_session.add(cat)
    db_session.commit()

    res = client.post("/api/v1/categories", json={"name": "Hardware 2", "slug": "hardware"}, headers=headers)
    assert res.status_code == 409


# =========================================================================
# 2. PRODUCT TESTS (7 - 18)
# =========================================================================

def test_07_list_products_public(client: TestClient, db_session: Session):
    cat = Category(id="cat-p-1", name="Cement", slug="cement", is_active=True)
    db_session.add(cat)
    db_session.flush()

    prod = Product(
        id="prod-t-1",
        name="OPC 53 Cement",
        slug="opc-53-cement",
        brand="UltraTech",
        category_id=cat.id,
        price=Decimal("380.00"),
        mrp=Decimal("420.00"),
        is_active=True,
    )
    db_session.add(prod)
    db_session.commit()

    res = client.get("/api/v1/products")
    assert res.status_code == 200
    body = res.json()
    assert "items" in body
    assert body["total"] >= 1


def test_08_product_pagination(client: TestClient, db_session: Session):
    cat = Category(id="cat-pag-1", name="Tools", slug="tools", is_active=True)
    db_session.add(cat)
    db_session.flush()

    for i in range(10):
        p = Product(
            id=f"prod-pag-{i}",
            name=f"Tool {i}",
            slug=f"tool-{i}",
            brand="Bosch",
            category_id=cat.id,
            price=Decimal("500.00"),
            mrp=Decimal("600.00"),
            is_active=True,
        )
        db_session.add(p)
    db_session.commit()

    res = client.get("/api/v1/products?page=1&page_size=4")
    assert res.status_code == 200
    body = res.json()
    assert len(body["items"]) == 4
    assert body["total"] == 10
    assert body["total_pages"] == 3


def test_09_product_search(client: TestClient, db_session: Session):
    cat = Category(id="cat-srch-1", name="Paint", slug="paint", is_active=True)
    db_session.add(cat)
    db_session.flush()

    p1 = Product(id="prod-s1", name="Asian Paints Royale", slug="ap-royale", brand="Asian Paints", category_id=cat.id, price=Decimal("1500"), mrp=Decimal("1600"), is_active=True)
    p2 = Product(id="prod-s2", name="Berger Silk Glamor", slug="berger-silk", brand="Berger", category_id=cat.id, price=Decimal("1400"), mrp=Decimal("1500"), is_active=True)
    db_session.add_all([p1, p2])
    db_session.commit()

    res = client.get("/api/v1/products?search=Royale")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "Asian Paints Royale"


def test_10_product_category_filter(client: TestClient, db_session: Session):
    c1 = Category(id="cat-c1", name="Pipes", slug="pipes", is_active=True)
    c2 = Category(id="cat-c2", name="Wires", slug="wires", is_active=True)
    db_session.add_all([c1, c2])
    db_session.flush()

    p1 = Product(id="prod-pipe", name="PVC Pipe", slug="pvc-pipe", brand="Finolex", category_id=c1.id, price=Decimal("200"), mrp=Decimal("250"), is_active=True)
    p2 = Product(id="prod-wire", name="Copper Wire", slug="copper-wire", brand="Havells", category_id=c2.id, price=Decimal("900"), mrp=Decimal("1000"), is_active=True)
    db_session.add_all([p1, p2])
    db_session.commit()

    res = client.get("/api/v1/products?category=pipes")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "pvc-pipe"


def test_11_product_price_filter(client: TestClient, db_session: Session):
    cat = Category(id="cat-pr-1", name="Bricks", slug="bricks", is_active=True)
    db_session.add(cat)
    db_session.flush()

    p1 = Product(id="prod-cheap", name="Red Brick", slug="red-brick", brand="Local", category_id=cat.id, price=Decimal("10.00"), mrp=Decimal("12.00"), is_active=True)
    p2 = Product(id="prod-exp", name="AAC Block", slug="aac-block", brand="Siporex", category_id=cat.id, price=Decimal("65.00"), mrp=Decimal("70.00"), is_active=True)
    db_session.add_all([p1, p2])
    db_session.commit()

    res = client.get("/api/v1/products?min_price=50&max_price=100")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "aac-block"


def test_12_product_stock_filter(client: TestClient, db_session: Session):
    cat = Category(id="cat-st-1", name="Steel", slug="steel", is_active=True)
    db_session.add(cat)
    db_session.flush()

    p1 = Product(id="prod-in-stock", name="TMT Bar 12mm", slug="tmt-12mm", brand="Tata Tiscon", category_id=cat.id, price=Decimal("450"), mrp=Decimal("500"), is_active=True)
    p2 = Product(id="prod-out-stock", name="TMT Bar 16mm", slug="tmt-16mm", brand="Tata Tiscon", category_id=cat.id, price=Decimal("650"), mrp=Decimal("700"), is_active=True)
    db_session.add_all([p1, p2])
    db_session.flush()

    i1 = Inventory(product_id=p1.id, quantity=50, warehouse="MAIN")
    i2 = Inventory(product_id=p2.id, quantity=0, warehouse="MAIN")
    db_session.add_all([i1, i2])
    db_session.commit()

    res = client.get("/api/v1/products?in_stock=true")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["slug"] == "tmt-12mm"


def test_13_get_product_by_id(client: TestClient, db_session: Session):
    cat = Category(id="cat-g1", name="Cement", slug="cement", is_active=True)
    db_session.add(cat)
    db_session.flush()

    prod = Product(id="prod-get-1", name="ACC Suraksha", slug="acc-suraksha", brand="ACC", category_id=cat.id, price=Decimal("370"), mrp=Decimal("400"), is_active=True)
    db_session.add(prod)
    db_session.commit()

    res = client.get(f"/api/v1/products/{prod.id}")
    assert res.status_code == 200
    assert res.json()["name"] == "ACC Suraksha"


def test_14_get_product_by_slug(client: TestClient, db_session: Session):
    cat = Category(id="cat-g2", name="Paints", slug="paints", is_active=True)
    db_session.add(cat)
    db_session.flush()

    prod = Product(id="prod-get-2", name="Dulux Velvet", slug="dulux-velvet", brand="Dulux", category_id=cat.id, price=Decimal("850"), mrp=Decimal("950"), is_active=True)
    db_session.add(prod)
    db_session.commit()

    res = client.get("/api/v1/products/slug/dulux-velvet")
    assert res.status_code == 200
    assert res.json()["brand"] == "Dulux"


def test_15_create_product_admin(client: TestClient, db_session: Session):
    admin = create_test_user(db_session, role=UserRole.ADMIN, email="admin.prod@hepnamart.com")
    headers = auth_header_for_user(admin)

    cat = Category(id="cat-cr-1", name="Glass", slug="glass", is_active=True)
    db_session.add(cat)
    db_session.commit()

    payload = {
        "name": "Toughened Glass 10mm",
        "slug": "toughened-glass-10mm",
        "sku": "SKU-GLASS-10",
        "brand": "Saint-Gobain",
        "category_id": cat.id,
        "price": "120.00",
        "mrp": "140.00",
        "unit": "Sq Ft",
        "initial_stock": 250,
    }
    res = client.post("/api/v1/products", json=payload, headers=headers)
    assert res.status_code == 201
    assert res.json()["slug"] == "toughened-glass-10mm"

    # Verify inventory was created
    inv = db_session.scalar(select(Inventory).where(Inventory.product_id == res.json()["id"]))
    assert inv is not None
    assert inv.quantity == 250


def test_16_update_product_admin(client: TestClient, db_session: Session):
    admin = create_test_user(db_session, role=UserRole.ADMIN, email="admin.up@hepnamart.com")
    headers = auth_header_for_user(admin)

    cat = Category(id="cat-up-p", name="Timber", slug="timber", is_active=True)
    db_session.add(cat)
    db_session.flush()

    prod = Product(id="prod-up-1", name="Teak Wood Block", slug="teak-wood", brand="Greenply", category_id=cat.id, price=Decimal("1200"), mrp=Decimal("1400"), is_active=True)
    db_session.add(prod)
    db_session.commit()

    res = client.put(f"/api/v1/products/{prod.id}", json={"price": "1150.00", "discount_percent": 15}, headers=headers)
    assert res.status_code == 200
    assert Decimal(str(res.json()["price"])) == Decimal("1150.00")


def test_17_duplicate_product_sku_rejected(client: TestClient, db_session: Session):
    admin = create_test_user(db_session, role=UserRole.ADMIN, email="admin.sku@hepnamart.com")
    headers = auth_header_for_user(admin)

    cat = Category(id="cat-sku-1", name="Adhesives", slug="adhesives", is_active=True)
    db_session.add(cat)
    db_session.flush()

    p1 = Product(id="p-sku-1", name="Fevicol SH", slug="fevicol-sh", sku="SKU-FEV-SH", brand="Pidilite", category_id=cat.id, price=Decimal("350"), mrp=Decimal("400"), is_active=True)
    db_session.add(p1)
    db_session.commit()

    payload = {
        "name": "Fevicol Marine",
        "slug": "fevicol-marine",
        "sku": "SKU-FEV-SH",  # Duplicate SKU
        "brand": "Pidilite",
        "category_id": cat.id,
        "price": "450.00",
        "mrp": "500.00",
    }
    res = client.post("/api/v1/products", json=payload, headers=headers)
    assert res.status_code == 409


def test_18_unauthorized_product_mutation_rejected(client: TestClient, db_session: Session):
    cat = Category(id="cat-unauth", name="Test", slug="test", is_active=True)
    db_session.add(cat)
    db_session.commit()

    payload = {
        "name": "Hacker Item",
        "slug": "hacker-item",
        "brand": "Bad",
        "category_id": cat.id,
        "price": "10.00",
        "mrp": "20.00",
    }
    # No auth header -> 401
    res = client.post("/api/v1/products", json=payload)
    assert res.status_code == 401


# =========================================================================
# 3. INVENTORY TESTS (19 - 24)
# =========================================================================

def test_19_list_inventory_staff(client: TestClient, db_session: Session):
    inv_mgr = create_test_user(db_session, role=UserRole.INVENTORY_MANAGER, email="inv.mgr@hepnamart.com")
    headers = auth_header_for_user(inv_mgr)

    cat = Category(id="cat-inv-1", name="Cement", slug="cement", is_active=True)
    prod = Product(id="prod-inv-1", name="Cement 50kg", slug="cement-50kg", brand="Ambuja", category_id=cat.id, price=Decimal("380"), mrp=Decimal("400"), is_active=True)
    inv = Inventory(product_id=prod.id, quantity=200, warehouse="MAIN")
    db_session.add_all([cat, prod, inv])
    db_session.commit()

    res = client.get("/api/v1/inventory", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_20_get_inventory_by_product_id(client: TestClient, db_session: Session):
    inv_mgr = create_test_user(db_session, role=UserRole.INVENTORY_MANAGER, email="inv.mgr2@hepnamart.com")
    headers = auth_header_for_user(inv_mgr)

    cat = Category(id="cat-inv-2", name="Pipes", slug="pipes", is_active=True)
    prod = Product(id="prod-inv-2", name="CPVC 1 inch", slug="cpvc-1in", brand="Astral", category_id=cat.id, price=Decimal("150"), mrp=Decimal("180"), is_active=True)
    inv = Inventory(product_id=prod.id, quantity=80, low_stock_threshold=20, warehouse="MAIN")
    db_session.add_all([cat, prod, inv])
    db_session.commit()

    res = client.get(f"/api/v1/inventory/{prod.id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["quantity"] == 80


def test_21_update_inventory_staff(client: TestClient, db_session: Session):
    inv_mgr = create_test_user(db_session, role=UserRole.INVENTORY_MANAGER, email="inv.mgr3@hepnamart.com")
    headers = auth_header_for_user(inv_mgr)

    cat = Category(id="cat-inv-3", name="Tools", slug="tools", is_active=True)
    prod = Product(id="prod-inv-3", name="Drill Machine", slug="drill-machine", brand="Bosch", category_id=cat.id, price=Decimal("3500"), mrp=Decimal("4000"), is_active=True)
    inv = Inventory(product_id=prod.id, quantity=15, low_stock_threshold=10, warehouse="MAIN")
    db_session.add_all([cat, prod, inv])
    db_session.commit()

    res = client.put(f"/api/v1/inventory/{prod.id}", json={"quantity": 40}, headers=headers)
    assert res.status_code == 200
    assert res.json()["quantity"] == 40


def test_22_negative_stock_rejected(client: TestClient, db_session: Session):
    inv_mgr = create_test_user(db_session, role=UserRole.INVENTORY_MANAGER, email="inv.mgr4@hepnamart.com")
    headers = auth_header_for_user(inv_mgr)

    cat = Category(id="cat-inv-4", name="Hardware", slug="hardware", is_active=True)
    prod = Product(id="prod-inv-4", name="Nails 2 inch", slug="nails-2in", brand="Local", category_id=cat.id, price=Decimal("50"), mrp=Decimal("60"), is_active=True)
    inv = Inventory(product_id=prod.id, quantity=100, warehouse="MAIN")
    db_session.add_all([cat, prod, inv])
    db_session.commit()

    res = client.put(f"/api/v1/inventory/{prod.id}", json={"quantity": -50}, headers=headers)
    assert res.status_code == 422  # Pydantic ge=0 validation


def test_23_reserved_greater_than_quantity_rejected(client: TestClient, db_session: Session):
    inv_mgr = create_test_user(db_session, role=UserRole.INVENTORY_MANAGER, email="inv.mgr5@hepnamart.com")
    headers = auth_header_for_user(inv_mgr)

    cat = Category(id="cat-inv-5", name="Hardware", slug="hardware", is_active=True)
    prod = Product(id="prod-inv-5", name="Screws 1 inch", slug="screws-1in", brand="Local", category_id=cat.id, price=Decimal("30"), mrp=Decimal("40"), is_active=True)
    inv = Inventory(product_id=prod.id, quantity=20, reserved_quantity=5, warehouse="MAIN")
    db_session.add_all([cat, prod, inv])
    db_session.commit()

    res = client.put(f"/api/v1/inventory/{prod.id}", json={"quantity": 10, "reserved_quantity": 15}, headers=headers)
    assert res.status_code == 400


def test_24_low_stock_query(client: TestClient, db_session: Session):
    inv_mgr = create_test_user(db_session, role=UserRole.INVENTORY_MANAGER, email="inv.mgr6@hepnamart.com")
    headers = auth_header_for_user(inv_mgr)

    cat = Category(id="cat-low-1", name="Electrical", slug="electrical", is_active=True)
    p_low = Product(id="prod-low", name="MCB 32A", slug="mcb-32a", brand="Schneider", category_id=cat.id, price=Decimal("350"), mrp=Decimal("400"), is_active=True)
    p_high = Product(id="prod-high", name="MCB 16A", slug="mcb-16a", brand="Schneider", category_id=cat.id, price=Decimal("300"), mrp=Decimal("350"), is_active=True)
    inv1 = Inventory(product_id=p_low.id, quantity=3, low_stock_threshold=10, warehouse="MAIN")
    inv2 = Inventory(product_id=p_high.id, quantity=50, low_stock_threshold=10, warehouse="MAIN")
    db_session.add_all([cat, p_low, p_high, inv1, inv2])
    db_session.commit()

    res = client.get("/api/v1/inventory/low-stock", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["product_slug"] == "mcb-32a"


# =========================================================================
# 4. AUTH & RBAC SECURITY TESTS (25 - 29)
# =========================================================================

def test_25_customer_cannot_create_product(client: TestClient, db_session: Session):
    customer = create_test_user(db_session, role=UserRole.CUSTOMER, email="customer@hepnamart.com")
    headers = auth_header_for_user(customer)

    cat = Category(id="cat-rbac-1", name="Cement", slug="cement", is_active=True)
    db_session.add(cat)
    db_session.commit()

    payload = {"name": "Illegal Product", "slug": "illegal", "brand": "Fake", "category_id": cat.id, "price": "100", "mrp": "120"}
    res = client.post("/api/v1/products", json=payload, headers=headers)
    assert res.status_code == 403


def test_26_customer_cannot_update_inventory(client: TestClient, db_session: Session):
    customer = create_test_user(db_session, role=UserRole.CUSTOMER, email="customer2@hepnamart.com")
    headers = auth_header_for_user(customer)

    cat = Category(id="cat-rbac-2", name="Cement", slug="cement", is_active=True)
    prod = Product(id="prod-rbac-2", name="Cement OPC", slug="cement-opc", brand="ACC", category_id=cat.id, price=Decimal("380"), mrp=Decimal("400"), is_active=True)
    inv = Inventory(product_id=prod.id, quantity=100, warehouse="MAIN")
    db_session.add_all([cat, prod, inv])
    db_session.commit()

    res = client.put(f"/api/v1/inventory/{prod.id}", json={"quantity": 999}, headers=headers)
    assert res.status_code == 403


def test_27_admin_can_create_and_update_product(client: TestClient, db_session: Session):
    admin = create_test_user(db_session, role=UserRole.ADMIN, email="admin.prod2@hepnamart.com")
    headers = auth_header_for_user(admin)

    cat = Category(id="cat-proc-1", name="Paints", slug="paints", is_active=True)
    db_session.add(cat)
    db_session.commit()

    payload = {"name": "Primer 20L", "slug": "primer-20l", "brand": "Asian Paints", "category_id": cat.id, "price": "2200", "mrp": "2500"}
    res = client.post("/api/v1/products", json=payload, headers=headers)
    assert res.status_code == 201


def test_28_inventory_manager_cannot_delete_product(client: TestClient, db_session: Session):
    inv_mgr = create_test_user(db_session, role=UserRole.INVENTORY_MANAGER, email="inv.mgr.nodelete@hepnamart.com")
    headers = auth_header_for_user(inv_mgr)

    cat = Category(id="cat-nodl", name="Paints", slug="paints", is_active=True)
    prod = Product(id="prod-nodl", name="Primer 1L", slug="primer-1l", brand="Asian Paints", category_id=cat.id, price=Decimal("200"), mrp=Decimal("250"), is_active=True)
    db_session.add_all([cat, prod])
    db_session.commit()

    res = client.delete(f"/api/v1/products/{prod.id}", headers=headers)
    assert res.status_code == 403


def test_29_super_admin_can_delete_product(client: TestClient, db_session: Session):
    super_admin = create_test_user(db_session, role=UserRole.SUPER_ADMIN, email="super.admin@hepnamart.com")
    headers = auth_header_for_user(super_admin)

    cat = Category(id="cat-super", name="Bricks", slug="bricks", is_active=True)
    prod = Product(id="prod-super", name="Old Brick", slug="old-brick", brand="Local", category_id=cat.id, price=Decimal("10"), mrp=Decimal("12"), is_active=True)
    db_session.add_all([cat, prod])
    db_session.commit()

    res = client.delete(f"/api/v1/products/{prod.id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["deleted"] is True


# =========================================================================
# 5. MIGRATION & SEED TESTS (30 - 35)
# =========================================================================

def test_30_seed_catalog_execution(db_session: Session):
    cats, prods, invs = seed_catalog(db_session=db_session)
    assert cats == 12
    assert prods == 62
    assert invs == 62


def test_31_seed_catalog_is_idempotent(db_session: Session):
    # Run 1st time
    cats1, prods1, invs1 = seed_catalog(db_session=db_session)
    assert cats1 == 12 and prods1 == 62 and invs1 == 62

    # Run 2nd time (should update/skip and NOT duplicate)
    cats2, prods2, invs2 = seed_catalog(db_session=db_session)
    assert cats2 == 12 and prods2 == 62 and invs2 == 62

    total_cats = db_session.scalar(select(func.count(Category.id)))
    total_prods = db_session.scalar(select(func.count(Product.id)))
    total_invs = db_session.scalar(select(func.count(Inventory.id)))

    assert total_cats == 12
    assert total_prods == 62
    assert total_invs == 62


def test_32_every_seeded_product_has_valid_category(db_session: Session):
    seed_catalog(db_session=db_session)
    products = db_session.scalars(select(Product)).all()
    for p in products:
        assert p.category_id is not None
        cat = db_session.scalar(select(Category).where(Category.id == p.category_id))
        assert cat is not None


def test_33_every_seeded_product_has_inventory(db_session: Session):
    seed_catalog(db_session=db_session)
    products = db_session.scalars(select(Product)).all()
    for p in products:
        inv = db_session.scalar(select(Inventory).where(Inventory.product_id == p.id))
        assert inv is not None
        assert inv.quantity >= 0
        assert inv.available_quantity >= 0


def test_34_seeded_prices_are_accurate_decimals(db_session: Session):
    seed_catalog(db_session=db_session)
    cement = db_session.scalar(select(Product).where(Product.slug == "ultratech-opc-53-grade-cement"))
    assert cement is not None
    assert cement.price == Decimal("390.00")
    assert cement.mrp == Decimal("420.00")
    assert cement.discount_percent == 7


def test_35_seeded_categories_have_product_counts_in_api(client: TestClient, db_session: Session):
    seed_catalog(db_session=db_session)
    res = client.get("/api/v1/categories")
    assert res.status_code == 200
    categories = res.json()
    assert len(categories) == 12
    # Check that each category has product_count > 0
    for cat in categories:
        assert cat["product_count"] >= 5
