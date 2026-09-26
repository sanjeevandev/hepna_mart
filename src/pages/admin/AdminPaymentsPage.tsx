import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Copy,
  Receipt,
  Wallet,
  Building,
  User,
  Smartphone,
} from 'lucide-react';
import {
  apiClient,
  BackendPayment,
  BackendPaymentMetrics,
} from '@/lib/api';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<BackendPayment[]>([]);
  const [metrics, setMetrics] = useState<BackendPaymentMetrics>({
    pending_verification: 0,
    verified_today: 0,
    failed_payments: 0,
    cod_orders: 0,
    upi_volume: 0,
    refund_pending: 0,
    total_payments: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Review Modal State
  const [selectedPayment, setSelectedPayment] = useState<BackendPayment | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('UPI reference could not be matched with banking statement.');
  const [isRejecting, setIsRejecting] = useState(false);

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('Order cancelled or returned by customer');
  const [isRefunding, setIsRefunding] = useState(false);

  // Reconciliation State
  const [reconciliationList, setReconciliationList] = useState<any[]>([]);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isCheckingReconcile, setIsCheckingReconcile] = useState(false);

  // Load Payments & Metrics
  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const [listRes, metricsRes] = await Promise.all([
        apiClient.adminPayments.list({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          method: methodFilter !== 'all' ? methodFilter : undefined,
          search: searchQuery.trim() || undefined,
          page,
          limit: 20,
        }),
        apiClient.adminPayments.getMetrics(),
      ]);

      if (listRes.data) {
        setPayments(listRes.data.payments);
        setTotalCount(listRes.data.total);
      }
      if (metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payments data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter, methodFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPayments();
  };

  // Open Review Details
  const handleOpenReview = async (p: BackendPayment) => {
    try {
      const res = await apiClient.adminPayments.get(p.id);
      if (res.data) {
        setSelectedPayment(res.data);
      } else {
        setSelectedPayment(p);
      }
    } catch {
      setSelectedPayment(p);
    }
    setIsReviewModalOpen(true);
  };

  // Execute Verification
  const handleConfirmVerify = async () => {
    if (!selectedPayment) return;
    setIsVerifying(true);
    try {
      const res = await apiClient.adminPayments.verify(selectedPayment.id, verificationNotes);
      if (res.data) {
        toast.success(`Payment for Order #${selectedPayment.order?.order_number || selectedPayment.order_id.slice(0, 8)} VERIFIED!`);
        setIsReviewModalOpen(false);
        setVerificationNotes('');
        loadPayments();
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // Execute Rejection
  const handleConfirmReject = async () => {
    if (!selectedPayment) return;
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setIsRejecting(true);
    try {
      const res = await apiClient.adminPayments.reject(selectedPayment.id, rejectionReason);
      if (res.data) {
        toast.success('Payment rejected and marked as failed');
        setIsRejectModalOpen(false);
        setIsReviewModalOpen(false);
        loadPayments();
      }
    } catch (err: any) {
      toast.error(err.message || 'Rejection failed');
    } finally {
      setIsRejecting(false);
    }
  };

  // Execute Refund
  const handleConfirmRefund = async () => {
    if (!selectedPayment) return;
    setIsRefunding(true);
    try {
      const res = await apiClient.adminPayments.refund(selectedPayment.id, refundReason);
      if (res.data) {
        toast.success('Payment refund record created');
        setIsRefundModalOpen(false);
        setIsReviewModalOpen(false);
        loadPayments();
      }
    } catch (err: any) {
      toast.error(err.message || 'Refund failed');
    } finally {
      setIsRefunding(false);
    }
  };

  // Check Reconciliation
  const handleCheckReconciliation = async () => {
    setIsCheckingReconcile(true);
    try {
      const res = await apiClient.adminPayments.getReconciliation();
      if (res.data) {
        setReconciliationList(res.data);
        setIsReconcileModalOpen(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to check reconciliation');
    } finally {
      setIsCheckingReconcile(false);
    }
  };

  // Single Reconcile Action
  const handleReconcileSingle = async (paymentId: string) => {
    try {
      await apiClient.adminPayments.reconcile(paymentId);
      toast.success('Order payment status synchronized!');
      // Refresh list
      const res = await apiClient.adminPayments.getReconciliation();
      if (res.data) setReconciliationList(res.data);
      loadPayments();
    } catch (err: any) {
      toast.error(err.message || 'Reconciliation failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified</span>
          </span>
        );
      case 'awaiting_verification':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Awaiting Verification</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refunded</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <X className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Receipt className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-primary font-bold uppercase tracking-wider">
            <span>Phase 2G</span>
            <span>•</span>
            <span>Real Commerce Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#071A2B] mt-1">
            Payment Management & UPI Verification
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Authoritative financial auditing, manual UPI UTR verification, and reconciliation against PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckReconciliation}
            disabled={isCheckingReconcile}
            className="flex items-center gap-1.5 bg-white shadow-sm text-slate-700 hover:text-primary"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Reconciliation Check</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadPayments}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Awaiting Verification
          </span>
          <span className="text-2xl font-black font-heading text-amber-900 mt-1 block">
            {metrics.pending_verification}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Verified Today
          </span>
          <span className="text-2xl font-black font-heading text-emerald-900 mt-1 block">
            {metrics.verified_today}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
            Failed / Rejected
          </span>
          <span className="text-2xl font-black font-heading text-red-900 mt-1 block">
            {metrics.failed_payments}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            Cash on Delivery
          </span>
          <span className="text-2xl font-black font-heading text-blue-900 mt-1 block">
            {metrics.cod_orders}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
            UPI Verified Volume
          </span>
          <span className="text-2xl font-black font-heading text-purple-900 mt-1 block">
            {formatPrice(metrics.upi_volume)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Payments
          </span>
          <span className="text-2xl font-black font-heading text-slate-900 mt-1 block">
            {metrics.total_payments}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, UTR, Customer, or Ref..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
          />
        </form>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="awaiting_verification">Awaiting Verification</option>
              <option value="verified">Verified</option>
              <option value="failed">Failed / Rejected</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Methods</option>
              <option value="upi">UPI</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">UPI / UTR Reference</th>
                <th className="py-3.5 px-4">Created / Submitted</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading payment records from PostgreSQL...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    No payments found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      #{p.order?.order_number || p.order_id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                        {p.order?.customer_name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                        {p.order?.customer_email || p.user_id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-black font-heading text-slate-900">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold uppercase text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(p.payment_status)}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {p.provider_reference ? (
                        <span className="font-bold text-primary bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
                          {p.provider_reference}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not submitted</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(p.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant={p.payment_status === 'awaiting_verification' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleOpenReview(p)}
                        className="text-xs"
                      >
                        {p.payment_status === 'awaiting_verification' ? 'Review & Verify' : 'View Details'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Verification Modal */}
      {isReviewModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                  Payment Verification Desk
                </span>
                <h2 className="text-xl font-heading font-black text-[#071A2B] mt-0.5">
                  Order #{selectedPayment.order?.order_number || selectedPayment.order_id.slice(0, 8)}
                </h2>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Details Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 block text-[11px] uppercase font-bold">Customer</span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {selectedPayment.order?.customer_name || 'Customer'}
                </span>
                <span className="text-slate-500 text-xs">{selectedPayment.order?.customer_email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] uppercase font-bold">Authoritative Amount</span>
                <span className="font-black text-primary text-base font-heading block mt-0.5">
                  {formatPrice(selectedPayment.amount)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] uppercase font-bold">Method / Provider</span>
                <span className="font-semibold uppercase text-slate-900 block mt-0.5">
                  {selectedPayment.payment_method} ({selectedPayment.provider})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] uppercase font-bold">Submitted UTR Reference</span>
                <span className="font-mono font-bold text-primary text-sm block mt-0.5">
                  {selectedPayment.provider_reference || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] uppercase font-bold">Payment Status</span>
                <div className="mt-1">{getStatusBadge(selectedPayment.payment_status)}</div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] uppercase font-bold">Submission Timestamp</span>
                <span className="text-slate-700 block mt-0.5">
                  {new Date(selectedPayment.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Event Audit Trail */}
            {selectedPayment.events && selectedPayment.events.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Audit Event History (Immutable)
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedPayment.events.map((evt) => (
                    <div key={evt.id} className="text-xs flex items-center justify-between border-b border-slate-100 last:border-0 pb-1.5">
                      <div>
                        <span className="font-bold text-slate-800">{evt.event_type}</span>
                        <span className="text-slate-400 text-[10px] ml-2 font-mono">
                          {evt.old_status || 'null'} → {evt.new_status}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(evt.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReviewModalOpen(false)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {selectedPayment.payment_status === 'awaiting_verification' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRejectModalOpen(true)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Reject Payment
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleConfirmVerify}
                      disabled={isVerifying}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify Payment'}
                    </Button>
                  </>
                )}

                {selectedPayment.payment_status === 'verified' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRefundModalOpen(true)}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    Issue Refund Record
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Prompt Modal */}
      {isRejectModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-[#071A2B] mb-2">Reject Payment Reference</h3>
            <p className="text-xs text-slate-600 mb-4">
              Please enter the specific reason why this UPI transaction could not be verified. This will be visible in the customer timeline.
            </p>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. UTR reference not found in bank statement"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Prompt Modal */}
      {isRefundModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-[#071A2B] mb-2">Record Payment Refund</h3>
            <p className="text-xs text-slate-600 mb-4">
              Record a refund in PostgreSQL for Order #{selectedPayment.order?.order_number}. Note: Direct bank refund must be processed manually via your banking desk.
            </p>
            <textarea
              required
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Customer cancelled order before dispatch"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsRefundModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRefund}
                disabled={isRefunding}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isRefunding ? 'Recording...' : 'Confirm Refund'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation Modal */}
      {isReconcileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-[#071A2B]">Payment & Order Reconciliation</h3>
              </div>
              <button
                onClick={() => setIsReconcileModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reconciliationList.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">All Payments Reconciled!</p>
                <p className="text-xs text-slate-500 mt-1">
                  There are no discrepancies between payment records and order payment statuses in PostgreSQL.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  The following {reconciliationList.length} orders have status discrepancies between the Payment table and Orders table:
                </p>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {reconciliationList.map((disc) => (
                    <div key={disc.payment_id} className="p-4 flex items-center justify-between gap-4 bg-slate-50/50">
                      <div>
                        <span className="font-mono font-bold text-slate-900 text-sm">#{disc.order_number}</span>
                        <p className="text-xs text-amber-700 font-semibold mt-0.5">{disc.discrepancy_type}</p>
                        <span className="text-[11px] text-slate-500">
                          Customer: {disc.customer_name} ({disc.customer_email}) • Amount: {formatPrice(disc.payment_amount)}
                        </span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReconcileSingle(disc.payment_id)}
                      >
                        Reconcile Order
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
