import pytest
from decimal import Decimal
from fastapi import status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.notification import ProjectNotification
from app.models.activity import ProjectAction
from app.models.user import User, UserRole, AccountType
from app.models.category import Category
from app.models.product import Product
from app.models.organization import (
    Organization,
    OrganizationMember,
    OrgRole,
)
from app.core.security import create_access_token, hash_password
from app.services.notification_service import ProjectNotificationService
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
    user_a = create_user(db_session, "notif_owner@example.com", "Notif Owner")
    user_b = create_user(db_session, "notif_member@example.com", "Notif Member")
    user_c = create_user(db_session, "notif_outsider@example.com", "Notif Outsider")

    return {
        "user_a": {"user": user_a, "headers": auth_header(user_a)},
        "user_b": {"user": user_b, "headers": auth_header(user_b)},
        "user_c": {"user": user_c, "headers": auth_header(user_c)},
    }


@pytest.fixture
def sample_product(db_session: Session):
    cat = db_session.get(Category, "cat-notif-1")
    if not cat:
        cat = Category(id="cat-notif-1", name="Building Materials", slug="building-materials-notif", is_active=True)
        db_session.add(cat)
        db_session.commit()

    prod = db_session.get(Product, "prod-notif-steel")
    if not prod:
        prod = Product(
            id="prod-notif-steel",
            name="TMT Steel Fe 550D 12mm",
            slug="tmt-steel-fe-550d-12mm",
            brand="Tata Tiscon",
            category_id="cat-notif-1",
            price=Decimal("68.00"),
            mrp=Decimal("75.00"),
            discount_percent=9,
            unit="Kg",
            is_active=True,
        )
        db_session.add(prod)
        db_session.commit()
        db_session.refresh(prod)
    return prod


def test_member_addition_generates_notification(client, test_users):
    """
    When User A assigns User B to an org project, User B receives a notification.
    User A (the actor) does not receive a self-notification.
    """
    u_a = test_users["user_a"]["user"]
    h_a = test_users["user_a"]["headers"]
    u_b = test_users["user_b"]["user"]
    h_b = test_users["user_b"]["headers"]

    # 1. Create Organization
    org_resp = client.post(
        "/api/v1/organizations",
        headers=h_a,
        json={
            "name": "Notif Construction Group",
            "business_type": "contractor",
            "city": "Pune",
            "state": "Maharashtra",
            "contact_person": "Notif Owner",
            "contact_phone": "9876543210",
        },
    )
    assert org_resp.status_code == status.HTTP_201_CREATED
    org_id = org_resp.json()["id"]

    # 2. Invite User B and accept
    inv_resp = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        headers=h_a,
        json={"email": u_b.email, "role": "admin"},
    )
    token_invite = inv_resp.json()["token"]
    client.post(f"/api/v1/invitations/{token_invite}/accept", headers=h_b)

    # 3. Create Project
    proj_resp = client.post(
        "/api/v1/projects",
        headers=h_a,
        json={
            "organization_id": org_id,
            "name": "Highway Interchange",
            "project_type": "Infrastructure",
            "built_up_area": 10000,
            "city": "Pune",
            "pincode": "411001",
        },
    )
    assert proj_resp.status_code == status.HTTP_201_CREATED
    proj_id = proj_resp.json()["id"]

    # 4. User A assigns User B as Site Supervisor
    add_mem = client.post(
        f"/api/v1/projects/{proj_id}/members",
        headers=h_a,
        json={"user_id": u_b.id, "role": "site_supervisor"},
    )
    assert add_mem.status_code == status.HTTP_201_CREATED

    # 5. Check User B's notification center
    notifs_b = client.get("/api/v1/notifications", headers=h_b)
    assert notifs_b.status_code == status.HTTP_200_OK
    b_data = notifs_b.json()
    assert b_data["total"] >= 1
    actions = [n["notification_type"] for n in b_data["notifications"]]
    assert ProjectAction.PROJECT_MEMBER_ADDED in actions

    target_notif = next(n for n in b_data["notifications"] if n["notification_type"] == ProjectAction.PROJECT_MEMBER_ADDED)
    assert "Assigned to Project Workspace" in target_notif["title"]
    assert "site supervisor" in target_notif["message"]

    # 6. Check User A (actor) has unread count = 0 (no self notification)
    unread_a = client.get("/api/v1/notifications/unread-count", headers=h_a)
    assert unread_a.status_code == status.HTTP_200_OK
    assert unread_a.json()["unread_count"] == 0


