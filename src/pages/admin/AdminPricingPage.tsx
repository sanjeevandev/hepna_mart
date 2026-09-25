import React from 'react';
import { DollarSign, Percent, TrendingUp, ShieldCheck } from 'lucide-react';

const AdminPricingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-black text-slate-900">
          Pricing Tiers & Tax Schedules
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Wholesale volume discount tiers, GST rates, and contractor credit margins
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500">Retail Markup Margin</span>
          <div className="text-2xl font-black text-slate-900">8.5% - 12.0%</div>
          <span className="text-[11px] text-slate-400 block">Applied on direct mill base cost</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500">Wholesale Bulk Discount</span>
          <div className="text-2xl font-black text-emerald-700">10% - 18% Off</div>
          <span className="text-[11px] text-slate-400 block">Triggered on minimum container/truck quantities</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500">Standard GST Tax Rate</span>
          <div className="text-2xl font-black text-purple-700">18.0% GST</div>
          <span className="text-[11px] text-slate-400 block">Full Input Tax Credit (ITC) eligible</span>
        </div>
      </div>
    </div>
  );
};

export default AdminPricingPage;
