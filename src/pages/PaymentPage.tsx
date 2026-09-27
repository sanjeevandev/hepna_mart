import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Wallet,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import { apiClient, getAuthToken, BackendPayment, BackendPaymentConfig } from '@/lib/api';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrder, fetchOrderById } = useOrderStore();

  const [order, setOrder] = useState<any>(orderId ? getOrder(orderId) : undefined);
  const [payment, setPayment] = useState<BackendPayment | null>(null);
  const [config, setConfig] = useState<BackendPaymentConfig>({
    upi_id: 'hepnamart@upi',
    upi_display_name: 'HEPNA MART',
    upi_qr_path: '/images/hepna-upi-qr.png',
    currency: 'INR',
    manual_upi_enabled: true,
    cod_enabled: true,
    gateway_enabled: false,
  });

  const [utrReference, setUtrReference] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Order & Payment Information
  useEffect(() => {
    window.scrollTo(0, 0);

    const loadData = async () => {
      if (!orderId) return;
      setIsLoading(true);

      // 1. Fetch payment config
      try {
        const cfgRes = await apiClient.payments.getConfig();
        if (cfgRes.data) {
          setConfig(cfgRes.data);
        }
      } catch {
        // Fallback to default
      }

      // 2. Fetch order
      let currentOrder = getOrder(orderId);
      if (!currentOrder) {
        currentOrder = await fetchOrderById(orderId);
      }
      setOrder(currentOrder);

      // 3. Fetch or initialize payment
      let token = getAuthToken();
      if (!token) {
        await useAuthStore.getState().ensureBackendToken();
        token = getAuthToken();
      }

      if (token) {
        try {
          const payRes = await apiClient.payments.getForOrder(orderId);
          if (payRes.data) {
            setPayment(payRes.data);
            if (payRes.data.provider_reference) {
              setUtrReference(payRes.data.provider_reference);
            }
          } else if (currentOrder) {
            // Auto-create payment record if not yet created
            const normMethod = (currentOrder.paymentMethod || 'upi').toLowerCase().includes('cod') ? 'cod' : 'upi';
            const createRes = await apiClient.payments.create({
              order_id: currentOrder.id,
              payment_method: normMethod,
            });
            if (createRes.data) {
              setPayment(createRes.data);
            }
          }
        } catch (err: any) {
          console.error('Payment load error:', err);
        }
      }
      setIsLoading(false);
    };

    loadData();
  }, [orderId, getOrder, fetchOrderById]);

  // Copy UPI ID to clipboard
  const handleCopyUPI = () => {
    navigator.clipboard.writeText(config.upi_id);
    setCopied(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  // Submit UTR Reference
  const handleSubmitReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;

    const trimmed = utrReference.trim();
    if (!trimmed || trimmed.length < 4) {
      toast.error('Please enter a valid 12-digit UPI UTR / Transaction Reference ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.payments.submitUPI(payment.id, trimmed);
      if (res.data) {
        setPayment(res.data);
        toast.success('Payment reference submitted! Awaiting verification.');
        if (orderId) {
          await fetchOrderById(orderId);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit UPI reference');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh payment status
  const handleRefresh = async () => {
    if (!payment) return;
    setIsLoading(true);
    try {
      const res = await apiClient.payments.get(payment.id);
      if (res.data) {
        setPayment(res.data);
        toast.success('Payment status updated');
      }
    } catch {
      toast.error('Could not refresh payment status');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !order) {
    return (
      <div className="container-custom py-24 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Loading payment details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-custom py-24 text-center">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#071A2B] mb-2">Order Not Found</h1>
        <p className="text-slate-600 mb-6">Could not locate order #{orderId}.</p>
        <Link to="/orders">
          <Button variant="primary">Return to Orders</Button>
        </Link>
      </div>
    );
  }

  const orderAmount = order.total || order.total_amount || 0;
  const paymentStatus = payment?.payment_status || 'pending';
  const isCOD = (order.paymentMethod || '').toLowerCase() === 'cod' || payment?.payment_method === 'cod';

  // Construct UPI Intent URI for mobile app deep-linking
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(config.upi_id)}&pn=${encodeURIComponent(config.upi_display_name)}&am=${encodeURIComponent(orderAmount.toFixed(2))}&cu=${encodeURIComponent(config.currency)}&tn=${encodeURIComponent(`HEPNA-${order.order_number || order.orderNumber || order.id}`)}`;

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container-custom max-w-4xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to={`/orders/${order.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Order #{order.order_number || order.orderNumber || order.id.slice(0, 8)}</span>
          </Link>

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Main Grid: Payment Card & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Payment Instructions & Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                    Phase 2G Payment Gateway
                  </span>
                  <h1 className="text-2xl font-heading font-black text-[#071A2B] mt-1">
                    {isCOD ? 'Cash on Delivery' : 'Pay Securely with UPI'}
                  </h1>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-primary flex-shrink-0">
                  {isCOD ? <Wallet className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                </div>
              </div>

              {/* Status Banner */}
              <div className="mb-6">
                {paymentStatus === 'verified' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm">Payment Verified</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Your payment of {formatPrice(orderAmount)} has been verified and confirmed by our accounts team.
                      </p>
                    </div>
                  </div>
                )}

                {paymentStatus === 'awaiting_verification' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3.5">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">Awaiting Admin Verification</h4>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Your UPI reference ({payment?.provider_reference}) has been submitted. Our team is verifying the receipt with the banking desk.
                      </p>
                    </div>
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3.5">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-900 text-sm">Verification Failed / Rejected</h4>
                      <p className="text-xs text-red-700 mt-0.5">
                        {payment?.failure_reason || 'UPI reference could not be verified. Please double check and resubmit.'}
                      </p>
                    </div>
                  </div>
                )}

                {paymentStatus === 'pending' && !isCOD && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3.5">
                    <Receipt className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-900 text-sm">Payment Pending</h4>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Scan the UPI QR code below or use the merchant UPI ID to transfer exactly {formatPrice(orderAmount)}.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* COD View */}
              {isCOD ? (
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                    <Wallet className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h3 className="font-bold text-[#071A2B] text-lg">Pay on Delivery</h3>
                    <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                      Please keep <span className="font-bold text-slate-900">{formatPrice(orderAmount)}</span> in cash or ready via site delivery UPI at the time of unloading.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="primary" size="lg" className="w-full sm:w-auto">
                        Track Delivery Status
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                /* UPI Flow */
                <div className="space-y-6">
                  {/* QR Code & UPI Details Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-[#071A2B] text-white rounded-2xl p-6 shadow-md">
                    <div className="text-center mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400">
                        Official Merchant QR
                      </span>
                      <div className="text-3xl font-heading font-black text-white mt-1">
                        {formatPrice(orderAmount)}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Pay exact amount for Order #{order.order_number || order.orderNumber || order.id.slice(0, 8)}
                      </p>
                    </div>

                    {/* QR Asset */}
                    <div className="bg-white p-4 rounded-xl max-w-[220px] mx-auto shadow-inner mb-5">
                      <img
                        src={config.upi_qr_path}
                        alt="HEPNA MART UPI QR"
                        className="w-full h-auto object-contain mx-auto rounded"
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute('src', '/images/hepna-upi-qr.svg');
                        }}
                      />
                    </div>

                    {/* UPI ID Copy Field */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3 mb-4">
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Merchant UPI ID
                        </span>
                        <span className="font-mono text-sm font-semibold text-white truncate block">
                          {config.upi_id}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUPI}
                        className="flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg transition-colors flex-shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Mobile UPI Intent Button */}
                    <a
                      href={upiIntentUri}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                      <span>Open in UPI App (GPay / PhonePe / Paytm)</span>
                    </a>
                  </div>

                  {/* Payment Instructions */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      <span>How to complete payment:</span>
                    </h4>
                    <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Scan the QR code using any UPI application or copy the UPI ID.</li>
                      <li>
                        Enter the exact amount: <strong className="text-slate-900">{formatPrice(orderAmount)}</strong>.
                      </li>
                      <li>Complete the payment inside your bank/UPI application.</li>
                      <li>Copy the 12-digit UTR / UPI Transaction Reference number and submit below.</li>
                    </ol>
                  </div>

                  {/* UTR Submission Form */}
                  {paymentStatus !== 'verified' && (
                    <form onSubmit={handleSubmitReference} className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          UPI Transaction ID / 12-Digit UTR
                        </label>
                        <input
                          type="text"
                          required
                          value={utrReference}
                          onChange={(e) => setUtrReference(e.target.value)}
                          placeholder="e.g. 426891234567 or UPI-REF-XXXX"
                          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Found in your UPI app payment receipt (PhonePe / GPay / Paytm / BHIM / Cred).
                        </span>
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        disabled={isSubmitting || !utrReference.trim()}
                      >
                        {isSubmitting ? 'Submitting Reference...' : 'I Have Completed Payment'}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Audit Timeline */}
          <div className="lg:col-span-5 space-y-6">
            {/* Order Financial Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#071A2B] text-base mb-4 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-mono text-slate-500 font-normal">
                  #{order.order_number || order.orderNumber || order.id.slice(0, 8)}
                </span>
              </h3>

              <div className="space-y-3 text-sm text-slate-600 border-b border-slate-100 pb-4 mb-4">
                <div className="flex justify-between">
                  <span>Customer</span>
                  <span className="font-semibold text-slate-900">{order.customer_name || order.customerName || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="font-semibold uppercase text-slate-900">{payment?.payment_method || order.paymentMethod || 'UPI'}</span>
                </div>
                {payment?.payment_reference && (
                  <div className="flex justify-between">
                    <span>Payment Ref</span>
                    <span className="font-mono text-xs font-semibold text-slate-900">{payment.payment_reference}</span>
                  </div>
                )}
                {payment?.provider_reference && (
                  <div className="flex justify-between">
                    <span>Submitted UTR</span>
                    <span className="font-mono text-xs font-bold text-primary">{payment.provider_reference}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-lg font-bold text-[#071A2B]">
                <span>Total Amount</span>
                <span className="text-primary font-black font-heading text-xl">{formatPrice(orderAmount)}</span>
              </div>
            </div>

            {/* Audit Event Timeline */}
            {payment?.events && payment.events.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-bold text-[#071A2B] text-base mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Payment Timeline</span>
                </h3>

                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {payment.events.map((evt) => (
                    <div key={evt.id} className="flex items-start gap-3 relative">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center flex-shrink-0 z-10">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {evt.event_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Status: <span className="font-semibold uppercase">{evt.new_status}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust & Security Badge */}
            <div className="bg-slate-100/80 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div className="text-xs text-slate-600">
                <strong className="text-slate-900 block">Bank-Grade Verification</strong>
                All transactions are audited and reconciled against verified banking statements.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
