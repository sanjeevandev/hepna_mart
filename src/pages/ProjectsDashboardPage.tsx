import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HardHat, Plus, Building, Layers, Trash2, ArrowRight, FileText, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { products } from '@/data/products';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';

const TOTAL_STAGES = 6;

const ProjectsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, deleteProject } = useProjectStore();
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

  // Helper to calculate estimated total from products.ts
  const getProjectEstimatedTotal = (materialItems: typeof projects[0]['materials']) => {
    return materialItems.reduce((acc, item) => {
      const prod = products.find((p) => p.id === item.productId);
      const price = prod?.price || 0;
      return acc + price * item.quantity;
    }, 0);
  };

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="container-custom">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-accent text-xs font-bold uppercase tracking-wider mb-2">
              <HardHat className="w-3.5 h-3.5" />
              <span>Project Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#071A2B]">
              My Construction Projects
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Plan requirements, manage stage milestones, and generate itemized Bill of Quantities (BOQs).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/calculator">
              <Button variant="outline" size="md">
                <span>Cost Calculator</span>
              </Button>
            </Link>

            <Link to="/projects/new">
              <Button variant="primary" size="md" className="shadow-md shadow-accent/20 flex items-center gap-1.5 font-bold">
                <Plus className="w-4 h-4" />
                <span>Create New Project</span>
              </Button>
            </Link>
          </div>
        </div>

        {projects.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-16 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-accent mx-auto flex items-center justify-center mb-4">
              <HardHat className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No projects created yet</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              Create your first project to calculate construction material quantities, track foundation to finishing stages, and order directly to your site.
            </p>
            <Link to="/projects/new">
              <Button variant="primary" size="lg" className="px-8 font-bold">
                Start Your First Project
              </Button>
            </Link>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const estValue = getProjectEstimatedTotal(project.materials);
              const progressPct = Math.round(
                (project.completedStages.length / TOTAL_STAGES) * 100
              );

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#071A2B] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                          {project.type === 'House' && '🏠'}
                          {project.type === 'Villa' && '🏡'}
                          {project.type === 'Apartment' && '🏢'}
                          {project.type === 'Commercial' && '🏬'}
                          {project.type === 'Industrial' && '🏭'}
                          {project.type === 'Renovation' && '🔨'}
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-accent transition-colors line-clamp-1">
                            {project.name}
                          </h3>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {project.type} • {project.city}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setProjectToDelete({ id: project.id, name: project.name })}
                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Project"
                        aria-label={`Delete ${project.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Specs Pills */}
                    <div className="flex flex-wrap gap-2 mb-4 text-[11px]">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                        📏 {project.builtUpArea} {project.areaUnit}
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                        🏢 {project.floors} Floor{project.floors > 1 ? 's' : ''}
                      </span>
                      <span className="bg-amber-50 text-amber-800 border border-amber-200/50 px-2.5 py-1 rounded-md font-semibold">
                        📍 {project.stage}
                      </span>
                    </div>

                    {/* Stage Progress Bar */}
                    <div className="space-y-1.5 mb-5">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>Milestone Progress</span>
                        <span className="text-accent font-bold">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-accent h-full transition-all duration-500 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {project.completedStages.length} of {TOTAL_STAGES} stages completed
                      </div>
                    </div>

                    {/* Summary Row */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-5">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">
                          BOQ Materials
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {project.materials.length} Items Listed
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">
                          Estimated Budget
                        </span>
                        <span className="font-extrabold text-accent">
                          {formatPrice(estValue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <Link
                      to={`/projects/${project.id}/boq`}
                      className="py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-accent" />
                      <span>View BOQ</span>
                    </Link>

                    <Link
                      to={`/projects/${project.id}`}
                      className="py-2 px-3 rounded-xl bg-[#071A2B] hover:bg-[#0B2742] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>Open Project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {projectToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-base text-slate-900">
                  Delete &ldquo;{projectToDelete.name}&rdquo;?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This will remove the project and its BOQ from this device. Your general cart and wishlist items will not be affected.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsDashboardPage;
