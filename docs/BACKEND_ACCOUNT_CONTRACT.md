# HEPNA MART — Backend Account, Auth & RBAC API Specification (Phase 2 Contract)

> **Status**: Specification & Architectural Design (Future Phase 2 Contract)  
> **Notice**: These endpoints document the future REST API contract. They are not yet live on the frontend development server.

---

## 1. Authentication & Session Endpoints

### `POST /api/v1/auth/register`
Creates a new customer account.
- **Request Body**:
  ```json
  {
    "name": "Kiran Sharma",
    "email": "kiran@example.com",
    "phone": "+919876543210",
    "password": "<secure-password-hashed-at-server>",
    "accountType": "contractor" // "individual" | "contractor" | "business"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "user": {
      "id": "usr-10293",
      "name": "Kiran Sharma",
      "email": "kiran@example.com",
      "phone": "+919876543210",
      "accountType": "contractor",
      "role": "customer",
      "createdAt": "2026-09-25T12:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "expiresIn": 3600
    }
  }
  ```

### `POST /api/v1/auth/login`
Authenticates a customer or staff user with email and password.
- **Request Body**:
  ```json
  {
    "email": "user@hepnamart.com",
    "password": "<raw-password-over-tls>"
  }
  ```
- **Response `200 OK`**: Returns user profile and signed JWT tokens with assigned role and permissions.

### `POST /api/v1/auth/refresh`
Exchanges a valid refresh token for a new access token.

### `POST /api/v1/auth/logout`
Invalidates active server session and blacklists refresh token.

---

## 2. User Profile Endpoints

### `GET /api/v1/me`
Retrieves the authenticated user's profile and active permissions.

### `PATCH /api/v1/me`
Updates user profile parameters (`name`, `phone`, `avatar`, `companyName`).

---

## 3. Business & Contractor Profile Endpoints

### `GET /api/v1/business`
Fetches the current user's business and contractor profile.

### `POST /api/v1/business`
Registers a business entity.
- **Request Body**:
  ```json
  {
    "businessName": "Apex Infrastructure Pvt Ltd",
    "businessType": "Private Limited Company",
    "gstin": "27AAAAA0000A1Z5", // Optional
    "pan": "AAAAA0000A", // Optional
    "registeredAddress": "5th Floor, Apex Towers, SB Road",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411016",
    "contactPerson": "Priya Sharma",
    "contactPhone": "+919811234567"
  }
  ```

### `PATCH /api/v1/business`
Updates business information.

---

## 4. Team Members & Collaboration Endpoints

### `GET /api/v1/business/team`
Returns team members associated with the business entity.

### `POST /api/v1/business/team`
Invites a team member via verified email.
- **Request Body**:
  ```json
  {
    "name": "Rohit Joshi",
    "email": "rohit.j@company.com",
    "role": "Procurement Manager" // "Owner" | "Admin" | "Procurement Manager" | "Project Manager" | "Viewer"
  }
  ```

### `PATCH /api/v1/business/team/:id`
Updates role or access status for a team member.

### `DELETE /api/v1/business/team/:id`
Removes a team member from the organization.

---

## 5. Construction Site Delivery Endpoints

### `GET /api/v1/sites`
Returns all saved construction sites for the authenticated user/business.

### `POST /api/v1/sites`
Registers a new construction site.
- **Request Body**:
  ```json
  {
    "siteName": "Skyline Heights Project Site",
    "contactPerson": "Anand Rao (Site In-Charge)",
    "contactPhone": "+919888877777",
    "address": "Survey 89, Hinjawadi Phase 2",
    "landmark": "Near Megapolis Circle",
    "city": "Pune",
    "district": "Pune",
    "state": "Maharashtra",
    "pincode": "411057",
    "accessRoad": "15m Tar Road",
    "vehicleAccess": "12-Wheeler Trailers Permitted",
    "unloadingInstructions": "Unload at Tower B Material Yard",
    "isDefault": true
  }
  ```

### `PATCH /api/v1/sites/:id`
Updates site address or delivery access instructions.

### `DELETE /api/v1/sites/:id`
Deletes a saved construction site.

---

## 6. Project & BOQ Management Endpoints

### `GET /api/v1/projects`
Retrieves projects owned by the user or shared with their business organization.

### `POST /api/v1/projects`
Creates a new construction project.

### `GET /api/v1/projects/:id/boq`
Fetches the itemized Bill of Quantities schedule for a project.

### `PATCH /api/v1/projects/:id/boq`
Updates material quantities, purchased tracking, wastage %, or site notes.

---

## 7. Admin & Staff RBAC Endpoints

All admin endpoints require an internal staff role (`super_admin`, `admin`, `procurement_manager`, `inventory_manager`, `order_manager`, `support_staff`) verified via server-side middleware.

- `GET /api/v1/admin/dashboard` — Aggregated operational metrics (Requires `dashboard.view`)
- `GET /api/v1/admin/products` — Product catalog management (Requires `products.view`)
- `POST /api/v1/admin/products` — Create new catalog product (Requires `products.create`)
- `PATCH /api/v1/admin/products/:id` — Edit catalog product (Requires `products.edit`)
- `DELETE /api/v1/admin/products/:id` — Remove catalog product (Requires `products.delete`)
- `GET /api/v1/admin/inventory` — Stock levels and warehouse alerts (Requires `inventory.view`)
- `PATCH /api/v1/admin/inventory/:id` — Update physical stock count (Requires `inventory.update`)
- `GET /api/v1/admin/orders` — Orders pipeline (Requires `orders.view`)
- `PATCH /api/v1/admin/orders/:id/status` — Update order status & tracking (Requires `orders.update`)
- `GET /api/v1/admin/customers` — Customer and business accounts list (Requires `customers.view`)
- `GET /api/v1/admin/quotes` — Institutional bulk quotation requests (Requires `quotes.view`)
- `PATCH /api/v1/admin/quotes/:id` — Quote pricing & status updates (Requires `quotes.manage`)
- `GET /api/v1/admin/suppliers` — Manufacturer & supplier relations (Requires `suppliers.view`)
- `GET /api/v1/admin/pricing` — Pricing tiers & margin schedules (Requires `pricing.view`)
- `GET /api/v1/admin/reports` — Procurement, sales, and fulfillment reports (Requires `reports.view`)
- `PATCH /api/v1/admin/settings` — System and compliance settings (Requires `settings.manage`)
