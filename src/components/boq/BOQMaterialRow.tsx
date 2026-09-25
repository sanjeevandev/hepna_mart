import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2,
  ShoppingCart,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Edit2,
  Check,
  TrendingUp,
  TrendingDown,
  Info,
  Layers,
  Percent,
} from 'lucide-react';
import { Product, ProjectMaterialItem } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

export interface BOQItemComputed extends ProjectMaterialItem {
  product: Product;
  wastageQty: number;
  effectiveRequiredQty: number;
  remainingQty: number;
  currentPrice: number;
  originalPrice: number;
  unitPriceDiff: number;
  lineTotalRequired: number;
  lineTotalPurchased: number;
  lineTotalRemaining: number;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'OVER_PROCURED' | 'OUT_OF_STOCK';
  progressPercent: number;
}

interface BOQMaterialRowProps {
  item: BOQItemComputed;
  index: number;
  onUpdateBaseQty: (qty: number) => void;
  onUpdateUnit: (unit: string) => void;
  onUpdatePurchasedQty: (qty: number) => void;
  onUpdateWastagePercent: (percent: number) => void;
  onUpdateNotes: (notes: string) => void;
  onRemove: () => void;
  onAddToCart: (qty: number) => void;
}

const COMMON_UNITS = [
  'Bag',
  'Piece',
  'Nos',
  'Tonne (MT)',
  'Kg',
  'Metre',
  'Sq. Ft.',
  'Litre',
  'Bundle',
  'Cu.m',
  'Truckload',
];

const WASTAGE_OPTIONS = [0, 3, 5, 8, 10, 15];

