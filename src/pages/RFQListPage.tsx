import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  RefreshCw,
  Building,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { wholesaleService } from '@/services/wholesaleService';
import { BackendRFQ } from '@/lib/api';
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

const RFQListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuthStore();
  const [rfqs, setRfqs] = useState<BackendRFQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadRfqs = async () => {
    try {
      setLoading(true);
      const res = await wholesaleService.listUserRFQs({ page: 1, pageSize: 50 });
      setRfqs(res.items || []);
    } catch (err: any) {
      console.error('Failed to load RFQs:', err);
      toast.error(err.message || 'Unable to load your quote requests.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadRfqs();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRfqs();
  };

  const filteredRfqs = rfqs.filter((rfq) => {
    if (filterTab === 'all') return true;
    if (filterTab === 'action_needed') return rfq.status === 'quoted';
    if (filterTab === 'active') return ['submitted', 'under_review', 'quoted', 'revision_requested'].includes(rfq.status);
    if (filterTab === 'completed') return ['accepted', 'rejected', 'expired', 'cancelled'].includes(rfq.status);
    return true;
  });

  const quotesReadyCount = rfqs.filter((r) => r.status === 'quoted').length;
  const underReviewCount = rfqs.filter((r) => ['submitted', 'under_review'].includes(r.status)).length;
  const acceptedCount = rfqs.filter((r) => r.status === 'accepted').length;

  if (!isAuthenticated) {
    return (
      <div className="bg-[#F8FAFC] min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
            Sign In to View RFQs
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Please log in to your contractor or enterprise account to view your project quotations, revisions, and bulk procurement status.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={() => navigate('/account')} className="w-full">
              Go to Account Sign In
            </Button>
            <Link to="/wholesale" className="text-xs text-accent font-semibold hover:underline">
              Submit a new Bulk Quote Request →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-[#071A2B] text-white py-10 border-b border-white/10">
        <div className="container-custom px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent-light text-xs font-bold uppercase tracking-wider mb-2">
                <Building className="w-3.5 h-3.5 text-accent" />
                <span>Institutional Procurement Desk</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
                Project RFQs & Quotations
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Real-time tracking of bulk material inquiries, mill rate quotations, and direct order conversions
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5"
                title="Refresh Requests"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <Link to="/wholesale">
                <Button variant="primary" size="md" className="flex items-center gap-2 font-bold shadow-md shadow-accent/20">
                  <Plus className="w-4 h-4" />
                  <span>New Project RFQ</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-xs text-slate-400 font-medium">Total RFQs</div>
              <div className="text-xl font-bold text-white mt-0.5">{rfqs.length}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-xs text-amber-300 font-medium">Under Review</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{underReviewCount}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-xs text-emerald-300 font-medium">Quotations Ready</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <span>{quotesReadyCount}</span>
                {quotesReadyCount > 0 && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                    Action Needed
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-xs text-green-300 font-medium">Orders Placed</div>
              <div className="text-xl font-bold text-green-400 mt-0.5">{acceptedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container-custom px-4 py-8">
        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
          {[
            { id: 'all', label: 'All Requests', count: rfqs.length },
            { id: 'action_needed', label: 'Action Needed', count: quotesReadyCount, highlight: true },
            { id: 'active', label: 'Active / In Review', count: rfqs.filter((r) => ['submitted', 'under_review', 'quoted', 'revision_requested'].includes(r.status)).length },
            { id: 'completed', label: 'Completed / Historical', count: rfqs.filter((r) => ['accepted', 'rejected', 'expired', 'cancelled'].includes(r.status)).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                filterTab === tab.id
                  ? 'bg-[#071A2B] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  filterTab === tab.id
                    ? 'bg-white/20 text-white'
                    : tab.highlight && tab.count > 0
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-200 rounded-full w-24"></div>
                </div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                <div className="h-12 bg-slate-50 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRfqs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-accent flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-heading font-bold text-slate-900 mb-1">
              No Quote Requests Found
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {filterTab === 'all'
                ? 'You have not submitted any project RFQs yet. Submit your Bill of Quantities (BOQ) to receive mill-direct bulk pricing.'
                : 'No RFQ requests match the selected filter.'}
            </p>
            <Link to="/wholesale">
              <Button variant="primary" size="md" className="font-bold shadow-md shadow-accent/20">
                Submit Project RFQ
              </Button>
            </Link>
          </div>
        )}

        {/* RFQ Cards Grid */}
        {!loading && filteredRfqs.length > 0 && (
          <div className="space-y-4">
            {filteredRfqs.map((rfq) => {
              const badge = STATUS_BADGES[rfq.status] || STATUS_BADGES.draft;
              const hasQuote = Boolean(rfq.latest_quote);
              const latestQuote = rfq.latest_quote;

              return (
                <div
                  key={rfq.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                    rfq.status === 'quoted'
                      ? 'border-emerald-300 ring-1 ring-emerald-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-5 sm:p-6">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#071A2B]/5 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
                          <Layers className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-slate-900">
                              {rfq.rfq_number}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Created on {new Date(rfq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* Top Action */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Link to={`/rfqs/${rfq.id}`}>
                          <button className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1">
                            <span>RFQ Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Body Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Project / Site Name:</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{rfq.project_name || 'General Construction Project'}</span>
                        </div>
                        {rfq.project_type && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">{rfq.project_type}</span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Delivery Site:</span>
                        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {rfq.delivery_address?.city || rfq.delivery_address?.address_line1 || 'Maharashtra'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Items Requested:</span>
                        <div className="font-bold text-slate-900">
                          {rfq.items?.length || 0} Material Specification{(rfq.items?.length || 0) > 1 ? 's' : ''}
                        </div>
                        {rfq.required_by_date && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Target: {new Date(rfq.required_by_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quotation Highlight Card if Quoted or Accepted */}
                    {hasQuote && latestQuote && (
                      <div
                        className={`mt-2 p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          latestQuote.status === 'accepted'
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : latestQuote.status === 'sent'
                            ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-200/60'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              latestQuote.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                Quotation #{latestQuote.quote_number} (v{latestQuote.version})
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  latestQuote.status === 'accepted'
                                    ? 'bg-emerald-200 text-emerald-800'
                                    : latestQuote.status === 'sent'
                                    ? 'bg-amber-200 text-amber-900 animate-pulse'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {latestQuote.status === 'sent' ? 'Offer Ready for Acceptance' : latestQuote.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              {latestQuote.valid_until
                                ? `Valid until ${new Date(latestQuote.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                : 'GST inclusive mill wholesale package pricing'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                              Quoted Grand Total (incl. GST)
                            </span>
                            <span className="text-base sm:text-lg font-black text-slate-900">
                              {formatPrice(latestQuote.total)}
                            </span>
                          </div>

                          <Link to={`/quotes/${latestQuote.id}`}>
                            <Button
                              variant={latestQuote.status === 'sent' ? 'primary' : 'outline'}
                              size="sm"
                              className="font-bold shadow-xs flex items-center gap-1.5"
                            >
                              <span>Review Quote</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
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

export default RFQListPage;
