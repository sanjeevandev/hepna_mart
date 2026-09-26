import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  Building,
  Check,
  Percent,
  Calculator,
  Layers,
  Sparkles,
  HelpCircle,
  XCircle,
  RefreshCw,
  CreditCard,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { wholesaleService } from '@/services/wholesaleService';
import { BackendQuote } from '@/lib/api';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  sent: { label: 'Active Offer', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  accepted: { label: 'Accepted & Converted to Order', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  rejected: { label: 'Declined', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  expired: { label: 'Expired', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
};

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'NEFT / RTGS / Bank Wire Transfer', desc: 'Direct corporate transfer with UTR reference generation' },
  { id: 'contractor_credit', label: 'Contractor 30-Day Revolving Credit', desc: 'Requires approved GST contractor trade account' },
  { id: 'upi_business', label: 'UPI / Corporate Net Banking', desc: 'Instant verification via institutional payment gateway' },
  { id: 'cheque', label: 'Company Account Payee Cheque / DD', desc: 'Dispatch scheduled upon clearance' },
];

const QuoteDetailPage: React.FC = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [quote, setQuote] = useState<BackendQuote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Accept Modal State
  const [showAcceptModal, setShowAcceptModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('bank_transfer');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Revision Modal State
  const [showRevisionModal, setShowRevisionModal] = useState<boolean>(false);
  const [revisionNotes, setRevisionNotes] = useState<string>('');

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadQuote = async () => {
    if (!quoteId) return;
    try {
      setLoading(true);
      const data = await wholesaleService.getQuote(quoteId);
      setQuote(data);
    } catch (err: any) {
      console.error('Failed to load quote:', err);
      toast.error(err.message || 'Unable to load quotation details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && quoteId) {
      loadQuote();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, quoteId]);

  const handleAcceptQuote = async () => {
    if (!quoteId) return;
    try {
      setActionLoading(true);
      const res = await wholesaleService.acceptQuote(quoteId, {
        paymentMethod: selectedPaymentMethod,
        notes: orderNotes.trim(),
      });

      setShowAcceptModal(false);
      toast.success(
        `Quotation Accepted! Authoritative Order #${res.order.order_number} created successfully.`,
        { duration: 6000 }
      );

      navigate(`/orders/${res.order.id}`);
    } catch (err: any) {
      console.error('Failed to accept quote:', err);
      toast.error(err.message || 'Failed to accept quotation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!quote || !revisionNotes.trim()) {
      toast.error('Please specify the revision instructions or target rate.');
      return;
    }
    try {
      setActionLoading(true);
      await wholesaleService.requestRevision(quote.rfq_id, {
        notes: revisionNotes.trim(),
      });
      setShowRevisionModal(false);
      setRevisionNotes('');
      toast.success('Revision request submitted to the procurement desk.');
      loadQuote();
    } catch (err: any) {
      toast.error(err.message || 'Failed to request quote revision.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!quoteId) return;
    try {
      setActionLoading(true);
      const updated = await wholesaleService.rejectQuote(quoteId, rejectReason.trim());
      setQuote(updated);
      setShowRejectModal(false);
      toast.success('Quotation declined.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline quotation.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#F8FAFC] min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
            Sign In to View Quotation
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Please log in to review itemized pricing and accept this quotation.
          </p>
          <Button variant="primary" onClick={() => navigate('/account')} className="w-full">
            Go to Account Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-16 px-4">
        <div className="container-custom max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-white rounded-2xl border border-slate-200"></div>
          <div className="h-48 bg-white rounded-2xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="bg-[#F8FAFC] min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
            Quotation Not Found
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            This quotation does not exist or you do not have permission to view it.
          </p>
          <Link to="/rfqs">
            <Button variant="primary" className="w-full">
              Back to My RFQs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGES[quote.status] || STATUS_BADGES.draft;
  const isSent = quote.status === 'sent';
  const isAccepted = quote.status === 'accepted';
  const isExpired = quote.status === 'expired';

  // Compute calculated subtotal, GST parts
  const cgst = quote.tax_amount / 2;
  const sgst = quote.tax_amount / 2;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24">
      {/* Top Header Navigation */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-20">
        <div className="container-custom max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to={`/rfqs/${quote.rfq_id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to RFQ</span>
          </Link>

          {isSent && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRevisionModal(true)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Request Revision
              </button>

              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
              >
                Decline
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAcceptModal(true)}
                disabled={actionLoading}
                className="font-bold flex items-center gap-1.5 shadow-md shadow-accent/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept & Order</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="container-custom max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Status Callout Banner */}
        {isSent && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-5 rounded-r-2xl bg-white shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Official Quotation Package Ready for Review
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    This quotation includes guaranteed factory batch rates, 100% BIS certified test reports, and dedicated site fleet logistics.
                    {quote.valid_until && (
                      <span className="font-bold text-amber-800 ml-1">
                        Locked rate valid until {new Date(quote.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setShowAcceptModal(true)}
                className="font-bold shrink-0 shadow-md shadow-accent/20 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Accept Quotation</span>
              </Button>
            </div>
          </div>
        )}

        {isAccepted && (
          <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Quotation Confirmed & Converted to Authoritative Order
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Inventory allocation and warehouse dispatch sequence initiated.
                </p>
              </div>
            </div>
            <Link to="/orders">
              <Button variant="outline" size="sm" className="bg-white border-emerald-300 text-emerald-900 font-bold">
                View My Orders →
              </Button>
            </Link>
          </div>
        )}

        {isExpired && (
          <div className="bg-slate-100 border border-slate-300 p-5 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-slate-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Quotation Expired</h3>
                <p className="text-xs text-slate-500">
                  Raw material commodity prices fluctuate daily. Request a price refresh to generate an active quotation.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRevisionModal(true)}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-colors"
            >
              Request Price Refresh
            </button>
          </div>
        )}

        {/* Quotation Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xl font-black text-slate-900">
                  {quote.quote_number}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-[#071A2B] text-white">
                  Revision v{quote.version}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Issued by HEPNA MART Institutional Sales Desk on {new Date(quote.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                Grand Total (Inclusive of GST)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#071A2B]">
                {formatPrice(quote.total)}
              </span>
            </div>
          </div>

          {/* Notes & Guidance */}
          {(quote.customer_notes || quote.procurement_notes) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 text-xs">
              {quote.customer_notes && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 font-semibold block mb-0.5">Commercial Terms / Notes:</span>
                  <p className="text-slate-700">{quote.customer_notes}</p>
                </div>
              )}
              {quote.procurement_notes && (
                <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/60">
                  <span className="text-blue-600 font-semibold block mb-0.5">Logistics & Testing Lead Time:</span>
                  <p className="text-blue-950">{quote.procurement_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Itemized Pricing Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Itemized Quotation Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Unit wholesale pricing, catalog comparison, and tax breakdown per line item
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
              {quote.items?.length || 0} Material Specifications
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-10 text-center">#</th>
                  <th className="py-3.5 px-4">Material Specification</th>
                  <th className="py-3.5 px-4 text-center">Qty (Unit)</th>
                  <th className="py-3.5 px-4 text-right">Quoted Unit Rate</th>
                  <th className="py-3.5 px-4 text-right">Catalog Price</th>
                  <th className="py-3.5 px-4 text-right">GST (18%)</th>
                  <th className="py-3.5 px-6 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.items?.map((item, idx) => {
                  const unitPrice = item.quoted_unit_price;
                  const catPrice = item.catalog_unit_price_at_quote || unitPrice;
                  const discountPct = catPrice > unitPrice ? Math.round(((catPrice - unitPrice) / catPrice) * 100) : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {item.product_name}
                        {item.brand && (
                          <span className="text-slate-500 font-normal block text-[11px]">Brand: {item.brand}</span>
                        )}
                        {item.product_sku && (
                          <span className="text-slate-400 font-mono font-normal block text-[10px]">SKU: {item.product_sku}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-black text-slate-900 text-sm block">
                          {item.quoted_quantity}
                        </span>
                        <span className="text-[11px] text-slate-500">{item.unit || 'Standard'}</span>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-slate-900 text-sm">
                        {formatPrice(unitPrice)}
                        <span className="text-[10px] text-slate-400 block font-normal">per {item.unit || 'unit'}</span>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-500">
                        <span className={discountPct > 0 ? 'line-through' : ''}>
                          {formatPrice(catPrice)}
                        </span>
                        {discountPct > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 block">
                            Save {discountPct}%
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-slate-700">
                        {formatPrice(item.tax_amount)}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-slate-900 text-sm">
                        {formatPrice(item.line_total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Calculation & Institutional Terms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Commercial Guarantees */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="font-heading font-bold text-sm text-[#071A2B] uppercase tracking-wider">
              Institutional Procurement Commitments
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Mill Test Certificate (MTC) & BIS 100%</h4>
                  <p className="text-slate-600 mt-0.5">
                    Original manufacturer test certificates certifying chemical composition and tensile strength provided with delivery challan.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Direct Mill Dispatch & Weighbridge Slip</h4>
                  <p className="text-slate-600 mt-0.5">
                    GPS-enabled dedicated tipper logistics with computerized weighbridge slips attached for 100% quantity audit.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">100% Input Tax Credit (ITC) Invoicing</h4>
                  <p className="text-slate-600 mt-0.5">
                    GST-compliant tax invoices uploaded immediately upon order confirmation for full input tax reconciliation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Summary */}
          <div className="lg:col-span-5 bg-[#071A2B] text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-base text-white pb-3 border-b border-white/10 flex items-center justify-between">
              <span>Financial Breakdown</span>
              <Calculator className="w-4 h-4 text-accent" />
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Material Subtotal:</span>
                <span className="font-bold text-white">{formatPrice(quote.subtotal)}</span>
              </div>

              {quote.discount_amount > 0 && (
                <div className="flex justify-between items-center text-emerald-400">
                  <span>Additional Volume Discount:</span>
                  <span className="font-bold">- {formatPrice(quote.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-300">
                <span>CGST (9%):</span>
                <span className="font-semibold text-slate-200">{formatPrice(cgst)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>SGST (9%):</span>
                <span className="font-semibold text-slate-200">{formatPrice(sgst)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Site Freight & Logistics:</span>
                <span className="font-bold text-white">
                  {quote.delivery_charge > 0 ? formatPrice(quote.delivery_charge) : 'Included / Free'}
                </span>
              </div>

              <div className="pt-4 mt-4 border-t border-white/15 flex justify-between items-baseline">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">
                    Total Payable Amount
                  </span>
                  <span className="text-[10px] text-slate-400">All Taxes & Mill Levies Included</span>
                </div>
                <div className="text-2xl font-black text-accent">
                  {formatPrice(quote.total)}
                </div>
              </div>
            </div>

            {isSent && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowAcceptModal(true)}
                className="w-full py-3.5 text-sm font-bold shadow-lg shadow-accent/30 mt-4 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Accept Quotation & Order</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Accept Quotation Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-slate-900">
                    Accept Quotation #{quote.quote_number}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confirm payment terms and place authoritative order
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAcceptModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Total Order Value:</span>
                <span className="text-lg font-black text-slate-900">{formatPrice(quote.total)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Select Institutional Payment Method:
                </label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <label
                      key={pm.id}
                      className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                        selectedPaymentMethod === pm.id
                          ? 'border-accent bg-orange-50/50 ring-1 ring-accent/30'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={pm.id}
                        checked={selectedPaymentMethod === pm.id}
                        onChange={() => setSelectedPaymentMethod(pm.id)}
                        className="mt-0.5 text-accent focus:ring-accent"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{pm.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{pm.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Site Unloading / Gate Instructions (Optional):
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-accent/40"
                  placeholder="e.g. Unloading crane available between 8am-12pm. Call site engineer before dispatch."
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-amber-900">
                <Lock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Upon confirmation, the backend inventory is authoritatively allocated in PostgreSQL and a legally binding invoice is generated.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowAcceptModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleAcceptQuote}
                disabled={actionLoading}
                className="font-bold flex items-center gap-2 shadow-md shadow-accent/20"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Allocating Inventory...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Order Now</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-heading font-bold text-slate-900">
              Request Quotation Revision
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Specify required target rates, amended quantities, or different brand preferences. Our sales engineers will issue revision v{quote.version + 1}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Revision Details & Notes *
              </label>
              <textarea
                rows={4}
                required
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="e.g. Can you reduce TMT steel to ₹58,000/MT if we increase quantity to 25 Tonnes? Also switch cement to UltraTech Super."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRevisionModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRequestRevision}
                disabled={actionLoading || !revisionNotes.trim()}
                className="font-bold"
              >
                Submit Revision Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Quote Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-heading font-bold text-slate-900">
              Decline Quotation Offer?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to decline quote <strong className="text-slate-800">{quote.quote_number}</strong>? You can optionally state the reason below.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for declining (optional):
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="e.g. Budget constraints, selected alternative supplier..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRejectQuote}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Decline Offer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteDetailPage;
