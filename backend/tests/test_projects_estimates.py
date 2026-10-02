import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.models.user import User, UserRole, AccountType
from app.models.category import Category
from app.models.product import Product
from app.models.project import Project, ProjectMaterial, ProjectMember
from app.models.organization import Organization, OrganizationMember, OrgRole
from app.models.estimate import Estimate
from app.core.security import hash_password, create_access_token


@pytest.fixture
def test_customer_a(db_session):
    user = User(
        id="usr-cust-a-uuid",
        email="customer_a@example.com",
        password_hash=hash_password("SecurePassword123!"),
        first_name="Customer",
        last_name="Alpha",
        role=UserRole.CUSTOMER,
        account_type=AccountType.CONTRACTOR,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_a(test_customer_a):
    token = create_access_token(
        subject=test_customer_a.id,
        role=test_customer_a.role.value,
        account_type=test_customer_a.account_type.value,
        extra_claims={"email": test_customer_a.email, "is_staff": test_customer_a.is_staff},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_customer_b(db_session):
    user = User(
        id="usr-cust-b-uuid",
        email="customer_b@example.com",
        password_hash=hash_password("SecurePassword123!"),
        first_name="Customer",
        last_name="Beta",
        role=UserRole.CUSTOMER,
        account_type=AccountType.INDIVIDUAL,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_b(test_customer_b):
    token = create_access_token(
        subject=test_customer_b.id,
        role=test_customer_b.role.value,
        account_type=test_customer_b.account_type.value,
        extra_claims={"email": test_customer_b.email, "is_staff": test_customer_b.is_staff},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_customer_c(db_session):
    user = User(
        id="usr-cust-c-uuid",
        email="customer_c@example.com",
        password_hash=hash_password("SecurePassword123!"),
        first_name="Customer",
        last_name="Gamma",
        role=UserRole.CUSTOMER,
        account_type=AccountType.INDIVIDUAL,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_c(test_customer_c):
    token = create_access_token(
        subject=test_customer_c.id,
        role=test_customer_c.role.value,
        account_type=test_customer_c.account_type.value,
        extra_claims={"email": test_customer_c.email, "is_staff": test_customer_c.is_staff},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_product(db_session):
    cat = db_session.get(Category, "cat-1")
    if not cat:
        cat = Category(id="cat-1", name="Cement & Sand", slug="cement-sand", is_active=True)
        db_session.add(cat)
        db_session.commit()

    prod = Product(
        id="prod-test-cement",
        name="UltraTech OPC 53 Grade Cement",
        slug="ultratech-opc-53-grade-cement",
        brand="UltraTech",
        category_id="cat-1",
        price=Decimal("390.00"),
        mrp=Decimal("430.00"),
        discount_percent=9,
        unit="Bag",
        is_active=True,
    )
    db_session.add(prod)
    db_session.commit()
    db_session.refresh(prod)
    return prod


# ============================================================================
# PROJECT & BOQ TESTS (BASELINE)
# ============================================================================

def test_unauthenticated_project_access_rejected(client: TestClient):
    res = client.get("/api/v1/projects")
    assert res.status_code == 401


def test_create_project_authenticated(client: TestClient, auth_headers_a):
    payload = {
        "name": "Sunrise Villa",
        "project_type": "Villa",
        "built_up_area": 2400.0,
        "area_unit": "sq.ft",
        "floors": 2,
        "stage": "Foundation",
        "city": "Bengaluru",
        "pincode": "560001",
    }
    res = client.post("/api/v1/projects", json=payload, headers=auth_headers_a)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Sunrise Villa"
    assert data["built_up_area"] == 2400.0
    assert data["city"] == "Bengaluru"
    assert data["materials"] == []
    assert data["is_shared"] is False
    assert data["organization_id"] is None


def test_list_projects_customer_isolation(
    client: TestClient, auth_headers_a, auth_headers_b
):
    # Customer A creates 2 projects
    client.post(
        "/api/v1/projects",
        json={"name": "Project A1", "built_up_area": 1200, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )
    client.post(
        "/api/v1/projects",
        json={"name": "Project A2", "built_up_area": 1500, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )

    # Customer B creates 1 project
    client.post(
        "/api/v1/projects",
        json={"name": "Project B1", "built_up_area": 1800, "city": "Mumbai", "pincode": "400001"},
        headers=auth_headers_b,
    )

    # Verify Customer A sees only 2 projects
    res_a = client.get("/api/v1/projects", headers=auth_headers_a)
    assert res_a.status_code == 200
    assert res_a.json()["total"] == 2
    names_a = [p["name"] for p in res_a.json()["projects"]]
    assert "Project A1" in names_a
    assert "Project A2" in names_a
    assert "Project B1" not in names_a

    # Verify Customer B sees only 1 project
    res_b = client.get("/api/v1/projects", headers=auth_headers_b)
    assert res_b.status_code == 200
    assert res_b.json()["total"] == 1
    assert res_b.json()["projects"][0]["name"] == "Project B1"


def test_get_project_and_idor_protection(
    client: TestClient, auth_headers_a, auth_headers_b
):
    # Customer A creates project
    res = client.post(
        "/api/v1/projects",
        json={"name": "Confidential Commercial Tower", "built_up_area": 10000, "city": "Delhi", "pincode": "110001"},
        headers=auth_headers_a,
    )
    project_id = res.json()["id"]

    # Customer A can retrieve it
    res_owner = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers_a)
    assert res_owner.status_code == 200
    assert res_owner.json()["name"] == "Confidential Commercial Tower"

    # Customer B is blocked with 403 Forbidden
    res_attacker = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers_b)
    assert res_attacker.status_code == 403


def test_update_project(client: TestClient, auth_headers_a, auth_headers_b):
    res = client.post(
        "/api/v1/projects",
        json={"name": "Initial Name", "built_up_area": 1000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )
    project_id = res.json()["id"]

    # Customer B cannot update
    res_b = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Hacked Name"},
        headers=auth_headers_b,
    )
    assert res_b.status_code == 403

    # Customer A can update
    res_a = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Updated Name", "stage": "Structure", "floors": 3},
        headers=auth_headers_a,
    )
    assert res_a.status_code == 200
    assert res_a.json()["name"] == "Updated Name"
    assert res_a.json()["stage"] == "Structure"
    assert res_a.json()["floors"] == 3


def test_delete_project_cascades(
    client: TestClient, auth_headers_a, auth_headers_b, sample_product
):
    res = client.post(
        "/api/v1/projects",
        json={"name": "Project to Delete", "built_up_area": 1000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )
    project_id = res.json()["id"]

    # Add a material
    client.post(
        f"/api/v1/projects/{project_id}/materials",
        json={"product_id": sample_product.id, "quantity": 100, "unit": "Bag"},
        headers=auth_headers_a,
    )

    # Customer B cannot delete
    res_b = client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers_b)
    assert res_b.status_code == 403

    # Customer A deletes
    res_a = client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers_a)
    assert res_a.status_code == 204

    # Confirm it is gone
    res_check = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers_a)
    assert res_check.status_code == 404


def test_add_and_update_boq_materials(
    client: TestClient, auth_headers_a, sample_product
):
    res = client.post(
        "/api/v1/projects",
        json={"name": "BOQ Test Project", "built_up_area": 2000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )
    project_id = res.json()["id"]

    # Add material
    mat_payload = {
        "product_id": sample_product.id,
        "quantity": 50,
        "unit": "Bag",
        "wastage_percent": 5.0,
        "stage": "Foundation",
        "notes": "Store in dry shed",
    }
    res_add = client.post(
        f"/api/v1/projects/{project_id}/materials",
        json=mat_payload,
        headers=auth_headers_a,
    )
    assert res_add.status_code == 200
    materials = res_add.json()["materials"]
    assert len(materials) == 1
    assert materials[0]["quantity"] == 50.0
    assert materials[0]["wastage_percent"] == 5.0
    assert materials[0]["price_at_addition"] == 390.0

    # Adding same product again increments quantity
    client.post(
        f"/api/v1/projects/{project_id}/materials",
        json={"product_id": sample_product.id, "quantity": 25},
        headers=auth_headers_a,
    )
    res_after = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers_a)
    assert res_after.json()["materials"][0]["quantity"] == 75.0

    # Update material
    res_update = client.patch(
        f"/api/v1/projects/{project_id}/materials/{sample_product.id}",
        json={"purchased_quantity": 40.0, "notes": "40 bags already delivered"},
        headers=auth_headers_a,
    )
    assert res_update.status_code == 200
    mat = res_update.json()["materials"][0]
    assert mat["purchased_quantity"] == 40.0
    assert mat["notes"] == "40 bags already delivered"

    # Remove material
    res_del = client.delete(
        f"/api/v1/projects/{project_id}/materials/{sample_product.id}",
        headers=auth_headers_a,
    )
    assert res_del.status_code == 200
    assert len(res_del.json()["materials"]) == 0


def test_toggle_project_stage(client: TestClient, auth_headers_a):
    res = client.post(
        "/api/v1/projects",
        json={"name": "Milestone Project", "built_up_area": 1500, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )
    project_id = res.json()["id"]

    # Toggle Foundation complete
    res_toggle1 = client.post(
        f"/api/v1/projects/{project_id}/stages/Foundation/toggle",
        headers=auth_headers_a,
    )
    assert res_toggle1.status_code == 200
    assert "Foundation" in res_toggle1.json()["completed_stages"]

    # Toggle Foundation back to in-progress
    res_toggle2 = client.post(
        f"/api/v1/projects/{project_id}/stages/Foundation/toggle",
        headers=auth_headers_a,
    )
    assert res_toggle2.status_code == 200
    assert "Foundation" not in res_toggle2.json()["completed_stages"]


# ============================================================================
# PHASE 2L.3 SHARED PROJECTS & MULTI-USER BOQ COLLABORATION TESTS
# ============================================================================

def test_organization_project_creation_and_membership(
    client: TestClient, auth_headers_a, auth_headers_b, db_session
):
    # 1. Customer A creates organization
    org_res = client.post(
        "/api/v1/organizations",
        json={"name": "Apex Builders Pvt Ltd", "business_type": "Private Limited"},
        headers=auth_headers_a,
    )
    assert org_res.status_code == 201
    org_id = org_res.json()["id"]

    # 2. Customer A creates project bound to organization
    proj_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Apex Towers Phase 1",
            "organization_id": org_id,
            "built_up_area": 50000,
            "city": "Mumbai",
            "pincode": "400001",
        },
        headers=auth_headers_a,
    )
    assert proj_res.status_code == 201
    proj_data = proj_res.json()
    assert proj_data["is_shared"] is True
    assert proj_data["organization_id"] == org_id
    assert proj_data["organization_name"] == "Apex Builders Pvt Ltd"
    assert proj_data["current_user_role"] == "owner"
    assert proj_data["member_count"] == 1
    assert proj_data["members"][0]["user_id"] == "usr-cust-a-uuid"


def test_cross_org_access_strictly_forbidden(
    client: TestClient, auth_headers_a, auth_headers_b
):
    # Customer A creates org and project
    org_res = client.post(
        "/api/v1/organizations",
        json={"name": "Secret Corp", "business_type": "Proprietorship"},
        headers=auth_headers_a,
    )
    org_id = org_res.json()["id"]

    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Classified Project", "organization_id": org_id, "built_up_area": 1000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )
    proj_id = proj_res.json()["id"]

    # Customer B tries to view -> 403
    assert client.get(f"/api/v1/projects/{proj_id}", headers=auth_headers_b).status_code == 403


def test_cannot_add_non_org_user_to_project(
    client: TestClient, auth_headers_a, test_customer_b
):
    org_res = client.post(
        "/api/v1/organizations",
        json={"name": "Builders A", "business_type": "Proprietorship"},
        headers=auth_headers_a,
    )
    org_id = org_res.json()["id"]

    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Project A", "organization_id": org_id, "built_up_area": 1000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )
    proj_id = proj_res.json()["id"]

    # Try to add Customer B (who is NOT in organization) to project
    res_add = client.post(
        f"/api/v1/projects/{proj_id}/members",
        json={"user_id": test_customer_b.id, "role": "viewer"},
        headers=auth_headers_a,
    )
    assert res_add.status_code == 400
    assert "not a member of the organization" in res_add.json()["detail"]


def test_collaborator_roles_and_boq_permissions_matrix(
    client: TestClient,
    auth_headers_a,
    auth_headers_b,
    auth_headers_c,
    test_customer_b,
    test_customer_c,
    sample_product,
):
    # Customer A creates Org
    org_res = client.post(
        "/api/v1/organizations",
        json={"name": "Omni Builders", "business_type": "LLP"},
        headers=auth_headers_a,
    )
    org_id = org_res.json()["id"]

    # Invite Customer B as Site Supervisor and Customer C as Viewer to Org
    inv_b = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        json={"email": test_customer_b.email, "role": "site_supervisor"},
        headers=auth_headers_a,
    )
    client.post(
        f"/api/v1/invitations/{inv_b.json()['token']}/accept",
        headers=auth_headers_b,
    )

    inv_c = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        json={"email": test_customer_c.email, "role": "viewer"},
        headers=auth_headers_a,
    )
    client.post(
        f"/api/v1/invitations/{inv_c.json()['token']}/accept",
        headers=auth_headers_c,
    )

    # Owner creates Project
    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Matrix Project", "organization_id": org_id, "built_up_area": 3000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )
    proj_id = proj_res.json()["id"]

    # Add Customer B (Supervisor) and Customer C (Viewer) as Project Members
    client.post(
        f"/api/v1/projects/{proj_id}/members",
        json={"user_id": test_customer_b.id, "role": "site_supervisor"},
        headers=auth_headers_a,
    )
    client.post(
        f"/api/v1/projects/{proj_id}/members",
        json={"user_id": test_customer_c.id, "role": "viewer"},
        headers=auth_headers_a,
    )

    # 1. Owner adds material
    res_add_mat = client.post(
        f"/api/v1/projects/{proj_id}/materials",
        json={"product_id": sample_product.id, "quantity": 100, "wastage_percent": 5.0},
        headers=auth_headers_a,
    )
    assert res_add_mat.status_code == 200

    # 2. Viewer (Customer C) attempts to add material -> 403 Forbidden
    res_viewer_add = client.post(
        f"/api/v1/projects/{proj_id}/materials",
        json={"product_id": sample_product.id, "quantity": 10},
        headers=auth_headers_c,
    )
    assert res_viewer_add.status_code == 403

    # 3. Supervisor (Customer B) attempts to add material -> 403 Forbidden
    res_sup_add = client.post(
        f"/api/v1/projects/{proj_id}/materials",
        json={"product_id": sample_product.id, "quantity": 10},
        headers=auth_headers_b,
    )
    assert res_sup_add.status_code == 403

    # 4. Supervisor attempts to modify core quantity -> 403 Forbidden
    res_sup_qty = client.patch(
        f"/api/v1/projects/{proj_id}/materials/{sample_product.id}",
        json={"quantity": 200},
        headers=auth_headers_b,
    )
    assert res_sup_qty.status_code == 403

    # 5. Supervisor updates purchased_quantity -> 200 OK
    res_sup_purchased = client.patch(
        f"/api/v1/projects/{proj_id}/materials/{sample_product.id}",
        json={"purchased_quantity": 50.0, "notes": "50 bags arrived on site"},
        headers=auth_headers_b,
    )
    assert res_sup_purchased.status_code == 200
    assert res_sup_purchased.json()["materials"][0]["purchased_quantity"] == 50.0

    # 6. Supervisor toggles stage complete -> 200 OK
    res_sup_toggle = client.post(
        f"/api/v1/projects/{proj_id}/stages/Foundation/toggle",
        headers=auth_headers_b,
    )
    assert res_sup_toggle.status_code == 200
    assert "Foundation" in res_sup_toggle.json()["completed_stages"]

    # 7. Viewer attempts to toggle stage -> 403 Forbidden
    res_view_toggle = client.post(
        f"/api/v1/projects/{proj_id}/stages/Foundation/toggle",
        headers=auth_headers_c,
    )
    assert res_view_toggle.status_code == 403


