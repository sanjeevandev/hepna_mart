import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { HardHat, Building, Ruler, CheckCircle2, Circle, FileText, Plus, Trash2, ArrowRight, ArrowLeft, ShoppingCart, Truck, ShieldCheck, Sparkles, AlertCircle, Calculator } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { products } from '@/data/products';
import { categories } from '@/data/categories';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const STAGES = [
  'Foundation',
  'Structure',
  'Masonry',
  'Plumbing & Electrical',
  'Flooring',
  'Finishing',
];

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getProject, toggleStageComplete, removeMaterialFromProject } = useProjectStore();

  const project = projectId ? getProject(projectId) : undefined;

  if (!project) {
    return (
      <div className="container-custom py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">The project you are looking for does not exist on this device.</p>
        <Link to="/projects">
          <Button variant="primary" size="md">Return to Projects Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Calculate project financial metrics
  const totalMaterialValue = project.materials.reduce((acc, m) => {
    const prod = products.find((p) => p.id === m.productId);
    return acc + (prod?.price || 0) * m.quantity;
  }, 0);

  const progressPct = Math.round(
    (project.completedStages.length / STAGES.length) * 100
  );

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 sm:py-12">
      <div className="container-custom">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Projects</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to={`/calculator?projectId=${project.id}`}>
              <button
                type="button"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Calculator className="w-4 h-4 text-accent" />
                <span>Calculate Cost</span>
              </button>
            </Link>

            <Link to={`/projects/${project.id}/boq`}>
              <button
                type="button"
                className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Open BOQ Matrix</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Project Header Hero Card */}
        <div className="bg-[#071A2B] text-white p-6 sm:p-8 rounded-2xl mb-8 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent-light text-xs font-bold uppercase tracking-wider mb-2">
                <span>{project.type} Construction</span>
                <span>•</span>
                <span>{project.city}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-heading font-black text-white">
                {project.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-3">
                <span>📏 {project.builtUpArea} {project.areaUnit}</span>
                <span>•</span>
                <span>🏢 {project.floors} Floor{project.floors > 1 ? 's' : ''}</span>
                <span>•</span>
                <span>📍 Active Stage: {project.stage}</span>
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm text-center">
              <div>
                <div className="text-xs text-slate-400 font-medium">BOQ Items</div>
                <div className="text-lg sm:text-xl font-bold text-white">{project.materials.length}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Est. Value</div>
                <div className="text-lg sm:text-xl font-bold text-accent">{formatPrice(totalMaterialValue)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Milestone</div>
                <div className="text-lg sm:text-xl font-bold text-emerald-400">{progressPct}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Milestone Stage Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                Construction Stage Progress
              </h2>
              <p className="text-xs text-slate-500">
                Click a stage to mark it as completed or in-progress
              </p>
            </div>
            <span className="text-xs font-bold text-accent bg-orange-50 px-3 py-1 rounded-full border border-orange-200/60">
              {project.completedStages.length} of {STAGES.length} Completed
            </span>
          </div>

          {/* Visual Progress Bar (Desktop & Mobile) */}
          <div className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {STAGES.map((st, idx) => {
                const isCompleted = project.completedStages.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleStageComplete(project.id, st)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isCompleted
                        ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 shadow-sm'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Stage 0{idx + 1}
                      </span>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                    </div>
                    <div className="font-bold text-xs sm:text-sm">{st}</div>
                    <div className="text-[10px] mt-1 font-medium text-slate-500">
                      {isCompleted ? '✓ Completed' : 'Click to complete'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout: BOQ Items & Material Category Explorers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Project Materials List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                    Project Materials in BOQ ({project.materials.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Materials actively mapped to this project
                  </p>
                </div>

                <Link
                  to={`/projects/${project.id}/boq`}
                  className="text-xs text-accent hover:underline font-bold flex items-center gap-1"
                >
                  <span>Edit Full BOQ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {project.materials.length === 0 ? (
                /* Empty Materials State */
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <HardHat className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Your project is ready!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Start adding materials from our catalog to calculate quantities and establish your project BOQ.
                  </p>
                  <Link to="/shop">
                    <Button variant="primary" size="sm" className="mt-2">
                      Browse Materials Catalog
                    </Button>
                  </Link>
                </div>
              ) : (
                /* Material Items Table/List */
                <div className="divide-y divide-slate-100">
                  {project.materials.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    if (!product) return null;
                    const lineTotal = product.price * item.quantity;

                    return (
                      <div
                        key={item.productId}
                        className="py-3.5 flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={product.images?.[0] || 'https://placehold.co/100?text=HEPNA'}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/product/${product.slug}`}
                              className="font-bold text-xs sm:text-sm text-slate-900 hover:text-accent transition-colors truncate block"
                            >
                              {product.name}
                            </Link>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-semibold text-slate-700">
                                {item.quantity} {item.unit}
                              </span>
                              <span>•</span>
                              <span>{formatPrice(product.price)} / {product.unit}</span>
                              {item.stage && (
                                <>
                                  <span>•</span>
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium text-[10px]">
                                    {item.stage}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="font-extrabold text-xs sm:text-sm text-slate-900">
                              {formatPrice(lineTotal)}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium">
                              In Stock
                            </div>
                          </div>

                          <button
                            onClick={() => removeMaterialFromProject(project.id, item.productId)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove from project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Col: Material Categories Shortcut Grid */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-heading font-bold text-base text-slate-900 mb-1">
                Explore Project Materials
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Select a category to browse supplies and add directly into this project:
              </p>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-accent/40 bg-slate-50/60 hover:bg-orange-50/50 flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-8 h-8 rounded-lg object-cover bg-white shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-accent truncate">
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {cat.productCount}+ certified supplies
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-accent shrink-0 pl-2">
                      + Add
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Direct Logistics Banner */}
            <div className="p-4 bg-[#071A2B] text-white rounded-2xl border border-white/10 shadow-sm space-y-2 text-xs">
              <div className="flex items-center gap-2 text-accent font-bold">
                <Truck className="w-4 h-4" />
                <span>Site Vehicle Dispatch Available</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                HEPNA MART coordinates scheduled vehicle drops directly at your site in {project.city}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
