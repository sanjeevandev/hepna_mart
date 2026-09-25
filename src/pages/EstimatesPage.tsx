import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Calculator,
  Plus,
  Trash2,
  HardHat,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building,
  Calendar,
} from 'lucide-react';
import { useEstimateStore } from '@/store/estimateStore';
import { formatPrice } from '@/utils/formatPrice';
import { ConstructionEstimate } from '@/types';
import TransferToProjectModal from '@/components/calculator/TransferToProjectModal';
import Button from '@/components/ui/Button';
import SectionReveal from '@/components/ui/SectionReveal';

const EstimatesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    estimates,
    deleteEstimate,
    refreshEstimatePricing,
    addAvailableMaterialsToCart,
  } = useEstimateStore();

  const [selectedEstimateForTransfer, setSelectedEstimateForTransfer] =
    useState<ConstructionEstimate | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAddToCart = (estId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = addAvailableMaterialsToCart(estId);
    if (res.added > 0) {
      navigate('/cart');
    }
  };

  const handleRefresh = (estId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    refreshEstimatePricing(estId);
  };

  const handleDelete = (estId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Delete estimate #${estId}?`)) {
      deleteEstimate(estId);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="container-custom">
        {/* Header */}
        <SectionReveal variant="hero">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-accent text-xs font-bold uppercase tracking-wider mb-2">
                <Calculator className="w-3.5 h-3.5" />
                <span>Estimate History</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#071A2B]">
                My Saved Material Estimates
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Review historical cost snapshots, compare live catalog price shifts, and transfer to BOQ.
              </p>
            </div>

            <Link to="/calculator">
              <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
                New Cost Estimate
              </Button>
            </Link>
          </div>
        </SectionReveal>

        {/* Estimates Listing */}
        {estimates.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-16 text-center max-w-xl mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <FileText size={32} />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              No saved estimates yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use our smart cost calculator to estimate structural materials, review budgets, and plan your project.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Link to="/calculator">
                <Button variant="primary" size="sm" icon={<Calculator className="w-4 h-4" />}>
                  Open Cost Calculator
                </Button>
              </Link>
              <Link to="/projects/new">
                <Button variant="outline" size="sm" icon={<HardHat className="w-4 h-4" />}>
                  Create a Project
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {estimates.map((est) => {
              const createdDateStr = new Date(est.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={est.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-all space-y-5"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                          #{est.id}
                        </span>
                        <h3 className="font-heading font-bold text-lg text-[#071A2B] mt-1.5 line-clamp-1">
                          {est.inputs.projectName || `${est.inputs.projectType} Construction`}
                        </h3>
                      </div>

                      {est.hasPriceChanges ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Prices Changed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Current Pricing
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-4">
                      <span>{est.inputs.builtUpArea} {est.inputs.areaUnit} ({est.inputs.floors} Flr)</span>
                      <span>•</span>
                      <span className="capitalize">{est.inputs.quality} Quality</span>
                      <span>•</span>
                      <span>{est.inputs.city || 'Pune'}</span>
                    </div>

                    {/* Financial Numbers Matrix */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Original Snapshot ({createdDateStr}):</span>
                        <span className="font-semibold text-slate-800">
                          {formatPrice(est.totalAtEstimate)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-600">
                        <span>Current Live Catalog Total:</span>
                        <span className="font-bold text-accent text-sm">
                          {formatPrice(est.currentTotal || est.totalAtEstimate)}
                        </span>
                      </div>

                      {est.priceDifference !== 0 && (
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/80">
                          <span className="text-[11px] text-slate-500">Price Variance:</span>
                          <span
                            className={`font-extrabold text-xs ${
                              est.priceDifference > 0 ? 'text-red-600' : 'text-emerald-600'
                            }`}
                          >
                            {est.priceDifference > 0
                              ? `+${formatPrice(est.priceDifference)}`
                              : formatPrice(est.priceDifference)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(est.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete estimate"
                        aria-label="Delete estimate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleRefresh(est.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-accent hover:bg-orange-50 transition-colors"
                        title="Update to current prices"
                        aria-label="Update prices"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedEstimateForTransfer(est)}
                        className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors"
                        title="Transfer to Project BOQ"
                        aria-label="Transfer to Project BOQ"
                      >
                        <HardHat className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(est.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-accent hover:bg-orange-50 transition-colors"
                        title="Add in-stock materials to cart"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>

                    <Link
                      to={`/estimates/${est.id}`}
                      className="py-2 px-3.5 rounded-xl bg-[#071A2B] hover:bg-[#0B2742] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transfer to BOQ Modal */}
      {selectedEstimateForTransfer && (
        <TransferToProjectModal
          estimate={selectedEstimateForTransfer}
          isOpen={Boolean(selectedEstimateForTransfer)}
          onClose={() => setSelectedEstimateForTransfer(null)}
        />
      )}
    </div>
  );
};

export default EstimatesPage;
