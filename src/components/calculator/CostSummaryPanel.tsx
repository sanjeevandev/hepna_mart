import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  ShoppingCart,
  HardHat,
  Printer,
  Send,
  BookmarkPlus,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  ArrowRight,
} from 'lucide-react';
import { CalculatorProjectInputs, EstimatedMaterialLine } from '@/types';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';

interface CostSummaryPanelProps {
  inputs: CalculatorProjectInputs;
  subtotal: number;
  tax: number;
  delivery: number;
  total: number;
  materials: EstimatedMaterialLine[];
  onSaveEstimate: () => void;
  onOpenAddToProject: () => void;
  onAddToCart: () => void;
  onOpenBulkQuote: () => void;
  onOpenPrint: () => void;
  savedEstimateId?: string;
  isSaving?: boolean;
}

const CostSummaryPanel: React.FC<CostSummaryPanelProps> = ({
  inputs,
  subtotal,
  tax,
  delivery,
  total,
  materials,
  onSaveEstimate,
  onOpenAddToProject,
  onAddToCart,
  onOpenBulkQuote,
  onOpenPrint,
  savedEstimateId,
  isSaving = false,
}) => {
  const inStockCount = materials.filter((m) => m.inStock).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 sticky top-24">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-lg text-[#071A2B]">
            Estimated Budget Summary
          </h3>
          <p className="text-[11px] text-slate-500">
            Based on current live catalog pricing
          </p>
        </div>

        {savedEstimateId && (
          <span className="text-[11px] font-extrabold text-accent bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
            #{savedEstimateId}
          </span>
        )}
      </div>

      {/* Specifications Recap */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-600">
        <div className="flex justify-between">
          <span>Project Classification:</span>
          <strong className="text-slate-900">{inputs.projectType} ({inputs.quality} grade)</strong>
        </div>
        <div className="flex justify-between">
          <span>Built-up Footprint:</span>
          <strong className="text-slate-900">
            {inputs.builtUpArea} {inputs.areaUnit} ({inputs.floors} {inputs.floors === 1 ? 'Floor' : 'Floors'})
          </strong>
        </div>
        {inputs.city && (
          <div className="flex justify-between">
            <span>Location:</span>
            <strong className="text-slate-900">{inputs.city}</strong>
          </div>
        )}
      </div>

      {/* Price Breakdown Calculation */}
      <div className="space-y-3 text-xs sm:text-sm text-slate-600">
        <div className="flex justify-between">
          <span>Materials Subtotal ({materials.length} categories):</span>
          <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span>GST (18% Input Tax Credit Eligible):</span>
          <span className="font-semibold text-slate-900">{formatPrice(tax)}</span>
        </div>

        <div className="flex justify-between">
          <span>Direct Job-Site Delivery:</span>
          <span className="font-semibold text-slate-900">
            {delivery === 0 ? (
              <span className="text-emerald-700 font-bold">FREE</span>
            ) : (
              formatPrice(delivery)
            )}
          </span>
        </div>

        {delivery === 0 && (
          <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/60 p-2 rounded-lg text-center font-medium">
            🎉 Eligible for Free Direct Site Drop
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base sm:text-lg font-black text-[#071A2B]">
          <span>Indicative Total:</span>
          <span className="text-xl sm:text-2xl text-accent font-black">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {/* Primary Procurement & Conversion Actions */}
      <div className="space-y-2.5 pt-2">
        {/* Add to Project BOQ */}
        <Button
          variant="primary"
          fullWidth
          size="md"
          onClick={onOpenAddToProject}
          icon={<HardHat className="w-4 h-4" />}
          className="shadow-md shadow-accent/20"
        >
          Transfer to Project BOQ
        </Button>

        {/* Add Available Materials to Cart */}
        <Button
          variant="dark"
          fullWidth
          size="md"
          onClick={onAddToCart}
          icon={<ShoppingCart className="w-4 h-4 text-accent" />}
        >
          Add {inStockCount} Materials to Cart
        </Button>

        {/* Save Estimate / Update Snapshot */}
        <button
          type="button"
          onClick={onSaveEstimate}
          disabled={isSaving}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <BookmarkPlus className="w-4 h-4 text-accent" />
          <span>{savedEstimateId ? 'Update Saved Estimate' : 'Save to My Estimates'}</span>
        </button>

        {/* Request Wholesale Bulk Quote */}
        <button
          type="button"
          onClick={onOpenBulkQuote}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Send className="w-4 h-4 text-accent" />
          <span>Request B2B Bulk Discount</span>
        </button>

        {/* Print / Save PDF */}
        <button
          type="button"
          onClick={onOpenPrint}
          className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save Estimate (PDF)</span>
        </button>
      </div>

      {/* Trust Badge */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Prices matched with live catalog SKU codes</span>
      </div>
    </div>
  );
};

export default CostSummaryPanel;
