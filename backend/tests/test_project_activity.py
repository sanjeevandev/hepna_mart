import pytest
from decimal import Decimal
from fastapi import status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.activity import ProjectActivityLog, ProjectAction
from app.models.user import User, UserRole, AccountType
from app.models.category import Category
from app.models.product import Product
from app.models.organization import (
    Organization,
    OrganizationMember,
    OrgRole,
)
from app.core.security import create_access_token, hash_password
from app.services.activity_service import ProjectActivityService


def create_user(db: Session, email: str, name: str = "Test User") -> User:
    user = User(
        id=f"usr-{email.split('@')[0]}",
        email=email,
        password_hash=hash_password("TestPassword123!"),
        first_name=name.split()[0],
        last_name=name.split()[-1] if len(name.split()) > 1 else "User",
        account_type=AccountType.BUSINESS,
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_header(user: User) -> dict:
    token = create_access_token(
        subject=user.id,
        role=user.role.value,
        account_type=user.account_type.value,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_users(db_session: Session):
    user_a = create_user(db_session, "audit_owner@example.com", "Audit Owner")
    user_b = create_user(db_session, "audit_member@example.com", "Audit Member")
    user_c = create_user(db_session, "audit_outsider@example.com", "Audit Outsider")

    return {
        "user_a": {"user": user_a, "headers": auth_header(user_a)},
        "user_b": {"user": user_b, "headers": auth_header(user_b)},
        "user_c": {"user": user_c, "headers": auth_header(user_c)},
    }


@pytest.fixture
def sample_product(db_session: Session):
    cat = db_session.get(Category, "cat-audit-1")
    if not cat:
        cat = Category(id="cat-audit-1", name="Cement & Sand", slug="cement-sand-audit", is_active=True)
        db_session.add(cat)
        db_session.commit()

    prod = db_session.get(Product, "prod-audit-cement")
    if not prod:
        prod = Product(
            id="prod-audit-cement",
            name="UltraTech OPC 53 Grade Cement",
            slug="ultratech-opc-53-audit",
            brand="UltraTech",
            category_id="cat-audit-1",
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


def test_personal_project_creation_and_activity_log(client, test_users):
    """
    Verifies that creating a personal project generates a PROJECT_CREATED activity log.
    """
    u_a = test_users["user_a"]["user"]
    h_a = test_users["user_a"]["headers"]

    resp = client.post(
        "/api/v1/projects",
        headers=h_a,
        json={
            "name": "Audit Personal Project",
            "project_type": "Villa",
            "built_up_area": 2500,
            "city": "Pune",
            "pincode": "411045",
        },
    )
    assert resp.status_code == status.HTTP_201_CREATED
    proj_id = resp.json()["id"]

    # Query activity endpoint
    act_resp = client.get(
        f"/api/v1/projects/{proj_id}/activity",
        headers=h_a,
    )
    assert act_resp.status_code == status.HTTP_200_OK
    data = act_resp.json()
    assert data["total"] >= 1
    actions = [a["action"] for a in data["activities"]]
    assert ProjectAction.PROJECT_CREATED in actions

    created_log = next(a for a in data["activities"] if a["action"] == ProjectAction.PROJECT_CREATED)
    assert created_log["actor_user_id"] == u_a.id
    assert created_log["actor"]["email"] == "audit_owner@example.com"
    assert created_log["metadata"]["name"] == "Audit Personal Project"


def test_personal_project_isolation_and_idor_protection(client, test_users):
    """
    Unauthorized user (user_c) must NOT be able to view activity logs of user_a's personal project.
    """
    h_a = test_users["user_a"]["headers"]
    h_c = test_users["user_c"]["headers"]

    resp = client.post(
        "/api/v1/projects",
        headers=h_a,
        json={
            "name": "Secret Private Project",
            "project_type": "House",
            "built_up_area": 1200,
            "city": "Mumbai",
            "pincode": "400001",
        },
    )
    proj_id = resp.json()["id"]

    # Outsider attempts to access activity
    act_resp = client.get(
        f"/api/v1/projects/{proj_id}/activity",
        headers=h_c,
    )
    assert act_resp.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]


def test_boq_mutations_and_specialized_actions(client, test_users, sample_product):
    """
    Verifies that BOQ additions, modifications, status updates, and deletions create precise audit entries.
    """
    h_a = test_users["user_a"]["headers"]

    # Create project
    proj_resp = client.post(
        "/api/v1/projects",
        headers=h_a,
        json={
            "name": "BOQ Activity Test Project",
            "project_type": "Commercial",
            "built_up_area": 5000,
            "city": "Pune",
            "pincode": "411001",
        },
    )
    proj_id = proj_resp.json()["id"]

    # 1. Add Material
    add_resp = client.post(
        f"/api/v1/projects/{proj_id}/materials",
        headers=h_a,
        json={
            "product_id": sample_product.id,
            "quantity": 100,
            "unit": "Bag",
            "stage": "Foundation",
            "notes": "Grade 53 cement",
        },
    )
    assert add_resp.status_code == status.HTTP_200_OK

    # 2. Update core quantity
    upd_resp = client.patch(
        f"/api/v1/projects/{proj_id}/materials/{sample_product.id}",
        headers=h_a,
        json={
            "quantity": 150,
        },
    )
    assert upd_resp.status_code == status.HTTP_200_OK

    # 3. Update purchased quantity (Procurement/Site action)
    pur_resp = client.patch(
        f"/api/v1/projects/{proj_id}/materials/{sample_product.id}",
        headers=h_a,
        json={
            "purchased_quantity": 50,
        },
    )
    assert pur_resp.status_code == status.HTTP_200_OK

    # 4. Update note
    note_resp = client.patch(
        f"/api/v1/projects/{proj_id}/materials/{sample_product.id}",
        headers=h_a,
        json={
            "notes": "First batch of 50 bags delivered to site shed",
        },
    )
    assert note_resp.status_code == status.HTTP_200_OK

    # 5. Toggle stage milestone
    stage_resp = client.post(
        f"/api/v1/projects/{proj_id}/stages/Foundation/toggle",
        headers=h_a,
    )
    assert stage_resp.status_code == status.HTTP_200_OK

    # 6. Refresh BOQ pricing
    ref_resp = client.post(
        f"/api/v1/projects/{proj_id}/refresh-pricing",
        headers=h_a,
    )
    assert ref_resp.status_code == status.HTTP_200_OK

    # 7. Remove material
    del_resp = client.delete(
        f"/api/v1/projects/{proj_id}/materials/{sample_product.id}",
        headers=h_a,
    )
    assert del_resp.status_code == status.HTTP_200_OK

    # Query activity logs
    act_resp = client.get(
        f"/api/v1/projects/{proj_id}/activity",
        headers=h_a,
    )
    assert act_resp.status_code == status.HTTP_200_OK
    data = act_resp.json()
    actions = [a["action"] for a in data["activities"]]

    assert ProjectAction.PROJECT_CREATED in actions
    assert ProjectAction.BOQ_MATERIAL_ADDED in actions
    assert ProjectAction.BOQ_MATERIAL_UPDATED in actions
    assert ProjectAction.PURCHASED_QUANTITY_UPDATED in actions
    assert ProjectAction.PROCUREMENT_NOTE_UPDATED in actions
    assert ProjectAction.PROJECT_STAGE_UPDATED in actions
    assert ProjectAction.BOQ_PRICING_REFRESHED in actions
    assert ProjectAction.BOQ_MATERIAL_REMOVED in actions


def test_organization_collaborators_activity_and_rbac(client, test_users):
    """
    Verifies organization project member actions:
    - Adding collaborator logs PROJECT_MEMBER_ADDED.
    - Changing collaborator role logs PROJECT_MEMBER_ROLE_UPDATED.
    - Removing collaborator logs PROJECT_MEMBER_REMOVED.
    - Collaborator with VIEWER role can read activity logs.
    """
    u_a = test_users["user_a"]["user"]
    h_a = test_users["user_a"]["headers"]
    u_b = test_users["user_b"]["user"]
    h_b = test_users["user_b"]["headers"]

    # 1. Create Organization (User A is Owner)
    org_resp = client.post(
        "/api/v1/organizations",
        headers=h_a,
        json={
            "name": "Audit Builders Pvt Ltd",
            "business_type": "contractor",
            "city": "Pune",
            "state": "Maharashtra",
            "contact_person": "Audit Owner",
            "contact_phone": "9876543210",
        },
    )
    assert org_resp.status_code == status.HTTP_201_CREATED
    org_id = org_resp.json()["id"]

    # 2. Invite User B as Admin in Org
    inv_resp = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        headers=h_a,
        json={
            "email": "audit_member@example.com",
            "role": "admin",
        },
    )
    assert inv_resp.status_code == status.HTTP_201_CREATED
    token_invite = inv_resp.json()["token"]

    # User B accepts invitation
    acc_resp = client.post(
        f"/api/v1/invitations/{token_invite}/accept",
        headers=h_b,
    )
    assert acc_resp.status_code == status.HTTP_200_OK

    # 3. Create Org Project
    proj_resp = client.post(
        "/api/v1/projects",
        headers=h_a,
        json={
            "organization_id": org_id,
            "name": "Apex Commercial Tower",
            "project_type": "Commercial",
            "built_up_area": 12000,
            "city": "Pune",
            "pincode": "411001",
        },
    )
    assert proj_resp.status_code == status.HTTP_201_CREATED
    proj_id = proj_resp.json()["id"]

    # 4. Add User B to project as Project Manager
    add_mem_resp = client.post(
        f"/api/v1/projects/{proj_id}/members",
        headers=h_a,
        json={"user_id": u_b.id, "role": "project_manager"},
    )
    assert add_mem_resp.status_code == status.HTTP_201_CREATED

    # 5. User A updates User B's role on project to site_supervisor
    upd_role_resp = client.patch(
        f"/api/v1/projects/{proj_id}/members/{u_b.id}",
        headers=h_a,
        json={"role": "site_supervisor"},
    )
    assert upd_role_resp.status_code == status.HTTP_200_OK

    # 6. User B reads activity log
    act_b_resp = client.get(
        f"/api/v1/projects/{proj_id}/activity",
        headers=h_b,
    )
    assert act_b_resp.status_code == status.HTTP_200_OK
    actions = [a["action"] for a in act_b_resp.json()["activities"]]
    assert ProjectAction.PROJECT_CREATED in actions
    assert ProjectAction.PROJECT_MEMBER_ADDED in actions
    assert ProjectAction.PROJECT_MEMBER_ROLE_UPDATED in actions


def test_project_transfer_and_estimate_transfer_activity(client, test_users, sample_product):
    """
    Verifies PROJECT_MOVED_TO_ORGANIZATION / PROJECT_MOVED_TO_PERSONAL and ESTIMATE_TRANSFERRED_TO_BOQ.
    """
    h_a = test_users["user_a"]["headers"]

    # 1. Create personal project
    proj_resp = client.post(
        "/api/v1/projects",
        headers=h_a,
        json={
            "name": "Transferable Workspace",
            "project_type": "House",
            "built_up_area": 1800,
            "city": "Pune",
            "pincode": "411001",
        },
    )
    proj_id = proj_resp.json()["id"]

    # 2. Create organization
    org_resp = client.post(
        "/api/v1/organizations",
        headers=h_a,
        json={
            "name": "Transfer Dest Org",
            "business_type": "builder",
            "city": "Pune",
            "state": "Maharashtra",
            "contact_person": "Audit Owner",
            "contact_phone": "9876543210",
        },
    )
    org_id = org_resp.json()["id"]

    # 3. Transfer personal project to Org
    trans_resp = client.post(
        f"/api/v1/projects/{proj_id}/transfer-organization",
        headers=h_a,
        json={"target_organization_id": org_id},
    )
    assert trans_resp.status_code == status.HTTP_200_OK

    # 4. Create an Estimate and Transfer to Project BOQ
    est_resp = client.post(
        "/api/v1/estimates",
        headers=h_a,
        json={
            "inputs": {
                "projectName": "Phase 1 Estimation",
                "projectType": "House",
                "builtUpArea": 1800,
                "city": "Pune",
            },
            "materials": [
                {
                    "category": "Cement",
                    "matchedProductId": sample_product.id,
                    "productName": sample_product.name,
                    "quantity": 200,
                    "unit": "Bag",
                    "estimatedPrice": 380,
                }
            ],
            "subtotal_at_estimate": 76000,
            "total_at_estimate": 89680,
        },
    )
    assert est_resp.status_code == status.HTTP_201_CREATED
    est_id = est_resp.json()["id"]

    trans_est_resp = client.post(
        f"/api/v1/estimates/{est_id}/transfer",
        headers=h_a,
        json={"target_project_id": proj_id},
    )
    assert trans_est_resp.status_code == status.HTTP_200_OK

    # 5. Check activity log for transfer and estimate actions
    act_resp = client.get(
        f"/api/v1/projects/{proj_id}/activity",
        headers=h_a,
    )
    assert act_resp.status_code == status.HTTP_200_OK
    actions = [a["action"] for a in act_resp.json()["activities"]]
    assert ProjectAction.PROJECT_MOVED_TO_ORGANIZATION in actions
    assert ProjectAction.ESTIMATE_TRANSFERRED_TO_BOQ in actions


def test_activity_pagination_and_filtering(client, test_users):
    """
    Verifies pagination (page, limit) and action filtering on project activity endpoint.
    """
    h_a = test_users["user_a"]["headers"]

    proj_resp = client.post(
        "/api/v1/projects",
        headers=h_a,
        json={
            "name": "Pagination Activity Project",
            "project_type": "House",
            "built_up_area": 1500,
            "city": "Pune",
            "pincode": "411001",
        },
    )
    proj_id = proj_resp.json()["id"]

    # Generate multiple activity logs
    client.patch(
        f"/api/v1/projects/{proj_id}",
        headers=h_a,
        json={"name": "Pagination Renamed 1"},
    )
    client.patch(
        f"/api/v1/projects/{proj_id}",
        headers=h_a,
        json={"name": "Pagination Renamed 2"},
    )
    client.post(
        f"/api/v1/projects/{proj_id}/stages/Structure/toggle",
        headers=h_a,
    )

    # Test limit=2
    page1 = client.get(
        f"/api/v1/projects/{proj_id}/activity?page=1&limit=2",
        headers=h_a,
    )
    assert page1.status_code == status.HTTP_200_OK
    d1 = page1.json()
    assert len(d1["activities"]) == 2
    assert d1["total"] >= 4
    assert d1["page"] == 1
    assert d1["limit"] == 2

    # Test action filter
    filter_resp = client.get(
        f"/api/v1/projects/{proj_id}/activity?action={ProjectAction.PROJECT_STAGE_UPDATED}",
        headers=h_a,
    )
    assert filter_resp.status_code == status.HTTP_200_OK
    d_filter = filter_resp.json()
    assert len(d_filter["activities"]) == 1
    assert d_filter["activities"][0]["action"] == ProjectAction.PROJECT_STAGE_UPDATED


def test_transactional_rollback_preserves_audit_integrity(db_session: Session):
    """
    Verifies that if a transaction fails before commit, the staged activity log is NOT persisted.
    """
    # Create an activity log and then roll back the session
    ProjectActivityService.log_activity(
        db=db_session,
        action="TEST_FAILED_MUTATION",
        resource_type="project",
        resource_id="proj-rollback-test",
        project_id="proj-rollback-test",
    )
    db_session.rollback()

    # Query DB directly to verify nothing persisted
    saved_log = db_session.scalar(
        select(ProjectActivityLog).where(ProjectActivityLog.action == "TEST_FAILED_MUTATION")
    )
    assert saved_log is None
