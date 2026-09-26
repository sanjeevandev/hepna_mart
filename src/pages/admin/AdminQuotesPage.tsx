import React, { useEffect, useState } from 'react';
import {
  FileText,
  Send,
  CheckCircle2,
  Clock,
  Building,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Edit3,
  Layers,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  Check,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import apiClient, { BackendRFQ, BackendQuote } from '@/lib/api';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  submitted: { label: 'Submitted', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  under_review: { label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  quoted: { label: 'Quoted', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  revision_requested: { label: 'Revision Req', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  accepted: { label: 'Accepted', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  rejected: { label: 'Declined', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  expired: { label: 'Expired', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const AdminQuotesPage: React.FC = () => {
  const [rfqs, setRfqs] = useState<BackendRFQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRfq, setSelectedRfq] = useState<BackendRFQ | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Quote Generation Modal State
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [quoteForRfq, setQuoteForRfq] = useState<BackendRFQ | null>(null);
  const [quoteItems, setQuoteItems] = useState<{
    rfq_item_id: string;
    product_name: string;
    requested_quantity: number;
    quoted_quantity: number;
    quoted_unit_price: number;
    unit: string;
  }[]>([]);
  const [quoteDiscount, setQuoteDiscount] = useState<string>('0');
  const [quoteDeliveryCharge, setQuoteDeliveryCharge] = useState<string>('0');
  const [quoteValidDays, setQuoteValidDays] = useState<number>(7);
  const [quoteCustomerNotes, setQuoteCustomerNotes] = useState<string>('Payment within 15 days of dispatch.');
  const [quoteProcNotes, setQuoteProcNotes] = useState<string>('Dispatched from Pune Central Depot.');
  const [sendImmediately, setSendImmediately] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchRfqs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.adminRfqs.list({
        page: 1,
        pageSize: 100,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm.trim() || undefined,
      });
      setRfqs(res.data?.items || []);
    } catch (err: any) {
      console.error('Failed to load admin RFQs:', err);
      toast.error(err.message || 'Failed to fetch RFQs.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, [statusFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRfqs();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRfqs();
  };

  const openQuoteModal = (rfq: BackendRFQ) => {
    setQuoteForRfq(rfq);
    const initialItems = (rfq.items || []).map((it) => ({
      rfq_item_id: it.id,
      product_name: it.product_name,
      requested_quantity: it.requested_quantity,
      quoted_quantity: it.requested_quantity,
      quoted_unit_price: it.target_unit_price || 350,
      unit: it.unit || 'Units',
    }));
    setQuoteItems(initialItems);
    setQuoteDiscount('0');
    setQuoteDeliveryCharge('0');
    setQuoteValidDays(7);
    setShowQuoteModal(true);
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForRfq) return;

    try {
      setActionLoading(true);
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + quoteValidDays);

      const payload = {
        items: quoteItems.map((it) => ({
          rfq_item_id: it.rfq_item_id,
          product_name: it.product_name,
          requested_quantity: it.requested_quantity,
          quoted_quantity: it.quoted_quantity,
          quoted_unit_price: it.quoted_unit_price,
          unit: it.unit,
        })),
        discount_amount: parseFloat(quoteDiscount) || 0,
        delivery_charge: parseFloat(quoteDeliveryCharge) || 0,
        valid_until: validUntil.toISOString(),
        customer_notes: quoteCustomerNotes.trim(),
        procurement_notes: quoteProcNotes.trim(),
        send_now: sendImmediately,
      };

      await apiClient.adminRfqs.createQuote(quoteForRfq.id, payload);
      setShowQuoteModal(false);
      toast.success(
        sendImmediately
          ? 'Quotation created & sent to client successfully!'
          : 'Draft quotation saved.'
      );
      fetchRfqs();
    } catch (err: any) {
      console.error('Failed to create quote:', err);
      toast.error(err.message || 'Failed to generate quote.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendQuote = async (quoteId: string) => {
    try {
      setActionLoading(true);
      await apiClient.adminQuotes.send(quoteId);
      toast.success('Quotation sent to client!');
      fetchRfqs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send quote.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (rfqId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      await apiClient.adminRfqs.updateStatus(rfqId, { status: newStatus });
      toast.success(`RFQ status updated to ${newStatus}`);
      fetchRfqs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update RFQ status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black text-slate-900">
            Institutional RFQs & Quotations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time procurement pipeline, bill of quantities review, and mill package generation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by RFQ #, project name, or client location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'submitted', 'under_review', 'quoted', 'revision_requested', 'accepted'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 capitalize ${
                statusFilter === st
                  ? 'bg-[#071A2B] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* RFQ Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">RFQ Ref & Date</th>
                <th className="py-3.5 px-4">Project & Client</th>
                <th className="py-3.5 px-4">Delivery Site</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-right">Latest Quote</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
                    <span>Loading institutional procurement pipeline...</span>
                  </td>
                </tr>
              )}

              {!loading && rfqs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No RFQs found matching the selected filter.
                  </td>
                </tr>
              )}

              {!loading &&
                rfqs.map((rfq) => {
                  const badge = STATUS_BADGES[rfq.status] || STATUS_BADGES.draft;
                  const latestQuote = rfq.latest_quote;

                  return (
                    <tr key={rfq.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className="font-mono">{rfq.rfq_number}</span>
                        <span className="text-[11px] text-slate-400 block font-normal">
                          {new Date(rfq.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block font-bold">
                          {rfq.project_name || 'General Project'}
                        </strong>
                        <span className="text-[11px] text-slate-500">
                          {rfq.delivery_address?.contact_name || 'Procurement Client'}
                          {rfq.delivery_address?.contact_phone && ` (${rfq.delivery_address.contact_phone})`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {rfq.delivery_address?.city || rfq.delivery_address?.address_line1 || 'Maharashtra'}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {rfq.items?.length || 0}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {latestQuote ? (
                          <div>
                            <span className="font-black text-slate-900 block">
                              {formatPrice(latestQuote.total)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {latestQuote.quote_number} (v{latestQuote.version})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Quoted</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedRfq(selectedRfq?.id === rfq.id ? null : rfq)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Inspect RFQ Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openQuoteModal(rfq)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#071A2B] hover:bg-[#0c2842] text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                            title="Generate Quote Package"
                          >
                            <Plus className="w-3 h-3 text-accent" />
                            <span>{latestQuote ? 'Revise' : 'Quote'}</span>
                          </button>

                          {latestQuote && latestQuote.status === 'draft' && (
                            <button
                              onClick={() => handleSendQuote(latestQuote.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                              title="Send Draft Quote to Client"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected RFQ Drawer / Expanded Inspector */}
      {selectedRfq && (
        <div className="bg-white rounded-2xl border border-slate-300 p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-black text-slate-900">{selectedRfq.rfq_number}</span>
                <span className="text-xs text-slate-500 font-semibold">• {selectedRfq.project_name}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Site: {selectedRfq.delivery_address?.address_line1}, {selectedRfq.delivery_address?.city} | Contact: {selectedRfq.delivery_address?.contact_name} ({selectedRfq.delivery_address?.contact_phone})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedRfq.status}
                onChange={(e) => handleStatusChange(selectedRfq.id, e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="quoted">Quoted</option>
                <option value="revision_requested">Revision Requested</option>
                <option value="accepted">Accepted</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                onClick={() => setSelectedRfq(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Requested Material Specs (BOQ):</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Material</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Target Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRfq.items?.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 font-semibold text-slate-900">{it.product_name}</td>
                        <td className="py-2 px-3 text-center">{it.requested_quantity} {it.unit}</td>
                        <td className="py-2 px-3 text-right">{it.target_unit_price ? formatPrice(it.target_unit_price) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status History & Notes */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Customer / Project Notes:</h4>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 italic">
                  {selectedRfq.notes || 'No notes provided.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Progression Timeline:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedRfq.status_history?.map((h, i) => (
                    <div key={h.id || i} className="flex items-start gap-2 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-accent mt-1 shrink-0"></span>
                      <div>
                        <strong className="text-slate-800">{h.title}</strong>
                        <span className="text-slate-400 ml-1">({new Date(h.created_at).toLocaleTimeString()})</span>
                        {h.description && <p className="text-slate-500">{h.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Creation / Revision Modal */}
      {showQuoteModal && quoteForRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-heading font-bold text-slate-900">
                  Generate Official Quotation Package
                </h3>
                <p className="text-xs text-slate-500">
                  For RFQ <strong className="font-mono text-slate-800">{quoteForRfq.rfq_number}</strong> ({quoteForRfq.project_name})
                </p>
              </div>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-6 text-xs">
              {/* Line Items Pricing Inputs */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Itemized Unit Price Specifications:</h4>
                <div className="space-y-3">
                  {quoteItems.map((item, idx) => (
                    <div
                      key={item.rfq_item_id || idx}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-6 font-bold text-slate-900">
                        {item.product_name}
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Quoted Qty ({item.unit})
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={item.quoted_quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setQuoteItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, quoted_quantity: val } : it))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Quoted Unit Rate (₹)
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={item.quoted_unit_price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setQuoteItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, quoted_unit_price: val } : it))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercials Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Special Volume Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={quoteDiscount}
                    onChange={(e) => setQuoteDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Site Delivery & Freight (₹)
                  </label>
                  <input
                    type="number"
                    value={quoteDeliveryCharge}
                    onChange={(e) => setQuoteDeliveryCharge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="0 (Free Delivery)"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Offer Validity (Days)
                  </label>
                  <input
                    type="number"
                    value={quoteValidDays}
                    onChange={(e) => setQuoteValidDays(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    min="1"
                    max="60"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Commercial Terms / Customer Notes
                  </label>
                  <input
                    type="text"
                    value={quoteCustomerNotes}
                    onChange={(e) => setQuoteCustomerNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="e.g. Rate valid for complete truckload dispatch."
                  />
                </div>
              </div>

              {/* Send Immediately Checkbox */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/70 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Send to Client Immediately</span>
                  <span className="text-[11px] text-slate-500">
                    If checked, quote status will be set to 'sent' and customer will see the offer ready to accept.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={sendImmediately}
                  onChange={(e) => setSendImmediately(e.target.checked)}
                  className="w-4 h-4 text-accent rounded focus:ring-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setShowQuoteModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={actionLoading}
                  className="font-bold flex items-center gap-2 shadow-md shadow-accent/20"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Quotation...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{sendImmediately ? 'Create & Dispatch Quote' : 'Save Draft Quote'}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuotesPage;
