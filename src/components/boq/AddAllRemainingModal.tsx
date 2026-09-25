import React from 'react';
import { ShoppingCart, Check, AlertCircle, X, ArrowRight, PackageCheck, AlertTriangle } from 'lucide-react';
import { BOQItemComputed } from './BOQMaterialRow';
import { formatPrice } from '@/utils/formatPrice';

interface AddAllRemainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BOQItemComputed[];
  onConfirm: () => void;
  projectName: string;
}

export const AddAllRemainingModal: React.FC<AddAllRemainingModalProps> = ({
  isOpen,
  onClose,
  items,
  onConfirm,
  projectName,
}) => {
  if (!isOpen) return null;

  const availableRemainingItems = items.filter(
    (it) => it.remainingQty > 0 && Boolean(it.product.stock && it.product.stock > 0)
  );

  const outOfStockItems = items.filter(
    (it) => it.remainingQty > 0 && (!it.product.stock || it.product.stock <= 0)
  );

  const subtotal = availableRemainingItems.reduce(
    (acc, it) => acc + it.currentPrice * it.remainingQty,
    0
  );
  const estimatedTax = subtotal * 0.18;
  const grandTotal = subtotal + estimatedTax;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-accent border border-orange-200/60 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[#071A2B]">
                Procure Remaining BOQ Materials
              </h3>
              <p className="text-xs text-slate-500">
                Push unprocured materials from &ldquo;{projectName}&rdquo; to your active cart
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {availableRemainingItems.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <PackageCheck className="w-10 h-10 mx-auto text-emerald-500" />
              <h4 className="font-bold text-slate-800 text-sm">
                No Remaining Items To Procure!
              </h4>
              <p className="text-xs max-w-xs mx-auto text-slate-500">
                All materials in this BOQ have already been purchased or are currently unavailable.
              </p>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>Items To Be Added ({availableRemainingItems.length})</span>
                <span className="text-emerald-700 font-semibold">Live Catalog Rates</span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {availableRemainingItems.map((item) => {
                  const lineTotal = item.currentPrice * item.remainingQty;
                  return (
                    <div
                      key={item.productId}
                      className="p-3 bg-white flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.product.images?.[0] || 'https://placehold.co/80?text=HEPNA'}
                          alt={item.product.name}
                          className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {item.product.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Qty: <strong className="text-accent">{item.remainingQty} {item.unit}</strong> • {formatPrice(item.currentPrice)}/{item.unit}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-black text-slate-900 shrink-0">
                        {formatPrice(lineTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Out of Stock Warning if any */}
              {outOfStockItems.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {outOfStockItems.length} Item(s) Currently Out of Stock:
                    </span>
                    <span className="text-[11px] text-amber-800">
                      {outOfStockItems.map((it) => it.product.name).join(', ')} cannot be added at this moment.
                    </span>
                  </div>
                </div>
              )}

              {/* Cost Summary Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Materials Subtotal:</span>
                  <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimated GST (18%):</span>
                  <span className="font-bold text-slate-900">{formatPrice(estimatedTax)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-sm text-[#071A2B]">
                  <span>Total Cart Addition Value:</span>
                  <span className="text-accent font-black text-base">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={availableRemainingItems.length === 0}
            className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Confirm & Add {availableRemainingItems.length} Items to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAllRemainingModal;
