import React, { useEffect, useState } from 'react';
import { Building, TrendingDown, Clock, ShieldCheck, Plus, Trash2, HardHat, FileText, CheckCircle2, Truck, PhoneCall, Mail, Calculator } from 'lucide-react';
import Button from '@/components/ui/Button';
import ScrollReveal from '@/components/ui/ScrollReveal';
import toast from 'react-hot-toast';

interface ProjectQuoteItem {
  id: number;
  material: string;
  quantity: string;
  unit: string;
}

const COMMON_UNITS = [
  'Bags (50kg)',
  'Tonnes (MT)',
  'Pieces / Nos',
  'Sq. Ft.',
  'Metres',
  'Litres (L)',
  'Bundles',
  'Truckloads (10-Wheel)',
  'Brass (CFT)',
];

const WholesalePage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [projectName, setProjectName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [projectStage, setProjectStage] = useState('Foundation & Structure');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [items, setItems] = useState<ProjectQuoteItem[]>([
    { id: 1, material: 'OPC 53 Grade Cement', quantity: '500', unit: 'Bags (50kg)' },
    { id: 2, material: 'Fe 550D TMT Rebar (12mm & 16mm)', quantity: '15', unit: 'Tonnes (MT)' },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), material: '', quantity: '', unit: 'Bags (50kg)' },
    ]);
  };

  const updateItem = (id: number, field: keyof ProjectQuoteItem, val: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      `Project Quote Request for "${projectName || companyName}" submitted! Our institutional sales engineer will contact you within 4 hours.`,
      { duration: 5000 }
    );
    setItems([{ id: 1, material: '', quantity: '', unit: 'Bags (50kg)' }]);
    setProjectName('');
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setSiteLocation('');
    setRequiredDate('');
    setAdditionalNotes('');
  };

  return (
    <div className="bg-[#F8FAFC] pb-20">
      {/* Hero Section */}
      <div className="bg-[#071A2B] text-white py-16 md:py-24 relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#E87A2D_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="container-custom relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent-light text-xs font-bold uppercase tracking-wider mb-6">
            <HardHat className="w-4 h-4 text-accent" />
            <span>Institutional & Contractor Procurement</span>
          </div>

          <ScrollReveal
            baseOpacity={0.2}
            baseRotation={2}
            blurStrength={6}
            as="h1"
            containerClassName="mb-6"
            textClassName="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white leading-tight"
          >
            Buying for a Project? Get Wholesale Rates
          </ScrollReveal>
          
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Direct mill pricing, certified test reports, GST input tax credits, and scheduled site fleet delivery for builders, general contractors, and developers.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-10 text-left">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-xl font-bold text-accent">Up to 25%</div>
              <div className="text-xs text-slate-300">Volume Discounts</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-xl font-bold text-accent">&lt; 4 Hours</div>
              <div className="text-xs text-slate-300">Fast Quote Turnaround</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-xl font-bold text-accent">100% BIS</div>
              <div className="text-xs text-slate-300">Certified Test Reports</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-xl font-bold text-accent">Credit Line</div>
              <div className="text-xs text-slate-300">30-Day Terms Available</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-12 px-4">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Request Form */}
          <div className="w-full lg:w-3/5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-[#071A2B]">
                    Request a Project Bulk Quotation
                  </h2>
                  <p className="text-xs text-slate-500">
                    Submit your Bill of Quantities (BOQ) or material breakdown
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project & Company Info */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    1. Project & Company Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Project / Site Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                        placeholder="e.g. Skyline Heights Tower A"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Company / Contractor Entity Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                        placeholder="e.g. BuildWell Infrastructure Pvt Ltd"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                        placeholder="e.g. Rajesh Patil (Procurement Head)"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Mobile (+91) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Official Business Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                        placeholder="procurement@buildwell.in"
                      />
                    </div>
                  </div>
                </div>

                {/* Material Itemization */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      2. Required Materials & Quantities
                    </h3>
                    <span className="text-xs text-accent font-semibold">
                      {items.length} item{items.length > 1 ? 's' : ''} added
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-3 items-start sm:items-end group"
                      >
                        <div className="flex-1 w-full">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            {idx === 0 ? 'Material / Specification / Brand' : `Item #${idx + 1}`}
                          </label>
                          <input
                            type="text"
                            required
                            value={item.material}
                            onChange={(e) => updateItem(item.id, 'material', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                            placeholder="e.g. UltraTech 53 Grade / Tata Tiscon 16mm"
                          />
                        </div>

                        <div className="w-full sm:w-28">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Quantity
                          </label>
                          <input
                            type="text"
                            required
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                            placeholder="e.g. 500"
                          />
                        </div>

                        <div className="w-full sm:w-44">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Unit
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                          >
                            {COMMON_UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 self-end"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-dark mt-3 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Material / Item</span>
                  </button>
                </div>

                {/* Site Logistics */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    3. Site Logistics & Delivery Timeline
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Site Location / City / Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        value={siteLocation}
                        onChange={(e) => setSiteLocation(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                        placeholder="e.g. Hinjawadi Phase 3, Pune 411057"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Required First Delivery Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={requiredDate}
                        onChange={(e) => setRequiredDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Project Stage / Scope
                      </label>
                      <select
                        value={projectStage}
                        onChange={(e) => setProjectStage(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                      >
                        <option value="Foundation & Structure">Foundation & Structure (Substructure / Columns / Slabs)</option>
                        <option value="Masonry & Brickwork">Masonry & Brickwork (AAC Blocks / Red Bricks / Mortar)</option>
                        <option value="Plumbing & Electrical Rough-in">Plumbing & Electrical Rough-in</option>
                        <option value="Flooring, Plaster & Painting">Flooring, Plaster & Painting</option>
                        <option value="Complete Turnkey Supply (Full Schedule)">Complete Turnkey Supply (Full Schedule)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Additional Specifications / Notes / Delivery Constraints
                      </label>
                      <textarea
                        rows={3}
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-none"
                        placeholder="Specify target brand preference, unloading crane needs, phased delivery schedule, or credit terms required..."
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full py-4 text-base font-bold shadow-lg shadow-accent/20">
                  Submit Project Quote Request
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column: Institutional Advantages & Pricing Benchmarks */}
          <div className="w-full lg:w-2/5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7">
              <h3 className="font-heading font-bold text-lg text-[#071A2B] mb-4">
                Why Builders Choose HEPNA MART
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Direct Mill Wholesale Pricing</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Eliminate middleman margins with manufacturer direct dispatch for cement, steel, and AAC blocks.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Dedicated Fleet Logistics</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      GPS-tracked heavy tippers and trailer trucks with confirmed time-slot delivery directly to your pouring site.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">100% Tax Compliant & BIS Certified</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Instant GST invoices for 100% input tax credit claiming, accompanied by factory Mill Test Certificates (MTC).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Contractor Credit Accounts</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Approved GST registered builders enjoy 15 to 30 days credit facilities with revolving project limits.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Volume Discount Tiers */}
            <div className="bg-[#071A2B] text-white rounded-2xl p-6 sm:p-7 border border-white/10 shadow-lg">
              <h4 className="font-heading font-bold text-base text-white mb-3 flex items-center gap-2">
                <span>Indicative Tiered Bulk Savings</span>
              </h4>
              <div className="space-y-3 divide-y divide-white/10 text-xs">
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-300">Cement (500+ Bags)</span>
                  <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">Save up to 14%</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-300">TMT Steel (10+ Tonnes)</span>
                  <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">Save up to ₹3,500/MT</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-300">AAC Blocks (2+ Truckloads)</span>
                  <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">Save up to 18%</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-slate-300">Paints & Waterproofing (300L+)</span>
                  <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">Save up to 22%</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Direct Contractor Desk:</span>
                <a href="tel:+919876543210" className="text-accent font-bold hover:underline">
                  +91 (020) 2450-HEPNA
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WholesalePage;