def test_boq_and_stage_notifications_to_collaborators(client, test_users, sample_product):
    """
    When User A modifies BOQ materials or milestones, assigned collaborator User B receives alerts.
    """
    u_a = test_users["user_a"]["user"]
    h_a = test_users["user_a"]["headers"]
    u_b = test_users["user_b"]["user"]
    h_b = test_users["user_b"]["headers"]

    # Setup Org, Project, and add User B
    org_resp = client.post(
        "/api/v1/organizations",
        headers=h_a,
        json={
            "name": "Infra Infra Corp",
            "business_type": "builder",
            "city": "Pune",
            "state": "Maharashtra",
            "contact_person": "Notif Owner",
            "contact_phone": "9876543210",
        },
    )
    org_id = org_resp.json()["id"]

    inv_resp = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        headers=h_a,
        json={"email": u_b.email, "role": "admin"},
    )
    client.post(f"/api/v1/invitations/{inv_resp.json()['token']}/accept", headers=h_b)

    proj_resp = client.post(
        "/api/v1/projects",
        headers=h_a,
        json={
            "organization_id": org_id,
            "name": "Skyline Heights",
            "project_type": "Commercial",
            "built_up_area": 8000,
            "city": "Pune",
            "pincode": "411001",
        },
    )
    proj_id = proj_resp.json()["id"]
    client.post(f"/api/v1/projects/{proj_id}/members", headers=h_a, json={"user_id": u_b.id, "role": "project_manager"})

    # 1. User A adds material
    client.post(
        f"/api/v1/projects/{proj_id}/materials",
        headers=h_a,
        json={
            "product_id": sample_product.id,
            "quantity": 500,
            "unit": "Kg",
            "stage": "Structure",
        },
    )

    # 2. User A toggles milestone stage
    client.post(
        f"/api/v1/projects/{proj_id}/stages/Structure/toggle",
        headers=h_a,
    )

    # 3. User B checks notifications
    notifs_b = client.get("/api/v1/notifications", headers=h_b)
    assert notifs_b.status_code == status.HTTP_200_OK
    b_data = notifs_b.json()
    actions = [n["notification_type"] for n in b_data["notifications"]]
    assert ProjectAction.BOQ_MATERIAL_ADDED in actions
    assert ProjectAction.PROJECT_STAGE_UPDATED in actions


