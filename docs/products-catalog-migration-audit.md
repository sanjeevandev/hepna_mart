# HEPNA MART — Products, Categories & Inventory Backend Migration Audit (Phase 2C)

## 1. Audit Overview
This audit establishes the migration boundary and compatibility contract for transitioning HEPNA MART's product catalog, category taxonomy, and inventory records from static frontend data (`src/data/products.ts`, `src/data/categories.ts`) to normalized backend storage (PostgreSQL + SQLAlchemy 2.x + FastAPI).

---

## 2. Source Data Inventory

### Categories Data (`src/data/categories.ts`)
- **Total Records**: 12 categories
- **Fields in Current Frontend Schema**:
  - `id`: string (`cat-1` to `cat-12`)
  - `name`: string (e.g., "Cement & Concrete")
  - `slug`: string (e.g., "cement-concrete")
  - `description`: string
  - `tagline`: string
  - `icon`: string (Lucide icon identifier)
  - `image`: string (Unsplash URL)
  - `productCount`: number
  - `subcategories`: string[]

### Products Data (`src/data/products.ts`)
- **Total Records**: 62 construction products
- **Category Distribution**: 5 to 6 products per category across 12 categories
- **Fields in Current Frontend Schema**:
  - `id`: string (`prod-1` to `prod-62`)
  - `name`: string
  - `slug`: string
  - `brand`: string
  - `category`: string (category slug reference)
  - `subcategory`: string
  - `description`: string
  - `images`: string[]
  - `price`: number (INR)
  - `mrp`: number (INR)
  - `discount`: number (percentage integer)
  - `unit`: string (e.g., "Bag", "Piece", "Sq Ft", "Litre", "Kg")
  - `stock`: number (integer)
  - `rating`: number (float, e.g. 4.5)
  - `reviews`: number (integer count)
  - `bulkPrice`: number (optional)
  - `minimumBulkQuantity`: number (optional)
  - `deliveryAvailable`: boolean
  - `featured`: boolean
  - `newArrival`: boolean
  - `specifications`: `Array<{ key: string; value: string }>` or `Record<string, string>`
  - `features`: string[]

### Inventory Data (Implicit in products.ts)
- Currently embedded within `Product.stock` (e.g., 500 bags, 1200 bricks).
- Phase 2C normalizes inventory into a dedicated `Inventory` entity with `quantity`, `reserved_quantity`, `available_quantity` (derived), `low_stock_threshold`, `warehouse`, and `location`.

---

## 3. Frontend Dependency Map

The static catalog files are referenced across 24 files in `src/`:

| Component / File | Usage Type | Migration Strategy |
|---|---|---|
| `src/pages/ShopPage.tsx` | Full catalog browsing, filters, search, pagination | Fetch `/api/v1/products` via `catalogService` / API client |
| `src/pages/ProductDetailsPage.tsx` | Single product by slug, related products | Fetch `/api/v1/products/slug/:slug` |
| `src/pages/CategoriesPage.tsx` | Category cards grid | Fetch `/api/v1/categories` |
| `src/pages/CategoryProductsPage.tsx` | Products filtered by category slug | Fetch `/api/v1/products?category=:slug` |
| `src/components/ui/SearchBar.tsx` | Search auto-suggestions | Use fetched catalog cache or query API |
| `src/components/home/FeaturedProducts.tsx` | Featured products grid | Fetch `/api/v1/products?featured=true` |
| `src/components/home/CategorySection.tsx` | Homepage categories | Fetch `/api/v1/categories` |
| `src/pages/admin/AdminProductsPage.tsx` | Admin product management table & CRUD | Connected to `/api/v1/products` CRUD |
| `src/pages/admin/AdminCategoriesPage.tsx` | Admin category management & CRUD | Connected to `/api/v1/categories` CRUD |
| `src/pages/admin/AdminInventoryPage.tsx` | Admin inventory management & stock updates | Connected to `/api/v1/inventory` |
| `src/pages/admin/AdminOverviewPage.tsx` | SKU count KPI | Query total products count |
| `src/pages/WishlistPage.tsx` | Wishlist items lookup by ID | Compatible product resolver via `catalogService` |
| `src/store/cartStore.ts` | Cart items reference `Product` | Product shape preserved in TypeScript |
| `src/store/projectStore.ts` / `BOQ` | Project materials & BOQ line items | Historical snapshots preserved |
| `src/store/estimateStore.ts` / `Calculator` | Construction estimate calculation | Historical pricing preserved |

---

## 4. Backend RBAC Permissions Mapping

Phase 2B established the following server-side permissions in `backend/app/core/rbac.py`:
- `products.view`: Accessible to all roles (and public unauthenticated GET)
- `products.create`: `super_admin`, `admin`, `procurement_manager`
- `products.update`: `super_admin`, `admin`, `procurement_manager`
- `products.delete`: `super_admin`, `admin`
- `categories.view`: Accessible to all roles (and public unauthenticated GET)
- `categories.manage`: `super_admin`, `admin`
- `inventory.view`: `super_admin`, `admin`, `procurement_manager`, `inventory_manager`
- `inventory.update`: `super_admin`, `admin`, `inventory_manager`

Public unauthenticated requests:
- `GET /api/v1/products` (Filtered/paginated list)
- `GET /api/v1/products/{id}` / `GET /api/v1/products/slug/{slug}`
- `GET /api/v1/categories` / `GET /api/v1/categories/{id}` / `GET /api/v1/categories/slug/{slug}`

---

## 5. Migration Risks & Mitigation Strategy

1. **Risk: Breaking offline/local components (Cart, Wishlist, BOQ, Estimates)**
   - *Mitigation*: Create `src/services/catalogService.ts` and maintain a safe local fallback adapter for unmigrated domains while transitioning active pages to async API queries. Keep `src/data/products.ts` available as a seed source and fallback.
2. **Risk: Inconsistent product IDs between seed and localStorage**
   - *Mitigation*: Seed database deterministically preserving standard IDs (`prod-1` to `prod-62`) or deterministic UUIDs mapped to original slugs.
3. **Risk: Floating-point inaccuracy in money**
   - *Mitigation*: Use `Numeric(12, 2)` / `Decimal` in backend models and Pydantic schemas.
