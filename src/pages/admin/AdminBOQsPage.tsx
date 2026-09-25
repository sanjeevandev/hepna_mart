import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, FileText, ArrowRight, Eye } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { products } from '@/data/products';
import { formatPrice } from '@/utils/formatPrice';

const AdminBOQsPage: React.FC = () => {
  const { projects } = useProjectStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-black text-slate-900">
          Bill of Quantities (BOQ) Schedules
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Central procurement matrices and material demand schedules across client projects
        </p>
      </div>

      <div className="space-y-4">
        {projects.map((proj) => {
          const totalValuation = proj.materials.reduce((acc, m) => {
            const p = products.find((prod) => prod.id === m.productId);
            return acc + (p?.price || 0) * (m.quantity + Math.round(m.quantity * ((m.wastagePercent || 0) / 100)));
          }, 0);

          return (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-slate-900">{proj.name}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                    {proj.stage}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {proj.materials.length} scheduled material line items • Location: {proj.city}
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-sm font-black text-slate-900">{formatPrice(totalValuation)}</div>
                  <span className="text-[10px] text-slate-400">Scheduled Budget</span>
                </div>

                <Link to={`/projects/${proj.id}/boq`}>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View BOQ</span>
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminBOQsPage;
