# HEPNA MART — Authentication & RBAC Architecture Notes

## 1. Architectural Scope & Current Status (Phase 1)

Phase 1 establishes the **Frontend Account Structure, Internal Staff Role Architecture, and RBAC Permission Layer**.

```
User Entity
├── Account Type (Customer Level)
│   ├── Individual (Personal homebuilders / retail)
│   ├── Contractor (Builders / civil engineering contractors)
│   └── Business (Real estate developers / institutional enterprises)
│
└── Role (Internal Security / Staff Level)
    ├── Customer (Default for all public users)
    ├── Super Admin (Complete system administration)
    ├── Admin (Operations management)
    ├── Procurement Manager (Materials, quotes, suppliers, pricing)
    ├── Inventory Manager (Stock, catalog, warehouses)
    ├── Order Manager (Fulfillment, tracking, dispatch)
    └── Support Staff (Customer service, order tracking, projects)
```

---

## 2. Core Security Principles & Critical Disclaimers

> [!WARNING]
> **Frontend RBAC is NOT a Security Boundary**:  
> In Phase 1, all client-side guards (`AdminRoute.tsx`, `hasPermission()`, role checks) serve solely for **User Experience (UX) and navigation organization**. Any client-side state in `localStorage` or memory can be inspected or modified by a knowledgeable user in the browser.

### Rules for Production Authorization (Phase 2 Requirements):
1. **Server-Side Token Validation**: Every request to `/api/v1/admin/*` must carry a cryptographically signed JWT or secure session cookie validated by the backend gateway.
2. **Database Role Enforcement**: User roles and permission claims must originate from the authoritative PostgreSQL/relational database, never from client input.
3. **Password Security**: Passwords must be hashed using argon2id / bcrypt on the server; client never stores raw credentials.
4. **GSTIN / PAN Compliance**: GSTIN and PAN fields remain unverified on the frontend until integrated with a certified GST Portal API / GSP (GST Suvidha Provider) in a future phase.
5. **Team Collaborations**: Team member invitations will dispatch verified cryptographic magic links via transactional email (SendGrid/AWS SES) upon backend implementation.
6. **No Mock Secrets**: The repository contains zero fake JWT signatures, mock API secrets, or pretend security tokens.

---

## 3. Separation of Concerns: Customer Account vs. Admin Workspace

- **Customer Account Domain (`/account`)**:
  - Exclusively for customer-facing features: Project management, BOQ tracking, saved delivery sites, active order history, estimates, and business team view.
  - Does NOT contain admin or employee operations.

- **Internal Admin Workspace (`/admin`)**:
  - Separate application workspace dedicated to internal HEPNA MART operations (Catalog management, stock level audits, bulk quotation dispatch, logistics monitoring).
  - Enforces route-level and component-level permission checking (`ROLE_PERMISSIONS`).
  - Renders an explicit **Access Restricted** screen if accessed by a customer account.
