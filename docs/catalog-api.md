# HEPNA MART — Phase 2C: Product Catalog & Inventory API Specification

This document details the backend REST API endpoints, schemas, validation rules, RBAC controls, and client integration contracts for **Categories**, **Products**, and **Inventory** in HEPNA MART.

---

## 1. Overview & Architecture

- **Authoritative Source**: PostgreSQL database with SQLAlchemy 2.x ORM models.
- **Financial Precision**: All monetary values (`price`, `mrp`, `bulk_price`) use `Numeric(12, 2)` (Python `Decimal`) to eliminate floating-point rounding errors.
- **Inventory Tracking**: Dedicated `inventory` table tracking `quantity`, `reserved_quantity`, `available_quantity` (generated/computed), `low_stock_threshold`, and `warehouse`.
- **RBAC Matrix**:
  - **Public / Customer**: Read-only access to active categories and products (`GET /categories`, `GET /products`).
  - **Staff / Inventory Manager**: Access to `/inventory` stock monitoring and stock adjustments (`PUT /inventory/{product_id}`).
  - **Admin / Super Admin**: Full CRUD on categories and products (`POST`, `PUT`, `DELETE`).

---

## 2. Category Endpoints

### 2.1 List Categories
- **Endpoint**: `GET /api/v1/categories`
- **Access**: Public
- **Query Parameters**:
  - `active_only` (bool, default: `true`): Filter to active categories only.
- **Response**: `200 OK`
```json
[
  {
    "id": "c1a2b3c4-...",
    "name": "Cement & Aggregates",
    "slug": "cement-aggregates",
    "description": "High-grade Portland Pozzolana cement, river sand, blue metal aggregates...",
    "tagline": "Strong Foundation Materials",
    "icon": "Building2",
    "image": "https://images.unsplash.com/photo-...",
    "parent_id": null,
    "is_active": true,
    "sort_order": 1,
    "subcategories": ["OPC Cement", "PPC Cement", "White Cement", "Sand & Gravel"],
    "product_count": 8
  }
]
```

### 2.2 Get Category by Slug / ID
- **Endpoint**: `GET /api/v1/categories/slug/{slug}` or `GET /api/v1/categories/{id}`
- **Access**: Public
- **Response**: `200 OK` with full category object, or `404 Not Found`.

### 2.3 Create Category
- **Endpoint**: `POST /api/v1/categories`
- **Access**: Admin (`categories:create` / Staff Admin)
- **Request Body**:
```json
{
  "name": "Structural Steel",
  "slug": "structural-steel",
  "description": "Fe 550D TMT rebars, MS angles, and beams.",
  "tagline": "TMT Rebars & Structural Sections",
  "icon": "Layers",
  "image": "https://images.unsplash.com/photo-...",
  "sort_order": 2,
  "subcategories": ["TMT Rebars", "MS Channels", "Steel Binding Wire"]
}
```

### 2.4 Update / Delete Category
- **Update**: `PUT /api/v1/categories/{id}` (Admin)
- **Delete**: `DELETE /api/v1/categories/{id}` (Super Admin)

---

## 3. Product Endpoints

### 3.1 List Products (Paginated & Filtered)
- **Endpoint**: `GET /api/v1/products`
- **Access**: Public
- **Query Parameters**:
  - `search` (string): Text search over product name, brand, description, and specifications.
  - `category` (string): Filter by category slug or UUID.
  - `brand` (string): Filter by exact brand name.
  - `min_price` (decimal), `max_price` (decimal): Price range filter.
  - `rating` (float): Minimum customer rating (e.g. `4.0`).
  - `in_stock` (bool): Filter items with `available_stock > 0`.
  - `featured` (bool): Featured homepage items.
  - `new` (bool): New arrivals.
  - `offer` (bool): On-sale / discount items.
  - `active_only` (bool, default: `true`): Public filter.
  - `sort` (enum: `price_asc`, `price_desc`, `rating`, `newest`, `featured`).
  - `page` (int, default: `1`), `page_size` (int, default: `24`, max: `100`).
