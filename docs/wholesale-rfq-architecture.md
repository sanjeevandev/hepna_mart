# HEPNA MART — PHASE 2F: REAL WHOLESALE / RFQ / BULK PROCUREMENT ARCHITECTURE

## 1. System Overview

Phase 2F implements a production-grade, authoritative PostgreSQL-backed Wholesale, Request for Quotation (RFQ), and Institutional Procurement subsystem for HEPNA MART. It bridges large-scale contractor/builder material estimation and bulk purchasing with the core catalog, inventory, and order fulfillment systems.

```
React + TypeScript Storefront (Vite)
        ↓  (API Client: /api/v1/rfqs, /api/v1/quotes, /api/v1/admin/rfqs)
FastAPI (127.0.0.1:8001)
        ↓  (SQLAlchemy + Row Locks + Pydantic v2 + Decimal Precision)
PostgreSQL Database (hepna_mart:5432)
  ├── rfqs & rfq_items
  ├── rfq_status_history
  ├── quotes & quote_items
  └── orders & order_items (Phase 2E fulfillment bridge)
```

---

## 2. PostgreSQL Schema & Models

### A. RFQ & RFQ Items (`rfqs`, `rfq_items`)
- **`rfqs`**:
  - `id`: UUID (Primary Key)
  - `rfq_number`: Unique string (`RFQ-YYYYMMDD-XXXXXX`)
  - `user_id`: Foreign Key referencing `users.id`
  - `project_id`: Nullable UUID referencing customer projects
  - `project_name`, `project_type`: Metadata for site and stage
  - `required_by_date`: Target delivery date
  - `delivery_address`: JSON snapshot containing site address, contact person, mobile, and GSTIN
  - `gstin`: 15-character GSTIN
  - `notes`: Contractor notes / constraints
  - `status`: Enum (`draft`, `submitted`, `under_review`, `quoted`, `revision_requested`, `accepted`, `rejected`, `expired`, `cancelled`)
  - `submitted_at`: Timestamp of submission
- **`rfq_items`**:
  - `id`: UUID
  - `rfq_id`: Foreign Key referencing `rfqs.id` (CASCADE on delete)
  - `product_id`: Nullable UUID referencing `products.id`
  - `product_name`, `product_sku`, `brand`, `unit`: Historical specifications snapshot
  - `requested_quantity`: Decimal precision requested quantity
  - `target_unit_price`: Nullable target price
  - `notes`: Item-level notes
- **`rfq_status_history`**:
  - `id`: UUID
  - `rfq_id`: Foreign Key referencing `rfqs.id`
  - `old_status`, `new_status`: Status transitions
  - `changed_by_user_id`: Foreign Key referencing `users.id`
  - `title`, `description`: Milestone log

### B. Quotations & Quote Items (`quotes`, `quote_items`)
- **`quotes`**:
  - `id`: UUID (Primary Key)
  - `quote_number`: String (`QTE-YYYYMMDD-XXXXXX`)
  - `rfq_id`: Foreign Key referencing `rfqs.id`
  - `version`: Integer (1, 2, 3...) for sequential revisions
  - `status`: Enum (`draft`, `sent`, `accepted`, `rejected`, `expired`)
  - `subtotal`, `discount_amount`, `tax_amount`, `delivery_charge`, `total`: High-precision Decimal monetary values
  - `valid_until`: Offer validity timestamp
  - `customer_notes`, `procurement_notes`: Commercial and logistics instructions
  - `created_by_user_id`: Procurement officer ID
- **`quote_items`**:
  - `id`: UUID
  - `quote_id`: Foreign Key referencing `quotes.id`
  - `rfq_item_id`, `product_id`: Reference IDs
  - `product_name`, `product_sku`, `brand`, `unit`: Item specification
  - `requested_quantity`, `quoted_quantity`: Numerical quantities
  - `catalog_unit_price_at_quote`, `quoted_unit_price`: Rate snapshots
  - `discount_amount`, `tax_amount`, `line_subtotal`, `line_total`: Computed line item financials

---

## 3. Financial Calculation Engine

All calculations are strictly computed in Python using `Decimal` arithmetic rounded to 2 decimal places (`ROUND_HALF_UP`):
1. **Line Subtotal**: `round(quoted_quantity * quoted_unit_price, 2)`
2. **Line Item Tax**: `round(line_subtotal * 0.18, 2)` (Standard 18% GST for construction materials)
3. **Line Total**: `line_subtotal + line_tax`
4. **Quotation Subtotal**: `sum(line_subtotals)`
5. **Tax Amount**: `round(max(0, subtotal - discount_amount) * 0.18, 2)`
6. **Quotation Grand Total**: `subtotal - discount_amount + tax_amount + delivery_charge`

---

## 4. RFQ and Quotation State Machine

```
[Customer Draft]
       │
       ▼ (submit)
  [Submitted] ───────────────► [Cancelled]
       │
       ▼ (staff review)
 [Under Review]
       │
       ▼ (quote issued & sent)
   [Quoted] ◄────────────────┐ (staff revision v2)
   │     │                   │
   │     ▼ (revision req)    │
   │  [Revision Requested] ──┘
   │
   ├──► [Rejected]
   ├──► [Expired]
   │
   ▼ (Customer Acceptance)
[Accepted] ───► Creates Order & Deducts PostgreSQL Inventory (Atomic SELECT ... FOR UPDATE)
```

---

## 5. Quote Acceptance & Inventory Deductions

- Inquiries, drafts, and quotations **do not deduct inventory** prematurely.
- Upon customer quote acceptance:
  1. Validates quote status is `sent` and not expired (`valid_until >= now`).
  2. Uses `OrderService.create_order_from_quote` with row-level locks (`SELECT ... FOR UPDATE`) on table `inventory`.
  3. Validates available stock for each catalog-linked product.
  4. Deducts `inventory.quantity` **exactly once**.
  5. Generates authoritative `orders`, `order_items`, and `order_status_history` records.
  6. Updates quote status to `accepted` and RFQ status to `accepted`.
  7. Commits the transaction atomically in a single PostgreSQL unit of work.

---

## 6. Security & Multi-Tenant RBAC

- **Customer Isolation**: Customers can only view, submit, revise, accept, or cancel their own RFQs and quotes. Attempts to access other customers' records return `403 Forbidden` or `404 Not Found`.
- **Procurement RBAC**:
  - Staff / Admins (`super_admin`, `admin`, `procurement_manager`) have access to `/api/v1/admin/rfqs` and `/api/v1/admin/quotes`.
  - Customer roles cannot access administrative quotation endpoints.

---

## 7. Automated Test & Verification Suite

- **Pytest Suite (`backend/tests/test_wholesale.py`)**: 12 comprehensive unit and integration test cases covering RFQ validation, customer isolation, RBAC, quote revision tracking, quote acceptance, single inventory deduction, and state machines.
- **Full Backend Suite**: **108/108 Tests Passing** across Auth, Catalog, Cart/Wishlist, Orders, and Wholesale.
- **Direct PostgreSQL Verification (`backend/scripts/verify_phase2f_postgres.py`)**: End-to-end database script verifying table schemas, catalog baseline (12 categories, 62 products, 62 inventory items), customer RFQ submission, isolation, quote revision v1 -> v2, quote acceptance, order placement, and exact inventory deduction (-50, -30).
