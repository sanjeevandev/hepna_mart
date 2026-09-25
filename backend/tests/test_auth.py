from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.user import User, AccountType, UserRole
from app.schemas.auth import RegisterRequest


def test_01_registration_succeeds(client: TestClient):
    payload = {
        "email": "customer.test@example.com",
        "password": "SecurePassword123!",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+91 99999 88888",
        "account_type": "contractor",
        "company_name": "Test Builder Corp",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "customer.test@example.com"
    assert data["user"]["role"] == "customer"
    assert data["user"]["account_type"] == "contractor"
    assert data["user"]["is_staff"] is False


def test_02_duplicate_email_fails(client: TestClient):
    payload = {
        "email": "dup@example.com",
        "password": "SecurePassword123!",
        "first_name": "First",
        "last_name": "User",
    }
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    r2 = client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"]


def test_03_invalid_email_fails(client: TestClient):
    payload = {
        "email": "not-an-email",
        "password": "SecurePassword123!",
        "first_name": "Test",
        "last_name": "User",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_04_weak_or_short_password_fails(client: TestClient):
    payload = {
        "email": "short@example.com",
        "password": "short",  # Under 8 chars
        "first_name": "Test",
        "last_name": "User",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_05_password_is_hashed_in_database(client: TestClient, db_session: Session):
    payload = {
        "email": "hashcheck@example.com",
        "password": "RawPassword123!",
        "first_name": "Hash",
        "last_name": "Check",
    }
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 201

    user = db_session.scalar(select(User).where(User.email == "hashcheck@example.com"))
    assert user is not None
    assert user.password_hash != "RawPassword123!"
    assert user.password_hash.startswith("$argon2")


def test_06_plaintext_password_never_returned_in_responses(client: TestClient):
    payload = {
        "email": "nopw@example.com",
        "password": "SecretPass123!",
        "first_name": "No",
        "last_name": "Password",
    }
    r_reg = client.post("/api/v1/auth/register", json=payload)
    data_reg = r_reg.json()
    assert "password" not in data_reg["user"]
    assert "password_hash" not in data_reg["user"]

    r_login = client.post("/api/v1/auth/login", json={"email": "nopw@example.com", "password": "SecretPass123!"})
    data_login = r_login.json()
    assert "password" not in data_login["user"]
    assert "password_hash" not in data_login["user"]


def test_07_login_succeeds(client: TestClient):
    # Register first
    client.post("/api/v1/auth/register", json={
        "email": "login.ok@example.com",
        "password": "ValidPassword123!",
        "first_name": "Login",
        "last_name": "Success",
    })

    # Login
    response = client.post("/api/v1/auth/login", json={
        "email": "login.ok@example.com",
        "password": "ValidPassword123!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login.ok@example.com"


def test_08_wrong_password_fails(client: TestClient):
    client.post("/api/v1/auth/register", json={
        "email": "wrongpw@example.com",
        "password": "CorrectPassword123!",
        "first_name": "Wrong",
        "last_name": "Pass",
    })

    response = client.post("/api/v1/auth/login", json={
        "email": "wrongpw@example.com",
        "password": "IncorrectPassword999!",
    })
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_09_unknown_email_fails(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "AnyPassword123!",
    })
    assert response.status_code == 401


def test_10_auth_me_requires_authentication(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_11_auth_me_returns_current_user_and_permissions(client: TestClient):
    r_reg = client.post("/api/v1/auth/register", json={
        "email": "me.check@example.com",
        "password": "ValidPassword123!",
        "first_name": "Priya",
        "last_name": "Sharma",
        "account_type": "business",
    })
    token = r_reg.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me.check@example.com"
    assert data["first_name"] == "Priya"
    assert data["role"] == "customer"
    assert isinstance(data["permissions"], list)


def test_12_inactive_user_is_rejected(client: TestClient, db_session: Session):
    # Create deactivated user directly
    user = User(
        email="inactive@example.com",
        password_hash=hash_password("Password123!"),
        first_name="Inactive",
        last_name="User",
        role=UserRole.CUSTOMER,
        account_type=AccountType.INDIVIDUAL,
        is_active=False,
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token(subject=user.id, role="customer", account_type="individual")

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert "deactivated" in response.json()["detail"].lower()


def test_13_customer_cannot_access_staff_only_endpoint(client: TestClient):
    r_reg = client.post("/api/v1/auth/register", json={
        "email": "cust.staff.block@example.com",
        "password": "Password123!",
        "first_name": "Cust",
        "last_name": "User",
    })
    token = r_reg.json()["access_token"]

    response = client.get(
        "/api/v1/admin/staff-access-test",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert "Staff authorization required" in response.json()["detail"]


def test_14_staff_role_can_access_permitted_endpoint(client: TestClient, db_session: Session):
    staff_user = User(
        email="procurement.staff@hepnamart.com",
        password_hash=hash_password("StaffPassword123!"),
        first_name="Rajesh",
        last_name="Kumar",
        role=UserRole.PROCUREMENT_MANAGER,
        account_type=AccountType.BUSINESS,
        is_active=True,
    )
    db_session.add(staff_user)
    db_session.commit()

    token = create_access_token(
        subject=staff_user.id,
        role=staff_user.role.value,
        account_type=staff_user.account_type.value,
    )

    response = client.get(
        "/api/v1/admin/staff-access-test",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["role"] == "procurement_manager"


def test_15_insufficient_role_gets_403(client: TestClient, db_session: Session):
    # Support staff attempting to access super-admin-only endpoint
    support_user = User(
        email="support@hepnamart.com",
        password_hash=hash_password("StaffPassword123!"),
        first_name="Ananya",
        last_name="Rao",
        role=UserRole.SUPPORT_STAFF,
        account_type=AccountType.BUSINESS,
        is_active=True,
    )
    db_session.add(support_user)
    db_session.commit()

    token = create_access_token(
        subject=support_user.id,
        role=support_user.role.value,
        account_type=support_user.account_type.value,
    )

    response = client.get(
        "/api/v1/admin/super-admin-access-test",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert "Super Administrator authorization required" in response.json()["detail"]


def test_16_missing_token_gets_401(client: TestClient):
    response = client.get("/api/v1/admin/staff-access-test")
    assert response.status_code == 401


def test_17_invalid_token_gets_401(client: TestClient):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_gibberish_token_string"},
    )
    assert response.status_code == 401


def test_18_expired_token_gets_401(client: TestClient, db_session: Session):
    user = User(
        email="expired@example.com",
        password_hash=hash_password("Password123!"),
        first_name="Exp",
        last_name="User",
        role=UserRole.CUSTOMER,
        account_type=AccountType.INDIVIDUAL,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    # Create expired token (10 minutes in the past)
    expired_token = create_access_token(
        subject=user.id,
        role="customer",
        account_type="individual",
        expires_delta=timedelta(minutes=-10),
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401


def test_19_public_registration_cannot_create_staff_role(client: TestClient, db_session: Session):
    payload = {
        "email": "hack.role@example.com",
        "password": "Password123!",
        "first_name": "Hacker",
        "last_name": "Attempt",
        "role": "super_admin",  # Attacker attempts to inject super_admin
    }
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 201
    assert r.json()["user"]["role"] == "customer"

    # Verify directly in DB
    user = db_session.scalar(select(User).where(User.email == "hack.role@example.com"))
    assert user.role == UserRole.CUSTOMER


def test_20_dev_seed_users_disabled_by_default(client: TestClient):
    # Verify default config is False
    assert settings.ENABLE_DEV_SEED_USERS is False

    response = client.post("/api/v1/auth/seed-dev-users")
    assert response.status_code == 403
    assert "disabled" in response.json()["detail"].lower()
