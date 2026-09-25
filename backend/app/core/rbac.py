from enum import Enum
from typing import List, Set, Union
from app.models.user import UserRole


class Permission(str, Enum):
    # Products & Catalog
    PRODUCTS_VIEW = "products.view"
    PRODUCTS_CREATE = "products.create"
    PRODUCTS_UPDATE = "products.update"
    PRODUCTS_DELETE = "products.delete"

    # Categories
    CATEGORIES_VIEW = "categories.view"
    CATEGORIES_MANAGE = "categories.manage"

    # Inventory
    INVENTORY_VIEW = "inventory.view"
    INVENTORY_UPDATE = "inventory.update"

    # Orders & Dispatches
    ORDERS_VIEW = "orders.view"
    ORDERS_UPDATE = "orders.update"
    ORDERS_CANCEL = "orders.cancel"

    # Customers & Directory
    CUSTOMERS_VIEW = "customers.view"
    CUSTOMERS_UPDATE = "customers.update"

    # Quotes & RFQs
    QUOTES_VIEW = "quotes.view"
    QUOTES_MANAGE = "quotes.manage"

    # Construction Projects
    PROJECTS_VIEW = "projects.view"
    PROJECTS_MANAGE = "projects.manage"

    # BOQ 2.0 Schedules
    BOQS_VIEW = "boqs.view"
    BOQS_MANAGE = "boqs.manage"

    # Cost Calculator Estimates
    ESTIMATES_VIEW = "estimates.view"
    ESTIMATES_MANAGE = "estimates.manage"

    # Suppliers & Mills
    SUPPLIERS_VIEW = "suppliers.view"
    SUPPLIERS_MANAGE = "suppliers.manage"

    # Pricing & Margins
    PRICING_VIEW = "pricing.view"
    PRICING_MANAGE = "pricing.manage"

    # Analytics & Reports
    REPORTS_VIEW = "reports.view"

    # System & Staff Administration
    SETTINGS_MANAGE = "settings.manage"
    USERS_MANAGE = "users.manage"
    ROLES_MANAGE = "roles.manage"


# Complete Master Permission Set
ALL_PERMISSIONS: Set[Permission] = set(Permission)

# Authoritative Server-Side Role-to-Permission Mapping
ROLE_PERMISSIONS: dict[UserRole, Set[Permission]] = {
    UserRole.SUPER_ADMIN: ALL_PERMISSIONS,

    UserRole.ADMIN: {
        Permission.PRODUCTS_VIEW,
        Permission.PRODUCTS_CREATE,
        Permission.PRODUCTS_UPDATE,
        Permission.PRODUCTS_DELETE,
        Permission.CATEGORIES_VIEW,
        Permission.CATEGORIES_MANAGE,
        Permission.INVENTORY_VIEW,
        Permission.INVENTORY_UPDATE,
        Permission.ORDERS_VIEW,
        Permission.ORDERS_UPDATE,
        Permission.ORDERS_CANCEL,
        Permission.CUSTOMERS_VIEW,
        Permission.CUSTOMERS_UPDATE,
        Permission.QUOTES_VIEW,
        Permission.QUOTES_MANAGE,
        Permission.PROJECTS_VIEW,
        Permission.PROJECTS_MANAGE,
        Permission.BOQS_VIEW,
        Permission.BOQS_MANAGE,
        Permission.ESTIMATES_VIEW,
        Permission.ESTIMATES_MANAGE,
        Permission.SUPPLIERS_VIEW,
        Permission.SUPPLIERS_MANAGE,
        Permission.PRICING_VIEW,
        Permission.PRICING_MANAGE,
        Permission.REPORTS_VIEW,
        Permission.SETTINGS_MANAGE,
        Permission.USERS_MANAGE,
    },

    UserRole.PROCUREMENT_MANAGER: {
        Permission.PRODUCTS_VIEW,
        Permission.CATEGORIES_VIEW,
        Permission.INVENTORY_VIEW,
        Permission.INVENTORY_UPDATE,
        Permission.QUOTES_VIEW,
        Permission.QUOTES_MANAGE,
        Permission.SUPPLIERS_VIEW,
        Permission.SUPPLIERS_MANAGE,
        Permission.PRICING_VIEW,
        Permission.PRICING_MANAGE,
        Permission.REPORTS_VIEW,
        Permission.PROJECTS_VIEW,
        Permission.BOQS_VIEW,
    },

    UserRole.INVENTORY_MANAGER: {
        Permission.PRODUCTS_VIEW,
        Permission.CATEGORIES_VIEW,
        Permission.INVENTORY_VIEW,
        Permission.INVENTORY_UPDATE,
        Permission.ORDERS_VIEW,
        Permission.SUPPLIERS_VIEW,
        Permission.REPORTS_VIEW,
    },

    UserRole.ORDER_MANAGER: {
        Permission.ORDERS_VIEW,
        Permission.ORDERS_UPDATE,
        Permission.ORDERS_CANCEL,
        Permission.CUSTOMERS_VIEW,
        Permission.REPORTS_VIEW,
    },

    UserRole.SUPPORT_STAFF: {
        Permission.CUSTOMERS_VIEW,
        Permission.ORDERS_VIEW,
        Permission.PROJECTS_VIEW,
        Permission.BOQS_VIEW,
        Permission.ESTIMATES_VIEW,
    },

    UserRole.CUSTOMER: set(),  # Customers have no staff administrative permissions
}


def get_role_permissions(role: UserRole) -> List[Permission]:
    """
    Returns the list of permissions associated with a given user role.
    """
    return list(ROLE_PERMISSIONS.get(role, set()))


def has_permission(role: UserRole, permission: Union[Permission, str]) -> bool:
    """
    Evaluates whether a role possesses a specific permission.
    """
    if isinstance(permission, str):
        try:
            permission = Permission(permission)
        except ValueError:
            return False
    return permission in ROLE_PERMISSIONS.get(role, set())


def is_staff_role(role: UserRole) -> bool:
    """
    Determines if a role belongs to the internal staff domain.
    """
    return role != UserRole.CUSTOMER
