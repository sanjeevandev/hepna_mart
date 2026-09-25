from fastapi import APIRouter
from app.api.v1.endpoints import health

api_router = APIRouter()

# Health & Diagnostics
api_router.include_router(health.router, tags=["Health & Diagnostics"])

# =========================================================================
# FUTURE PHASE 2+ ROUTE REGISTRATIONS (Modular Placeholders)
# =========================================================================
# The following routes will be plugged in systematically in subphases 2B-2D:
#
# api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
# api_router.include_router(users.router, prefix="/users", tags=["Users & Profiles"])
# api_router.include_router(products.router, prefix="/products", tags=["Products Catalog"])
# api_router.include_router(categories.router, prefix="/categories", tags=["Categories & Taxonomy"])
# api_router.include_router(inventory.router, prefix="/inventory", tags=["Warehouse & Inventory"])
# api_router.include_router(orders.router, prefix="/orders", tags=["Orders & Site Delivery"])
# api_router.include_router(customers.router, prefix="/customers", tags=["Customer Directory"])
# api_router.include_router(projects.router, prefix="/projects", tags=["Construction Projects"])
# api_router.include_router(boqs.router, prefix="/boqs", tags=["BOQ 2.0 Schedules"])
# api_router.include_router(estimates.router, prefix="/estimates", tags=["Cost Calculator Estimates"])
# api_router.include_router(quotes.router, prefix="/quotes", tags=["Wholesale Quotations"])
# api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers & Mills"])
# api_router.include_router(admin.router, prefix="/admin", tags=["Staff Administration"])
