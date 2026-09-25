import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, FolderPlus, Building, Check, HardHat, Plus } from 'lucide-react';
import { Product } from '@/types';
import { useProjectStore } from '@/store/projectStore';
import { formatPrice } from '@/utils/formatPrice';

interface AddToProjectModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const AddToProjectModal: React.FC<AddToProjectModalProps> = ({ product, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { projects, activeProjectId, addMaterialToProject, setActiveProjectId } = useProjectStore();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProjectId || projects[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>(product?.unit || 'Bag');
  const [stage, setStage] = useState<string>('Foundation');

  if (!isOpen || !product) return null;

  const handleAdd = () => {
    if (!selectedProjectId) return;
    const success = addMaterialToProject(selectedProjectId, product.id, quantity, unit, stage);
    if (success) {
      setActiveProjectId(selectedProjectId);
      onClose();
    }
  };

  const handleCreateNewProject = () => {
    onClose();
    navigate('/projects/new');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-[#071A2B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-white">
                Add to Project BOQ
              </h3>
              <p className="text-[11px] text-white/70 truncate max-w-[240px]">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Product Mini Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <img
              src={product.images?.[0] || 'https://placehold.co/100?text=HEPNA'}
              alt={product.name}
              className="w-12 h-12 rounded-lg object-cover bg-white shrink-0 border border-gray-100"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-gray-900 truncate">{product.name}</h4>
              <div className="text-xs text-accent font-bold">
                {formatPrice(product.price)}{' '}
                <span className="text-gray-400 font-normal">/ {product.unit}</span>
              </div>
            </div>
          </div>

          {projects.length === 0 ? (
            /* No projects yet state */
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-accent mx-auto flex items-center justify-center">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">You don't have a project yet</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Create a project to organize materials, track stages, and generate instant BOQ cost estimates.
              </p>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewProject}
                  className="flex-1 py-2 px-4 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold transition-colors shadow-sm"
                >
                  Create Project
                </button>
              </div>
            </div>
          ) : (
            /* Projects selector */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Select Target Project
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {projects.map((p) => {
                    const isSelected = selectedProjectId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-accent bg-orange-50/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Building className={`w-4 h-4 shrink-0 ${isSelected ? 'text-accent' : 'text-gray-400'}`} />
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate text-xs">{p.name}</div>
                            <div className="text-[10px] text-gray-500">
                              {p.type} • {p.builtUpArea} {p.areaUnit} ({p.city})
                            </div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-accent bg-accent text-white' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Initial Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
                    placeholder="e.g. Bag, Tonne, Piece"
                  />
                </div>
              </div>

              {/* Stage Mapping */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assign to Construction Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="Foundation">Foundation</option>
                  <option value="Structure">Structure</option>
                  <option value="Masonry">Masonry</option>
                  <option value="Plumbing & Electrical">Plumbing & Electrical</option>
                  <option value="Flooring">Flooring</option>
                  <option value="Finishing">Finishing</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!selectedProjectId}
                  className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm transition-colors shadow-md shadow-accent/20 disabled:opacity-50"
                >
                  Confirm Add to Project BOQ
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewProject}
                  className="text-center text-xs text-gray-500 hover:text-accent font-semibold py-1 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Another Project</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToProjectModal;
