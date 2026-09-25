import React from 'react';
import { Layers, ShoppingCart, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';

interface BOQSummaryCardsProps {
  totalItemsCount: number;
  totalRequiredValue: number;
  purchasedValue: number;
  remainingValue: number;
  completionPercent: number;
  priceVariance: number;
  pendingItemsCount: number;
  completedItemsCount: number;
}

export const BOQSummaryCards: React.FC<BOQSummaryCardsProps> = ({
  totalItemsCount,
  totalRequiredValue,
  purchasedValue,
  remainingValue,
  completionPercent,
  priceVariance,
  pendingItemsCount,
  completedItemsCount,
}) => {
  const estimatedTax = remainingValue * 0.18;
  const remainingWithTax = remainingValue + estimatedTax;

  return (
    <div className="space-y-4">
      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Required Value */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Total BOQ Budget
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-heading font-black text-[#071A2B]">
              {formatPrice(totalRequiredValue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span>{totalItemsCount} scheduled items</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400">Excl. Tax</span>
            </div>
          </div>
        </div>

        {/* Card 2: Purchased / Procured Value */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Procured Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-heading font-black text-emerald-600">
              {formatPrice(purchasedValue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span className="font-semibold text-emerald-700">{completedItemsCount} items completed</span>
              <span className="text-slate-300">•</span>
              <span>{Math.round(completionPercent)}% value</span>
            </div>
          </div>
        </div>

        {/* Card 3: Remaining Procurement Value */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Remaining to Buy
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-accent flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-heading font-black text-accent">
              {formatPrice(remainingValue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              <span>{pendingItemsCount} items pending • {formatPrice(remainingWithTax)} w/GST</span>
            </div>
          </div>
        </div>

        {/* Card 4: Price Variance vs Catalog */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Market Price Variance
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                priceVariance > 0
                  ? 'bg-amber-50 text-amber-600'
                  : priceVariance < 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {priceVariance > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : priceVariance < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
            </div>
          </div>
          <div>
            <div
              className={`text-lg sm:text-2xl font-heading font-black ${
                priceVariance > 0
                  ? 'text-amber-700'
                  : priceVariance < 0
                  ? 'text-emerald-700'
                  : 'text-slate-800'
              }`}
            >
              {priceVariance > 0 ? `+${formatPrice(priceVariance)}` : priceVariance < 0 ? `-${formatPrice(Math.abs(priceVariance))}` : '₹0 (In Sync)'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {priceVariance !== 0 ? 'Compared to original addition rate' : 'Aligned with live catalog rates'}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Material Procurement Fulfillment
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
              {Math.round(completionPercent)}% Complete
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            <span className="font-bold text-emerald-600">{formatPrice(purchasedValue)}</span> procured of{' '}
            <span className="font-bold text-slate-800">{formatPrice(totalRequiredValue)}</span> total requirement
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60 flex">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, completionPercent))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BOQSummaryCards;
