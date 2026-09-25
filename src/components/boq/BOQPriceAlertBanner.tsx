import React from 'react';
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';

interface BOQPriceAlertBannerProps {
  priceVariance: number;
  changedItemsCount: number;
  onRefreshPrices: () => void;
  isUpdating?: boolean;
}

export const BOQPriceAlertBanner: React.FC<BOQPriceAlertBannerProps> = ({
  priceVariance,
  changedItemsCount,
  onRefreshPrices,
  isUpdating = false,
}) => {
  if (changedItemsCount === 0) {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-emerald-950">
              Live Catalog Rates Synchronized
            </div>
            <div className="text-emerald-700 text-[11px] mt-0.5">
              All material rates in this BOQ are current with active HEPNA MART catalog prices.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPriceIncrease = priceVariance > 0;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${
        isPriceIncrease
          ? 'bg-amber-50/90 border-amber-300 text-amber-950'
          : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            isPriceIncrease
              ? 'bg-amber-200/70 text-amber-800'
              : 'bg-emerald-200/70 text-emerald-800'
          }`}
        >
          {isPriceIncrease ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm">
              {changedItemsCount} Material{changedItemsCount > 1 ? 's' : ''} with Market Price Changes
            </h4>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                isPriceIncrease
                  ? 'bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
              }`}
            >
              {isPriceIncrease ? `+${formatPrice(priceVariance)} Net Increase` : `-${formatPrice(Math.abs(priceVariance))} Net Savings`}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Active HEPNA MART catalog rates differ from snapshot rates when materials were added to this BOQ.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={onRefreshPrices}
          disabled={isUpdating}
          className="px-4 py-2 rounded-xl bg-[#071A2B] hover:bg-[#0B2742] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-accent ${isUpdating ? 'animate-spin' : ''}`} />
          <span>Update to Live Catalog Rates</span>
        </button>
      </div>
    </div>
  );
};

export default BOQPriceAlertBanner;
