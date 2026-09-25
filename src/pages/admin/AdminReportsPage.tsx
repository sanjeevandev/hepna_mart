import React from 'react';
import { BarChart3, FileSpreadsheet, Download, TrendingUp } from 'lucide-react';

const AdminReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black text-slate-900">
            Procurement Reports & Financial Audits
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Material consumption analytics, regional site deliveries, and revenue logs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-accent flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Monthly Material Consumption Matrix
              </h3>
              <p className="text-xs text-slate-500">Aggregate Cement, TMT Steel & Masonry Volumes</p>
            </div>
          </div>
          <button
            type="button"
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV (Simulated)</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Regional Fleet Logistics Performance
              </h3>
              <p className="text-xs text-slate-500">Pune & Mumbai Site Delivery Turnaround Times</p>
            </div>
          </div>
          <button
            type="button"
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
