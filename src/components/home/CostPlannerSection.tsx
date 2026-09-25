import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  HardHat,
  ArrowRight,
  Sparkles,
  PieChart,
  Boxes,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionReveal from '@/components/ui/SectionReveal';

const CostPlannerSection: React.FC = () => {
  return (
    <section className="relative bg-[#071A2B] text-white py-16 sm:py-20 overflow-hidden border-t border-b border-white/10">
      {/* Blueprint Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Decorative Glow */}
      <div className="absolute -top-24 right-10 w-80 h-80 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-accent-light text-xs font-bold uppercase tracking-widest">
              <Calculator className="w-3.5 h-3.5 text-accent" />
              <span>BUILD WITH A PLAN</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white tracking-tight leading-tight">
              Know What You Need <br className="hidden sm:block" />
              <span className="text-accent">Before You Build.</span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Estimate materials, understand your budget, build your Bill of Quantities (BOQ), and move directly to procurement with current live catalog prices.
            </p>

            {/* Feature Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Indicative cement, steel & block estimates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Live catalog rates & price snapshots</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1-Click transfer to Project BOQ</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Printable cost planning reports</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-4">
              <Link to="/calculator">
                <Button
                  variant="primary"
                  size="lg"
                  className="shadow-xl shadow-accent/25 flex items-center gap-2 font-bold"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Calculate Construction Cost</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link to="/projects/new">
                <Button variant="outline-white" size="lg" className="font-bold">
                  <HardHat className="w-4 h-4 mr-1.5 text-accent" />
                  <span>Build a Project</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Interactive Blueprint Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-7 border border-white/15 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center font-bold text-xs">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-white">
                      Sample Villa Budget Matrix
                    </h3>
                    <p className="text-[10px] text-slate-400">1,800 sq.ft • 2 Floors • Standard</p>
                  </div>
                </div>
                <span className="text-xs font-black text-accent">₹16,42,800</span>
              </div>

              {/* Sample Mini Breakdown Bar */}
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="w-[32%] bg-accent h-full" title="Cement (32%)" />
                  <div className="w-[26%] bg-blue-500 h-full" title="Steel (26%)" />
                  <div className="w-[18%] bg-emerald-500 h-full" title="Blocks (18%)" />
                  <div className="w-[14%] bg-amber-500 h-full" title="Flooring (14%)" />
                  <div className="w-[10%] bg-purple-500 h-full" title="Other (10%)" />
                </div>
              </div>

              {/* Sample Items List */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-white/5 text-slate-300">
                  <span>UltraTech OPC 53 Cement (720 Bags)</span>
                  <strong className="text-white">₹2,80,800</strong>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white/5 text-slate-300">
                  <span>High-Precision AAC Blocks (2,160 Pcs)</span>
                  <strong className="text-white">₹1,40,400</strong>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white/5 text-slate-300">
                  <span>Vitrified Floor Tiles (81 Boxes)</span>
                  <strong className="text-white">₹68,850</strong>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/calculator?type=Villa&area=1800&floors=2"
                  className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Customize this Blueprint Estimate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CostPlannerSection;
