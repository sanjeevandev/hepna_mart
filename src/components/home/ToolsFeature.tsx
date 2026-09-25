import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import ScrollReveal from '@/components/ui/ScrollReveal';

const ToolsFeature: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-[#0B2742] text-white relative overflow-hidden">
      {/* Subtle blueprint grid line decoration */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #E87A2D 1px, transparent 1px), linear-gradient(to bottom, #2A5A8C 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-accent mb-2 block">
            PROFESSIONAL GEAR
          </span>
          <ScrollReveal
            baseOpacity={0.15}
            baseRotation={0}
            blurStrength={6}
            as="h2"
            containerClassName="mb-3"
            textClassName="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white tracking-tight"
          >
            Tools Built for Real Work
          </ScrollReveal>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Equip your workforce with industry-grade power tools and lab-tested safety gear designed to withstand the most demanding jobsite conditions.
          </p>
        </div>

        {/* Dual Split Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          
          {/* Card 1: Heavy Duty Construction Tools */}
          <div className="group relative rounded-3xl overflow-hidden bg-[#071A2B] border border-white/10 shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-accent/40">
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                  Industrial Grade
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white mb-3">
                Power & Hand Tools
              </h3>
              
              <p className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed">
                Impact drills, rotary hammers, angle grinders, spirit levels, and precision trowels from leading brands like Bosch, Stanley, and Taparia.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>Bosch 13mm Impact Drills with 1-Year Warranty</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>Stanley Magnetic Spirit Levels & Measuring Tapes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>Heavy-Duty Wheelbarrows and Masonry Trowels</span>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 pt-0 flex items-center justify-between border-t border-white/5 mt-auto">
              <span className="text-sm font-semibold text-accent-light">
                Starting from ₹280
              </span>
              <Link to="/tools">
                <Button variant="primary" size="md" className="flex items-center gap-2 hover-lift">
                  <span>Browse Tools</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 2: Site Safety Equipment */}
          <div className="group relative rounded-3xl overflow-hidden bg-[#071A2B] border border-white/10 shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-emerald-500/40">
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  ISI Certified
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white mb-3">
                Site Safety & PPE
              </h3>
              
              <p className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed">
                Certified protective helmets, steel-toe boots, high-visibility reflective jackets, and 3M safety goggles for total compliance and worker safety.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Karam High-Density Polyethylene Safety Helmets</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Bata Steel-Toe Puncture-Resistant Work Shoes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>3M Polycarbonate Scratch-Resistant Eyewear</span>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 pt-0 flex items-center justify-between border-t border-white/5 mt-auto">
              <span className="text-sm font-semibold text-emerald-400">
                Bulk Discounts from 20+ Units
              </span>
              <Link to="/category/safety-equipment">
                <Button 
                  variant="outline-white" 
                  size="md" 
                  className="flex items-center gap-2 hover-lift"
                >
                  <span>Safety Gear</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ToolsFeature;
