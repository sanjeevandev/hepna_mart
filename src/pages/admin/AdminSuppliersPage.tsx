import React from 'react';
import { Truck, Building, Info, ShieldCheck } from 'lucide-react';

const SUPPLIERS_DEMO = [
  {
    name: 'UltraTech Cement Ltd',
    category: 'Cement & Concrete',
    leadTime: '24-48 Hours',
    rating: 4.8,
    status: 'Verified Direct Mill',
  },
  {
    name: 'Tata Steel (Tiscon)',
    category: 'Structural Steel & TMT',
    leadTime: '48 Hours',
    rating: 4.9,
    status: 'Verified Primary Producer',
  },
  {
    name: 'Finolex Industries',
    category: 'Plumbing & Pipes',
    leadTime: '24 Hours',
    rating: 4.7,
    status: 'Authorized Distributor',
  },
  {
    name: 'Kajaria Ceramics',
    category: 'Tiles & Flooring',
    leadTime: '3-4 Days',
    rating: 4.6,
    status: 'Direct Mill Partner',
  },
];

const AdminSuppliersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-black text-slate-900">
          Suppliers & Mill Network
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manufacturer partnerships, primary mill dispatch points, and logistics lead times
        </p>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Phase 2 Integration Architecture:</span>
          <span className="text-blue-800">
            Real-time EDI supplier dispatch links and automated inventory replenishment will be connected during Phase 2 backend deployment.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SUPPLIERS_DEMO.map((s) => (
          <div
            key={s.name}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                  {s.category}
                </span>
                <h3 className="font-heading font-bold text-base text-slate-900 mt-0.5">
                  {s.name}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {s.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Logistics Lead Time: <strong className="text-slate-800">{s.leadTime}</strong></span>
              <span>Reliability Score: <strong className="text-emerald-700">{s.rating}/5.0</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSuppliersPage;