def test_project_manager_cannot_delete_org_project(
    client: TestClient, auth_headers_a, auth_headers_b, test_customer_b
):
    # Customer A (Owner) creates org & project
    org_res = client.post(
        "/api/v1/organizations",
        json={"name": "Delta Builders", "business_type": "LLP"},
        headers=auth_headers_a,
    )
    org_id = org_res.json()["id"]

    # Invite Customer B as Project Manager in Org
    inv_b = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        json={"email": test_customer_b.email, "role": "project_manager"},
        headers=auth_headers_a,
    )
    client.post(
        f"/api/v1/invitations/{inv_b.json()['token']}/accept",
        headers=auth_headers_b,
    )

    # Create project and assign Customer B as Project Manager
    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Delta Project", "organization_id": org_id, "built_up_area": 2000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )
    proj_id = proj_res.json()["id"]

    client.post(
        f"/api/v1/projects/{proj_id}/members",
        json={"user_id": test_customer_b.id, "role": "project_manager"},
        headers=auth_headers_a,
    )

    # Customer B (PM) tries to delete project -> 403 Forbidden
    res_del_pm = client.delete(f"/api/v1/projects/{proj_id}", headers=auth_headers_b)
    assert res_del_pm.status_code == 403
    assert "Only organization Owners or Administrators can delete" in res_del_pm.json()["detail"]

    # Customer A (Owner) can delete project -> 204
    res_del_owner = client.delete(f"/api/v1/projects/{proj_id}", headers=auth_headers_a)
    assert res_del_owner.status_code == 204


