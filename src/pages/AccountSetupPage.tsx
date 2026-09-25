import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  HardHat,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Briefcase,
  Layers,
  Truck,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useBusinessStore } from '@/store/businessStore';
import { useSiteStore } from '@/store/siteStore';
import { AccountType, ContractorSpecialization } from '@/types';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const SPECIALIZATIONS: ContractorSpecialization[] = [
  'Residential Construction',
  'Commercial Construction',
  'Renovation',
  'Civil Works',
  'Roofing',
  'Plumbing',
  'Electrical',
  'Interior / Finishing',
  'General Contractor',
];

const AccountSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, setAccountType } = useAuthStore();
  const { updateBusinessProfile, updateContractorProfile } = useBusinessStore();
  const { addSite } = useSiteStore();

  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedType, setSelectedType] = useState<AccountType>(
    currentUser?.accountType || 'contractor'
  );
  const [name, setName] = useState(currentUser?.name || 'John Doe');
  const [email, setEmail] = useState(currentUser?.email || 'john.doe@buildright.in');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98765 43210');

  // Contractor details
  const [contractorBizName, setContractorBizName] = useState('BuildRight Constructions');
  const [specializations, setSpecializations] = useState<ContractorSpecialization[]>([
    'Residential Construction',
    'Civil Works',
  ]);
  const [experience, setExperience] = useState<number>(8);
  const [serviceArea, setServiceArea] = useState('Pune & PCMC Metropolitan Area');

  // Business details
  const [bizName, setBizName] = useState('Apex Infrastructure Pvt Ltd');
  const [bizType, setBizType] = useState('Private Limited Company');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [bizAddress, setBizAddress] = useState('5th Floor, Apex Towers, SB Road');
  const [bizCity, setBizCity] = useState('Pune');
  const [bizState, setBizState] = useState('Maharashtra');
  const [bizPincode, setBizPincode] = useState('411016');

  // Construction site details
  const [hasSite, setHasSite] = useState<boolean>(true);
  const [siteName, setSiteName] = useState('Green Villa Site (Phase 1)');
  const [siteContact, setSiteContact] = useState('Ramesh (Site Foreman)');
  const [sitePhone, setSitePhone] = useState('+91 98765 11223');
  const [siteAddress, setSiteAddress] = useState('Plot 48, Baner-Pashan Link Road');
  const [siteLandmark, setSiteLandmark] = useState('Opposite Hill View Residency');
  const [siteCity, setSiteCity] = useState('Pune');
  const [siteDistrict, setSiteDistrict] = useState('Pune');
  const [siteState, setSiteState] = useState('Maharashtra');
  const [sitePincode, setSitePincode] = useState('411045');
  const [accessRoad, setAccessRoad] = useState('12m Wide Tar Road');
  const [vehicleAccess, setVehicleAccess] = useState('10-Wheeler Tipper / Transit Mixer Accessible');
  const [unloadingInstructions, setUnloadingInstructions] = useState(
    'Unload cement inside covered shed. Stack steel near Gate 2.'
  );

  const toggleSpecialization = (spec: ContractorSpecialization) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter((s) => s !== spec));
    } else {
      setSpecializations([...specializations, spec]);
    }
  };

  const handleFinishSetup = () => {
    // 1. Update basic user profile
    updateProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      accountType: selectedType,
      companyName:
        selectedType === 'contractor'
          ? contractorBizName
          : selectedType === 'business'
          ? bizName
          : undefined,
    });
    setAccountType(selectedType);

    // 2. Update Contractor / Business profile
    if (selectedType === 'contractor') {
      updateContractorProfile({
        businessName: contractorBizName,
        specialization: specializations,
        yearsOfExperience: experience,
        serviceArea,
      });
    } else if (selectedType === 'business') {
      updateBusinessProfile({
        businessName: bizName,
        businessType: bizType,
        gstin: gstin.trim() || undefined,
        pan: pan.trim() || undefined,
        registeredAddress: bizAddress,
        city: bizCity,
        state: bizState,
        pincode: bizPincode,
        contactPerson: name,
        contactPhone: phone,
      });
    }

    // 3. Add default construction site if filled
    if (hasSite && siteName.trim()) {
      addSite({
        userId: currentUser?.id || 'usr-current',
        siteName: siteName.trim(),
        contactPerson: siteContact.trim(),
        contactPhone: sitePhone.trim(),
        address: siteAddress.trim(),
        landmark: siteLandmark.trim(),
        city: siteCity.trim(),
        district: siteDistrict.trim(),
        state: siteState.trim(),
        pincode: sitePincode.trim(),
        accessRoad,
        vehicleAccess,
        unloadingInstructions,
        isDefault: true,
      });
    }

    toast.success('Account setup completed successfully!', { icon: '🎉' });
    navigate('/account');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-16">
      <div className="container-custom max-w-3xl">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Profile & Procurement Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-black text-[#071A2B]">
            Configure Your HEPNA MART Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            Set up your procurement profile to customize pricing, site delivery preferences, and BOQ tools.
          </p>
        </div>

        {/* Multi-Step Indicator Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-8">
          <div className="flex items-center justify-between relative">
            {/* Background connection line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />

            {[
              { num: 1, label: 'Account Type' },
              { num: 2, label: 'Profile' },
              { num: 3, label: 'Business / Trade' },
              { num: 4, label: 'Delivery Site' },
              { num: 5, label: 'Complete' },
            ].map((s) => (
              <div
                key={s.num}
                className="flex flex-col items-center gap-1.5 z-10 cursor-pointer"
                onClick={() => {
                  if (s.num <= step) setStep(s.num);
                }}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                    step === s.num
                      ? 'bg-accent text-white scale-110 shadow-accent/30 ring-4 ring-orange-100'
                      : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-bold text-center hidden sm:block ${
                    step === s.num
                      ? 'text-accent'
                      : step > s.num
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-10">
          {/* STEP 1: Account Type */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-heading font-bold text-[#071A2B]">
                  Choose Your Account Type
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the profile that best matches your construction and procurement workflows.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {/* Individual */}
                <div
                  onClick={() => setSelectedType('individual')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    selectedType === 'individual'
                      ? 'border-accent bg-orange-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      selectedType === 'individual'
                        ? 'bg-accent text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-base text-slate-900">
                        Individual / Homebuilder
                      </h3>
                      {selectedType === 'individual' && (
                        <span className="w-3 h-3 rounded-full bg-accent" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Personal construction purchases, home renovations, residential extensions, and DIY tool procurement.
                    </p>
                  </div>
                </div>

                {/* Contractor */}
                <div
                  onClick={() => setSelectedType('contractor')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    selectedType === 'contractor'
                      ? 'border-accent bg-orange-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      selectedType === 'contractor'
                        ? 'bg-accent text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <HardHat className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-base text-slate-900">
                        Contractor / Builder
                      </h3>
                      {selectedType === 'contractor' && (
                        <span className="w-3 h-3 rounded-full bg-accent" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Manage multiple site projects, Bill of Quantities (BOQs), civil stage materials, and direct site logistics.
                    </p>
                  </div>
                </div>

                {/* Business */}
                <div
                  onClick={() => setSelectedType('business')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    selectedType === 'business'
                      ? 'border-accent bg-orange-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      selectedType === 'business'
                        ? 'bg-accent text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-base text-slate-900">
                        Business / Enterprise
                      </h3>
                      {selectedType === 'business' && (
                        <span className="w-3 h-3 rounded-full bg-accent" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Manage institutional company procurement, tax invoices, developer projects, and collaborative team members.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-accent/20"
                >
                  <span>Continue to Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Basic Profile */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-heading font-bold text-[#071A2B]">
                  Personal Profile Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your contact details for delivery alerts, invoices, and quotations.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!name.trim() || !email.trim()) {
                      toast.error('Please enter name and email');
                      return;
                    }
                    setStep(3);
                  }}
                  className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-accent/20"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Business / Contractor Details */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-heading font-bold text-[#071A2B]">
                  {selectedType === 'contractor'
                    ? 'Contractor & Trade Specialization'
                    : selectedType === 'business'
                    ? 'Business & Entity Details'
                    : 'Personal Building Goals'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedType === 'individual'
                    ? 'Tell us about your home building or renovation project.'
                    : 'Configure your trade preferences and optional tax identifiers.'}
                </p>
              </div>

              {selectedType === 'contractor' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Firm / Contracting Business Name
                      </label>
                      <input
                        type="text"
                        value={contractorBizName}
                        onChange={(e) => setContractorBizName(e.target.value)}
                        placeholder="e.g. BuildRight Constructions"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={experience}
                        onChange={(e) => setExperience(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Service Area / Coverage Region
                    </label>
                    <input
                      type="text"
                      value={serviceArea}
                      onChange={(e) => setServiceArea(e.target.value)}
                      placeholder="e.g. Pune Metropolitan & Pimpri-Chinchwad"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Trade Specializations
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SPECIALIZATIONS.map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => toggleSpecialization(spec)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                            specializations.includes(spec)
                              ? 'bg-accent/10 border-accent text-accent font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedType === 'business' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Registered Business Name *
                      </label>
                      <input
                        type="text"
                        value={bizName}
                        onChange={(e) => setBizName(e.target.value)}
                        placeholder="e.g. Apex Infrastructure Pvt Ltd"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Business Entity Type
                      </label>
                      <select
                        value={bizType}
                        onChange={(e) => setBizType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      >
                        <option value="Private Limited Company">Private Limited Company</option>
                        <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                        <option value="Partnership Firm">Partnership Firm</option>
                        <option value="Proprietorship">Proprietorship</option>
                        <option value="Builder / Real Estate Developer">Builder / Real Estate Developer</option>
                      </select>
                    </div>
                  </div>

                  {/* Tax identifiers note */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Tax Identifiers are Optional:</span>
                      <span className="text-blue-800 text-[11px]">
                        GSTIN and PAN verification will be available after backend API integration.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        GSTIN (Optional)
                      </label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        placeholder="27AAAAA0000A1Z5"
                        maxLength={15}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        PAN (Optional)
                      </label>
                      <input
                        type="text"
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        placeholder="AAAAA0000A"
                        maxLength={10}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Registered Address
                    </label>
                    <input
                      type="text"
                      value={bizAddress}
                      onChange={(e) => setBizAddress(e.target.value)}
                      placeholder="Street, Tower, Floor"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        value={bizCity}
                        onChange={(e) => setBizCity(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={bizState}
                        onChange={(e) => setBizState(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={bizPincode}
                        onChange={(e) => setBizPincode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedType === 'individual' && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-600">
                  <div className="font-bold text-slate-900 text-sm">
                    Direct Retail Building Supplies Access
                  </div>
                  <p>
                    As an Individual Homebuilder, you receive instant access to verified brand pricing, doorstep construction deliveries, our Smart Construction Cost Calculator, and digital quotation downloads.
                  </p>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-accent/20"
                >
                  <span>Continue to Site Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Default Construction Site */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-heading font-bold text-[#071A2B]">
                    Primary Construction Site (Optional)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Save your active delivery site for instant checkout and crane/tipper vehicle access coordination.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={hasSite}
                    onChange={(e) => setHasSite(e.target.checked)}
                    className="rounded text-accent focus:ring-accent w-4 h-4"
                  />
                  <span>Add Site Now</span>
                </label>
              </div>

              {hasSite ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Site Name / Project Reference *
                      </label>
                      <input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        placeholder="e.g. Green Villa Plot 48"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Site Contact Person & Phone
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={siteContact}
                          onChange={(e) => setSiteContact(e.target.value)}
                          placeholder="Foreman Name"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-accent"
                        />
                        <input
                          type="tel"
                          value={sitePhone}
                          onChange={(e) => setSitePhone(e.target.value)}
                          placeholder="+91 98..."
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Site Physical Address & Landmark
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={siteAddress}
                        onChange={(e) => setSiteAddress(e.target.value)}
                        placeholder="Plot / Survey No., Street"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                      <input
                        type="text"
                        value={siteLandmark}
                        onChange={(e) => setSiteLandmark(e.target.value)}
                        placeholder="Nearby Landmark"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        value={siteCity}
                        onChange={(e) => setSiteCity(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={siteState}
                        onChange={(e) => setSiteState(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={sitePincode}
                        onChange={(e) => setSitePincode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Road Access & Vehicle Type
                      </label>
                      <input
                        type="text"
                        value={vehicleAccess}
                        onChange={(e) => setVehicleAccess(e.target.value)}
                        placeholder="e.g. 10-Wheeler Tipper Accessible"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Unloading Instructions
                      </label>
                      <input
                        type="text"
                        value={unloadingInstructions}
                        onChange={(e) => setUnloadingInstructions(e.target.value)}
                        placeholder="e.g. Covered shed, crane required"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <Truck className="w-10 h-10 mx-auto text-slate-400" />
                  <div className="text-xs text-slate-600">
                    You can add construction sites later anytime from your Account Dashboard.
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-accent/20"
                >
                  <span>Review & Complete</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Complete */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-heading font-bold text-[#071A2B]">
                  Review Your Procurement Profile
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm your details below to activate your tailored HEPNA MART dashboard.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-500 font-medium">Account Category</span>
                    <h4 className="text-sm font-bold text-slate-900 capitalize">
                      {selectedType} Account
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-accent text-white font-bold text-[10px] uppercase">
                    Ready to Activate
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block">Name</span>
                    <strong className="text-slate-900">{name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email</span>
                    <strong className="text-slate-900">{email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone</span>
                    <strong className="text-slate-900">{phone}</strong>
                  </div>
                </div>

                {selectedType !== 'individual' && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block">Organization</span>
                    <strong className="text-slate-900">
                      {selectedType === 'contractor' ? contractorBizName : bizName}
                    </strong>
                  </div>
                )}

                {hasSite && siteName.trim() && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block">Default Construction Site</span>
                    <strong className="text-slate-900">
                      {siteName} — {siteCity} ({sitePincode})
                    </strong>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinishSetup}
                  className="px-7 py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-accent/30 hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Activate Profile & Launch Dashboard</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSetupPage;
