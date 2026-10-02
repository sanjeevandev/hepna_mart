import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User, UserRole, AccountType
from app.models.organization import (
    Organization,
    OrganizationMember,
    OrganizationInvitation,
    OrgRole,
)
from app.core.security import create_access_token, hash_password


def create_test_user(db: Session, email: str, name: str = "Test User", role: UserRole = UserRole.CUSTOMER) -> User:
    user = User(
        id=f"usr-{email.split('@')[0]}",
        email=email,
        password_hash=hash_password("TestPassword123!"),
        first_name=name.split()[0],
        last_name=name.split()[-1] if len(name.split()) > 1 else "User",
        account_type=AccountType.BUSINESS,
        role=role,
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


def test_unauthenticated_organization_access_rejected(client: TestClient):
    res = client.get("/api/v1/organizations")
    assert res.status_code == 401

    res = client.post("/api/v1/organizations", json={"name": "Apex Corp"})
    assert res.status_code == 401


def test_create_organization_and_automatic_owner_membership(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "alice.owner@apex.in", "Alice Owner")
    headers = auth_header(owner)

    res = client.post(
        "/api/v1/organizations",
        headers=headers,
        json={
            "name": "Apex Infrastructure Pvt Ltd",
            "business_type": "Private Limited Company",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Apex Infrastructure Pvt Ltd"
    assert data["owner_id"] == owner.id
    assert data["current_user_role"] == "owner"
    assert data["member_count"] == 1
    org_id = data["id"]

    # Verify database membership
    mem = db_session.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == owner.id,
        )
    )
    assert mem is not None
    assert mem.role == OrgRole.OWNER


def test_list_and_get_user_organizations(client: TestClient, db_session: Session):
    user = create_test_user(db_session, "bob.builder@buildright.in", "Bob Builder")
    headers = auth_header(user)

    # Initially 0
    res = client.get("/api/v1/organizations", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 0

    # Create 2 orgs
    client.post("/api/v1/organizations", headers=headers, json={"name": "Org Alpha"})
    client.post("/api/v1/organizations", headers=headers, json={"name": "Org Beta"})

    res = client.get("/api/v1/organizations", headers=headers)
    assert res.status_code == 200
    orgs = res.json()
    assert len(orgs) == 2
    assert {o["name"] for o in orgs} == {"Org Alpha", "Org Beta"}

    # Get single org
    org_id = orgs[0]["id"]
    get_res = client.get(f"/api/v1/organizations/{org_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == org_id


def test_get_organization_non_member_forbidden(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "owner1@example.com", "Owner 1")
    stranger = create_test_user(db_session, "stranger@example.com", "Stranger User")

    res = client.post(
        "/api/v1/organizations",
        headers=auth_header(owner),
        json={"name": "Owner 1 Enterprise"},
    )
    org_id = res.json()["id"]

    # Stranger accesses org -> 403 Forbidden
    res_forbidden = client.get(f"/api/v1/organizations/{org_id}", headers=auth_header(stranger))
    assert res_forbidden.status_code == 403
    assert "not a member" in res_forbidden.json()["detail"].lower()


def test_update_organization_owner_and_admin_allowed(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "carol.owner@infra.com", "Carol Owner")
    admin = create_test_user(db_session, "dave.admin@infra.com", "Dave Admin")
    viewer = create_test_user(db_session, "eve.viewer@infra.com", "Eve Viewer")

    res = client.post("/api/v1/organizations", headers=auth_header(owner), json={"name": "Infra Tech"})
    org_id = res.json()["id"]

    # Add admin and viewer
    db_session.add(OrganizationMember(organization_id=org_id, user_id=admin.id, role=OrgRole.ADMIN))
    db_session.add(OrganizationMember(organization_id=org_id, user_id=viewer.id, role=OrgRole.VIEWER))
    db_session.commit()

    # Admin updates name
    admin_up = client.put(
        f"/api/v1/organizations/{org_id}",
        headers=auth_header(admin),
        json={"name": "Infra Tech Updated By Admin"},
    )
    assert admin_up.status_code == 200
    assert admin_up.json()["name"] == "Infra Tech Updated By Admin"

    # Viewer updates name -> 403 Forbidden
    viewer_up = client.put(
        f"/api/v1/organizations/{org_id}",
        headers=auth_header(viewer),
        json={"name": "Infra Tech Hacked By Viewer"},
    )
    assert viewer_up.status_code == 403


def test_list_organization_members(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "frank.owner@apex.in", "Frank Owner")
    member = create_test_user(db_session, "grace.pm@apex.in", "Grace PM")

    res = client.post("/api/v1/organizations", headers=auth_header(owner), json={"name": "Frank Construction"})
    org_id = res.json()["id"]

    db_session.add(OrganizationMember(organization_id=org_id, user_id=member.id, role=OrgRole.PROJECT_MANAGER))
    db_session.commit()

    # Member lists members
    list_res = client.get(f"/api/v1/organizations/{org_id}/members", headers=auth_header(member))
    assert list_res.status_code == 200
    members = list_res.json()
    assert len(members) == 2
    assert {m["role"] for m in members} == {"owner", "project_manager"}


def test_invitation_lifecycle_and_acceptance(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "helen.owner@con.in", "Helen Owner")
    invitee = create_test_user(db_session, "ian.invitee@con.in", "Ian Invitee")

    res = client.post("/api/v1/organizations", headers=auth_header(owner), json={"name": "Helen Builders"})
    org_id = res.json()["id"]

    # 1. Owner invites Ian
    inv_res = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        headers=auth_header(owner),
        json={"email": invitee.email, "role": "procurement_manager"},
    )
    assert inv_res.status_code == 201
    inv_data = inv_res.json()
    token = inv_data["token"]
    assert token is not None
    assert inv_data["status"] == "pending"
    assert inv_data["role"] == "procurement_manager"

    # 2. List invitations
    list_inv = client.get(f"/api/v1/organizations/{org_id}/invitations", headers=auth_header(owner))
    assert list_inv.status_code == 200
    assert len(list_inv.json()) == 1

    # 3. Invitee accepts token
    accept_res = client.post(f"/api/v1/invitations/{token}/accept", headers=auth_header(invitee))
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ok"
    assert accept_res.json()["role"] == "procurement_manager"

    # 4. Verify membership created
    mem_res = client.get(f"/api/v1/organizations/{org_id}/members", headers=auth_header(invitee))
    assert mem_res.status_code == 200
    assert any(m["user_id"] == invitee.id and m["role"] == "procurement_manager" for m in mem_res.json())


def test_invitation_replay_protection(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "jack.owner@re.in", "Jack Owner")
    invitee = create_test_user(db_session, "karen.rep@re.in", "Karen Rep")

    res = client.post("/api/v1/organizations", headers=auth_header(owner), json={"name": "Replay Org"})
    org_id = res.json()["id"]

    inv_res = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        headers=auth_header(owner),
        json={"email": invitee.email, "role": "viewer"},
    )
    token = inv_res.json()["token"]

    # Accept first time -> OK
    client.post(f"/api/v1/invitations/{token}/accept", headers=auth_header(invitee))

    # Replay same token -> 400 Bad Request
    replay_res = client.post(f"/api/v1/invitations/{token}/accept", headers=auth_header(invitee))
    assert replay_res.status_code == 400
    assert "already been accepted" in replay_res.json()["detail"].lower()


def test_invitation_wrong_email_rejected(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "leo.owner@org.in", "Leo Owner")
    intended = create_test_user(db_session, "intended@org.in", "Intended User")
    attacker = create_test_user(db_session, "attacker@other.in", "Attacker User")

    res = client.post("/api/v1/organizations", headers=auth_header(owner), json={"name": "Security Org"})
    org_id = res.json()["id"]

    inv_res = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        headers=auth_header(owner),
        json={"email": intended.email, "role": "admin"},
    )
    token = inv_res.json()["token"]

    # Attacker tries to accept intended user's token -> 403 Forbidden
    hijack_res = client.post(f"/api/v1/invitations/{token}/accept", headers=auth_header(attacker))
    assert hijack_res.status_code == 403
    assert "different email" in hijack_res.json()["detail"].lower()


