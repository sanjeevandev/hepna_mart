# HEPNA MART — Backend Migration Audit

**Document Version:** 1.0.0  
**Phase:** Phase 2A — Real Backend Foundation (FastAPI + PostgreSQL)  
**Date:** September 2026  

---

## 1. Executive Summary

This audit documents the current frontend data architecture of **HEPNA MART** and outlines the migration path toward a production-grade backend powered by **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.x**, and **Alembic**.

In Phase 2A, the backend infrastructure is established independently with strict boundaries:
- **No frontend regressions**: All existing React/Vite components, Zustand stores, and static datasets remain untouched and fully functional.
- **Zero data loss**: LocalStorage state management remains active for the storefront and admin panel until endpoints are progressively connected in subsequent subphases.
- **Clean modular backend foundation**: Modern asynchronous FastAPI service layer prepared for PostgreSQL relational schema modeling.

---

## 2. Current Frontend Architecture Audit

### 2.1 State Management & Persistence (Zustand)

| Store | LocalStorage Key | Entity Managed | Current State | Migration Target (Phase 2B+) |
|---|---|---|---|---|
| `authStore.ts` | `hepna-auth` | User profile, active persona, role permissions | Local simulation with 9 preset personas | `/api/v1/auth/*` (JWT Auth, OAuth2, Session) |
| `cartStore.ts` | `hepna-cart` | Cart line items, subtotal, 18% GST, delivery logic | Local persistent store | `/api/v1/cart/*` (Persistent user carts & session carts) |
| `wishlistStore.ts` | `hepna-wishlist` | Saved product IDs | Local array of string IDs | `/api/v1/wishlist/*` (User-bound wishlist table) |
| `orderStore.ts` | `hepna-orders` | Placed orders, tracking timeline, site drops | Local array with demo seeds | `/api/v1/orders/*` (Relational order & order_items tables) |
| `projectStore.ts` | `hepna-projects` | Construction projects & BOQ line items | Local array with demo seed | `/api/v1/projects/*` & `/api/v1/boqs/*` |
| `estimateStore.ts` | `hepna-estimates` | Smart Cost Calculator estimates & snapshots | Local array with demo seed | `/api/v1/estimates/*` |
| `compareStore.ts` | `hepna-compare` | Side-by-side product comparisons | Local array of products | In-memory / User preference sync |
| `businessStore.ts` | `hepna-business` | Contractor/Business profiles & team members | Local business profile | `/api/v1/business/*` & `/api/v1/team/*` |
| `siteStore.ts` | `hepna-sites` | Construction delivery addresses & road clearance | Local array of site records | `/api/v1/sites/*` |
| `searchStore.ts` | *In-Memory* | Filter options, search query, category filters | In-memory state | Backend query parameters with Elasticsearch/Postgres Full-Text Search |

---

### 2.2 Static Catalog Data

| Data File | Records | Content Description | Migration Strategy |
|---|---|---|---|
| `src/data/categories.ts` | 12 Categories | Building categories (Cement, Steel, Plumbing, Electrical, etc.) with image URLs, taglines, subcategories | Seed script into PostgreSQL `categories` and `subcategories` tables. |
| `src/data/products.ts` | 62 Products | Construction materials with realistic Indian market pricing, MRP, wholesale tiers, specifications, and features | Seed script into PostgreSQL `products` and `product_specifications` tables. |

---

### 2.3 Existing TypeScript Domain Types (`src/types/index.ts`)

The TypeScript definitions serve as the primary contract for FastAPI Pydantic schemas and SQLAlchemy models:
- **`Product` & `Category`**: Core catalog entities.
- **`AccountType` & `UserRole`**: Customer segmentation (`individual`, `contractor`, `business`) vs. Internal Staff roles (`super_admin`, `admin`, `procurement_manager`, etc.).
- **`UserProfile`**, **`ContractorProfile`**, **`BusinessProfile`**, **`TeamMember`**: Customer identity and corporate hierarchy models.
- **`ConstructionSite`**: Site delivery rules, heavy vehicle clearance (10-wheeler/407), and gate timings.
- **`Project` & `BOQItem`**: Construction BOQ 2.0 stage scheduling and material bill of quantities.
- **`ConstructionEstimate`**: Parametric calculator inputs, formulas, and price-snapshot audits.
- **`Order` & `OrderItem`**: E-commerce transactions with multi-stage delivery milestones (`confirmed` → `processing` → `packed` → `shipped` → `out-for-delivery` → `delivered`).

---

## 3. Future Backend Migration Roadmap

```
Phase 2A (Current):
  ├── Backend Directory Layout & Requirements
  ├── Configuration (Pydantic Settings, Environment variables)
  ├── SQLAlchemy 2.x Database Engine & Session Factory
  ├── Alembic Migration Scaffold
  ├── FastAPI Application & Central Router
  └── Health Check Endpoints (GET /api/v1/health, GET /api/v1/health/db)

Phase 2B (Database Models & Seeders):
  ├── SQLAlchemy Models for Users, Categories, Products, Inventory
  ├── Alembic Initial Migration (0001_initial_schema.py)
  └── Catalog Seeder Script (importing data from categories.ts and products.ts)

Phase 2C (Authentication & User Services):
  ├── Password Hashing (Argon2 / bcrypt) & JWT Bearer Token validation
  └── REST Endpoints for /api/v1/auth and /api/v1/users

Phase 2D (Commerce & Construction APIs):
  ├── Orders, Cart, Quotations, and Checkout endpoints
  ├── Projects, BOQs, and Calculator Estimates endpoints
  └── Frontend Zustand stores adapter swapping (localStorage → Axios/Fetch client)
```

---

## 4. Safety & Integrity Policy
- The static frontend (`http://localhost:3000`) will continue to operate with 100% functionality.
- The FastAPI backend (`http://localhost:8000`) runs independently.
- No sensitive keys or production database credentials will ever be committed to git.
