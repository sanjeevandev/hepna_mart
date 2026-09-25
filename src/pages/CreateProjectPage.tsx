import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HardHat, Building, Ruler, Layers, MapPin, Calendar, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { ProjectType, ProjectStage } from '@/types';
import Button from '@/components/ui/Button';

const PROJECT_TYPES: { type: ProjectType; description: string; icon: string }[] = [
  { type: 'House', description: 'Individual residential home or bungalow', icon: '🏠' },
  { type: 'Villa', description: 'Luxury independent villa or row house', icon: '🏡' },
  { type: 'Apartment', description: 'Multi-unit flat or highrise tower', icon: '🏢' },
  { type: 'Commercial', description: 'Office, retail showroom, or mall', icon: '🏬' },
  { type: 'Industrial', description: 'Factory, manufacturing unit, or warehouse', icon: '🏭' },
  { type: 'Renovation', description: 'Floor extension, remodel, or interior build', icon: '🔨' },
];

const PROJECT_STAGES: ProjectStage[] = [
  'Foundation',
  'Structure',
  'Masonry',
  'Plumbing & Electrical',
  'Flooring',
  'Finishing',
  'Complete Project',
];

const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { createProject } = useProjectStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('House');
  const [builtUpArea, setBuiltUpArea] = useState<string>('1500');
  const [areaUnit, setAreaUnit] = useState<'sq.ft' | 'sq.m'>('sq.ft');
  const [floors, setFloors] = useState<number>(2);
  const [stage, setStage] = useState<ProjectStage>('Foundation');
  const [city, setCity] = useState('Pune');
  const [pincode, setPincode] = useState('411045');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Project Name is required';
    const areaNum = parseFloat(builtUpArea);
    if (isNaN(areaNum) || areaNum <= 0) {
      newErrors.builtUpArea = 'Built-up area must be greater than 0';
    }
    if (!city.trim()) newErrors.city = 'City is required';
    if (pincode && !/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = 'Please enter a valid 6-digit PIN code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const projectId = createProject({
      name: name.trim(),
      type,
      builtUpArea: parseFloat(builtUpArea),
      areaUnit,
      floors: Math.max(1, floors),
      stage,
      city: city.trim(),
      pincode: pincode.trim(),
    });

    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-14">
      <div className="container-custom max-w-3xl">
        {/* Back link */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Dashboard</span>
        </Link>

        {/* Header */}
        <div className="bg-[#071A2B] text-white p-6 sm:p-8 rounded-2xl mb-8 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <HardHat className="w-32 h-32 text-accent" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent-light text-xs font-bold uppercase tracking-wider mb-3">
              <HardHat className="w-3.5 h-3.5 text-accent" />
              <span>Project Planning Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
              Create Your Construction Project
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              Configure your building specs to organize materials, track phase milestones, and automatically calculate your comprehensive Bill of Quantities (BOQ).
            </p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* Section 1: Name & Type */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-accent" />
              <span>1. Project Identity</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project / Site Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all ${
                    errors.name ? 'border-red-400' : 'border-slate-200 focus:border-accent'
                  }`}
                  placeholder="e.g. My New House / Royal Orchid Villa"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Project Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PROJECT_TYPES.map((pt) => {
                    const isSelected = type === pt.type;
                    return (
                      <button
                        key={pt.type}
                        type="button"
                        onClick={() => setType(pt.type)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-accent bg-orange-50/60 ring-2 ring-accent/30 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-lg mb-1">{pt.icon}</div>
                        <div className="text-xs font-bold text-slate-900">{pt.type}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{pt.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Area & Floor Specifications */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-accent" />
              <span>2. Dimensions & Scope</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Built-up Area *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={builtUpArea}
                    onChange={(e) => {
                      setBuiltUpArea(e.target.value);
                      if (errors.builtUpArea) setErrors((prev) => ({ ...prev, builtUpArea: '' }));
                    }}
                    className={`flex-1 px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                      errors.builtUpArea ? 'border-red-400' : 'border-slate-200 focus:border-accent'
                    }`}
                    placeholder="1500"
                  />
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as 'sq.ft' | 'sq.m')}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <option value="sq.ft">sq.ft</option>
                    <option value="sq.m">sq.m</option>
                  </select>
                </div>
                {errors.builtUpArea && (
                  <p className="text-xs text-red-500 mt-1">{errors.builtUpArea}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Floors (G + N)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={floors}
                  onChange={(e) => setFloors(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  placeholder="2"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Current Stage */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-accent" />
              <span>3. Current Project Stage</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROJECT_STAGES.map((st) => {
                const isSelected = stage === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStage(st)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      isSelected
                        ? 'border-accent bg-accent text-white shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Location */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span>4. Site Location</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / District *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                    errors.city ? 'border-red-400' : 'border-slate-200 focus:border-accent'
                  }`}
                  placeholder="e.g. Pune / Mumbai"
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site PIN Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value);
                    if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                    errors.pincode ? 'border-red-400' : 'border-slate-200 focus:border-accent'
                  }`}
                  placeholder="411045"
                />
                {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
              </div>
            </div>
          </div>

          {/* Submission Notice */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Your project will be saved locally on this device. You can customize materials, stages, and export a digital BOQ quotation at any time.
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto px-10 shadow-lg shadow-accent/20 font-bold">
              <span>Create Project & Setup BOQ</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectPage;