def test_cascade_removal_cleans_project_members(
    client: TestClient, auth_headers_a, auth_headers_b, test_customer_b
):
    # Setup Org, Project, and Member
    org_res = client.post(
        "/api/v1/organizations",
        json={"name": "Cascade Corp", "business_type": "LLP"},
        headers=auth_headers_a,
    )
    org_id = org_res.json()["id"]

    inv_b = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        json={"email": test_customer_b.email, "role": "project_manager"},
        headers=auth_headers_a,
    )
    client.post(
        f"/api/v1/invitations/{inv_b.json()['token']}/accept",
        headers=auth_headers_b,
    )

    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Cascade Project", "organization_id": org_id, "built_up_area": 1000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )
    proj_id = proj_res.json()["id"]

    client.post(
        f"/api/v1/projects/{proj_id}/members",
        json={"user_id": test_customer_b.id, "role": "project_manager"},
        headers=auth_headers_a,
    )

    # Verify Customer B can see project
    assert client.get(f"/api/v1/projects/{proj_id}", headers=auth_headers_b).status_code == 200

    # Remove Customer B from Organization
    client.delete(f"/api/v1/organizations/{org_id}/members/{test_customer_b.id}", headers=auth_headers_a)

    # Verify Customer B can NO LONGER see project (403 Forbidden)
    assert client.get(f"/api/v1/projects/{proj_id}", headers=auth_headers_b).status_code == 403