def test_expired_invitation_rejected(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "mike.owner@exp.in", "Mike Owner")
    invitee = create_test_user(db_session, "nancy.exp@exp.in", "Nancy Exp")

    res = client.post("/api/v1/organizations", headers=auth_header(owner), json={"name": "Expired Org"})
    org_id = res.json()["id"]

    inv = OrganizationInvitation(
        id="inv-expired-1",
        organization_id=org_id,
        invited_by_user_id=owner.id,
        email=invitee.email,
        role=OrgRole.VIEWER,
        token="expired_token_12345",
        status="pending",
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),  # Expired yesterday
    )
    db_session.add(inv)
    db_session.commit()

    # Attempt to accept expired invitation -> 400 Bad Request
    exp_res = client.post("/api/v1/invitations/expired_token_12345/accept", headers=auth_header(invitee))
    assert exp_res.status_code == 400
    assert "expired" in exp_res.json()["detail"].lower()


def test_revoked_invitation_rejected(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "oscar.owner@rev.in", "Oscar Owner")
    invitee = create_test_user(db_session, "paul.rev@rev.in", "Paul Rev")

    res = client.post("/api/v1/organizations", headers=auth_header(owner), json={"name": "Revocation Org"})
    org_id = res.json()["id"]

    inv_res = client.post(
        f"/api/v1/organizations/{org_id}/invitations",
        headers=auth_header(owner),
        json={"email": invitee.email, "role": "site_supervisor"},
    )
    inv_id = inv_res.json()["id"]
    token = inv_res.json()["token"]

    # Revoke invitation
    rev_res = client.delete(f"/api/v1/organizations/{org_id}/invitations/{inv_id}", headers=auth_header(owner))
    assert rev_res.status_code == 200

    # Attempt to accept revoked invitation -> 400 Bad Request
    accept_rev = client.post(f"/api/v1/invitations/{token}/accept", headers=auth_header(invitee))
    assert accept_rev.status_code == 400
    assert "revoked" in accept_rev.json()["detail"].lower()


