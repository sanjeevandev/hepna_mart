import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Printer,
  FileText,
  PhoneCall,
  RotateCcw,
  AlertCircle,
  Building,
  HardHat,
  ChevronRight,
  ShieldCheck,
  Truck,
  Boxes,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice } from '@/utils/formatPrice';
import OrderStatusTimeline, { getStatusBadgeInfo } from '@/components/order/OrderStatusTimeline';
import SiteDeliveryCard from '@/components/order/SiteDeliveryCard';
import OrderInvoiceModal from '@/components/order/OrderInvoiceModal';
import QuotationModal from '@/components/cart/QuotationModal';
import Button from '@/components/ui/Button';
import SectionReveal from '@/components/ui/SectionReveal';

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrder, fetchOrderById, cancelOrder, reorderItems } = useOrderStore();

  const [order, setOrder] = useState<Order | undefined>(orderId ? getOrder(orderId) : undefined);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Construction schedule postponed by contractor');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (orderId) {
      // First check local state
      const existing = getOrder(orderId);
      if (existing) setOrder(existing);
      // Then fetch latest from server
      fetchOrderById(orderId).then((fetched) => {
        if (fetched) setOrder(fetched);
      });
    }
  }, [orderId, getOrder, fetchOrderById]);

  // Handle Order Cancellation
  const handleConfirmCancel = async () => {
    if (!order) return;
    const success = await cancelOrder(order.id, cancelReason);
    if (success) {
      setIsCancelModalOpen(false);
      const updated = getOrder(order.id);
      if (updated) setOrder(updated);
    }
  };

  // Handle Reorder
  const handleReorder = async () => {
    if (!order) return;
    const res = await reorderItems(order.id);
    if (res.added > 0) {
      navigate('/cart');
    }
  };

  // Fallback if order not found
  if (!order) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
          <Package size={40} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#071A2B] mb-2">
          Order Not Found
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
          We couldn't find an order matching &ldquo;{orderId}&rdquo;. It may have been archived or removed from local history.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/orders">
            <Button variant="primary">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>View All Orders</span>
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline">
              <span>Explore Materials Catalog</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadgeInfo(order.status);
  const canCancel = order.status === 'confirmed' || order.status === 'processing';
  const orderDateStr = new Date(order.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-8 sm:py-10">
      <div className="container-custom">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-xs text-slate-500 mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight size={14} className="mx-1.5 text-slate-400" />
          <Link to="/orders" className="hover:text-primary transition-colors">
            Orders
          </Link>
          <ChevronRight size={14} className="mx-1.5 text-slate-400" />
          <span className="text-slate-900 font-bold truncate">#{order.id}</span>
        </nav>

        {/* Top Order Header Card */}
        <SectionReveal variant="hero">
          <div className="bg-[#071A2B] text-white rounded-2xl p-6 sm:p-8 shadow-xl mb-8 border border-white/10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Details */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white">
                    Order #{order.id}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border ${statusBadge.bg}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
                    <span>{statusBadge.label}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
                  <div>
                    Placed on: <strong className="text-white">{orderDateStr}</strong>
                  </div>
                  <div>
                    Payment: <strong className="text-white">{order.paymentMethod}</strong>
                  </div>
                  <div>
                    Items: <strong className="text-white">{order.items.length} materials</strong>
                  </div>
                  {order.projectName && (
                    <div className="flex items-center gap-1.5 text-accent-light font-bold">
                      <Building className="w-3.5 h-3.5" />
                      <span>{order.projectName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action Hub */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline-white"
                  size="sm"
                  onClick={() => setIsInvoiceOpen(true)}
                  icon={<Printer className="w-3.5 h-3.5" />}
                >
                  Tax Invoice
                </Button>

                {order.quotationId && (
                  <Button
                    variant="outline-white"
                    size="sm"
                    onClick={() => setIsQuotationOpen(true)}
                    icon={<FileText className="w-3.5 h-3.5" />}
                  >
                    View Quotation
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleReorder}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Reorder Materials
                </Button>

                {canCancel && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setIsCancelModalOpen(true)}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* Main Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN (8/12): Delivery Timeline + Ordered Materials + Price Breakdown */}
          <div className="lg:col-span-8 space-y-8">
            {/* Visual Delivery Timeline */}
            <SectionReveal>
              <OrderStatusTimeline order={order} />
            </SectionReveal>

            {/* Ordered Materials List */}
            <SectionReveal>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#071A2B] flex items-center justify-center font-bold">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-[#071A2B]">
                        Ordered Materials & Supplies
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {order.items.length} product line {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-500">
                    Total Qty: {order.items.reduce((acc, i) => acc + i.quantity, 0)} Units
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {order.items.map((item) => {
                    const itemSub = item.product.price * item.quantity;
                    return (
                      <div
                        key={item.product.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Link
                            to={`/product/${item.product.slug}`}
                            className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1.5"
                          >
                            <img
                              src={item.product.images?.[0] || 'https://placehold.co/100?text=HEPNA'}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </Link>

                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                              {item.product.brand}
                            </span>
                            <Link to={`/product/${item.product.slug}`}>
                              <h4 className="font-bold text-sm text-slate-900 hover:text-accent transition-colors line-clamp-1">
                                {item.product.name}
                              </h4>
                            </Link>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Rate: <strong className="text-slate-800">{formatPrice(item.product.price)}</strong> /{' '}
                              {item.product.unit}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right">
                          <div className="text-xs">
                            <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                              Quantity
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {item.quantity} {item.product.unit}s
                            </span>
                          </div>

                          <div className="text-right min-w-[90px]">
                            <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                              Subtotal
                            </span>
                            <span className="font-black text-[#071A2B] text-sm sm:text-base">
                              {formatPrice(itemSub)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionReveal>

            {/* Financial Summary Calculation Card */}
            <SectionReveal>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h3 className="font-heading font-bold text-sm sm:text-base text-[#071A2B] pb-3 border-b border-slate-100">
                  Order Payment Summary
                </h3>

                <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Materials Subtotal:</span>
                    <span className="font-semibold text-slate-900">{formatPrice(order.subtotal)}</span>
                  </div>

                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Promotional Discount:</span>
                      <span className="font-semibold">-{formatPrice(order.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>GST (18% Input Tax Credit Eligible):</span>
                    <span className="font-semibold text-slate-900">{formatPrice(order.tax)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Direct Job-Site Logistics:</span>
                    <span className="font-semibold text-slate-900">
                      {order.deliveryCharge === 0 ? (
                        <span className="text-emerald-700 font-bold">FREE</span>
                      ) : (
                        formatPrice(order.deliveryCharge)
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base sm:text-lg font-black text-[#071A2B]">
                    <span>Total Amount Paid:</span>
                    <span className="text-xl sm:text-2xl text-accent font-black">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>

          {/* RIGHT COLUMN (4/12): Construction Site Card + Project Link + Support */}
          <div className="lg:col-span-4 space-y-6">
            {/* Construction Site Delivery Card */}
            <SiteDeliveryCard
              address={order.deliveryAddress}
              projectName={order.projectName}
              deliveryWindow={order.deliveryWindow}
              estimatedDelivery={order.estimatedDelivery}
            />

            {/* Linked Project Card (if order is linked to a project) */}
            {order.projectId && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-accent" />
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#071A2B]">
                    Linked Project & BOQ
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  This order was scheduled for <strong className="text-slate-900">{order.projectName}</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to={`/projects/${order.projectId}`}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>View Project</span>
                    <ChevronRight size={14} />
                  </Link>
                  <Link
                    to={`/projects/${order.projectId}/boq`}
                    className="py-2 px-3 rounded-xl bg-[#071A2B] hover:bg-[#0B2742] text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>View BOQ</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* Direct Logistics Support Card */}
            <div className="bg-[#071A2B] text-white rounded-2xl p-5 space-y-3 border border-white/10">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-accent" />
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-white">
                  Need Help with Site Delivery?
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Contact our specialized site dispatch coordinators for route access clearances or heavy crane unloading coordination.
              </p>
              <div className="pt-2">
                <Link to="/contact">
                  <Button variant="outline-white" size="sm" fullWidth>
                    Contact Logistics Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      <OrderInvoiceModal
        order={order}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />

      {/* Digital Quotation Modal Integration */}
      <QuotationModal
        isOpen={isQuotationOpen}
        onClose={() => setIsQuotationOpen(false)}
      />

      {/* Cancellation Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-heading font-bold text-lg text-slate-900">
                Cancel Order #{order.id}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel this order? Material allocation will be released back to warehouse inventory.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="Construction schedule postponed by contractor">
                  Construction schedule postponed by contractor
                </option>
                <option value="Ordered incorrect grade or quantity of material">
                  Ordered incorrect grade or quantity of material
                </option>
                <option value="Site road access clearance issue">
                  Site road access clearance issue
                </option>
                <option value="Found alternative local stock">Found alternative local stock</option>
                <option value="Other project adjustment">Other project adjustment</option>
              </select>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Keep Order
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
