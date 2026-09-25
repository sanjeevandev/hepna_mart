import { UserRole, AccountType, Permission } from '@/types';

/**
 * =========================================================================
 * HEPNA MART — ROLE-BASED ACCESS CONTROL (RBAC) PERMISSION MATRIX
 * =========================================================================
 * IMPORTANT: This client-side RBAC matrix governs UI visibility and client navigation only.
 * Production authorization must be enforced by the backend API on every request in Phase 2.
 */

export const ALL_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'products.view',
  'products.create',
  'products.edit',
  'products.delete',
  'categories.view',
  'inventory.view',
  'inventory.update',
  'orders.view',
  'orders.update',
  'orders.cancel',
  'customers.view',
  'customers.edit',
  'projects.view',
  'projects.edit',
  'boq.view',
  'boq.edit',
  'estimates.view',
  'quotes.view',
  'quotes.manage',
  'suppliers.view',
  'suppliers.manage',
  'pricing.view',
  'pricing.manage',
  'reports.view',
  'settings.manage',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [...ALL_PERMISSIONS],

  admin: [
    'dashboard.view',
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'categories.view',
    'inventory.view',
    'inventory.update',
    'orders.view',
    'orders.update',
    'orders.cancel',
    'customers.view',
    'customers.edit',
    'projects.view',
    'projects.edit',
    'boq.view',
    'boq.edit',
    'estimates.view',
    'quotes.view',
    'quotes.manage',
    'suppliers.view',
    'suppliers.manage',
    'pricing.view',
    'pricing.manage',
    'reports.view',
    'settings.manage',
  ],

  procurement_manager: [
    'dashboard.view',
    'products.view',
    'categories.view',
    'inventory.view',
    'inventory.update',
    'quotes.view',
    'quotes.manage',
    'suppliers.view',
    'suppliers.manage',
    'pricing.view',
    'pricing.manage',
    'reports.view',
  ],

  inventory_manager: [
    'dashboard.view',
    'products.view',
    'categories.view',
    'inventory.view',
    'inventory.update',
    'reports.view',
  ],

  order_manager: [
    'dashboard.view',
    'orders.view',
    'orders.update',
    'orders.cancel',
    'customers.view',
    'reports.view',
  ],

  support_staff: [
    'dashboard.view',
    'customers.view',
    'projects.view',
    'orders.view',
    'boq.view',
    'estimates.view',
  ],

  customer: [],
};

/**
 * Checks if a user with a given role has a specific permission
 */
export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Checks if a role is an internal staff/admin member
 */
export function isInternalStaff(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role !== 'customer';
}

/**
 * Formats a UserRole into a human-friendly string
 */
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Administrator';
    case 'procurement_manager':
      return 'Procurement Manager';
    case 'inventory_manager':
      return 'Inventory Manager';
    case 'order_manager':
      return 'Order Manager';
    case 'support_staff':
      return 'Support Staff';
    case 'customer':
      return 'Customer';
    default:
      return 'User';
  }
}

/**
 * Returns accessible styling tokens for role badges
 */
export function getRoleBadgeColor(role: UserRole): {
  bg: string;
  text: string;
  border: string;
} {
  switch (role) {
    case 'super_admin':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
      };
    case 'admin':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case 'procurement_manager':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
      };
    case 'inventory_manager':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'order_manager':
      return {
        bg: 'bg-cyan-50',
        text: 'text-cyan-700',
        border: 'border-cyan-200',
      };
    case 'support_staff':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
      };
    case 'customer':
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
      };
  }
}

/**
 * Formats an AccountType into a human-friendly string
 */
export function getAccountTypeLabel(type: AccountType): string {
  switch (type) {
    case 'individual':
      return 'Individual';
    case 'contractor':
      return 'Contractor / Builder';
    case 'business':
      return 'Business / Enterprise';
    default:
      return 'Standard';
  }
}