def test_member_role_update_and_privilege_escalation_guards(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "quinn.owner@rbac.in", "Quinn Owner")
    admin = create_test_user(db_session, "rachel.admin@rbac.in", "Rachel Admin")
    member = create_test_user(db_session, "sam.mem@rbac.in", "Sam Member")

    res = client.post("/api/v1/organizations", headers=auth_header(owner), json={"name": "RBAC Guards Org"})
    org_id = res.json()["id"]

    db_session.add(OrganizationMember(organization_id=org_id, user_id=admin.id, role=OrgRole.ADMIN))
    db_session.add(OrganizationMember(organization_id=org_id, user_id=member.id, role=OrgRole.VIEWER))
    db_session.commit()

    # 1. Admin attempts to promote member to OWNER -> 403 Forbidden
    admin_esc = client.put(
        f"/api/v1/organizations/{org_id}/members/{member.id}",
        headers=auth_header(admin),
        json={"role": "owner"},
    )
    assert admin_esc.status_code == 403

    # 2. Admin attempts to demote OWNER -> 403 Forbidden
    admin_demote_owner = client.put(
        f"/api/v1/organizations/{org_id}/members/{owner.id}",
        headers=auth_header(admin),
        json={"role": "viewer"},
    )
    assert admin_demote_owner.status_code == 403

    # 3. Member attempts to promote themselves -> 400 Bad Request (cannot modify own role)
    self_esc = client.put(
        f"/api/v1/organizations/{org_id}/members/{member.id}",
        headers=auth_header(member),
        json={"role": "admin"},
    )
    assert self_esc.status_code == 400

    # 4. Owner updates member to procurement_manager -> 200 OK
    owner_up = client.put(
        f"/api/v1/organizations/{org_id}/members/{member.id}",
        headers=auth_header(owner),
        json={"role": "procurement_manager"},
    )
    assert owner_up.status_code == 200
    assert owner_up.json()["role"] == "procurement_manager"