def test_project_transfer_organization(
    client: TestClient, auth_headers_a, auth_headers_b, test_customer_b
):
    # Customer A creates 2 organizations: Org 1 and Org 2
    org1 = client.post(
        "/api/v1/organizations",
        json={"name": "Org 1", "business_type": "LLP"},
        headers=auth_headers_a,
    ).json()

    org2 = client.post(
        "/api/v1/organizations",
        json={"name": "Org 2", "business_type": "LLP"},
        headers=auth_headers_a,
    ).json()

    # Invite Customer B to Org 1 only
    inv_b = client.post(
        f"/api/v1/organizations/{org1['id']}/invitations",
        json={"email": test_customer_b.email, "role": "site_supervisor"},
        headers=auth_headers_a,
    )
    client.post(
        f"/api/v1/invitations/{inv_b.json()['token']}/accept",
        headers=auth_headers_b,
    )

    # Create project in Org 1 and assign Customer B
    proj = client.post(
        "/api/v1/projects",
        json={"name": "Transferable Project", "organization_id": org1["id"], "built_up_area": 1000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    ).json()

    client.post(
        f"/api/v1/projects/{proj['id']}/members",
        json={"user_id": test_customer_b.id, "role": "site_supervisor"},
        headers=auth_headers_a,
    )

    # Transfer project from Org 1 to Org 2
    res_transfer = client.post(
        f"/api/v1/projects/{proj['id']}/transfer-organization",
        json={"target_organization_id": org2["id"]},
        headers=auth_headers_a,
    )
    assert res_transfer.status_code == 200
    assert res_transfer.json()["organization_id"] == org2["id"]
    assert res_transfer.json()["organization_name"] == "Org 2"

    # Customer B should NOT have access now because they are not in Org 2
    assert client.get(f"/api/v1/projects/{proj['id']}", headers=auth_headers_b).status_code == 403


# ============================================================================
# ESTIMATE TESTS
# ============================================================================

def test_create_and_list_estimates(
    client: TestClient, auth_headers_a, auth_headers_b, sample_product
):
    estimate_payload = {
        "inputs": {
            "projectType": "Villa",
            "builtUpArea": 2000,
            "areaUnit": "sq.ft",
            "floors": 2,
            "quality": "standard",
            "city": "Pune",
            "projectName": "Green Villa",
        },
        "materials": [
            {
                "id": "mat-cement",
                "categoryName": "Cement",
                "categorySlug": "cement-concrete",
                "matchedProductId": sample_product.id,
                "productName": sample_product.name,
                "quantity": 100,
                "unit": "Bag",
                "priceAtEstimate": 375.0,  # Old price snapshot
                "lineTotalAtEstimate": 37500.0,
            }
        ],
        "subtotal_at_estimate": 37500.0,
        "tax_at_estimate": 6750.0,
        "delivery_at_estimate": 0.0,
        "total_at_estimate": 44250.0,
        "notes": "Initial villa estimate snapshot",
    }

    res = client.post("/api/v1/estimates", json=estimate_payload, headers=auth_headers_a)
    assert res.status_code == 201
    data = res.json()
    assert data["project_type"] == "Villa"
    assert data["total_at_estimate"] == 44250.0
    # Live catalog price check: current is 390.0 vs snapshot 375.0 -> price change detected!
    assert data["has_price_changes"] is True
    assert data["price_difference"] > 0
    estimate_id = data["id"]

    # Customer B cannot see Customer A's estimate
    res_b = client.get("/api/v1/estimates", headers=auth_headers_b)
    assert res_b.json()["total"] == 0

    res_b_get = client.get(f"/api/v1/estimates/{estimate_id}", headers=auth_headers_b)
    assert res_b_get.status_code == 403

    # Customer A can retrieve it
    res_a_get = client.get(f"/api/v1/estimates/{estimate_id}", headers=auth_headers_a)
    assert res_a_get.status_code == 200
    assert res_a_get.json()["notes"] == "Initial villa estimate snapshot"


def test_transfer_estimate_to_project_boq(
    client: TestClient, auth_headers_a, auth_headers_b, sample_product
):
    # 1. Create target project
    res_proj = client.post(
        "/api/v1/projects",
        json={"name": "Target BOQ Project", "built_up_area": 1800, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    )
    project_id = res_proj.json()["id"]

    # 2. Create estimate
    res_est = client.post(
        "/api/v1/estimates",
        json={
            "inputs": {"projectType": "House", "builtUpArea": 1800, "city": "Pune"},
            "materials": [
                {
                    "id": "mat-1",
                    "matchedProductId": sample_product.id,
                    "quantity": 120,
                    "unit": "Bag",
                }
            ],
            "subtotal_at_estimate": 46800.0,
            "total_at_estimate": 55224.0,
        },
        headers=auth_headers_a,
    )
    estimate_id = res_est.json()["id"]

    # 3. Customer B cannot transfer Customer A's estimate
    res_unauth = client.post(
        f"/api/v1/estimates/{estimate_id}/transfer",
        json={"target_project_id": project_id},
        headers=auth_headers_b,
    )
    assert res_unauth.status_code == 403

    # 4. Customer A transfers estimate to project
    res_transfer = client.post(
        f"/api/v1/estimates/{estimate_id}/transfer",
        json={"target_project_id": project_id},
        headers=auth_headers_a,
    )
    assert res_transfer.status_code == 200
    assert res_transfer.json()["transferred_items"] == 1

    # 5. Verify project now has the material
    res_check = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers_a)
    materials = res_check.json()["materials"]
    assert len(materials) == 1
    assert materials[0]["product_id"] == sample_product.id
    assert materials[0]["quantity"] == 120.0


def test_stale_role_capping_prevents_privilege_escalation(
    client: TestClient, auth_headers_a, auth_headers_b, test_customer_b, sample_product
):
    # Customer A creates org and invites Customer B as Project Manager
    org = client.post(
        "/api/v1/organizations",
        json={"name": "Capping Test Org", "business_type": "LLP"},
        headers=auth_headers_a,
    ).json()

    inv = client.post(
        f"/api/v1/organizations/{org['id']}/invitations",
        json={"email": test_customer_b.email, "role": "project_manager"},
        headers=auth_headers_a,
    ).json()
    client.post(f"/api/v1/invitations/{inv['token']}/accept", headers=auth_headers_b)

    # Customer A creates project and adds Customer B as Project Manager
    proj = client.post(
        "/api/v1/projects",
        json={"name": "Capping Project", "organization_id": org["id"], "built_up_area": 1000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    ).json()

    client.post(
        f"/api/v1/projects/{proj['id']}/members",
        json={"user_id": test_customer_b.id, "role": "project_manager"},
        headers=auth_headers_a,
    )

    # Verify B can add material as PM
    res_add1 = client.post(
        f"/api/v1/projects/{proj['id']}/materials",
        json={"product_id": sample_product.id, "quantity": 10},
        headers=auth_headers_b,
    )
    assert res_add1.status_code == 200

    # Demote Customer B to VIEWER in the Organization
    client.put(
        f"/api/v1/organizations/{org['id']}/members/{test_customer_b.id}",
        json={"role": "viewer"},
        headers=auth_headers_a,
    )

    # Now Customer B's effective role on the project is capped at VIEWER!
    # Adding material must be rejected with 403 Forbidden
    res_add2 = client.post(
        f"/api/v1/projects/{proj['id']}/materials",
        json={"product_id": sample_product.id, "quantity": 20},
        headers=auth_headers_b,
    )
    assert res_add2.status_code == 403


def test_pm_cannot_assign_admin_or_owner_roles(
    client: TestClient,
    auth_headers_a,
    auth_headers_b,
    auth_headers_c,
    test_customer_b,
    test_customer_c,
):
    # Customer A (Owner) creates Org
    org = client.post(
        "/api/v1/organizations",
        json={"name": "PM Role Check Org", "business_type": "LLP"},
        headers=auth_headers_a,
    ).json()

    # Invite B as PM and C as Viewer
    inv_b = client.post(
        f"/api/v1/organizations/{org['id']}/invitations",
        json={"email": test_customer_b.email, "role": "project_manager"},
        headers=auth_headers_a,
    ).json()
    client.post(f"/api/v1/invitations/{inv_b['token']}/accept", headers=auth_headers_b)

    inv_c = client.post(
        f"/api/v1/organizations/{org['id']}/invitations",
        json={"email": test_customer_c.email, "role": "viewer"},
        headers=auth_headers_a,
    ).json()
    client.post(f"/api/v1/invitations/{inv_c['token']}/accept", headers=auth_headers_c)

    # Create project and assign B as PM
    proj = client.post(
        "/api/v1/projects",
        json={"name": "PM Security Project", "organization_id": org["id"], "built_up_area": 1000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    ).json()
    client.post(
        f"/api/v1/projects/{proj['id']}/members",
        json={"user_id": test_customer_b.id, "role": "project_manager"},
        headers=auth_headers_a,
    )

    # PM B tries to add C as Admin -> 403 Forbidden
    res_admin = client.post(
        f"/api/v1/projects/{proj['id']}/members",
        json={"user_id": test_customer_c.id, "role": "admin"},
        headers=auth_headers_b,
    )
    assert res_admin.status_code == 403

    # PM B adds C as Viewer -> 201 Created
    res_viewer = client.post(
        f"/api/v1/projects/{proj['id']}/members",
        json={"user_id": test_customer_c.id, "role": "viewer"},
        headers=auth_headers_b,
    )
    assert res_viewer.status_code == 201

    # PM B tries to elevate C to Owner -> 403 Forbidden
    res_elevate = client.patch(
        f"/api/v1/projects/{proj['id']}/members/{test_customer_c.id}",
        json={"role": "owner"},
        headers=auth_headers_b,
    )
    assert res_elevate.status_code == 403


def test_estimate_transfer_rbac_enforcement(
    client: TestClient,
    auth_headers_a,
    auth_headers_b,
    test_customer_b,
    sample_product,
):
    # Customer A creates org, project, and estimate
    org = client.post(
        "/api/v1/organizations",
        json={"name": "Estimate RBAC Org", "business_type": "LLP"},
        headers=auth_headers_a,
    ).json()

    inv_b = client.post(
        f"/api/v1/organizations/{org['id']}/invitations",
        json={"email": test_customer_b.email, "role": "viewer"},
        headers=auth_headers_a,
    ).json()
    client.post(f"/api/v1/invitations/{inv_b['token']}/accept", headers=auth_headers_b)

    proj = client.post(
        "/api/v1/projects",
        json={"name": "Target Shared Project", "organization_id": org["id"], "built_up_area": 1000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    ).json()

    # Assign Customer B as Viewer on project
    client.post(
        f"/api/v1/projects/{proj['id']}/members",
        json={"user_id": test_customer_b.id, "role": "viewer"},
        headers=auth_headers_a,
    )

    # Customer B creates an estimate
    est_b = client.post(
        "/api/v1/estimates",
        json={
            "inputs": {"projectType": "House", "builtUpArea": 1000, "city": "Pune"},
            "materials": [{"id": "m1", "matchedProductId": sample_product.id, "quantity": 10}],
            "subtotal_at_estimate": 3900.0,
            "total_at_estimate": 4602.0,
        },
        headers=auth_headers_b,
    ).json()

    # Customer B tries to transfer estimate to project where they only have VIEWER role -> 403
    res_xfer = client.post(
        f"/api/v1/estimates/{est_b['id']}/transfer",
        json={"target_project_id": proj["id"]},
        headers=auth_headers_b,
    )
    assert res_xfer.status_code == 403


def test_procurement_manager_permissions_matrix(
    client: TestClient,
    auth_headers_a,
    auth_headers_b,
    test_customer_b,
    sample_product,
):
    # Customer A (Owner) creates Org and invites Customer B as Procurement Manager
    org = client.post(
        "/api/v1/organizations",
        json={"name": "Procurement Test Org", "business_type": "LLP"},
        headers=auth_headers_a,
    ).json()

    inv = client.post(
        f"/api/v1/organizations/{org['id']}/invitations",
        json={"email": test_customer_b.email, "role": "procurement_manager"},
        headers=auth_headers_a,
    ).json()
    client.post(f"/api/v1/invitations/{inv['token']}/accept", headers=auth_headers_b)

    # 1. Procurement Manager attempts to create org project -> 403 Forbidden
    res_create_proj = client.post(
        "/api/v1/projects",
        json={"name": "Procurement Project Attempt", "organization_id": org["id"], "built_up_area": 1000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_b,
    )
    assert res_create_proj.status_code == 403

    # Owner creates project and adds B as Procurement Manager
    proj = client.post(
        "/api/v1/projects",
        json={"name": "Procurement Valid Project", "organization_id": org["id"], "built_up_area": 1000, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    ).json()

    client.post(
        f"/api/v1/projects/{proj['id']}/members",
        json={"user_id": test_customer_b.id, "role": "procurement_manager"},
        headers=auth_headers_a,
    )

    # Owner adds initial material
    client.post(
        f"/api/v1/projects/{proj['id']}/materials",
        json={"product_id": sample_product.id, "quantity": 100, "wastage_percent": 5.0},
        headers=auth_headers_a,
    )

    # 2. Procurement Manager attempts to add material -> 403 Forbidden
    res_add = client.post(
        f"/api/v1/projects/{proj['id']}/materials",
        json={"product_id": sample_product.id, "quantity": 50},
        headers=auth_headers_b,
    )
    assert res_add.status_code == 403

    # 3. Procurement Manager attempts to modify base quantity -> 403 Forbidden
    res_qty = client.patch(
        f"/api/v1/projects/{proj['id']}/materials/{sample_product.id}",
        json={"quantity": 200},
        headers=auth_headers_b,
    )
    assert res_qty.status_code == 403

    # 4. Procurement Manager attempts to modify wastage percent -> 403 Forbidden
    res_waste = client.patch(
        f"/api/v1/projects/{proj['id']}/materials/{sample_product.id}",
        json={"wastage_percent": 10.0},
        headers=auth_headers_b,
    )
    assert res_waste.status_code == 403

    # 5. Procurement Manager attempts to delete material -> 403 Forbidden
    res_del_mat = client.delete(
        f"/api/v1/projects/{proj['id']}/materials/{sample_product.id}",
        headers=auth_headers_b,
    )
    assert res_del_mat.status_code == 403

    # 6. Procurement Manager updates purchased_quantity & notes -> 200 OK
    res_purchased = client.patch(
        f"/api/v1/projects/{proj['id']}/materials/{sample_product.id}",
        json={"purchased_quantity": 40.0, "notes": "Procured from wholesale depot"},
        headers=auth_headers_b,
    )
    assert res_purchased.status_code == 200
    assert res_purchased.json()["materials"][0]["purchased_quantity"] == 40.0

    # 7. Procurement Manager refreshes BOQ pricing -> 200 OK
    res_refresh = client.post(
        f"/api/v1/projects/{proj['id']}/refresh-pricing",
        headers=auth_headers_b,
    )
    assert res_refresh.status_code == 200

    # 8. Procurement Manager transfers estimate to BOQ -> 200 OK
    est_b = client.post(
        "/api/v1/estimates",
        json={
            "inputs": {"projectType": "House", "builtUpArea": 1000, "city": "Pune"},
            "materials": [{"id": "m1", "matchedProductId": sample_product.id, "quantity": 25}],
            "subtotal_at_estimate": 9750.0,
            "total_at_estimate": 11505.0,
        },
        headers=auth_headers_b,
    ).json()

    res_est_xfer = client.post(
        f"/api/v1/estimates/{est_b['id']}/transfer",
        json={"target_project_id": proj["id"]},
        headers=auth_headers_b,
    )
    assert res_est_xfer.status_code == 200


def test_viewer_comprehensive_mutation_lockout(
    client: TestClient,
    auth_headers_a,
    auth_headers_b,
    test_customer_b,
    sample_product,
):
    # Customer A creates org and project
    org = client.post(
        "/api/v1/organizations",
        json={"name": "Viewer Lockout Org", "business_type": "LLP"},
        headers=auth_headers_a,
    ).json()

    inv = client.post(
        f"/api/v1/organizations/{org['id']}/invitations",
        json={"email": test_customer_b.email, "role": "viewer"},
        headers=auth_headers_a,
    ).json()
    client.post(f"/api/v1/invitations/{inv['token']}/accept", headers=auth_headers_b)

    proj = client.post(
        "/api/v1/projects",
        json={"name": "Viewer Locked Project", "organization_id": org["id"], "built_up_area": 1200, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    ).json()

    client.post(
        f"/api/v1/projects/{proj['id']}/members",
        json={"user_id": test_customer_b.id, "role": "viewer"},
        headers=auth_headers_a,
    )

    client.post(
        f"/api/v1/projects/{proj['id']}/materials",
        json={"product_id": sample_product.id, "quantity": 50},
        headers=auth_headers_a,
    )

    # 1. Viewer can read project and BOQ -> 200 OK
    assert client.get(f"/api/v1/projects/{proj['id']}", headers=auth_headers_b).status_code == 200

    # 2. Patch project metadata -> 403
    assert client.patch(f"/api/v1/projects/{proj['id']}", json={"name": "Hacked"}, headers=auth_headers_b).status_code == 403

    # 3. Add BOQ material -> 403
    assert client.post(f"/api/v1/projects/{proj['id']}/materials", json={"product_id": sample_product.id, "quantity": 1}, headers=auth_headers_b).status_code == 403

    # 4. Patch BOQ material -> 403
    assert client.patch(f"/api/v1/projects/{proj['id']}/materials/{sample_product.id}", json={"purchased_quantity": 10}, headers=auth_headers_b).status_code == 403

    # 5. Delete BOQ material -> 403
    assert client.delete(f"/api/v1/projects/{proj['id']}/materials/{sample_product.id}", headers=auth_headers_b).status_code == 403

    # 6. Toggle stage -> 403
    assert client.post(f"/api/v1/projects/{proj['id']}/stages/Foundation/toggle", headers=auth_headers_b).status_code == 403

    # 7. Refresh pricing -> 403
    assert client.post(f"/api/v1/projects/{proj['id']}/refresh-pricing", headers=auth_headers_b).status_code == 403

    # 8. Transfer project -> 403
    assert client.post(f"/api/v1/projects/{proj['id']}/transfer-organization", json={"target_organization_id": None}, headers=auth_headers_b).status_code == 403

    # 9. Delete project -> 403
    assert client.delete(f"/api/v1/projects/{proj['id']}", headers=auth_headers_b).status_code == 403


def test_cross_organization_idor_isolation(
    client: TestClient,
    auth_headers_a,
    auth_headers_b,
    sample_product,
):
    # Customer A creates Org 1 & Project 1
    org1 = client.post(
        "/api/v1/organizations",
        json={"name": "Org 1 Corp", "business_type": "LLP"},
        headers=auth_headers_a,
    ).json()

    proj1 = client.post(
        "/api/v1/projects",
        json={"name": "Org 1 Project", "organization_id": org1["id"], "built_up_area": 1500, "city": "Pune", "pincode": "411001"},
        headers=auth_headers_a,
    ).json()

    client.post(
        f"/api/v1/projects/{proj1['id']}/materials",
        json={"product_id": sample_product.id, "quantity": 100},
        headers=auth_headers_a,
    )

    # Customer B creates Org 2
    client.post(
        "/api/v1/organizations",
        json={"name": "Org 2 Corp", "business_type": "LLP"},
        headers=auth_headers_b,
    )

    # Customer B (from Org 2) tries to access Org 1 Project -> 403 Forbidden
    assert client.get(f"/api/v1/projects/{proj1['id']}", headers=auth_headers_b).status_code == 403
    assert client.patch(f"/api/v1/projects/{proj1['id']}", json={"name": "Injected"}, headers=auth_headers_b).status_code == 403
    assert client.post(f"/api/v1/projects/{proj1['id']}/materials", json={"product_id": sample_product.id, "quantity": 10}, headers=auth_headers_b).status_code == 403
    assert client.delete(f"/api/v1/projects/{proj1['id']}", headers=auth_headers_b).status_code == 403
    assert client.get(f"/api/v1/projects/{proj1['id']}/members", headers=auth_headers_b).status_code == 403

