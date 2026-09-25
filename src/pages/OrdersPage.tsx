import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  ChevronRight,
  Truck,
  RotateCcw,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice } from '@/utils/formatPrice';
import { getStatusBadgeInfo } from '@/components/order/OrderStatusTimeline';
import { OrderStatus } from '@/types';
import Button from '@/components/ui/Button';
import SectionReveal from '@/components/ui/SectionReveal';

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, reorderItems } = useOrderStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter calculations
  const activeOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === 'confirmed' ||
        o.status === 'processing' ||
        o.status === 'packed' ||
        o.status === 'shipped' ||
        o.status === 'out-for-delivery'
    ).length;
  }, [orders]);

  const deliveredOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'delivered').length;
  }, [orders]);

  const cancelledOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'cancelled').length;
  }, [orders]);

  // Filtered and Searched Orders
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Filter by Tab
    if (activeTab === 'active') {
      result = result.filter(
        (o) =>
          o.status === 'confirmed' ||
          o.status === 'processing' ||
          o.status === 'packed' ||
          o.status === 'shipped' ||
          o.status === 'out-for-delivery'
      );
    } else if (activeTab === 'delivered') {
      result = result.filter((o) => o.status === 'delivered');
    } else if (activeTab === 'cancelled') {
      result = result.filter((o) => o.status === 'cancelled');
    }

    // Search Query (Order ID, Project Name, Product Name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const matchesId = o.id.toLowerCase().includes(q);
        const matchesProject = o.projectName?.toLowerCase().includes(q);
        const matchesItems = o.items.some(
          (item) =>
            item.product.name.toLowerCase().includes(q) ||
            item.product.brand.toLowerCase().includes(q)
        );
        return matchesId || matchesProject || matchesItems;
      });
    }

    return result;
  }, [orders, activeTab, searchQuery]);

  const handleReorder = (orderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = reorderItems(orderId);
    if (res.added > 0) {
      navigate('/cart');
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-10 sm:py-12">
      <div className="container-custom">
        {/* Page Header */}
        <SectionReveal variant="hero">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#071A2B]">
                  My Orders & Site Deliveries
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Track live construction material dispatches, download invoices, and manage project deliveries
              </p>
            </div>

            <Link to="/shop">
              <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                Order New Materials
              </Button>
            </Link>
          </div>
        </SectionReveal>

        {/* Controls: Search & Tabs */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'all'
                    ? 'bg-[#071A2B] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Orders ({orders.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'active'
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                <span>Active Deliveries ({activeOrdersCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('delivered')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'delivered'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Delivered ({deliveredOrdersCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cancelled')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'cancelled'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cancelled ({cancelledOrdersCount})
              </button>
            </div>

            {/* Local Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order #, Project, Material..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Package size={32} />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">
              No orders found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              {searchQuery
                ? `No orders matching "${searchQuery}". Try searching for another keyword or clear filter.`
                : 'Your construction material orders and site deliveries will appear here.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/shop">
                <Button variant="primary" size="sm">
                  Start Exploring Materials
                </Button>
              </Link>
              <Link to="/projects/new">
                <Button variant="outline" size="sm">
                  Create a Project & BOQ
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const statusBadge = getStatusBadgeInfo(order.status);
              const orderDateStr = new Date(order.date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 transition-all hover:shadow-md hover:border-slate-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100">
                    {/* Top Order Overview */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/orders/${order.id}`}
                          className="font-heading font-bold text-base sm:text-lg text-[#071A2B] hover:text-accent transition-colors"
                        >
                          Order #{order.id}
                        </Link>

                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
                          <span>{statusBadge.label}</span>
                        </span>

                        {order.projectName && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            <Building className="w-3 h-3 text-accent" />
                            <span>{order.projectName}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
                        <span>Placed on: <strong className="text-slate-700">{orderDateStr}</strong></span>
                        <span>Site: <strong className="text-slate-700">{order.deliveryAddress.city}</strong></span>
                        <span>
                          Estimated Drop:{' '}
                          <strong className="text-slate-800 font-bold">
                            {order.estimatedDelivery}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Total & Primary Action Button */}
                    <div className="flex items-center justify-between lg:justify-end gap-6 pt-2 lg:pt-0 border-t lg:border-0 border-slate-100">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Total Amount
                        </span>
                        <span className="text-lg sm:text-xl font-black text-[#071A2B]">
                          {formatPrice(order.total)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/orders/${order.id}`}>
                          <Button variant="primary" size="sm" icon={<Truck className="w-3.5 h-3.5" />}>
                            Track Order
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Items Preview Strip */}
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-3 overflow-x-auto py-1">
                      {order.items.slice(0, 3).map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl shrink-0"
                        >
                          <img
                            src={item.product.images?.[0] || 'https://placehold.co/100?text=HEPNA'}
                            alt={item.product.name}
                            className="w-6 h-6 object-cover rounded bg-white"
                          />
                          <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                            {item.product.name}
                          </span>
                          <span className="text-slate-500 font-bold">
                            ×{item.quantity}
                          </span>
                        </div>
                      ))}

                      {order.items.length > 3 && (
                        <span className="text-xs font-semibold text-slate-400 shrink-0">
                          +{order.items.length - 3} more items
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleReorder(order.id, e)}
                        className="text-xs font-bold text-accent hover:text-accent-dark flex items-center gap-1 transition-colors px-2 py-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </button>

                      <Link
                        to={`/orders/${order.id}`}
                        className="text-xs font-bold text-slate-700 hover:text-primary flex items-center gap-0.5 transition-colors px-2 py-1"
                      >
                        <span>View Details</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