def test_member_removal_and_owner_protection(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "tina.owner@rem.in", "Tina Owner")
    admin = create_test_user(db_session, "uma.admin@rem.in", "Uma Admin")
    member = create_test_user(db_session, "victor.mem@rem.in", "Victor Member")

    res = client.post("/api/v1/organizations", headers=auth_header(owner), json={"name": "Removal Org"})
    org_id = res.json()["id"]

    db_session.add(OrganizationMember(organization_id=org_id, user_id=admin.id, role=OrgRole.ADMIN))
    db_session.add(OrganizationMember(organization_id=org_id, user_id=member.id, role=OrgRole.VIEWER))
    db_session.commit()

    # 1. Admin attempts to remove OWNER -> 400 Bad Request
    admin_rem_owner = client.delete(
        f"/api/v1/organizations/{org_id}/members/{owner.id}",
        headers=auth_header(admin),
    )
    assert admin_rem_owner.status_code == 400

    # 2. Owner attempts to remove self -> 400 Bad Request
    owner_rem_self = client.delete(
        f"/api/v1/organizations/{org_id}/members/{owner.id}",
        headers=auth_header(owner),
    )
    assert owner_rem_self.status_code == 400

    # 3. Admin removes member -> 200 OK
    admin_rem_mem = client.delete(
        f"/api/v1/organizations/{org_id}/members/{member.id}",
        headers=auth_header(admin),
    )
    assert admin_rem_mem.status_code == 200


def test_cross_organization_idor_isolation(client: TestClient, db_session: Session):
    user_a = create_test_user(db_session, "user_a@org.in", "User A")
    user_b = create_test_user(db_session, "user_b@org.in", "User B")

    org_a = client.post("/api/v1/organizations", headers=auth_header(user_a), json={"name": "Org A"}).json()
    org_b = client.post("/api/v1/organizations", headers=auth_header(user_b), json={"name": "Org B"}).json()

    # User A tries to view Org B members -> 403 Forbidden
    res = client.get(f"/api/v1/organizations/{org_b['id']}/members", headers=auth_header(user_a))
    assert res.status_code == 403

    # User A tries to invite to Org B -> 403 Forbidden
    res = client.post(
        f"/api/v1/organizations/{org_b['id']}/invitations",
        headers=auth_header(user_a),
        json={"email": "someone@org.in", "role": "viewer"},
    )
    assert res.status_code == 403

    # User A tries to delete Org B member -> 403 Forbidden
    res = client.delete(
        f"/api/v1/organizations/{org_b['id']}/members/{user_b.id}",
        headers=auth_header(user_a),
    )
    assert res.status_code == 403


def test_all_org_roles_persisted_correctly(client: TestClient, db_session: Session):
    owner = create_test_user(db_session, "roles.owner@test.in", "Roles Owner")
    res = client.post("/api/v1/organizations", headers=auth_header(owner), json={"name": "Roles Matrix Org"})
    org_id = res.json()["id"]

    roles = [
        OrgRole.ADMIN,
        OrgRole.PROCUREMENT_MANAGER,
        OrgRole.PROJECT_MANAGER,
        OrgRole.SITE_SUPERVISOR,
        OrgRole.VIEWER,
    ]

    for r in roles:
        u = create_test_user(db_session, f"{r.value}@test.in", f"{r.value.title()} User")
        db_session.add(OrganizationMember(organization_id=org_id, user_id=u.id, role=r))
    db_session.commit()

    members = client.get(f"/api/v1/organizations/{org_id}/members", headers=auth_header(owner)).json()
    returned_roles = {m["role"] for m in members}
    assert "owner" in returned_roles
    for r in roles:
        assert r.value in returned_roles
