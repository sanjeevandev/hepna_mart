import React from 'react';
import { X, Printer, Share2, ShieldCheck, FileText, Info } from 'lucide-react';
import { ConstructionEstimate } from '@/types';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';

interface EstimatePrintModalProps {
  estimate: ConstructionEstimate;
  isOpen: boolean;
  onClose: () => void;
}

const EstimatePrintModal: React.FC<EstimatePrintModalProps> = ({
  estimate,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `HEPNA MART Smart Construction Estimate [${estimate.id}] for ${
      estimate.inputs.projectName || estimate.inputs.projectType
    } (${estimate.inputs.builtUpArea} ${estimate.inputs.areaUnit}). Total Indicative Cost: ${formatPrice(
      estimate.currentTotal || estimate.totalAtEstimate
    )}. View at https://hepnamart.com/estimates/${estimate.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const createdDateStr = new Date(estimate.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-[#071A2B] text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-bold text-white">
                Construction Material Estimate Sheet
              </h2>
              <p className="text-[11px] text-white/70">Estimate #{estimate.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-dark text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:m-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-primary/20 gap-4">
            <div>
              <div className="font-heading font-black text-2xl tracking-tight text-[#071A2B]">
                HEPNA <span className="text-accent">MART</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Smart Construction Cost & Material Planning Report
              </p>
              <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                <div>GSTIN: 27AABCH9821K1Z4 | CIN: U45200MH2023PTC891234</div>
                <div>Fulfillment Logistics: Direct-to-Site Transit Fleet</div>
                <div>Support: care@hepnamart.com | +91 98765 43210</div>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none w-full sm:w-auto border sm:border-0 border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-accent">
                Planning Estimate
              </div>
              <div className="text-base font-extrabold text-[#071A2B] mt-0.5">#{estimate.id}</div>
              <div className="text-xs text-slate-600 mt-1">
                Estimated On: <span className="font-semibold text-slate-900">{createdDateStr}</span>
              </div>
              <div className="text-xs text-slate-600">
                Price Validity: <span className="font-semibold text-emerald-700">7 Days Indicative</span>
              </div>
            </div>
          </div>

          {/* Project Specifications Summary */}
          <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Project Name
              </span>
              <span className="font-bold text-slate-900">
                {estimate.inputs.projectName || `${estimate.inputs.projectType} Project`}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Built-Up Area
              </span>
              <span className="font-bold text-slate-900">
                {estimate.inputs.builtUpArea} {estimate.inputs.areaUnit} ({estimate.inputs.floors} Flr)
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quality Spec
              </span>
              <span className="font-bold text-slate-900 capitalize">
                {estimate.inputs.quality} Quality
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Job-Site City
              </span>
              <span className="font-bold text-slate-900">
                {estimate.inputs.city || 'Regional Fulfillment'}
              </span>
            </div>
          </div>

          {/* Itemized Material Requirements Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#071A2B] text-white">
                  <th className="p-2.5 rounded-l-lg">#</th>
                  <th className="p-2.5">Category & Basis</th>
                  <th className="p-2.5">Mapped Catalog Product</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Unit Rate</th>
                  <th className="p-2.5 text-right rounded-r-lg">Estimated Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {estimate.materials.map((mat, idx) => (
                  <tr key={mat.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="p-2.5">
                      <div className="font-bold text-slate-900">{mat.categoryName}</div>
                      <div className="text-[10px] text-slate-500">{mat.coefficientDescription}</div>
                    </td>
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-800">{mat.productName}</div>
                      <div className="text-[10px] text-accent font-bold">{mat.brand}</div>
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-900">
                      {mat.quantity} {mat.unit}s
                    </td>
                    <td className="p-2.5 text-right font-medium text-slate-900">
                      {formatPrice(mat.currentPrice)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {formatPrice(mat.currentLineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t border-slate-200 gap-6">
            <div className="w-full sm:w-1/2 space-y-2 text-xs text-slate-600">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Procurement & Delivery Terms:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                <li>Materials are supplied from certified Bureau of Indian Standards (BIS) manufacturers.</li>
                <li>Free site delivery applies to standard full-truckload drops above ₹5,000.</li>
                <li>Direct cart conversion locks actual inventory allocations upon order placement.</li>
              </ul>
            </div>

            <div className="w-full sm:w-2/5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between text-slate-600">
                <span>Materials Subtotal:</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(estimate.currentSubtotal || estimate.subtotalAtEstimate)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18% ITC Eligible):</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(estimate.currentTax || estimate.taxAtEstimate)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Direct Site Delivery:</span>
                <span className="font-semibold text-slate-900">
                  {(estimate.currentDelivery || estimate.deliveryAtEstimate) === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    formatPrice(estimate.currentDelivery || estimate.deliveryAtEstimate)
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-bold text-[#071A2B]">
                <span>Indicative Total Budget:</span>
                <span className="text-base text-accent font-extrabold">
                  {formatPrice(estimate.currentTotal || estimate.totalAtEstimate)}
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory Formal Disclaimer */}
          <div className="mt-8 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Info className="w-4 h-4 text-amber-700" />
              <span>Legal & Engineering Disclaimer</span>
            </div>
            <p className="text-[11px] text-amber-900/90 leading-relaxed">
              This document represents an indicative planning estimate based on current HEPNA MART catalog prices and standard construction coefficients. Material quantities and final execution costs may vary based on structural design, architectural drawings, soil strata, site accessibility, supplier availability, taxes, logistics, and market price adjustments. Final purchase orders must be verified by a licensed structural engineer or contractor.
            </p>
          </div>
        </div>

        {/* Footer Bar (Hidden on print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Indicative Construction Cost Planning Document</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="primary" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimatePrintModal;
