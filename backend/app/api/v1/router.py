from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    admin_test,
    categories,
    products,
    inventory,
    cart,
    wishlist,
    orders,
    wholesale,
    payments,
    admin_payments,
    projects,
    notifications,
    estimates,
    profile,
    organizations,
)

api_router = APIRouter()

# Health & Diagnostics
api_router.include_router(health.router, tags=["Health & Diagnostics"])

# Authentication & Session Management
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & User Security"])

# Customer Business & Contractor Profiles (Phase 2L.1)
api_router.include_router(profile.router, tags=["Customer Business & Contractor Profiles"])

# Customer Organizations & Teams (Phase 2L.2)
api_router.include_router(organizations.router, tags=["Customer Organizations & Teams"])
api_router.include_router(organizations.invitations_router, tags=["Organization Invitations"])

# Staff & RBAC Gatekeeper Testing
api_router.include_router(admin_test.router, prefix="/admin", tags=["Staff Administration & RBAC"])

# Catalog & Taxonomy
api_router.include_router(categories.router, tags=["Categories & Taxonomy"])
api_router.include_router(products.router, tags=["Products Catalog"])
api_router.include_router(inventory.router, tags=["Warehouse & Inventory"])

# Customer Shopping Experience
api_router.include_router(cart.router, tags=["Customer Cart"])
api_router.include_router(wishlist.router, tags=["Customer Wishlist"])
api_router.include_router(orders.router, tags=["Customer Orders & Fulfillment"])
api_router.include_router(payments.router, tags=["Customer Payments & UPI"])

# Customer Projects, BOQ & Estimates Workspace (Phase 2K)
api_router.include_router(projects.router, tags=["Customer Projects & BOQ Workspace"])
api_router.include_router(notifications.router, tags=["Project Notifications & Activity Alerts"])
api_router.include_router(estimates.router, tags=["Customer Cost Estimates"])

# Wholesale & RFQ Customer Operations
api_router.include_router(wholesale.rfq_router, tags=["Customer RFQs & Wholesale Procurement"])
api_router.include_router(wholesale.quote_router, tags=["Customer Quotations & Approvals"])

# Staff Administration & Procurement Operations
api_router.include_router(orders.admin_router, tags=["Staff Orders Management"])
api_router.include_router(wholesale.admin_rfq_router, tags=["Staff RFQ Queue & Procurement"])
api_router.include_router(wholesale.admin_quote_router, tags=["Staff Quotation Management"])
api_router.include_router(admin_payments.router, tags=["Staff Payment Management & Verification"])
