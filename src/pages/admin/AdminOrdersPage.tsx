import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { useOrderStore, mapBackendOrderToOrder } from '@/store/orderStore';
import { apiClient, getAuthToken } from '@/lib/api';
import { formatPrice } from '@/utils/formatPrice';
import { OrderStatus, Order } from '@/types';
import toast from 'react-hot-toast';

const AdminOrdersPage: React.FC = () => {
  const { orders: localOrders, updateOrderStatus } = useOrderStore();
  const [adminOrders, setAdminOrders] = useState<Order[]>(localOrders);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchAdminOrders = async () => {
    const token = getAuthToken();
    if (!token) {
      setAdminOrders(localOrders);
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.adminOrders.list({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });

      if (res.data && res.data.orders) {
        const mapped = res.data.orders.map(mapBackendOrderToOrder);
        setAdminOrders(mapped);
      }
    } catch (err: any) {
      console.warn('[AdminOrders] Fetch failed, using local orders store:', err);
      setAdminOrders(localOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOrders();
  }, [statusFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdminOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(
        orderId,
        newStatus,
        `Status updated to ${newStatus} via Admin Console`
      );
      // Refresh list
      await fetchAdminOrders();
    } catch (err: any) {
      toast.error(err.message || 'Status update failed');
    }
  };

  const displayOrders = adminOrders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress?.siteName?.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress?.city.toLowerCase().includes(search.toLowerCase());

    if (statusFilter !== 'ALL') {
      return matchesSearch && o.status === statusFilter;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-black text-slate-900">
          Site Orders & Fulfillment Pipeline
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track customer site drops, dispatch schedules, and logistics status updates
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, Site Name, City..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-accent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Order Statuses ({displayOrders.length})</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="out-for-delivery">Out For Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span>Loading orders from fulfillment depot...</span>
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No orders match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Destination Site</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4 text-right">Order Total</th>
                  <th className="py-3.5 px-4 text-center">Dispatch Status</th>
                  <th className="py-3.5 px-4 text-center">Quick Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/orders/${order.id}`}
                        className="font-bold text-slate-900 hover:text-accent transition-colors block"
                      >
                        Order #{order.id}
                      </Link>
                      <span className="text-[11px] text-slate-400">
                        {new Date(order.date).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-800 block">
                        {order.deliveryAddress?.siteName || order.deliveryAddress?.fullName}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        {order.deliveryAddress?.city} ({order.deliveryAddress?.pincode})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {order.items.length} SKUs
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-accent"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="out-for-delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
