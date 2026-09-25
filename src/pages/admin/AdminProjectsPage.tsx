import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, FileText, ArrowRight, ExternalLink } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';

const AdminProjectsPage: React.FC = () => {
  const { projects } = useProjectStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-black text-slate-900">
          Client Construction Projects
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Oversight of active building sites, stage progression, and scheduled material requirements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                  {proj.type} • {proj.stage}
                </span>
                <span className="text-[11px] font-bold text-accent">
                  {proj.materials.length} Materials
                </span>
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900">{proj.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {proj.builtUpArea} {proj.areaUnit} • {proj.floors} Floors • {proj.city} (PIN: {proj.pincode})
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Ref: {proj.id}</span>
              <Link to={`/projects/${proj.id}/boq`}>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-[#071A2B] hover:bg-[#0B2742] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>Inspect BOQ</span>
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProjectsPage;