export const BOQMaterialRow: React.FC<BOQMaterialRowProps> = ({
  item,
  index,
  onUpdateBaseQty,
  onUpdateUnit,
  onUpdatePurchasedQty,
  onUpdateWastagePercent,
  onUpdateNotes,
  onRemove,
  onAddToCart,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(item.notes || '');

  const handleSaveNotes = () => {
    onUpdateNotes(noteText);
    setIsEditingNotes(false);
  };

  const inStock = Boolean(item.product.stock && item.product.stock > 0);

  return (
    <tr className="hover:bg-slate-50/80 transition-colors group border-b border-slate-100 text-xs sm:text-sm">
      {/* Index */}
      <td className="py-4 px-3 text-center font-bold text-slate-400">
        {index + 1}
      </td>

      {/* Material & Specifications */}
      <td className="py-4 px-4 min-w-[220px] max-w-[280px]">
        <div className="flex items-start gap-3">
          <img
            src={item.product.images?.[0] || 'https://placehold.co/80?text=HEPNA'}
            alt={item.product.name}
            className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <Link
              to={`/product/${item.product.slug}`}
              className="font-bold text-slate-900 hover:text-accent transition-colors line-clamp-1 block"
              title={item.product.name}
            >
              {item.product.name}
            </Link>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-slate-700">{item.product.brand}</span>
              <span className="text-slate-300">•</span>
              <span className="truncate">{item.product.subcategory || item.product.category}</span>
            </div>

            {/* Stage Badge & Notes trigger */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase tracking-wider">
                {item.stage || 'Foundation'}
              </span>

              {item.notes && !isEditingNotes && (
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(true)}
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 max-w-[140px] truncate"
                  title={item.notes}
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">{item.notes}</span>
                </button>
              )}

              {!item.notes && !isEditingNotes && (
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(true)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                  <span>+ Note</span>
                </button>
              )}
            </div>

            {/* Note Editor Inline */}
            {isEditingNotes && (
              <div className="mt-2 flex items-center gap-1.5">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g., Grade 53, store in dry shed..."
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] text-slate-800 w-full focus:outline-none focus:border-accent"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  title="Save Note"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Base Required Quantity & Unit */}
      <td className="py-4 px-3 text-center">
        <div className="inline-flex flex-col items-center">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
            <button
              type="button"
              onClick={() => onUpdateBaseQty(Math.max(1, item.quantity - 1))}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => onUpdateBaseQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center py-1 text-xs font-bold text-slate-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onUpdateBaseQty(item.quantity + 1)}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold"
            >
              +
            </button>
          </div>
          <select
            value={item.unit}
            onChange={(e) => onUpdateUnit(e.target.value)}
            className="mt-1 text-[11px] font-semibold text-slate-600 bg-transparent border-0 focus:outline-none cursor-pointer"
          >
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </td>

      {/* Wastage Allowance % */}
      <td className="py-4 px-3 text-center">
        <div className="inline-flex flex-col items-center">
          <select
            value={item.wastagePercent || 0}
            onChange={(e) => onUpdateWastagePercent(parseInt(e.target.value) || 0)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-accent"
          >
            {WASTAGE_OPTIONS.map((pct) => (
              <option key={pct} value={pct}>
                +{pct}%
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">
            ={item.effectiveRequiredQty} {item.unit}
          </span>
        </div>
      </td>

      {/* Purchased Quantity Stepper */}
      <td className="py-4 px-3 text-center">
        <div className="inline-flex flex-col items-center">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
            <button
              type="button"
              onClick={() => onUpdatePurchasedQty(Math.max(0, (item.purchasedQuantity || 0) - 1))}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold"
            >
              -
            </button>
            <input
              type="number"
              min={0}
              value={item.purchasedQuantity || 0}
              onChange={(e) => onUpdatePurchasedQty(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-12 text-center py-1 text-xs font-bold text-slate-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onUpdatePurchasedQty((item.purchasedQuantity || 0) + 1)}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold"
            >
              +
            </button>
          </div>
          {/* Item mini progress bar */}
          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full rounded-full ${
                item.progressPercent >= 100
                  ? 'bg-emerald-500'
                  : item.progressPercent > 0
                  ? 'bg-amber-500'
                  : 'bg-transparent'
              }`}
              style={{ width: `${Math.min(100, item.progressPercent)}%` }}
            />
          </div>
        </div>
      </td>

      {/* Remaining Quantity */}
      <td className="py-4 px-3 text-center font-bold">
        <span
          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold ${
            item.remainingQty === 0
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-orange-50 text-accent'
          }`}
        >
          {item.remainingQty} {item.unit}
        </span>
      </td>

      {/* Current Catalog Price & Impact */}
      <td className="py-4 px-3 text-right">
        <div className="font-extrabold text-slate-900">
          {formatPrice(item.currentPrice)}
          <span className="text-[10px] font-normal text-slate-400 block">/{item.unit}</span>
        </div>

        {item.unitPriceDiff !== 0 && (
          <div
            className={`text-[10px] font-bold flex items-center justify-end gap-0.5 mt-0.5 ${
              item.unitPriceDiff > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
            title={`Added at ${formatPrice(item.originalPrice)}`}
          >
            {item.unitPriceDiff > 0 ? (
              <>
                <TrendingUp className="w-3 h-3" />
                <span>+{formatPrice(item.unitPriceDiff)}</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3" />
                <span>-{formatPrice(Math.abs(item.unitPriceDiff))}</span>
              </>
            )}
          </div>
        )}
      </td>

      {/* Line Total (Required Total / Remaining Total) */}
      <td className="py-4 px-3 text-right">
        <div className="font-black text-slate-900 text-sm">
          {formatPrice(item.lineTotalRequired)}
        </div>
        {item.remainingQty > 0 && item.remainingQty !== item.effectiveRequiredQty && (
          <div className="text-[10px] text-accent font-semibold">
            {formatPrice(item.lineTotalRemaining)} left
          </div>
        )}
      </td>

      {/* Procurement Status */}
      <td className="py-4 px-3 text-center">
        {!inStock ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            Out of Stock
          </span>
        ) : item.status === 'COMPLETED' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Procured</span>
          </span>
        ) : item.status === 'PARTIAL' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>{Math.round(item.progressPercent)}% Part</span>
          </span>
        ) : item.status === 'OVER_PROCURED' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span>+{item.purchasedQuantity! - item.effectiveRequiredQty} Extra</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span>Pending</span>
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="py-4 px-3 text-center print:hidden">
        <div className="flex items-center justify-center gap-1.5">
          {/* Add Remaining to Cart */}
          <button
            type="button"
            onClick={() => onAddToCart(item.remainingQty)}
            disabled={!inStock || item.remainingQty <= 0}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              item.remainingQty > 0 && inStock
                ? 'bg-accent text-white hover:bg-accent-dark shadow-xs hover:shadow active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
            }`}
            title={
              !inStock
                ? 'Out of stock in catalog'
                : item.remainingQty <= 0
                ? 'Material fully procured'
                : `Add ${item.remainingQty} ${item.unit} to Cart`
            }
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Add {item.remainingQty > 0 ? item.remainingQty : ''}</span>
          </button>

          {/* Remove from BOQ */}
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Remove from project BOQ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default BOQMaterialRow;
