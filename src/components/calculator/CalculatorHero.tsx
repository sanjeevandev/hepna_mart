import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, HardHat, FileText, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface CalculatorHeroProps {
  onScrollToCalculator?: () => void;
}

const CalculatorHero: React.FC<CalculatorHeroProps> = ({ onScrollToCalculator }) => {
  return (
    <div className="relative bg-[#071A2B] text-white py-12 sm:py-16 overflow-hidden border-b border-white/10">
      {/* Subtle Construction Blueprint Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="max-w-3xl space-y-4">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-accent-light text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            <Calculator className="w-3.5 h-3.5 text-accent" />
            <span>Smart Construction Planner</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white tracking-tight leading-tight">
            Estimate Your Construction <br className="hidden sm:block" />
            <span className="text-accent">Material Requirements & Budget</span>
          </h1>

          {/* Supporting Description */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Plan your project material requirements using current HEPNA MART catalog prices. Generate an indicative estimate, analyze cost distributions, and connect directly to your project, BOQ, and cart.
          </p>

          {/* Trust Highlights */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Live Catalog Pricing
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Direct-to-BOQ Transfer
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Price Snapshot & History
            </span>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onScrollToCalculator}
              className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5"
            >
              <span>Start Material Estimate</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link to="/projects">
              <Button variant="outline-white" size="md">
                <HardHat className="w-4 h-4 mr-1.5 text-accent" />
                <span>My Projects</span>
              </Button>
            </Link>

            <Link to="/estimates">
              <Button variant="ghost-white" size="md">
                <FileText className="w-4 h-4 mr-1.5" />
                <span>Saved Estimates</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorHero;
