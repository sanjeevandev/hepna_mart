import pytest
from fastapi import status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.activity import ProjectAction, ProjectActivityLog
from app.models.notification import ProjectNotification
from app.models.comment import ProjectComment
from app.models.user import User, UserRole, AccountType
from app.models.organization import (
    Organization,
    OrganizationMember,
    OrgRole,
)
from app.core.security import create_access_token, hash_password


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
    user_a = create_user(db_session, "comment_owner@example.com", "Comment Owner")
    user_b = create_user(db_session, "comment_member@example.com", "Comment Member")
    user_c = create_user(db_session, "comment_outsider@example.com", "Comment Outsider")

    return {
        "user_a": {"user": user_a, "headers": auth_header(user_a)},
        "user_b": {"user": user_b, "headers": auth_header(user_b)},
        "user_c": {"user": user_c, "headers": auth_header(user_c)},
    }


def test_comment_unauthenticated_rejected(client):
    res = client.get("/api/v1/projects/proj-123/comments")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED

    res = client.post("/api/v1/projects/proj-123/comments", json={"content": "Hello"})
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


def test_comment_authorization_and_lifecycle(client, db_session: Session, test_users):
    u_a = test_users["user_a"]
    u_b = test_users["user_b"]
    u_c = test_users["user_c"]

    # 1. User A creates an organization and invites User B
    org_res = client.post(
        "/api/v1/organizations",
        json={
            "name": "BuildTech Infrastructure",
            "business_type": "contractor",
            "city": "Bengaluru",
            "state": "Karnataka",
            "contact_person": "Comment Owner",
            "contact_phone": "9876543210",
        },
        headers=u_a["headers"],
    )
    assert org_res.status_code == status.HTTP_201_CREATED
    org_id = org_res.json()["id"]

    inv_res = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        json={"email": u_b["user"].email, "role": "site_supervisor"},
        headers=u_a["headers"],
    )
    assert inv_res.status_code == status.HTTP_201_CREATED
    invite_token = inv_res.json()["token"]

    accept_res = client.post(
        f"/api/v1/invitations/{invite_token}/accept",
        headers=u_b["headers"],
    )
    assert accept_res.status_code == status.HTTP_200_OK

    # Create project in organization
    proj_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Tower A Construction",
            "project_type": "commercial",
            "built_up_area": 5000,
            "area_unit": "sq ft",
            "floors": 4,
            "stage": "Foundation",
            "city": "Bengaluru",
            "pincode": "560001",
            "organization_id": org_id,
        },
        headers=u_a["headers"],
    )
    assert proj_res.status_code == status.HTTP_201_CREATED
    project_id = proj_res.json()["id"]

    # Assign User B to the project
    add_pm_res = client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"user_id": u_b["user"].id, "role": "site_supervisor"},
        headers=u_a["headers"],
    )
    assert add_pm_res.status_code == status.HTTP_201_CREATED

    # 2. User B posts a valid comment mentioning User A
    post_res = client.post(
        f"/api/v1/projects/{project_id}/comments",
        json={"content": "Foundation soil testing completed. Ready for concrete pour. @comment_owner please review."},
        headers=u_b["headers"],
    )
    assert post_res.status_code == status.HTTP_201_CREATED
    comment_data = post_res.json()
    assert "Foundation soil testing completed" in comment_data["content"]
    assert comment_data["user_id"] == u_b["user"].id
    assert comment_data["is_edited"] is False
    assert comment_data["author"]["id"] == u_b["user"].id
    comment_id = comment_data["id"]

    # 3. User A reads comments list
    list_res = client.get(
        f"/api/v1/projects/{project_id}/comments",
        headers=u_a["headers"],
    )
    assert list_res.status_code == status.HTTP_200_OK
    list_data = list_res.json()
    assert list_data["total"] == 1
    assert list_data["comments"][0]["id"] == comment_id

    # 4. Check Activity Log was created
    act_log = db_session.scalar(
        select(ProjectActivityLog).where(
            ProjectActivityLog.project_id == project_id,
            ProjectActivityLog.action == ProjectAction.COMMENT_CREATED,
        )
    )
    assert act_log is not None
    assert act_log.actor_user_id == u_b["user"].id

    # 5. Check Notifications: User A (Org Owner) got notified, User B (actor) did NOT get self-notified
    user_a_notifs = db_session.scalars(
        select(ProjectNotification).where(
            ProjectNotification.recipient_user_id == u_a["user"].id,
            ProjectNotification.project_id == project_id,
            ProjectNotification.notification_type == ProjectAction.COMMENT_CREATED,
        )
    ).all()
    assert len(user_a_notifs) == 1
    assert "commented on project" in user_a_notifs[0].message

    user_b_notifs = db_session.scalars(
        select(ProjectNotification).where(
            ProjectNotification.recipient_user_id == u_b["user"].id,
            ProjectNotification.project_id == project_id,
            ProjectNotification.notification_type == ProjectAction.COMMENT_CREATED,
        )
    ).all()
    assert len(user_b_notifs) == 0  # Actor excluded

    # Outsider C gets 0 notifications
    user_c_notifs = db_session.scalars(
        select(ProjectNotification).where(
            ProjectNotification.recipient_user_id == u_c["user"].id,
            ProjectNotification.project_id == project_id,
        )
    ).all()
    assert len(user_c_notifs) == 0

    # 6. User B updates own comment
    update_res = client.patch(
        f"/api/v1/projects/{project_id}/comments/{comment_id}",
        json={"content": "Foundation soil testing completed with Grade A report."},
        headers=u_b["headers"],
    )
    assert update_res.status_code == status.HTTP_200_OK
    assert update_res.json()["content"] == "Foundation soil testing completed with Grade A report."
    assert update_res.json()["is_edited"] is True

    # 7. User A attempts to edit User B's comment -> Should be Forbidden (403)
    edit_by_other_res = client.patch(
        f"/api/v1/projects/{project_id}/comments/{comment_id}",
        json={"content": "Malicious edit attempt by other user"},
        headers=u_a["headers"],
    )
    assert edit_by_other_res.status_code == status.HTTP_403_FORBIDDEN