- **Response**: `200 OK`
```json
{
  "items": [
    {
      "id": "p1a2b3c4-...",
      "name": "UltraTech Super Cement (50kg)",
      "slug": "ultratech-super-cement-50kg",
      "sku": "SKU-CEM-001",
      "brand": "UltraTech",
      "category_id": "c1a2b3c4-...",
      "category_slug": "cement-aggregates",
      "category_name": "Cement & Aggregates",
      "subcategory": "PPC Cement",
      "description": "Engineered Portland Pozzolana Cement formulated for high durability...",
      "short_description": "Top-tier PPC cement for all residential and commercial structural concrete.",
      "price": 385.00,
      "mrp": 420.00,
      "discount_percent": 8,
      "unit": "Bag",
      "rating": 4.8,
      "review_count": 142,
      "bulk_price": 365.00,
      "minimum_bulk_quantity": 100,
      "delivery_available": true,
      "is_featured": true,
      "is_new": false,
      "is_offer": true,
      "is_active": true,
      "images": ["https://images.unsplash.com/..."],
      "specifications": { "Grade": "PPC", "Weight": "50 kg", "Setting Time": "30 mins" },
      "features": ["High early strength", "Crack resistant", "Corrosion resistant"],
      "stock": 450,
      "available_stock": 450,
      "reserved_stock": 0,
      "created_at": "2026-09-25T10:00:00Z",
      "updated_at": "2026-09-25T10:00:00Z"
    }
  ],
  "page": 1,
  "page_size": 24,
  "total": 62,
  "total_pages": 3
}
```

### 3.2 Get Product by Slug / ID
- **Endpoint**: `GET /api/v1/products/slug/{slug}` or `GET /api/v1/products/{id}`
- **Access**: Public
- **Response**: `200 OK` with full product details, category object, specifications, and live stock.

### 3.3 Create Product
- **Endpoint**: `POST /api/v1/products`
- **Access**: Admin (`products:create` / Staff Admin)
- **Request Body**: `ProductCreate` schema including `initial_stock` (auto-creates inventory record).

### 3.4 Update / Delete Product
- **Update**: `PUT /api/v1/products/{id}` (Admin)
- **Delete**: `DELETE /api/v1/products/{id}?hard_delete=false` (Super Admin). Defaults to soft-delete (`is_active = false`).

---

## 4. Inventory Endpoints (Staff Only)

### 4.1 List Inventory
- **Endpoint**: `GET /api/v1/inventory`
- **Access**: Staff (`inventory_manager`, `admin`, `super_admin`)
- **Query Parameters**:
  - `low_stock_only` (bool, default: `false`): Filter items where `available_quantity <= low_stock_threshold`.
  - `warehouse` (string, optional): Filter by warehouse node.
- **Response**: `200 OK` with list of `BackendInventoryListItem` including join product and category metadata.

### 4.2 Get Low Stock Alerts
- **Endpoint**: `GET /api/v1/inventory/low-stock`
- **Access**: Staff

### 4.3 Update Stock & Thresholds
- **Endpoint**: `PUT /api/v1/inventory/{product_id}`
- **Access**: Staff (`inventory_manager`, `admin`, `super_admin`)
- **Request Body**:
```json
{
  "quantity": 500,
  "reserved_quantity": 20,
  "low_stock_threshold": 100,
  "warehouse": "Pune Central Yard (Hinjawadi)"
}
```
- **Validation**:
  - `quantity >= 0` (422 Unprocessable Entity if negative).
  - `reserved_quantity <= quantity` (422 if reserved exceeds total stock).

---

## 5. Seed Catalog Script

The project includes an idempotent catalog seeder populating all 62 products and 12 categories from `backend/scripts/seed_data.json`:
```bash
PYTHONPATH=backend backend/.venv/bin/python backend/scripts/seed_catalog.py
```
- **Idempotent**: Safe to run multiple times without creating duplicates.
- **Integrity**: Creates category hierarchy, products with `Numeric(12, 2)` rates, and initial `inventory` records.
