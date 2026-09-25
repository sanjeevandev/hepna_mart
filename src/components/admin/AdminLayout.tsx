import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  FileText,
  Users,
  HardHat,
  Truck,
  DollarSign,
  BarChart3,
  Settings,
  Layers,
  Calculator,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Building,
  Tag,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/rbac';
import { Permission } from '@/types';
import AdminHeader from './AdminHeader';

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission: Permission;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'DASHBOARD',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        permission: 'dashboard.view',
      },
    ],
  },
  {
    title: 'CATALOG',
    items: [
      {
        label: 'Products',
        href: '/admin/products',
        icon: Package,
        permission: 'products.view',
      },
      {
        label: 'Categories',
        href: '/admin/categories',
        icon: Tag,
        permission: 'categories.view',
      },
      {
        label: 'Inventory',
        href: '/admin/inventory',
        icon: Boxes,
        permission: 'inventory.view',
      },
    ],
  },
  {
    title: 'COMMERCE',
    items: [
      {
        label: 'Orders',
        href: '/admin/orders',
        icon: ShoppingCart,
        permission: 'orders.view',
      },
      {
        label: 'Customers',
        href: '/admin/customers',
        icon: Users,
        permission: 'customers.view',
      },
      {
        label: 'Quotes',
        href: '/admin/quotes',
        icon: FileText,
        permission: 'quotes.view',
      },
    ],
  },
  {
    title: 'CONSTRUCTION',
    items: [
      {
        label: 'Projects',
        href: '/admin/projects',
        icon: HardHat,
        permission: 'projects.view',
      },
      {
        label: 'BOQs',
        href: '/admin/boqs',
        icon: Layers,
        permission: 'boq.view',
      },
      {
        label: 'Estimates',
        href: '/admin/estimates',
        icon: Calculator,
        permission: 'estimates.view',
      },
    ],
  },
  {
    title: 'PROCUREMENT',
    items: [
      {
        label: 'Suppliers',
        href: '/admin/suppliers',
        icon: Truck,
        permission: 'suppliers.view',
      },
      {
        label: 'Pricing',
        href: '/admin/pricing',
        icon: DollarSign,
        permission: 'pricing.view',
      },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      {
        label: 'Reports',
        href: '/admin/reports',
        icon: BarChart3,
        permission: 'reports.view',
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        label: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        permission: 'settings.manage',
      },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const role = currentUser?.role || 'customer';

  // Filter sections and items based on role permissions
  const permittedSections = NAV_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter((item) => hasPermission(role, item.permission)),
  })).filter((sec) => sec.items.length > 0);

  const renderNavLinks = () => (
    <div className="p-4 space-y-5 flex-1 overflow-y-auto">
      <div className="px-3 pb-1 border-b border-white/10 mb-2">
        <div className="font-heading font-black text-sm text-white tracking-wider">
          HEPNA MART
        </div>
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-accent">
          ADMIN PANEL
        </div>
      </div>

      {permittedSections.map((sec) => (
        <div key={sec.title} className="space-y-1">
          {sec.title !== 'DASHBOARD' && (
            <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              {sec.title}
            </div>
          )}
          {sec.items.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AdminHeader onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

      <div className="flex-1 flex min-w-0 relative">
        {/* Permanent Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#071A2B] text-slate-300 border-r border-white/10 shrink-0">
          {renderNavLinks()}

          <div className="p-4 border-t border-white/10 bg-[#0B2742]/50 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>HEPNA RBAC v1.0</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Live role simulation active.
            </p>
          </div>
        </aside>

        {/* Mobile Slide-over Drawer */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Sidebar drawer content */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#071A2B] text-slate-300 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <div className="font-heading font-black text-white text-sm">
                  HEPNA MART Admin
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {renderNavLinks()}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
