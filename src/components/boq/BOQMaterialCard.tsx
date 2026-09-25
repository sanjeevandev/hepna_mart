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
  Layers,
} from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';
import { BOQItemComputed } from './BOQMaterialRow';

interface BOQMaterialCardProps {
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

export const BOQMaterialCard: React.FC<BOQMaterialCardProps> = ({
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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3.5 print:hidden">
      {/* Top row: Image, Name, Status, Delete */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <img
            src={item.product.images?.[0] || 'https://placehold.co/80?text=HEPNA'}
            alt={item.product.name}
            className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <Link
              to={`/product/${item.product.slug}`}
              className="font-bold text-slate-900 hover:text-accent transition-colors text-sm line-clamp-1 block"
            >
              {item.product.name}
            </Link>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {item.product.brand} • {item.product.subcategory || item.product.category}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                {item.stage || 'Foundation'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          title="Remove from BOQ"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Progress & Status Strip */}
      <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-2">
          {!inStock ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
              Out of Stock
            </span>
          ) : item.status === 'COMPLETED' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Procured</span>
            </span>
          ) : item.status === 'PARTIAL' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{Math.round(item.progressPercent)}% Purchased</span>
            </span>
          ) : item.status === 'OVER_PROCURED' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
              +{item.purchasedQuantity! - item.effectiveRequiredQty} Extra
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              Pending
            </span>
          )}
        </div>

        <div className="text-right">
          <div className="text-xs font-black text-slate-900">
            {formatPrice(item.lineTotalRequired)}
          </div>
          <div className="text-[10px] text-slate-500">
            {formatPrice(item.currentPrice)}/{item.unit}
          </div>
        </div>
      </div>

      {/* Quantities Controls Grid */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {/* Required Base */}
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Required</span>
          <div className="flex items-center justify-center gap-1 my-1">
            <button
              type="button"
              onClick={() => onUpdateBaseQty(Math.max(1, item.quantity - 1))}
              className="w-5 h-5 bg-white border border-slate-200 rounded font-bold text-slate-600 flex items-center justify-center text-xs"
            >
              -
            </button>
            <span className="font-extrabold text-slate-900 text-xs">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdateBaseQty(item.quantity + 1)}
              className="w-5 h-5 bg-white border border-slate-200 rounded font-bold text-slate-600 flex items-center justify-center text-xs"
            >
              +
            </button>
          </div>
          <span className="text-[10px] text-slate-500">+{item.wastagePercent || 0}% waste</span>
        </div>

        {/* Procured */}
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Purchased</span>
          <div className="flex items-center justify-center gap-1 my-1">
            <button
              type="button"
              onClick={() => onUpdatePurchasedQty(Math.max(0, (item.purchasedQuantity || 0) - 1))}
              className="w-5 h-5 bg-white border border-slate-200 rounded font-bold text-slate-600 flex items-center justify-center text-xs"
            >
              -
            </button>
            <span className="font-extrabold text-slate-900 text-xs">{item.purchasedQuantity || 0}</span>
            <button
              type="button"
              onClick={() => onUpdatePurchasedQty((item.purchasedQuantity || 0) + 1)}
              className="w-5 h-5 bg-white border border-slate-200 rounded font-bold text-slate-600 flex items-center justify-center text-xs"
            >
              +
            </button>
          </div>
          <span className="text-[10px] text-slate-500">{item.unit}</span>
        </div>

        {/* Remaining */}
        <div className="bg-orange-50/70 p-2 rounded-xl border border-orange-200/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-accent uppercase">Remaining</span>
          <div className="font-black text-accent text-base my-0.5">
            {item.remainingQty}
          </div>
          <span className="text-[10px] text-accent/80 font-semibold">{item.unit}</span>
        </div>
      </div>

      {/* Notes / Specifications expandable */}
      <div className="pt-1">
        {!isEditingNotes ? (
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span className="truncate">
              {item.notes ? `Note: ${item.notes}` : 'No site notes added'}
            </span>
            <button
              type="button"
              onClick={() => setIsEditingNotes(true)}
              className="text-accent font-semibold hover:underline shrink-0 ml-2"
            >
              {item.notes ? 'Edit' : '+ Add Note'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g., Deliver to Block B..."
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-full focus:outline-none focus:border-accent"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              className="p-1 bg-emerald-600 text-white rounded-lg"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Action Button: Add Remaining to Cart */}
      <button
        type="button"
        onClick={() => onAddToCart(item.remainingQty)}
        disabled={!inStock || item.remainingQty <= 0}
        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
          item.remainingQty > 0 && inStock
            ? 'bg-accent hover:bg-accent-dark text-white shadow-xs'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
        }`}
      >
        <ShoppingCart className="w-4 h-4" />
        <span>
          {!inStock
            ? 'Out of Stock'
            : item.remainingQty <= 0
            ? 'Fully Procured'
            : `Add Remaining (${item.remainingQty} ${item.unit}) to Cart`}
        </span>
      </button>
    </div>
  );
};

export default BOQMaterialCard;
