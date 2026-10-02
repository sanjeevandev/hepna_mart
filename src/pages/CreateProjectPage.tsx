import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HardHat, Building, Ruler, Layers, MapPin, Calendar, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, Info, Users } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useBusinessStore } from '@/store/businessStore';
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
  const { organizations, fetchOrganizations } = useBusinessStore();

  const [name, setName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [type, setType] = useState<ProjectType>('House');
  const [builtUpArea, setBuiltUpArea] = useState<string>('1500');
  const [areaUnit, setAreaUnit] = useState<'sq.ft' | 'sq.m'>('sq.ft');
  const [floors, setFloors] = useState<number>(2);
  const [stage, setStage] = useState<ProjectStage>('Foundation');
  const [city, setCity] = useState('Pune');
  const [pincode, setPincode] = useState('411045');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

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
      organizationId: selectedOrgId || null,
      organization_id: selectedOrgId || null,
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
              Create Construction Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              Configure building specifications to organize materials, track milestones, and collaborate with your team in a shared Bill of Quantities (BOQ).
            </p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* Section 1: Workspace Ownership & Identity */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-accent" />
              <span>1. Workspace & Ownership</span>
            </h2>

            <div className="space-y-4">
              {/* Organization Selector */}
              {organizations.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Workspace Scope
                  </label>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent font-medium text-slate-800"
                  >
                    <option value="">👤 Personal Project (Private to you)</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        🏢 {org.name} ({org.business_type})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {selectedOrgId
                      ? 'Team members in this organization can be assigned as project collaborators.'
                      : 'Personal projects are visible only to your account.'}
                  </p>
                </div>
              )}

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
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xl mb-1.5">{pt.icon}</div>
                        <div className="font-bold text-xs text-slate-900">{pt.type}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {pt.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Building Specs */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-accent" />
              <span>2. Dimensions & Structure</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Built-Up Area *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={builtUpArea}
                    onChange={(e) => {
                      setBuiltUpArea(e.target.value);
                      if (errors.builtUpArea) setErrors((prev) => ({ ...prev, builtUpArea: '' }));
                    }}
                    className={`flex-1 px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all ${
                      errors.builtUpArea ? 'border-red-400' : 'border-slate-200 focus:border-accent'
                    }`}
                    placeholder="1500"
                    min="50"
                  />
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as any)}
                    className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="sq.ft">Sq. Ft.</option>
                    <option value="sq.m">Sq. Mtr.</option>
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
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => setFloors(fl)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        floors === fl
                          ? 'bg-[#071A2B] text-white border-[#071A2B] shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {fl} {fl === 1 ? 'Floor' : 'Floors'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Location & Milestone Stage */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span>3. Location & Milestone Stage</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site City / District *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all ${
                    errors.city ? 'border-red-400' : 'border-slate-200 focus:border-accent'
                  }`}
                  placeholder="Pune, Maharashtra"
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site PIN Code
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value);
                    if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all ${
                    errors.pincode ? 'border-red-400' : 'border-slate-200 focus:border-accent'
                  }`}
                  placeholder="411045"
                  maxLength={6}
                />
                {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Construction Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ProjectStage)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent font-medium text-slate-800"
              >
                {PROJECT_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link to="/projects">
              <Button variant="outline" size="md">
                Cancel
              </Button>
            </Link>

            <Button variant="primary" size="md" className="shadow-md shadow-accent/20 flex items-center gap-1.5 font-bold">
              <span>Save & Launch Project BOQ</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectPage;
