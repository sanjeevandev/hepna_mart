import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, Layers, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';
import { BOQItemComputed, BOQMaterialRow } from './BOQMaterialRow';
import { BOQMaterialCard } from './BOQMaterialCard';

interface BOQCategoryGroupProps {
  groupTitle: string;
  items: BOQItemComputed[];
  onUpdateBaseQty: (productId: string, qty: number) => void;
  onUpdateUnit: (productId: string, unit: string) => void;
  onUpdatePurchasedQty: (productId: string, qty: number) => void;
  onUpdateWastagePercent: (productId: string, percent: number) => void;
  onUpdateNotes: (productId: string, notes: string) => void;
  onRemove: (productId: string) => void;
  onAddToCart: (productId: string, qty: number) => void;
  onAddGroupRemainingToCart: (items: BOQItemComputed[]) => void;
}

export const BOQCategoryGroup: React.FC<BOQCategoryGroupProps> = ({
  groupTitle,
  items,
  onUpdateBaseQty,
  onUpdateUnit,
  onUpdatePurchasedQty,
  onUpdateWastagePercent,
  onUpdateNotes,
  onRemove,
  onAddToCart,
  onAddGroupRemainingToCart,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const groupTotalRequired = items.reduce((acc, it) => acc + it.lineTotalRequired, 0);
  const groupPurchased = items.reduce((acc, it) => acc + it.lineTotalPurchased, 0);
  const groupRemaining = items.reduce((acc, it) => acc + it.lineTotalRemaining, 0);
  const groupProgress = groupTotalRequired > 0 ? (groupPurchased / groupTotalRequired) * 100 : 0;
  const inStockRemainingItems = items.filter(
    (it) => it.remainingQty > 0 && Boolean(it.product.stock && it.product.stock > 0)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Category Group Header */}
      <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <button
            type="button"
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-xs"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-slate-900">
                {groupTitle}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[11px] font-bold">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Required: <strong className="text-slate-800">{formatPrice(groupTotalRequired)}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Procured: <strong className="text-emerald-700">{formatPrice(groupPurchased)}</strong> ({Math.round(groupProgress)}%)</span>
            </div>
          </div>
        </div>

        {/* Group Quick Actions */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {inStockRemainingItems.length > 0 && (
            <button
              type="button"
              onClick={() => onAddGroupRemainingToCart(inStockRemainingItems)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50 text-accent border border-accent/40 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add Group Remaining ({formatPrice(groupRemaining)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4">Material Specification</th>
                  <th className="py-3 px-3 text-center">Required</th>
                  <th className="py-3 px-3 text-center">Wastage %</th>
                  <th className="py-3 px-3 text-center">Procured</th>
                  <th className="py-3 px-3 text-center">Remaining</th>
                  <th className="py-3 px-3 text-right">Unit Rate</th>
                  <th className="py-3 px-3 text-right">Total Cost</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center print:hidden">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <BOQMaterialRow
                    key={it.productId}
                    item={it}
                    index={idx}
                    onUpdateBaseQty={(qty) => onUpdateBaseQty(it.productId, qty)}
                    onUpdateUnit={(u) => onUpdateUnit(it.productId, u)}
                    onUpdatePurchasedQty={(qty) => onUpdatePurchasedQty(it.productId, qty)}
                    onUpdateWastagePercent={(pct) => onUpdateWastagePercent(it.productId, pct)}
                    onUpdateNotes={(notes) => onUpdateNotes(it.productId, notes)}
                    onRemove={() => onRemove(it.productId)}
                    onAddToCart={(qty) => onAddToCart(it.productId, qty)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="md:hidden p-3 space-y-3">
            {items.map((it, idx) => (
              <BOQMaterialCard
                key={it.productId}
                item={it}
                index={idx}
                onUpdateBaseQty={(qty) => onUpdateBaseQty(it.productId, qty)}
                onUpdateUnit={(u) => onUpdateUnit(it.productId, u)}
                onUpdatePurchasedQty={(qty) => onUpdatePurchasedQty(it.productId, qty)}
                onUpdateWastagePercent={(pct) => onUpdateWastagePercent(it.productId, pct)}
                onUpdateNotes={(notes) => onUpdateNotes(it.productId, notes)}
                onRemove={() => onRemove(it.productId)}
                onAddToCart={(qty) => onAddToCart(it.productId, qty)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BOQCategoryGroup;