def test_comment_validation(client, test_users):
    u_a = test_users["user_a"]

    # Create personal project
    proj_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Personal Villa",
            "project_type": "residential",
            "built_up_area": 2400,
            "area_unit": "sq ft",
            "floors": 2,
            "stage": "Planning",
            "city": "Mysuru",
            "pincode": "570001",
        },
        headers=u_a["headers"],
    )
    assert proj_res.status_code == status.HTTP_201_CREATED
    project_id = proj_res.json()["id"]

    # Empty string
    res = client.post(
        f"/api/v1/projects/{project_id}/comments",
        json={"content": ""},
        headers=u_a["headers"],
    )
    assert res.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, 422]

    # Whitespace only
    res = client.post(
        f"/api/v1/projects/{project_id}/comments",
        json={"content": "   \n\t  "},
        headers=u_a["headers"],
    )
    assert res.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, 422]

    # Max length exceeded (> 5000 chars)
    res = client.post(
        f"/api/v1/projects/{project_id}/comments",
        json={"content": "A" * 5001},
        headers=u_a["headers"],
    )
    assert res.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, 422]


def test_comment_deletion_permissions(client, test_users):
    u_a = test_users["user_a"]
    u_b = test_users["user_b"]

    # User A creates Org and invites User B as viewer
    org_res = client.post(
        "/api/v1/organizations",
        json={
            "name": "Skyline Builders",
            "business_type": "contractor",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "contact_person": "Skyline Owner",
            "contact_phone": "9876543211",
        },
        headers=u_a["headers"],
    )
    org_id = org_res.json()["id"]

    inv_res = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        json={"email": u_b["user"].email, "role": "viewer"},
        headers=u_a["headers"],
    )
    token = inv_res.json()["token"]
    client.post(f"/api/v1/invitations/{token}/accept", headers=u_b["headers"])

    proj_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Skyline Heights",
            "project_type": "residential",
            "built_up_area": 10000,
            "area_unit": "sq ft",
            "floors": 10,
            "stage": "Structure",
            "city": "Chennai",
            "pincode": "600001",
            "organization_id": org_id,
        },
        headers=u_a["headers"],
    )
    project_id = proj_res.json()["id"]

    client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"user_id": u_b["user"].id, "role": "viewer"},
        headers=u_a["headers"],
    )

    # User A posts a comment
    c1_res = client.post(
        f"/api/v1/projects/{project_id}/comments",
        json={"content": "Welcome to Skyline Heights project."},
        headers=u_a["headers"],
    )
    c1_id = c1_res.json()["id"]

    # User B (viewer) attempts to delete User A's comment -> Should fail (403)
    del_fail = client.delete(
        f"/api/v1/projects/{project_id}/comments/{c1_id}",
        headers=u_b["headers"],
    )
    assert del_fail.status_code == status.HTTP_403_FORBIDDEN

    # User B posts own comment
    c2_res = client.post(
        f"/api/v1/projects/{project_id}/comments",
        json={"content": "Noted, reviewing drawings."},
        headers=u_b["headers"],
    )
    c2_id = c2_res.json()["id"]

    # User B deletes own comment -> Should succeed (204)
    del_c2 = client.delete(
        f"/api/v1/projects/{project_id}/comments/{c2_id}",
        headers=u_b["headers"],
    )
    assert del_c2.status_code == status.HTTP_204_NO_CONTENT

    # User B posts another comment
    c3_res = client.post(
        f"/api/v1/projects/{project_id}/comments",
        json={"content": "Viewer comment to be moderated by owner."},
        headers=u_b["headers"],
    )
    c3_id = c3_res.json()["id"]

    # User A (Org Owner) deletes User B's comment -> Should succeed (204)
    del_by_owner = client.delete(
        f"/api/v1/projects/{project_id}/comments/{c3_id}",
        headers=u_a["headers"],
    )
    assert del_by_owner.status_code == status.HTTP_204_NO_CONTENT


