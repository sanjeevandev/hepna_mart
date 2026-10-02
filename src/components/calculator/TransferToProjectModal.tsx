import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, HardHat, Building, Check, ArrowRight, User, ShieldAlert } from 'lucide-react';
import { ConstructionEstimate } from '@/types';
import { useProjectStore } from '@/store/projectStore';
import { useEstimateStore } from '@/store/estimateStore';
import { useBusinessStore } from '@/store/businessStore';
import Button from '@/components/ui/Button';

interface TransferToProjectModalProps {
  estimate: ConstructionEstimate;
  isOpen: boolean;
  onClose: () => void;
}

const TransferToProjectModal: React.FC<TransferToProjectModalProps> = ({
  estimate,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { projects, createProject } = useProjectStore();
  const { addEstimateToProjectBOQ } = useEstimateStore();
  const { organizations, fetchOrganizations } = useBusinessStore();

  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen, fetchOrganizations]);

  // Find first writable project
  const writableProjects = projects.filter((p) => {
    const role = p.currentUserRole || p.current_user_role;
    const isPersonal = !p.organization_id && !p.organizationId;
    return isPersonal || (role && !['VIEWER', 'SITE_SUPERVISOR'].includes(role));
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    estimate.inputs.projectId || writableProjects[0]?.id || projects[0]?.id || ''
  );
  const [isCreatingNew, setIsCreatingNew] = useState(projects.length === 0);
  const [newProjectName, setNewProjectName] = useState(
    estimate.inputs.projectName || `${estimate.inputs.projectType} Construction`
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  if (!isOpen) return null;

  const handleTransfer = () => {
    let targetId = selectedProjectId;

    if (isCreatingNew || !targetId) {
      if (!newProjectName.trim()) return;
      targetId = createProject({
        name: newProjectName.trim(),
        organizationId: selectedOrgId || null,
        organization_id: selectedOrgId || null,
        type: estimate.inputs.projectType,
        builtUpArea: estimate.inputs.builtUpArea,
        areaUnit: estimate.inputs.areaUnit,
        floors: estimate.inputs.floors,
        stage: 'Foundation',
        city: estimate.inputs.city || 'Pune',
        pincode: '411045',
      });
    }

    const success = addEstimateToProjectBOQ(estimate.id, targetId);
    if (success) {
      onClose();
      navigate(`/projects/${targetId}/boq`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white max-w-lg w-full rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-accent flex items-center justify-center font-bold border border-orange-200/60">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[#071A2B]">
                Transfer Estimate to Project BOQ
              </h3>
              <p className="text-xs text-slate-500">
                Populate Bill of Quantities with {estimate.materials.length} material items
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        {projects.length > 0 && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                !isCreatingNew
                  ? 'bg-white text-[#071A2B] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Existing Project
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                isCreatingNew
                  ? 'bg-white text-[#071A2B] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Create New Project
            </button>
          </div>
        )}

        {/* Existing Project Selector */}
        {!isCreatingNew && projects.length > 0 ? (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Select Target Project:
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {projects.map((p) => {
                const isSelected = selectedProjectId === p.id;
                const isPersonal = !p.organization_id && !p.organizationId;
                const role = p.currentUserRole || p.current_user_role;
                const isReadOnly = !isPersonal && (role === 'VIEWER' || role === 'SITE_SUPERVISOR');

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (!isReadOnly) setSelectedProjectId(p.id);
                    }}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isReadOnly
                        ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-accent bg-orange-50/70 ring-2 ring-accent/20 cursor-pointer'
                        : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {p.name}
                        </span>
                        {isPersonal ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            <User className="w-2.5 h-2.5" />
                            Personal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                            <Building className="w-2.5 h-2.5" />
                            {p.organization_name || 'Organization'}
                          </span>
                        )}
                        {role && !isPersonal && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {role.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1">
                        {p.type} • {p.builtUpArea} {p.areaUnit} • {p.materials.length} existing BOQ items
                      </div>

                      {isReadOnly && (
                        <div className="text-[10px] text-amber-700 flex items-center gap-1 mt-1 font-semibold">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Requires PM, Procurement, or Admin role to modify BOQ</span>
                        </div>
                      )}
                    </div>

                    {!isReadOnly && isSelected && (
                      <Check className="w-4 h-4 text-accent stroke-[3] shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Create New Project Form */
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Project Name *
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Green Villa Construction, Patil Residency..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {organizations.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workspace Scope
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="">Personal Workspace (Private)</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div>
                Type: <strong>{estimate.inputs.projectType}</strong>
              </div>
              <div>
                Built-up: <strong>{estimate.inputs.builtUpArea} {estimate.inputs.areaUnit} ({estimate.inputs.floors} Floors)</strong>
              </div>
              <div>
                City: <strong>{estimate.inputs.city || 'Pune'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={handleTransfer}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Transfer to BOQ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransferToProjectModal;
