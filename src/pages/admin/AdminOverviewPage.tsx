import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Boxes,
  ShoppingCart,
  Users,
  HardHat,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building,
  DollarSign,
  FileText,
  Truck,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useOrderStore } from '@/store/orderStore';
import { products } from '@/data/products';
import { formatPrice } from '@/utils/formatPrice';
import { getRoleLabel } from '@/utils/rbac';

export const AdminOverviewPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { projects } = useProjectStore();
  const { orders } = useOrderStore();

  const role = currentUser?.role || 'admin';
  const lowStockProducts = products.filter((p) => p.stock && p.stock < 150).slice(0, 5);

  const pendingOrders = orders.filter((o) => o.status === 'processing' || o.status === 'confirmed');
  const totalOrdersRevenue = orders.reduce((acc, o) => acc + o.total, 0);

  // Demo suppliers count & quote count for live display
  const demoSuppliersCount = 14;
  const demoOpenQuotesCount = 6;
  const demoCustomersCount = 128;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-[#071A2B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent-light text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Operational Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
            HEPNA MART Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Logged in as <strong className="text-white">{currentUser?.name}</strong> ({getRoleLabel(role)}) • Site dispatches, inventory health & construction procurement schedules.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start md:self-center">
          <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Store Sync Active</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
            Demo Data Included
          </span>
        </div>
      </div>

      {/* 8 Primary KPI Metric Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Key Operational Metrics</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Auto-updated from local store</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Orders */}
          <Link
            to="/admin/orders"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-accent/40 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <ShoppingCart className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900">{orders.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Revenue: {formatPrice(totalOrdersRevenue)}
            </div>
          </Link>

          {/* 2. Pending Orders */}
          <Link
            to="/admin/orders"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-accent/40 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Orders</span>
              <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-amber-600">{pendingOrders.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Awaiting packing / dispatch</div>
          </Link>

          {/* 3. Products */}
          <Link
            to="/admin/products"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-accent/40 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Products (SKUs)</span>
              <Package className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900">{products.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Across 12 building categories</div>
          </Link>

          {/* 4. Low Stock Items */}
          <Link
            to="/admin/inventory"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-accent/40 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Low Stock Items</span>
              <AlertTriangle className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-red-600">{lowStockProducts.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Below safety threshold</div>
          </Link>

          {/* 5. Customers */}
          <Link
            to="/admin/customers"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-accent/40 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Customers</span>
              <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900">{demoCustomersCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Contractors & Retail (Demo)</div>
          </Link>

          {/* 6. Active Projects */}
          <Link
            to="/admin/projects"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-accent/40 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Projects</span>
              <HardHat className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900">{projects.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Active site BOQ schedules</div>
          </Link>

          {/* 7. Open Quotes */}
          <Link
            to="/admin/quotes"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-accent/40 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Open Quotes</span>
              <FileText className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900">{demoOpenQuotesCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Bulk RFQs pending review (Demo)</div>
          </Link>

          {/* 8. Suppliers */}
          <Link
            to="/admin/suppliers"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-accent/40 transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Suppliers</span>
              <Truck className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900">{demoSuppliersCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Cement & Steel mills (Demo)</div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Site Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Recent Construction Site Orders
              </h3>
              <span className="text-[11px] text-slate-400">Live orderStore synchronized</span>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No orders placed in active session yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.slice(0, 4).map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-slate-900 block font-bold">
                      Order #{order.id}
                    </strong>
                    <span className="text-slate-500 text-[11px]">
                      {order.deliveryAddress?.siteName || order.deliveryAddress?.city} • {order.items.length} items
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 block">
                      {formatPrice(order.total)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Critical Inventory Stock Alerts
              </h3>
              <span className="text-[11px] text-slate-400">Items requiring mill replenishment</span>
            </div>
            <Link
              to="/admin/inventory"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>Manage Stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={p.images?.[0] || 'https://placehold.co/40?text=HEPNA'}
                    alt={p.name}
                    className="w-9 h-9 rounded-lg object-cover bg-slate-100"
                  />
                  <div>
                    <strong className="text-slate-900 block font-bold truncate max-w-[180px]">
                      {p.name}
                    </strong>
                    <span className="text-slate-500 text-[11px]">{p.brand}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {p.stock} {p.unit} remaining
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
