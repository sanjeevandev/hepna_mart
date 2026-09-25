# HEPNA MART — Authentication & Server-Side RBAC Migration Audit

**Document Version:** 1.0.0  
**Phase:** Phase 2B — Real Authentication & Server-Side RBAC  
**Date:** September 2026  

---

## 1. Executive Summary

In Phase 1 and Phase 2A, authentication and permissions were simulated on the client side using Zustand and localStorage (`hepna-auth`) to enable rapid frontend prototyping.

In **Phase 2B**, the backend becomes the **sole authoritative boundary** for:
- User Identity & Credentials
- Password Security (Argon2id hashing)
- Session Integrity & Token Issuance (Cryptographically signed JWTs)
- Staff vs. Customer Classification
- Role-Based Access Control (Server-side RBAC matrix & FastAPI dependencies)
- Customer Data Ownership

The frontend is strictly treated as a client presentation layer and is **never trusted** as a source of authority.

---

## 2. Current Frontend Authentication State

### 2.1 Storage & Personas
- **State Store**: `src/store/authStore.ts`
- **LocalStorage Key**: `hepna-auth`
- **Initial Dev Roster**: 9 preset personas (Super Admin, Operations Admin, Procurement Manager, Inventory Manager, Order Manager, Support Staff, Business Customer, Contractor Customer, Individual Customer).

### 2.2 Client-Side RBAC
- **Matrix File**: `src/utils/rbac.ts`
- **Route Guard**: `src/components/admin/AdminRoute.tsx`
- **Navigation Filter**: `src/components/admin/AdminLayout.tsx`
- **Limitation**: Prior to Phase 2B, modifying localStorage or Zustand state could alter UI visibility. Real security requires server-side validation on every HTTP request.

---

## 3. Account Types vs. Internal User Roles

| Dimension | Values | Purpose |
|---|---|---|
| **Customer Account Type** | `individual`, `contractor`, `business` | Segmenting trade discounts, wholesale pricing, and billing structures. |
| **Internal Staff Role** | `super_admin`, `admin`, `procurement_manager`, `inventory_manager`, `order_manager`, `support_staff`, `customer` | Authorizing access to sensitive administrative operations and datasets. |

> **Architectural Law**: A customer account type never grants administrative privileges. All retail and business customers strictly have `role = "customer"`. Public registration can only create accounts with `role = "customer"`.

---

## 4. Migration Strategy: Frontend to Backend

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React Client)                  │
│  - Captures credentials (email, password)                   │
│  - Sends POST /api/v1/auth/login                            │
│  - Stores received JWT token                                │
│  - Automatically attaches Authorization: Bearer <token>     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS Bearer Token
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 FastAPI REST API Layer (v1)                 │
│  - get_current_active_user dependency                       │
│  - Cryptographically verifies JWT signature (HS256)         │
│  - Extracts user UUID sub claim                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ User Model + Database Lookup
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Server-Side RBAC Gatekeeper                 │
│  - Checks authoritative user.role from PostgreSQL           │
│  - Evaluates require_permission() / require_role()          │
│  - Returns 401 Unauthorized or 403 Forbidden on violation   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Temporary Backward Compatibility Policy
- The frontend will support dual-mode operation:
  1. **Live Backend Mode**: When the FastAPI server is running, authentication requests hit `/api/v1/auth/*` and store real JWT access tokens.
  2. **Local Simulation Mode**: If backend connectivity is absent during offline prototyping, the frontend gracefully falls back to local persona switching with clear dev indicators.
- No existing business domain stores (Cart, Wishlist, Orders, Projects, BOQs, Estimates) will be deleted or disrupted in this phase.
