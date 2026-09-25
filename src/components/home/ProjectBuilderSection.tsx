import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, FileText, CheckCircle2, ArrowRight, Layers, Calculator, Building, Truck } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const ProjectBuilderSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-[#071A2B] text-white relative overflow-hidden border-y border-white/10">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#E87A2D_1px,transparent_1px)] [background-size:28px_28px]"></div>
      
      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Text & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent-light text-xs font-bold uppercase tracking-wider">
              <HardHat className="w-4 h-4 text-accent" />
              <span>BUILD YOUR PROJECT</span>
            </div>

            <ScrollReveal
              baseOpacity={0.2}
              baseRotation={1.5}
              blurStrength={5}
              as="h2"
              textClassName="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white leading-tight"
            >
              Plan Your Materials. Build With Confidence.
            </ScrollReveal>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              Create a project, organize your construction materials, build a Bill of Quantities, and move your requirements directly into your HEPNA MART cart.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>Custom Stage Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>Live Catalog Pricing</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>1-Click Cart Export</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link to="/projects/new">
                <button
                  type="button"
                  className="px-7 py-3.5 bg-accent hover:bg-accent-dark text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95"
                >
                  <span>Start a Project</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <Link to="/shop">
                <button
                  type="button"
                  className="px-6 py-3.5 border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-sm transition-all"
                >
                  <span>Explore Materials</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Right Visual Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#0B2742] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm">
                    🏠
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Residential Villa Project</h4>
                    <span className="text-[11px] text-slate-400">1800 sq.ft • Pune Site</span>
                  </div>
                </div>
                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                  Phase: Foundation
                </span>
              </div>

              {/* Sample Mini BOQ Table */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-slate-300">UltraTech 53 Grade Cement</span>
                  <span className="font-bold text-accent">450 Bags</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-slate-300">Fe 550D TMT Steel Rebar</span>
                  <span className="font-bold text-accent">12 Tonnes</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-slate-300">High Strength AAC Blocks</span>
                  <span className="font-bold text-accent">2,400 Nos</span>
                </div>
              </div>

              {/* Action Bar inside card preview */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Estimated BOQ Value</span>
                  <span className="font-extrabold text-white text-base">₹4,82,500</span>
                </div>
                <Link
                  to="/projects"
                  className="text-accent hover:text-accent-light font-bold text-xs flex items-center gap-1"
                >
                  <span>View Dashboard</span>
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

export default ProjectBuilderSection;