def test_notification_read_state_and_unread_count(client, test_users, sample_product):
    """
    Tests marking one notification as read, unread count decrement, and mark-all-read.
    """
    u_a = test_users["user_a"]["user"]
    h_a = test_users["user_a"]["headers"]
    u_b = test_users["user_b"]["user"]
    h_b = test_users["user_b"]["headers"]

    # Setup org & project with user B
    org_resp = client.post(
        "/api/v1/organizations",
        headers=h_a,
        json={
            "name": "Read State Org",
            "business_type": "builder",
            "city": "Pune",
            "state": "Maharashtra",
            "contact_person": "Notif Owner",
            "contact_phone": "9876543210",
        },
    )
    org_id = org_resp.json()["id"]
    inv_resp = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        headers=h_a,
        json={"email": u_b.email, "role": "admin"},
    )
    client.post(f"/api/v1/invitations/{inv_resp.json()['token']}/accept", headers=h_b)

    proj_resp = client.post(
        "/api/v1/projects",
        headers=h_a,
        json={
            "organization_id": org_id,
            "name": "Reading Towers",
            "project_type": "Villa",
            "built_up_area": 3000,
            "city": "Pune",
            "pincode": "411001",
        },
    )
    proj_id = proj_resp.json()["id"]
    client.post(f"/api/v1/projects/{proj_id}/members", headers=h_a, json={"user_id": u_b.id, "role": "project_manager"})

    # Action 1: Add material
    client.post(
        f"/api/v1/projects/{proj_id}/materials",
        headers=h_a,
        json={"product_id": sample_product.id, "quantity": 100, "unit": "Kg"},
    )

    # Action 2: Update milestone
    client.post(
        f"/api/v1/projects/{proj_id}/stages/Foundation/toggle",
        headers=h_a,
    )

    # Check initial unread count for User B
    initial_unread = client.get("/api/v1/notifications/unread-count", headers=h_b).json()["unread_count"]
    assert initial_unread >= 2

    # Fetch User B notifications
    notifs_b = client.get("/api/v1/notifications", headers=h_b).json()["notifications"]
    first_notif_id = notifs_b[0]["id"]

    # Mark first notification as read
    read_resp = client.patch(f"/api/v1/notifications/{first_notif_id}/read", headers=h_b)
    assert read_resp.status_code == status.HTTP_200_OK
    assert read_resp.json()["is_read"] is True
    assert read_resp.json()["read_at"] is not None

    # Check unread count decremented by 1
    new_unread = client.get("/api/v1/notifications/unread-count", headers=h_b).json()["unread_count"]
    assert new_unread == initial_unread - 1

    # Mark all as read
    mark_all_resp = client.post("/api/v1/notifications/read-all", headers=h_b)
    assert mark_all_resp.status_code == status.HTTP_200_OK

    # Unread count must now be 0
    final_unread = client.get("/api/v1/notifications/unread-count", headers=h_b).json()["unread_count"]
    assert final_unread == 0


def test_idor_security_user_isolation(client, test_users):
    """
    IDOR tests:
    - User C cannot read User B's notification.
    - User C cannot mark User B's notification as read.
    - User C cannot see User B's unread count.
    """
    u_a = test_users["user_a"]["user"]
    h_a = test_users["user_a"]["headers"]
    u_b = test_users["user_b"]["user"]
    h_b = test_users["user_b"]["headers"]
    h_c = test_users["user_c"]["headers"]

    # Setup org & project with user B
    org_resp = client.post(
        "/api/v1/organizations",
        headers=h_a,
        json={
            "name": "IDOR Defense Org",
            "business_type": "builder",
            "city": "Pune",
            "state": "Maharashtra",
            "contact_person": "Notif Owner",
            "contact_phone": "9876543210",
        },
    )
    org_id = org_resp.json()["id"]
    inv_resp = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        headers=h_a,
        json={"email": u_b.email, "role": "admin"},
    )
    client.post(f"/api/v1/invitations/{inv_resp.json()['token']}/accept", headers=h_b)

    proj_resp = client.post(
        "/api/v1/projects",
        headers=h_a,
        json={
            "organization_id": org_id,
            "name": "IDOR Fortress",
            "project_type": "Villa",
            "built_up_area": 3000,
            "city": "Pune",
            "pincode": "411001",
        },
    )
    proj_id = proj_resp.json()["id"]
    client.post(f"/api/v1/projects/{proj_id}/members", headers=h_a, json={"user_id": u_b.id, "role": "project_manager"})

    # Get User B's notification
    b_notifs = client.get("/api/v1/notifications", headers=h_b).json()["notifications"]
    assert len(b_notifs) > 0
    b_notif_id = b_notifs[0]["id"]

    # User C attempts to mark User B's notification read
    idor_mark = client.patch(f"/api/v1/notifications/{b_notif_id}/read", headers=h_c)
    assert idor_mark.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    # User C lists notifications with project filter of User B's project
    c_list = client.get(f"/api/v1/notifications?project_id={proj_id}", headers=h_c)
    assert c_list.status_code == status.HTTP_200_OK
    assert c_list.json()["total"] == 0  # No leaked notifications


