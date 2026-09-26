import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  XCircle,
  RefreshCw,
  Building,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  Truck,
  Check,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { wholesaleService } from '@/services/wholesaleService';
import { BackendRFQ, BackendQuote } from '@/lib/api';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  submitted: { label: 'Submitted', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  under_review: { label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  quoted: { label: 'Quotation Ready', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  revision_requested: { label: 'Revision Requested', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  accepted: { label: 'Order Confirmed', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  rejected: { label: 'Declined', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  expired: { label: 'Expired', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const RFQDetailPage: React.FC = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [rfq, setRfq] = useState<BackendRFQ | null>(null);
  const [quotes, setQuotes] = useState<BackendQuote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadData = async () => {
    if (!rfqId) return;
    try {
      setLoading(true);
      const [rfqData, quotesData] = await Promise.all([
        wholesaleService.getRFQ(rfqId),
        wholesaleService.listQuotes(rfqId).catch(() => []),
      ]);
      setRfq(rfqData);
      setQuotes(quotesData || []);
    } catch (err: any) {
      console.error('Failed to load RFQ:', err);
      toast.error(err.message || 'Failed to load RFQ details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && rfqId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, rfqId]);

  const handleSubmitDraft = async () => {
    if (!rfqId) return;
    try {
      setActionLoading(true);
      const updated = await wholesaleService.submitRFQ(rfqId);
      setRfq(updated);
      toast.success('RFQ submitted to procurement desk successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit RFQ.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRFQ = async () => {
    if (!rfqId) return;
    try {
      setActionLoading(true);
      const updated = await wholesaleService.cancelRFQ(rfqId, cancelReason);
      setRfq(updated);
      setShowCancelModal(false);
      toast.success('RFQ cancelled.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel RFQ.');
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
            Sign In Required
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Please log in to view project quotation details.
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
          <div className="h-48 bg-white rounded-2xl border border-slate-200"></div>
          <div className="h-64 bg-white rounded-2xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="bg-[#F8FAFC] min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
            RFQ Not Found
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            The requested RFQ could not be located or belongs to another user account.
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

  const badge = STATUS_BADGES[rfq.status] || STATUS_BADGES.draft;
  const canCancel = ['draft', 'submitted', 'under_review', 'quoted', 'revision_requested'].includes(rfq.status);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-20">
        <div className="container-custom max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/rfqs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All RFQ Requests</span>
          </Link>

          <div className="flex items-center gap-3">
            {rfq.status === 'draft' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitDraft}
                disabled={actionLoading}
                className="font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit RFQ Now</span>
              </Button>
            )}

            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
              >
                Cancel RFQ
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* RFQ Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xl font-black text-slate-900">
                  {rfq.rfq_number}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  {badge.label}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-heading font-black text-[#071A2B]">
                {rfq.project_name || 'Project Bulk Quotation'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted on {new Date(rfq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                {rfq.submitted_at && ` • Active since ${new Date(rfq.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              {rfq.project_type && (
                <div>
                  <span className="text-slate-400 font-semibold block">Project Scope:</span>
                  <span className="font-bold text-slate-800">{rfq.project_type}</span>
                </div>
              )}
              {rfq.required_by_date && (
                <div>
                  <span className="text-slate-400 font-semibold block">Target Delivery:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(rfq.required_by_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-400 font-semibold block">Materials Count:</span>
                <span className="font-bold text-slate-800">{rfq.items?.length || 0} Items</span>
              </div>
            </div>
          </div>

          {/* Delivery & Logistics Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-accent" />
                <span>Site Delivery Address</span>
              </h4>
              <p className="text-slate-700 leading-relaxed">
                {rfq.delivery_address?.address_line1}
                {rfq.delivery_address?.city && `, ${rfq.delivery_address?.city}`}
                {rfq.delivery_address?.state && `, ${rfq.delivery_address?.state}`}
                {rfq.delivery_address?.pincode && ` - ${rfq.delivery_address?.pincode}`}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-accent" />
                <span>Contact & Entity Details</span>
              </h4>
              <p className="font-semibold text-slate-800">
                {rfq.delivery_address?.contact_name || 'Procurement In-Charge'}
              </p>
              {rfq.delivery_address?.company_name && (
                <p className="text-slate-600">{rfq.delivery_address?.company_name}</p>
              )}
              {rfq.delivery_address?.contact_phone && (
                <p className="text-slate-600 mt-1">{rfq.delivery_address?.contact_phone}</p>
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-accent" />
                <span>Notes / Specifications</span>
              </h4>
              <p className="text-slate-600 italic leading-relaxed">
                {rfq.notes || 'No extra constraints or credit specifications noted.'}
              </p>
            </div>
          </div>
        </div>

        {/* Linked Quotations Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-slate-900">
                  Quotations from Procurement Desk
                </h2>
                <p className="text-xs text-slate-500">
                  Official mill pricing packages generated for this Bill of Quantities
                </p>
              </div>
            </div>
          </div>

          {quotes.length === 0 ? (
            <div className="p-8 bg-slate-50 rounded-xl text-center border border-slate-200">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                Quotations In Preparation
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Our sales engineers are evaluating manufacturer volume slabs, freight rates, and mill test certificates for your project. You will receive an offer package within 4 hours.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    q.status === 'accepted'
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : q.status === 'sent'
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-200/60 shadow-xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {q.quote_number}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-200 text-slate-800">
                        Revision v{q.version}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          q.status === 'accepted'
                            ? 'bg-emerald-200 text-emerald-800'
                            : q.status === 'sent'
                            ? 'bg-amber-200 text-amber-900 animate-pulse'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {q.status === 'sent' ? 'Offer Ready for Acceptance' : q.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
                      <span>Generated: {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      {q.valid_until && (
                        <span className="font-semibold text-slate-700">
                          Valid Until: {new Date(q.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span>{q.items?.length || 0} items priced</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                        Quotation Total (GST Incl.)
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        {formatPrice(q.total)}
                      </span>
                    </div>

                    <Link to={`/quotes/${q.id}`}>
                      <Button
                        variant={q.status === 'sent' ? 'primary' : 'outline'}
                        size="md"
                        className="font-bold flex items-center gap-2 shadow-xs"
                      >
                        <span>View Quotation</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Requested Materials Specification (BOQ Table) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Requested Materials Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Itemized specification submitted by customer
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
              {rfq.items?.length || 0} Total Specifications
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6 w-12 text-center">#</th>
                  <th className="py-3 px-4">Material Specification / Brand</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">Requested Quantity</th>
                  <th className="py-3 px-4 text-right">Target Unit Price</th>
                  <th className="py-3 px-6">Notes / Spec</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rfq.items?.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.product_name}
                      {item.brand && <span className="text-slate-500 font-normal block text-[11px]">Brand: {item.brand}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">
                      {item.unit || 'Standard'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                      {item.requested_quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                      {item.target_unit_price ? formatPrice(item.target_unit_price) : '—'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 italic">
                      {item.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status History Timeline */}
        {rfq.status_history && rfq.status_history.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h3 className="font-heading font-bold text-base text-slate-900 mb-6">
              RFQ Activity & Progression Timeline
            </h3>

            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {rfq.status_history.map((hist, idx) => (
                <div key={hist.id || idx} className="flex items-start gap-4 relative pl-8">
                  <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-accent border-2 border-white ring-2 ring-accent/30 flex items-center justify-center"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{hist.title}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {new Date(hist.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {hist.description && (
                      <p className="text-xs text-slate-600 mt-0.5">{hist.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-heading font-bold text-slate-900">
              Cancel Request for Quotation?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to cancel RFQ <strong className="text-slate-800">{rfq.rfq_number}</strong>? This will notify the procurement team to cease quotation processing.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for cancellation (optional):
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="e.g. Project postponed, specifications changed..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
              >
                Keep Active
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelRFQ}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
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

export default RFQDetailPage;