def test_cross_project_isolation(client, test_users):
    u_a = test_users["user_a"]
    u_b = test_users["user_b"]

    # User A creates private personal project
    p1_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Secret Project A",
            "project_type": "residential",
            "built_up_area": 1200,
            "area_unit": "sq ft",
            "floors": 1,
            "stage": "Planning",
            "city": "Kochi",
            "pincode": "682001",
        },
        headers=u_a["headers"],
    )
    p1_id = p1_res.json()["id"]

    # User A adds a comment to Project A
    c_res = client.post(
        f"/api/v1/projects/{p1_id}/comments",
        json={"content": "Confidential budget discussion for Project A."},
        headers=u_a["headers"],
    )
    comment_id = c_res.json()["id"]

    # User B (unrelated user) attempts to list comments on Project A -> 403 Forbidden
    u2_list = client.get(
        f"/api/v1/projects/{p1_id}/comments",
        headers=u_b["headers"],
    )
    assert u2_list.status_code == status.HTTP_403_FORBIDDEN

    # User B attempts to post a comment to Project A -> 403 Forbidden
    u2_post = client.post(
        f"/api/v1/projects/{p1_id}/comments",
        json={"content": "Intrusion attempt"},
        headers=u_b["headers"],
    )
    assert u2_post.status_code == status.HTTP_403_FORBIDDEN

    # User B creates their own Project B
    p2_res = client.post(
        "/api/v1/projects",
        json={
            "name": "User 2 Project B",
            "project_type": "commercial",
            "built_up_area": 3000,
            "area_unit": "sq ft",
            "floors": 2,
            "stage": "Foundation",
            "city": "Pune",
            "pincode": "411001",
        },
        headers=u_b["headers"],
    )
    p2_id = p2_res.json()["id"]

    # User B attempts to access comment from Project A via Project B endpoint -> 404 Not Found (since comment_id is not on Project B)
    cross_edit = client.patch(
        f"/api/v1/projects/{p2_id}/comments/{comment_id}",
        json={"content": "Attempt cross project edit"},
        headers=u_b["headers"],
    )
    assert cross_edit.status_code == status.HTTP_404_NOT_FOUND


def test_comment_pagination(client, test_users):
    u_a = test_users["user_a"]

    p_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Pagination Project",
            "project_type": "residential",
            "built_up_area": 1500,
            "area_unit": "sq ft",
            "floors": 2,
            "stage": "Finishing",
            "city": "Delhi",
            "pincode": "110001",
        },
        headers=u_a["headers"],
    )
    p_id = p_res.json()["id"]

    for i in range(5):
        client.post(
            f"/api/v1/projects/{p_id}/comments",
            json={"content": f"Comment message #{i + 1}"},
            headers=u_a["headers"],
        )

    # Page 1, limit 2
    page1 = client.get(
        f"/api/v1/projects/{p_id}/comments?page=1&limit=2",
        headers=u_a["headers"],
    )
    assert page1.status_code == status.HTTP_200_OK
    d1 = page1.json()
    assert d1["total"] == 5
    assert len(d1["comments"]) == 2
    assert d1["comments"][0]["content"] == "Comment message #1"
    assert d1["comments"][1]["content"] == "Comment message #2"

    # Page 2, limit 2
    page2 = client.get(
        f"/api/v1/projects/{p_id}/comments?page=2&limit=2",
        headers=u_a["headers"],
    )
    assert page2.status_code == status.HTTP_200_OK
    d2 = page2.json()
    assert len(d2["comments"]) == 2
    assert d2["comments"][0]["content"] == "Comment message #3"
    assert d2["comments"][1]["content"] == "Comment message #4"
