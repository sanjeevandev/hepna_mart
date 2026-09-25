# HEPNA MART — Phase 2B: Real Authentication & Server-Side RBAC Architecture

## 1. Executive Summary

Phase 2B establishes **authoritative backend authentication and server-side Role-Based Access Control (RBAC)** for HEPNA MART. 

Prior to Phase 2B, authentication and role simulation were handled via client-side state in Zustand and `localStorage`. In Phase 2B, all identity, password hashing, session tokens, and permission enforcement are authoritatively governed by the FastAPI backend and persisted in PostgreSQL. The frontend is treated strictly as an untrusted presentation client.

---

## 2. Core Architecture & Separation of Concerns

### A. Customer Account Type vs. Staff Internal Role

A foundational design principle in HEPNA MART is the strict separation between **Customer Account Types** and **Internal Staff Roles**:

| Dimension | Classification | Purpose | Allowed Roles |
|---|---|---|---|
| **Customer Account Type** | `individual`<br>`contractor`<br>`business` | Classifies commercial relationship, trade discounts, wholesale tiering, and project workflows. | `customer` |
| **Internal Staff Role** | `super_admin`<br>`admin`<br>`procurement_manager`<br>`inventory_manager`<br>`order_manager`<br>`support_staff` | Grants administrative access to back-office operational panels and API operations. | Any internal role |

> **Security Guardrail**: Public customer registration (`POST /api/v1/auth/register`) strictly sets `role = "customer"`. Internal staff accounts cannot be created via public registration and must be provisioned by an existing Super Admin or during secure database seeding.

---

## 3. Cryptography & Security Specifications

### Password Hashing (Argon2id)
- **Algorithm**: `Argon2id` (RFC 9106) via `argon2-cffi`
- **Parameters**:
  - `time_cost`: 3 iterations
  - `memory_cost`: 65,536 KiB (64 MiB)
  - `parallelism`: 4 threads
- **Fallback Verification**: Includes legacy bcrypt verification support to ensure transparent migration of existing hashes if needed.

### JWT Access Tokens
- **Algorithm**: HMAC-SHA256 (`HS256`)
- **Expiration**: 1,440 minutes (24 hours) configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`
- **Token Claims**:
  - `sub`: User UUID string
  - `email`: Normalized user email
  - `role`: Canonical role enum string (e.g., `super_admin`, `customer`)
  - `account_type`: Account type enum string (e.g., `contractor`, `business`)
  - `is_staff`: Boolean flag indicating staff panel eligibility
  - `exp`: Unix expiration timestamp
  - `iat`: Unix issuance timestamp
  - `type`: `access`

---

## 4. Server-Side RBAC Permission Matrix

The backend defines 26 granular permissions categorized into operational domains. Permissions are authoritatively mapped to roles:

```
Domain:
├── dashboard.view
├── products: view | create | edit | delete
├── categories: view
├── inventory: view | update
├── orders: view | update | cancel
├── customers: view | edit
├── projects: view | edit
├── boq: view | edit
├── estimates: view
├── quotes: view | manage
├── suppliers: view | manage
├── pricing: view | manage
├── reports: view
└── settings: manage
```

### Role-Permission Assignment Matrix

| Permission | Super Admin | Admin | Procurement Mgr | Inventory Mgr | Order Mgr | Support Staff | Customer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `dashboard.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `products.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `products.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `products.edit` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `products.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `categories.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `inventory.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `inventory.update` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `orders.view` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `orders.update` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `orders.cancel` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `customers.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `customers.edit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `projects.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `projects.edit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `boq.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `boq.edit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `estimates.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `quotes.view` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `quotes.manage` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `suppliers.view` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `suppliers.manage`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `pricing.view` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `pricing.manage` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `reports.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `settings.manage`| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 5. API Endpoints Specification

### Authentication Endpoints (`/api/v1/auth`)

1. **`POST /api/v1/auth/register`**
   - **Access**: Public
   - **Payload**: `email`, `password` (>=8 chars), `first_name`, `last_name`, `phone`, `account_type`, `company_name`
   - **Behavior**: Validates inputs, checks duplicate email, hashes password with Argon2id, assigns `role = "customer"`, generates JWT token.
   - **Response**: `201 Created` with `access_token` and sanitized `user` object.

2. **`POST /api/v1/auth/login`**
   - **Access**: Public
   - **Payload**: `email`, `password`
   - **Behavior**: Authenticates user against Argon2id hash, updates `last_login_at`, returns signed JWT.
   - **Response**: `200 OK` with `access_token` and `user` object.

3. **`GET /api/v1/auth/me`**
   - **Access**: Authenticated (`Authorization: Bearer <token>`)
   - **Behavior**: Validates JWT, fetches active user profile from database, attaches authoritative permissions list.
   - **Response**: `200 OK` with `CurrentUserResponse` (includes `permissions: string[]`).

4. **`POST /api/v1/auth/change-password`**
   - **Access**: Authenticated
   - **Payload**: `current_password`, `new_password`
   - **Behavior**: Verifies existing password before applying newly hashed Argon2id password.

5. **`POST /api/v1/auth/logout`**
   - **Access**: Authenticated
   - **Behavior**: Acknowledges session termination.

---

## 6. FastAPI Authorization Dependency Injection

Endpoints enforce security declaratively through FastAPI dependency functions:

```python
from app.api.dependencies import (
    get_current_user,
    require_authenticated_user,
    require_staff,
    require_admin,
    require_super_admin,
    require_permission,
)
from app.core.rbac import Permission

# Protect an administrative route
@router.get("/staff-only")
def staff_endpoint(user: User = Depends(require_staff)):
    ...

# Protect a granular permission-gated route
@router.post("/products")
def create_product(
    user: User = Depends(require_permission(Permission.PRODUCTS_CREATE))
):
    ...
```

---

## 7. Database Entity Schema (`users`)

Defined in SQLAlchemy (`backend/app/models/user.py`) and migrated via Alembic (`0001_create_users_table`):

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    account_type VARCHAR(20) NOT NULL DEFAULT 'individual',
    role VARCHAR(30) NOT NULL DEFAULT 'customer',
    company_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_role ON users(role);
CREATE INDEX ix_users_account_type ON users(account_type);
```

---

## 8. Frontend Integration & Backward Compatibility

1. **`src/lib/api.ts`**:
   - Manages token storage in `localStorage` (`hepna_auth_token`).
   - Automatically attaches `Authorization: Bearer <token>` to requests.
   - Provides typed helper methods `apiClient.auth.login()`, `register()`, `getMe()`, `changePassword()`, `logout()`.

2. **`src/store/authStore.ts`**:
   - Implements async `loginWithBackend()` and `registerWithBackend()` for direct interaction with FastAPI.
   - Synchronizes `serverPermissions` from `/api/v1/auth/me`.
   - Maintains preset personas (`PRESET_DEV_USERS`) and local mock fallback so local prototyping, component tests, and offline development remain 100% functional without requiring an active PostgreSQL instance.
