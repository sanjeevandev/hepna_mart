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
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Building,
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
    title: 'Core',
    items: [
      {
        label: 'Dashboard Overview',
        href: '/admin',
        icon: LayoutDashboard,
        permission: 'dashboard.view',
      },
    ],
  },
  {
    title: 'Catalog & Stock',
    items: [
      {
        label: 'Products',
        href: '/admin/products',
        icon: Package,
        permission: 'products.view',
      },
      {
        label: 'Inventory & Stock',
        href: '/admin/inventory',
        icon: Boxes,
        permission: 'inventory.view',
      },
    ],
  },
  {
    title: 'Commerce & Orders',
    items: [
      {
        label: 'Site Orders',
        href: '/admin/orders',
        icon: ShoppingCart,
        permission: 'orders.view',
      },
      {
        label: 'Bulk Quotations',
        href: '/admin/quotes',
        icon: FileText,
        permission: 'quotes.view',
      },
      {
        label: 'Customers & Trade',
        href: '/admin/customers',
        icon: Users,
        permission: 'customers.view',
      },
    ],
  },
  {
    title: 'Construction',
    items: [
      {
        label: 'Projects Oversight',
        href: '/admin/projects',
        icon: HardHat,
        permission: 'projects.view',
      },
      {
        label: 'BOQ Schedules',
        href: '/admin/boqs',
        icon: Layers,
        permission: 'boq.view',
      },
    ],
  },
  {
    title: 'Supply Chain',
    items: [
      {
        label: 'Suppliers & Mills',
        href: '/admin/suppliers',
        icon: Truck,
        permission: 'suppliers.view',
      },
      {
        label: 'Pricing & Margins',
        href: '/admin/pricing',
        icon: DollarSign,
        permission: 'pricing.view',
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        label: 'Reports & Audits',
        href: '/admin/reports',
        icon: BarChart3,
        permission: 'reports.view',
      },
      {
        label: 'System Settings',
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AdminHeader />

      <div className="flex-1 flex min-w-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#071A2B] text-slate-300 border-r border-white/10 shrink-0">
          <div className="p-4 space-y-6 flex-1 overflow-y-auto">
            {permittedSections.map((sec) => (
              <div key={sec.title} className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {sec.title}
                </div>
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

          <div className="p-4 border-t border-white/10 bg-[#0B2742]/50 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>HEPNA RBAC v1.0</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Frontend simulation of staff permission bounds.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
