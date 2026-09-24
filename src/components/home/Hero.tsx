import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, Tag, Truck, Users } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative min-h-[580px] lg:h-[88vh] max-h-[780px] flex items-center bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1541888086225-ee5315b8823f?q=80&w=2070&auto=format&fit=crop")',
      }}
    >
      {/* Deep Navy Atmospheric Overlay with Subtle Radial Vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#071A2B]/95 via-[#0B2742]/85 to-[#0F2440]/60" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/50 pointer-events-none" />

      {/* Main Content */}
      <div className="container-custom relative z-10 text-white py-12 md:py-20 flex flex-col justify-center h-full">
        <div className="max-w-3xl">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full bg-accent/20 border border-accent/40 text-accent-light text-xs sm:text-sm font-semibold tracking-wider uppercase backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>India's Trusted Construction Marketplace</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading mb-6 leading-[1.12] tracking-tight">
            Build Better. <br />
            <span className="text-accent underline decoration-accent/40 decoration-4 underline-offset-8">
              Buy Smarter.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed font-normal">
            Certified building materials, heavy structural supplies, and professional tools delivered directly to your job site across India.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <Link to="/shop">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-3.5 shadow-xl shadow-accent/30 flex items-center justify-center gap-2.5 hover-lift"
              >
                <span>Shop Materials</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/categories">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-3.5 border-white/40 text-white hover:bg-white hover:text-primary-dark backdrop-blur-md transition-all hover-lift"
              >
                Explore Categories
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/15">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-200">
                Premium Quality Materials
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-200">
                Competitive Prices
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Truck className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-200">
                Fast & Reliable Delivery
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-200">
                Trusted by Thousands
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Curved Transition into Foundation Story */}
      <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10 flex flex-col justify-end">
        <svg
          viewBox="0 0 1200 40"
          className="w-full h-8 text-[#071A2B] fill-current preserve-3d"
          preserveAspectRatio="none"
        >
          <path d="M0,40 L0,15 Q600,0 1200,15 L1200,40 Z" />
        </svg>
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      </div>
    </div>
  );
};

export default Hero;
