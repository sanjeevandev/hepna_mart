import React from 'react';
import { PieChart, TrendingUp, Layers } from 'lucide-react';
import { EstimatedMaterialLine } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

interface CostBreakdownChartProps {
  materials: EstimatedMaterialLine[];
  subtotal: number;
}

// Visual color palette matching industrial construction theme
const BAR_COLORS = [
  'bg-accent', // Construction Orange
  'bg-[#071A2B]', // Deep Navy
  'bg-[#1B3A5C]', // Slate Blue
  'bg-emerald-600', // Forest Green
  'bg-amber-600', // Amber
  'bg-indigo-600', // Indigo
  'bg-cyan-700', // Cyan
  'bg-rose-600', // Rose
  'bg-purple-600', // Purple
  'bg-teal-600', // Teal
];

const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ materials, subtotal }) => {
  if (subtotal <= 0) return null;

  // Compute category shares
  const shares = materials
    .map((mat, idx) => {
      const percentage = Math.round((mat.currentLineTotal / subtotal) * 100);
      return {
        id: mat.id,
        name: mat.categoryName,
        cost: mat.currentLineTotal,
        percentage,
        color: BAR_COLORS[idx % BAR_COLORS.length],
      };
    })
    .sort((a, b) => b.cost - a.cost);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#071A2B] flex items-center justify-center font-bold">
            <PieChart className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-[#071A2B]">
              Material Cost Distribution
            </h3>
            <p className="text-[11px] text-slate-500">
              Category-wise budget allocation breakdown
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-accent">
          {formatPrice(subtotal)} Net
        </span>
      </div>

      {/* Multi-segment Horizontal Proportion Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {shares.map((item) => (
            <div
              key={item.id}
              className={`h-full ${item.color} transition-all duration-500`}
              style={{ width: `${Math.max(2, item.percentage)}%` }}
              title={`${item.name}: ${item.percentage}% (${formatPrice(item.cost)})`}
            />
          ))}
        </div>
      </div>

      {/* Itemized Distribution List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {shares.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-3 h-3 rounded-md ${item.color} shrink-0`} />
              <span className="font-semibold text-slate-800 truncate">{item.name}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-slate-500 font-bold">{item.percentage}%</span>
              <span className="font-black text-slate-900">{formatPrice(item.cost)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostBreakdownChart;
