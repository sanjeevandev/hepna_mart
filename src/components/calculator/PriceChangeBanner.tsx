import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Info } from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';

interface PriceChangeBannerProps {
  originalTotal: number;
  currentTotal: number;
  priceDifference: number;
  onRefreshPricing: () => void;
  onDismissAlert?: () => void;
  snapshotDate?: string;
}

const PriceChangeBanner: React.FC<PriceChangeBannerProps> = ({
  originalTotal,
  currentTotal,
  priceDifference,
  onRefreshPricing,
  onDismissAlert,
  snapshotDate,
}) => {
  const isIncrease = priceDifference > 0;
  const isDecrease = priceDifference < 0;

  const dateFormatted = snapshotDate
    ? new Date(snapshotDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'earlier';

  return (
    <div className="bg-amber-50 rounded-2xl border-2 border-amber-300/80 p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Notice */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300/60 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-heading font-bold text-base text-amber-950 flex items-center gap-2">
              <span>Catalog Material Prices Have Changed</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                Price Alert
              </span>
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              Material catalog rates have adjusted since this estimate was generated on {dateFormatted}.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={onRefreshPricing}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Update to Current Prices
          </Button>

          {onDismissAlert && (
            <Button variant="outline" size="sm" onClick={onDismissAlert}>
              Keep Previous Snapshot
            </Button>
          )}
        </div>
      </div>

      {/* Numerical Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="p-3 bg-white/90 rounded-xl border border-amber-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Previous Estimate ({dateFormatted})
          </span>
          <span className="text-base font-extrabold text-slate-800">
            {formatPrice(originalTotal)}
          </span>
        </div>

        <div className="p-3 bg-white/90 rounded-xl border border-amber-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Current Live Estimate
          </span>
          <span className="text-base font-extrabold text-slate-900">
            {formatPrice(currentTotal)}
          </span>
        </div>

        <div className="p-3 bg-white/90 rounded-xl border border-amber-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Estimated Variance
          </span>
          <div className="flex items-center gap-1.5">
            {isIncrease ? (
              <TrendingUp className="w-4 h-4 text-red-600" />
            ) : isDecrease ? (
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            ) : null}
            <span
              className={`text-base font-black ${
                isIncrease
                  ? 'text-red-600'
                  : isDecrease
                  ? 'text-emerald-600'
                  : 'text-slate-800'
              }`}
            >
              {isIncrease ? `+${formatPrice(priceDifference)}` : formatPrice(priceDifference)}
            </span>
          </div>
        </div>
      </div>

      {/* Snapshot Reference Disclaimer */}
      <div className="flex items-center gap-2 text-[11px] text-amber-800/90 pt-1">
        <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>
          Previous estimate prices are shown for reference. Actual cart checkout and order placement strictly use current live catalog prices.
        </span>
      </div>
    </div>
  );
};

export default PriceChangeBanner;
