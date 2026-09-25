import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { Building2, ArrowRight, CheckCircle2, PhoneCall } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const BulkOrderBanner: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-[#071A2B] text-white relative overflow-hidden">
      {/* Blueprint Grid line overlay */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #E87A2D 1px, transparent 1px), linear-gradient(to bottom, #2A5A8C 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }}
      />

      <div className="container-custom relative z-10">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0B2742] to-[#0F2440] border border-white/10 p-8 sm:p-12 lg:p-16 shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-accent" />
                <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-accent">
                  B2B & WHOLESALE CONTRACT SUPPLY
                </span>
              </div>

              <ScrollReveal
                baseOpacity={0.15}
                baseRotation={0}
                blurStrength={6}
                as="h2"
                containerClassName="mb-4"
                textClassName="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight"
              >
                Bulk Materials. Better Pricing.
              </ScrollReveal>

              <p className="text-base sm:text-lg text-gray-300 mb-6 max-w-2xl leading-relaxed">
                Direct mill pricing on bulk cement, structural TMT steel, and kiln bricks. 
                Dedicated project managers, on-site fleet logistics, and unified GST billing.
              </p>

              {/* Trust highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>Up to 25% Bulk Discount</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>Scheduled Site Drops</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>500+ Active Builders</span>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4 justify-center items-stretch lg:items-end">
              <Link to="/wholesale" className="w-full">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-full text-base sm:text-lg py-4 px-8 shadow-xl shadow-accent/25 flex items-center justify-center gap-2 hover-lift"
                >
                  <span>Request Bulk Quote</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>

              <Link to="/contact" className="w-full">
                <Button 
                  variant="outline-white" 
                  size="lg" 
                  className="w-full text-base py-4 px-8 flex items-center justify-center gap-2 hover-lift"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Speak with Expert</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BulkOrderBanner;
