import pytest
from fastapi.testclient import TestClient
from app.models.user import User, UserRole, AccountType
from app.models.profile import BusinessProfile, ContractorProfile
from app.core.security import hash_password, create_access_token


@pytest.fixture
def test_user_a(db_session):
    user = User(
        id="usr-test-a-uuid",
        email="business_user_a@example.com",
        password_hash=hash_password("SecurePassword123!"),
        first_name="Priya",
        last_name="Sharma",
        role=UserRole.CUSTOMER,
        account_type=AccountType.BUSINESS,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_a(test_user_a):
    token = create_access_token(
        subject=test_user_a.id,
        role=test_user_a.role.value,
        account_type=test_user_a.account_type.value,
        extra_claims={"email": test_user_a.email, "is_staff": test_user_a.is_staff},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_user_b(db_session):
    user = User(
        id="usr-test-b-uuid",
        email="contractor_user_b@example.com",
        password_hash=hash_password("SecurePassword123!"),
        first_name="Vikram",
        last_name="Patel",
        role=UserRole.CUSTOMER,
        account_type=AccountType.CONTRACTOR,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_b(test_user_b):
    token = create_access_token(
        subject=test_user_b.id,
        role=test_user_b.role.value,
        account_type=test_user_b.account_type.value,
        extra_claims={"email": test_user_b.email, "is_staff": test_user_b.is_staff},
    )
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# 1. AUTHENTICATION REJECTION TESTS
# ============================================================================

def test_unauthenticated_profile_endpoints_rejected(client: TestClient):
    # Business
    res_get_biz = client.get("/api/v1/profile/business")
    assert res_get_biz.status_code == 401

    res_put_biz = client.put("/api/v1/profile/business", json={"business_name": "Test"})
    assert res_put_biz.status_code == 401

    # Contractor
    res_get_cont = client.get("/api/v1/profile/contractor")
    assert res_get_cont.status_code == 401

    res_put_cont = client.put("/api/v1/profile/contractor", json={"business_name": "Test"})
    assert res_put_cont.status_code == 401


# ============================================================================
# 2. BUSINESS PROFILE TESTS
# ============================================================================

def test_get_business_profile_not_found(client: TestClient, auth_headers_a):
    res = client.get("/api/v1/profile/business", headers=auth_headers_a)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_create_and_get_business_profile(client: TestClient, auth_headers_a, test_user_a):
    payload = {
        "business_name": "Apex Infrastructure Pvt Ltd",
        "business_type": "Private Limited Company",
        "gstin": "27AAAAA0000A1Z5",
        "pan": "AAAAA0000A",
        "registered_address": "Apex Towers, 5th Floor, Senapati Bapat Road",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411016",
        "contact_person": "Priya Sharma",
        "contact_phone": "+91 98112 34567",
        "contact_email": "priya.sharma@apexinfra.com",
    }
    # Create via PUT
    res = client.put("/api/v1/profile/business", json=payload, headers=auth_headers_a)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == test_user_a.id
    assert data["business_name"] == "Apex Infrastructure Pvt Ltd"
    assert data["gstin"] == "27AAAAA0000A1Z5"
    assert data["pan"] == "AAAAA0000A"
    assert data["tax_verification_status"] == "pending"
    assert "id" in data

    # Retrieve via GET
    get_res = client.get("/api/v1/profile/business", headers=auth_headers_a)
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["id"] == data["id"]
    assert get_data["city"] == "Pune"


def test_update_existing_business_profile_idempotent(client: TestClient, auth_headers_a):
    initial_payload = {
        "business_name": "Apex Infra",
        "business_type": "Private Limited",
        "registered_address": "Initial Address Line",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411016",
        "contact_person": "Priya Sharma",
        "contact_phone": "+91 98112 34567",
    }
    res1 = client.put("/api/v1/profile/business", json=initial_payload, headers=auth_headers_a)
    assert res1.status_code == 200
    profile_id = res1.json()["id"]

    # Update with new values
    updated_payload = {
        "business_name": "Apex Infrastructure Group",
        "business_type": "Public Limited Company",
        "registered_address": "Updated Tower, 10th Floor",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "contact_person": "Priya Sharma",
        "contact_phone": "+91 98112 34567",
        "gstin": "27AAAAA0000A1Z5",
    }
    res2 = client.put("/api/v1/profile/business", json=updated_payload, headers=auth_headers_a)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["id"] == profile_id
    assert data2["business_name"] == "Apex Infrastructure Group"
    assert data2["city"] == "Mumbai"
    assert data2["gstin"] == "27AAAAA0000A1Z5"


def test_business_profile_invalid_gstin_rejected(client: TestClient, auth_headers_a):
    payload = {
        "business_name": "Bad GSTIN Corp",
        "business_type": "Proprietorship",
        "gstin": "INVALID_GST_NUMBER",
        "registered_address": "Some Street",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560001",
        "contact_person": "John",
        "contact_phone": "+91 98765 43210",
    }
    res = client.put("/api/v1/profile/business", json=payload, headers=auth_headers_a)
    assert res.status_code == 422


def test_business_profile_invalid_pan_rejected(client: TestClient, auth_headers_a):
    payload = {
        "business_name": "Bad PAN Corp",
        "business_type": "Proprietorship",
        "pan": "BADPAN12",
        "registered_address": "Some Street",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560001",
        "contact_person": "John",
        "contact_phone": "+91 98765 43210",
    }
    res = client.put("/api/v1/profile/business", json=payload, headers=auth_headers_a)
    assert res.status_code == 422


# ============================================================================
# 3. CONTRACTOR PROFILE TESTS
# ============================================================================

def test_get_contractor_profile_not_found(client: TestClient, auth_headers_b):
    res = client.get("/api/v1/profile/contractor", headers=auth_headers_b)
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_create_and_get_contractor_profile(client: TestClient, auth_headers_b, test_user_b):
    payload = {
        "business_name": "BuildRight Constructions",
        "specialization": ["Residential Construction", "Civil Works", "Renovation"],
        "years_of_experience": 12,
        "service_area": "Pune & PCMC Metropolitan Region",
        "license_number": "MH-PWD-CONT-2024-9912",
        "project_count": 45,
        "preferred_materials": ["OPC 53 Cement", "Fe 550D TMT Rebars"],
    }
    # Create via PUT
    res = client.put("/api/v1/profile/contractor", json=payload, headers=auth_headers_b)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == test_user_b.id
    assert data["business_name"] == "BuildRight Constructions"
    assert len(data["specialization"]) == 3
    assert data["years_of_experience"] == 12
    assert data["verification_status"] == "pending"
    assert "id" in data

    # Retrieve via GET
    get_res = client.get("/api/v1/profile/contractor", headers=auth_headers_b)
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["id"] == data["id"]
    assert "Civil Works" in get_data["specialization"]


def test_update_contractor_profile(client: TestClient, auth_headers_b):
    initial = {
        "business_name": "BuildRight",
        "specialization": ["Residential Construction"],
        "years_of_experience": 5,
        "service_area": "Pune",
    }
    res1 = client.put("/api/v1/profile/contractor", json=initial, headers=auth_headers_b)
    assert res1.status_code == 200
    cont_id = res1.json()["id"]

    updated = {
        "business_name": "BuildRight Infrastructure LLP",
        "specialization": ["Residential Construction", "Commercial Construction", "Roofing"],
        "years_of_experience": 6,
        "service_area": "Statewide Maharashtra",
        "license_number": "LIC-9921",
    }
    res2 = client.put("/api/v1/profile/contractor", json=updated, headers=auth_headers_b)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["id"] == cont_id
    assert data2["business_name"] == "BuildRight Infrastructure LLP"
    assert len(data2["specialization"]) == 3
    assert data2["years_of_experience"] == 6


# ============================================================================
# 4. DATA ISOLATION & PERSISTENCE
# ============================================================================

def test_profile_user_isolation(client: TestClient, auth_headers_a, auth_headers_b, test_user_a, test_user_b):
    # User A creates business profile
    client.put("/api/v1/profile/business", json={
        "business_name": "User A Company",
        "registered_address": "Address A",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411001",
        "contact_person": "Person A",
        "contact_phone": "+91 90000 00001",
    }, headers=auth_headers_a)

    # User B creates business profile
    client.put("/api/v1/profile/business", json={
        "business_name": "User B Enterprises",
        "registered_address": "Address B",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560001",
        "contact_person": "Person B",
        "contact_phone": "+91 90000 00002",
    }, headers=auth_headers_b)

    # User A GET
    res_a = client.get("/api/v1/profile/business", headers=auth_headers_a)
    assert res_a.status_code == 200
    assert res_a.json()["business_name"] == "User A Company"
    assert res_a.json()["user_id"] == test_user_a.id

    # User B GET
    res_b = client.get("/api/v1/profile/business", headers=auth_headers_b)
    assert res_b.status_code == 200
    assert res_b.json()["business_name"] == "User B Enterprises"
    assert res_b.json()["user_id"] == test_user_b.id


def test_profile_persistence_across_requests(client: TestClient, auth_headers_a, db_session, test_user_a):
    payload = {
        "business_name": "Persisted Holdings Ltd",
        "business_type": "Public Limited Company",
        "gstin": "27AAAAA0000A1Z5",
        "pan": "AAAAA0000A",
        "registered_address": "77 Financial District",
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": "500032",
        "contact_person": "Chief Executive",
        "contact_phone": "+91 91111 22222",
        "contact_email": "ceo@persisted.com",
    }
    put_res = client.put("/api/v1/profile/business", json=payload, headers=auth_headers_a)
    assert put_res.status_code == 200
    profile_id = put_res.json()["id"]

    # Direct database query check
    db_profile = db_session.get(BusinessProfile, profile_id)
    assert db_profile is not None
    assert db_profile.business_name == "Persisted Holdings Ltd"
    assert db_profile.user_id == test_user_a.id

    # Second HTTP GET call
    get_res = client.get("/api/v1/profile/business", headers=auth_headers_a)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == profile_id
