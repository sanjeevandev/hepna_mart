import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calculator,
  HardHat,
  FileText,
  Boxes,
  ShieldCheck,
  RotateCcw,
  ShoppingCart,
  Send,
  Printer,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Building,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useEstimateStore } from '@/store/estimateStore';
import { formatPrice } from '@/utils/formatPrice';
import MaterialEstimateTable from '@/components/calculator/MaterialEstimateTable';
import CostBreakdownChart from '@/components/calculator/CostBreakdownChart';
import CostSummaryPanel from '@/components/calculator/CostSummaryPanel';
import PriceChangeBanner from '@/components/calculator/PriceChangeBanner';
import TransferToProjectModal from '@/components/calculator/TransferToProjectModal';
import EstimatePrintModal from '@/components/calculator/EstimatePrintModal';
import QuotationModal from '@/components/cart/QuotationModal';
import Button from '@/components/ui/Button';
import SectionReveal from '@/components/ui/SectionReveal';

const EstimateDetailsPage: React.FC = () => {
  const { estimateId } = useParams<{ estimateId: string }>();
  const navigate = useNavigate();
  const {
    getEstimate,
    refreshEstimatePricing,
    addAvailableMaterialsToCart,
    deleteEstimate,
  } = useEstimateStore();

  const [estimate, setEstimate] = useState(
    estimateId ? getEstimate(estimateId) : undefined
  );
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (estimateId) {
      setEstimate(getEstimate(estimateId));
    }
  }, [estimateId, getEstimate]);

  if (!estimate) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
          <FileText size={40} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#071A2B] mb-2">
          Estimate Not Found
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
          We couldn't find an estimate matching &ldquo;{estimateId}&rdquo;. It may have been deleted or expired.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/estimates">
            <Button variant="primary">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>View Saved Estimates</span>
            </Button>
          </Link>
          <Link to="/calculator">
            <Button variant="outline">
              <Calculator className="w-4 h-4 mr-1.5" />
              <span>Create New Estimate</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    if (!estimateId) return;
    const updated = refreshEstimatePricing(estimateId);
    if (updated) {
      setEstimate(updated);
    }
  };

  const handleAddToCart = () => {
    const res = addAvailableMaterialsToCart(estimate.id);
    if (res.added > 0) {
      navigate('/cart');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete estimate #${estimate.id}?`)) {
      deleteEstimate(estimate.id);
      navigate('/estimates');
    }
  };

  const createdDateStr = new Date(estimate.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 sm:py-10">
      <div className="container-custom">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-xs text-slate-500 mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight size={14} className="mx-1.5 text-slate-400" />
          <Link to="/estimates" className="hover:text-primary transition-colors">
            Estimates
          </Link>
          <ChevronRight size={14} className="mx-1.5 text-slate-400" />
          <span className="text-slate-900 font-bold truncate">#{estimate.id}</span>
        </nav>

        {/* Top Header Card */}
        <SectionReveal variant="hero">
          <div className="bg-[#071A2B] text-white rounded-2xl p-6 sm:p-8 shadow-xl mb-8 border border-white/10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white">
                    {estimate.inputs.projectName || `${estimate.inputs.projectType} Estimate`}
                  </h1>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent-light">
                    #{estimate.id}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
                  <div>
                    Estimated On: <strong className="text-white">{createdDateStr}</strong>
                  </div>
                  <div>
                    Built-up Footprint: <strong className="text-white">{estimate.inputs.builtUpArea} {estimate.inputs.areaUnit} ({estimate.inputs.floors} Flr)</strong>
                  </div>
                  <div className="capitalize">
                    Spec: <strong className="text-white">{estimate.inputs.quality} Quality</strong>
                  </div>
                  {estimate.inputs.city && (
                    <div>
                      City: <strong className="text-white">{estimate.inputs.city}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline-white"
                  size="sm"
                  onClick={() => setIsPrintModalOpen(true)}
                  icon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print / PDF
                </Button>

                <Button
                  variant="outline-white"
                  size="sm"
                  onClick={handleRefresh}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Update Prices
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsTransferModalOpen(true)}
                  icon={<HardHat className="w-3.5 h-3.5" />}
                >
                  Transfer to BOQ
                </Button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-2 rounded-xl text-red-400 hover:text-red-200 hover:bg-red-500/20 transition-colors"
                  title="Delete estimate"
                  aria-label="Delete estimate"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </SectionReveal>

        {/* Price Change Detection Banner */}
        {estimate.hasPriceChanges && !isAlertDismissed && (
          <div className="mb-8">
            <PriceChangeBanner
              originalTotal={estimate.totalAtEstimate}
              currentTotal={estimate.currentTotal || estimate.totalAtEstimate}
              priceDifference={estimate.priceDifference}
              onRefreshPricing={handleRefresh}
              onDismissAlert={() => setIsAlertDismissed(true)}
              snapshotDate={estimate.priceSnapshotTimestamp}
            />
          </div>
        )}

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8/12): Material Table + Cost Breakdown */}
          <div className="lg:col-span-8 space-y-8">
            <SectionReveal>
              <MaterialEstimateTable
                materials={estimate.materials}
                onOpenAddToProject={() => setIsTransferModalOpen(true)}
                showHistoricalComparison={estimate.hasPriceChanges}
              />
            </SectionReveal>

            <SectionReveal>
              <CostBreakdownChart
                materials={estimate.materials}
                subtotal={estimate.currentSubtotal || estimate.subtotalAtEstimate}
              />
            </SectionReveal>
          </div>

          {/* Right Column (4/12): Summary Panel */}
          <div className="lg:col-span-4">
            <CostSummaryPanel
              inputs={estimate.inputs}
              subtotal={estimate.currentSubtotal || estimate.subtotalAtEstimate}
              tax={estimate.currentTax || estimate.taxAtEstimate}
              delivery={estimate.currentDelivery ?? estimate.deliveryAtEstimate}
              total={estimate.currentTotal || estimate.totalAtEstimate}
              materials={estimate.materials}
              onSaveEstimate={handleRefresh}
              onOpenAddToProject={() => setIsTransferModalOpen(true)}
              onAddToCart={handleAddToCart}
              onOpenBulkQuote={() => setIsQuoteModalOpen(true)}
              onOpenPrint={() => setIsPrintModalOpen(true)}
              savedEstimateId={estimate.id}
            />
          </div>
        </div>
      </div>

      {/* Transfer to BOQ Modal */}
      <TransferToProjectModal
        estimate={estimate}
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      {/* Printable Estimate Modal */}
      <EstimatePrintModal
        estimate={estimate}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* Wholesale / Bulk Quote Modal */}
      <QuotationModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};

export default EstimateDetailsPage;