def test_removed_member_receives_no_future_notifications(client, test_users, sample_product):
    """
    Once a member is removed from a project, they must NOT receive subsequent notifications.
    """
    u_a = test_users["user_a"]["user"]
    h_a = test_users["user_a"]["headers"]
    u_b = test_users["user_b"]["user"]
    h_b = test_users["user_b"]["headers"]

    # Setup
    org_resp = client.post(
        "/api/v1/organizations",
        headers=h_a,
        json={
            "name": "Departing Org",
            "business_type": "contractor",
            "city": "Pune",
            "state": "Maharashtra",
            "contact_person": "Notif Owner",
            "contact_phone": "9876543210",
        },
    )
    org_id = org_resp.json()["id"]
    inv_resp = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        headers=h_a,
        json={"email": u_b.email, "role": "admin"},
    )
    client.post(f"/api/v1/invitations/{inv_resp.json()['token']}/accept", headers=h_b)

    proj_resp = client.post(
        "/api/v1/projects",
        headers=h_a,
        json={
            "organization_id": org_id,
            "name": "Exiting Project",
            "project_type": "House",
            "built_up_area": 2000,
            "city": "Pune",
            "pincode": "411001",
        },
    )
    proj_id = proj_resp.json()["id"]
    client.post(f"/api/v1/projects/{proj_id}/members", headers=h_a, json={"user_id": u_b.id, "role": "site_supervisor"})

    # User A removes User B from project
    client.delete(f"/api/v1/projects/{proj_id}/members/{u_b.id}", headers=h_a)
    # Also remove User B from organization
    client.delete(f"/api/v1/organizations/{org_id}/members/{u_b.id}", headers=h_a)

    # Record notification count after removal
    b_count_before = client.get("/api/v1/notifications", headers=h_b).json()["total"]

    # User A performs subsequent project operations
    client.post(
        f"/api/v1/projects/{proj_id}/materials",
        headers=h_a,
        json={"product_id": sample_product.id, "quantity": 100, "unit": "Kg"},
    )
    client.post(
        f"/api/v1/projects/{proj_id}/stages/Finishing/toggle",
        headers=h_a,
    )

    # Verify User B received no new notifications
    b_count_after = client.get("/api/v1/notifications", headers=h_b).json()["total"]
    assert b_count_after == b_count_before


def test_transaction_rollback_prevents_ghost_notifications(db_session: Session):
    """
    Verifies that when a session rollback occurs, no orphaned notification is committed to DB.
    """
    user = create_user(db_session, "rollback_notif@example.com", "Rollback Notif")
    
    notif = ProjectNotification(
        id="notif-ghost-test",
        recipient_user_id=user.id,
        notification_type="TEST_ACTION",
        title="Ghost Alert",
        message="This should never be saved",
        is_read=False,
    )
    db_session.add(notif)
    db_session.rollback()

    # Query DB directly to verify nothing persisted
    saved = db_session.scalar(
        select(ProjectNotification).where(ProjectNotification.id == "notif-ghost-test")
    )
    assert saved is None


def test_missing_actor_gracefully_handled(db_session: Session, client, test_users):
    """
    When actor_user_id is None or deleted user, notification listing does not crash.
    """
    u_b = test_users["user_b"]["user"]
    h_b = test_users["user_b"]["headers"]

    notif = ProjectNotification(
        id="notif-missing-actor-test",
        recipient_user_id=u_b.id,
        notification_type=ProjectAction.PROJECT_UPDATED,
        title="Orphaned Actor Notification",
        message="A past member updated specifications.",
        metadata_={"actor_name": "Former User"},
        is_read=False,
    )
    db_session.add(notif)
    db_session.commit()

    resp = client.get("/api/v1/notifications", headers=h_b)
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    found = next((n for n in data["notifications"] if n["id"] == "notif-missing-actor-test"), None)
    assert found is not None
    assert found["title"] == "Orphaned Actor Notification"
