import React from 'react';
import {
  Building2,
  Layers,
  Sparkles,
  MapPin,
  Ruler,
  HardHat,
  Home,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  CalculatorProjectInputs,
  ProjectType,
  ConstructionQuality,
} from '@/types';
import { useProjectStore } from '@/store/projectStore';

interface ProjectInputsFormProps {
  inputs: CalculatorProjectInputs;
  onChange: (inputs: CalculatorProjectInputs) => void;
  onReset?: () => void;
}

const PROJECT_TYPES: { type: ProjectType; label: string; desc: string }[] = [
  { type: 'House', label: 'Independent House', desc: 'Standard G+1/G+2 RCC structure' },
  { type: 'Villa', label: 'Luxury Villa', desc: 'Custom architectural layouts & finishes' },
  { type: 'Apartment', label: 'Apartment / Flat', desc: 'Multi-unit residential structure' },
  { type: 'Commercial', label: 'Commercial Building', desc: 'Offices, shops & retail complexes' },
  { type: 'Industrial', label: 'Industrial / Shed', desc: 'Heavy load warehouses & factories' },
  { type: 'Renovation', label: 'Home Renovation', desc: 'Plaster, flooring, tile & paint overhaul' },
];

const QUALITIES: {
  quality: ConstructionQuality;
  label: string;
  badge: string;
  desc: string;
  highlight: string;
}[] = [
  {
    quality: 'economy',
    label: 'Economy Budget',
    badge: 'Budget-Friendly',
    desc: 'Cost-effective structural components like Fly Ash bricks, PPC cement, ceramic flooring.',
    highlight: 'Optimized for rental properties and strict budgets.',
  },
  {
    quality: 'standard',
    label: 'Standard Builder Quality',
    badge: 'Recommended',
    desc: 'OPC 53 grade cement, high-precision AAC blocks, vitrified tile flooring, CPVC plumbing.',
    highlight: 'Ideal for long-lasting family homes and villas.',
  },
  {
    quality: 'premium',
    label: 'Premium Architecture',
    badge: 'High Performance',
    desc: 'UltraTech structural cement, imported vitrified tiles, heavy gauge CPVC, premium weatherproof coating.',
    highlight: 'Engineered for luxury finishes and maximum durability.',
  },
];

const ProjectInputsForm: React.FC<ProjectInputsFormProps> = ({
  inputs,
  onChange,
  onReset,
}) => {
  const { projects } = useProjectStore();

  const handleFieldChange = <K extends keyof CalculatorProjectInputs>(
    field: K,
    value: CalculatorProjectInputs[K]
  ) => {
    onChange({
      ...inputs,
      [field]: value,
    });
  };

  const handleLinkProject = (projectId: string) => {
    if (!projectId) {
      onChange({
        ...inputs,
        projectId: undefined,
        projectName: undefined,
      });
      return;
    }

    const selected = projects.find((p) => p.id === projectId);
    if (selected) {
      onChange({
        ...inputs,
        projectId: selected.id,
        projectName: selected.name,
        projectType: selected.type || inputs.projectType,
        builtUpArea: selected.builtUpArea || inputs.builtUpArea,
        areaUnit: selected.areaUnit || inputs.areaUnit,
        floors: selected.floors || inputs.floors,
        city: selected.city || inputs.city,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-accent flex items-center justify-center font-bold text-xs border border-orange-200/60">
              1
            </div>
            <h2 className="font-heading font-bold text-lg sm:text-xl text-[#071A2B]">
              Project Specifications
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure built-up area, floors, and target construction quality
          </p>
        </div>

        {/* Optional Linked Project Selector */}
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Autofill from:
            </span>
            <select
              value={inputs.projectId || ''}
              onChange={(e) => handleLinkProject(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="">-- Custom Inputs --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.builtUpArea} {p.areaUnit})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Project Type Grid */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Structure / Project Type *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {PROJECT_TYPES.map((pt) => {
            const isSelected = inputs.projectType === pt.type;
            return (
              <button
                key={pt.type}
                type="button"
                onClick={() => handleFieldChange('projectType', pt.type)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-accent bg-orange-50/70 ring-2 ring-accent/20 text-[#071A2B]'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs sm:text-sm">{pt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-accent stroke-[3]" />}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{pt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Built-up Area & Unit & Floors */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        {/* Built-up Area Input */}
        <div className="sm:col-span-5 space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Total Built-up Area *
          </label>
          <div className="relative">
            <input
              type="number"
              min={100}
              max={50000}
              step={50}
              value={inputs.builtUpArea || ''}
              onChange={(e) =>
                handleFieldChange('builtUpArea', Math.max(0, Number(e.target.value)))
              }
              placeholder="e.g. 1500"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
            />
            <Ruler className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <span className="text-[10px] text-slate-400">
            Single floor footprint or total built carpet area
          </span>
        </div>

        {/* Area Unit */}
        <div className="sm:col-span-3 space-y-1">
          <label className="block text-xs font-semibold text-slate-700">Area Unit</label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleFieldChange('areaUnit', 'sq.ft')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                inputs.areaUnit === 'sq.ft'
                  ? 'bg-white text-[#071A2B] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              sq.ft
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange('areaUnit', 'sq.m')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                inputs.areaUnit === 'sq.m'
                  ? 'bg-white text-[#071A2B] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              sq.m
            </button>
          </div>
        </div>

        {/* Number of Floors */}
        <div className="sm:col-span-4 space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Number of Floors (G+N)
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((f) => {
              const isSelected = inputs.floors === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFieldChange('floors', f)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'border-accent bg-accent text-white shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  {f === 4 ? '4+' : `${f} Flr`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Construction Quality Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Construction Quality Benchmark *
          </label>
          <span className="text-[11px] text-slate-400">
            Determines mapped catalog product grades & finishes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {QUALITIES.map((q) => {
            const isSelected = inputs.quality === q.quality;
            return (
              <button
                key={q.quality}
                type="button"
                onClick={() => handleFieldChange('quality', q.quality)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-accent bg-orange-50/60 ring-2 ring-accent/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-[#071A2B]">{q.label}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-accent text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {q.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {q.desc}
                  </p>
                </div>

                <div className="text-[11px] font-medium text-slate-500 pt-2 border-t border-slate-100">
                  {q.highlight}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Location / City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Project Job-Site City / Region
          </label>
          <div className="relative">
            <input
              type="text"
              value={inputs.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="e.g. Pune, Mumbai, Coimbatore, Bengaluru..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <span className="text-[10px] text-slate-400">
            Provides geographic context for your saved estimate
          </span>
        </div>

        {/* Project Name / Label */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Estimate / Project Title
          </label>
          <div className="relative">
            <input
              type="text"
              value={inputs.projectName || ''}
              onChange={(e) => handleFieldChange('projectName', e.target.value)}
              placeholder="e.g. My New House, Green Villa Project..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            <Home className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <span className="text-[10px] text-slate-400">
            Name your estimate to find it in &ldquo;My Estimates&rdquo;
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectInputsForm;
