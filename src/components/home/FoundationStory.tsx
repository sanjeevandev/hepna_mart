import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, CheckCircle2, Truck, Layers } from 'lucide-react';
import Button from '@/components/ui/Button';
import './FoundationStory.css';

const FoundationStory: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActive(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`foundation-story text-white py-16 md:py-24 relative ${isActive ? 'is-active' : ''}`}
    >
      {/* Blueprint Grid & Architectural Line Graphic */}
      <div className="foundation-blueprint-grid" aria-hidden="true" />

      {/* Subtle blueprint architectural geometric lines */}
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2 w-full md:w-3/5 h-full opacity-10 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 600"
        fill="none"
        stroke="#E87A2D"
        strokeWidth="1"
      >
        <path d="M100 500 L100 150 L350 50 L600 150 L600 500 Z" />
        <path d="M100 150 L600 150" />
        <path d="M350 50 L350 500" />
        <path d="M100 325 L600 325" />
        <line x1="160" y1="150" x2="160" y2="500" strokeDasharray="4 4" />
        <line x1="220" y1="150" x2="220" y2="500" strokeDasharray="4 4" />
        <line x1="480" y1="150" x2="480" y2="500" strokeDasharray="4 4" />
        <line x1="540" y1="150" x2="540" y2="500" strokeDasharray="4 4" />
      </svg>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT CONTENT COLUMN */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center">
            {/* Small Eyebrow */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-accent">
                WHY HEPNA MART
              </span>
            </div>

            {/* Main Story Headline */}
            <h2 className="foundation-headline text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-white leading-tight tracking-tight mb-4">
              Everything You Need<br className="hidden sm:inline" />
              {' '}to Build —<br />
              <span className="foundation-hepna-text text-accent">
                From Foundation to Finish
              </span>
            </h2>

            {/* Animated Orange Accent Line (0 -> 70px) */}
            <div className="foundation-orange-line mb-6" />

            {/* Supporting Copy */}
            <div className="foundation-copy space-y-4">
              <p className="text-lg sm:text-xl font-medium text-white/90 leading-relaxed">
                Quality materials. Stronger structures. A better tomorrow.
              </p>
              
              <p className="text-sm sm:text-base text-white/70 max-w-xl leading-relaxed">
                From high-grade OPC cement and precision-cast TMT steel to first-class kiln-fired bricks, 
                HEPNA MART delivers certified structural supplies directly from verified manufacturers to your project site.
              </p>

              {/* Three Value Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 pb-2">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-white/90">ISI Certified Quality</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <Truck className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-white/90">Direct Site Delivery</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <Layers className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-white/90">Wholesale Pricing</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link to="/category/cement-concrete">
                  <Button variant="primary" size="lg" className="px-7 py-3 text-base shadow-xl shadow-accent/25 flex items-center gap-2">
                    <span>Explore Core Materials</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/wholesale">
                  <Button variant="outline" size="lg" className="px-7 py-3 text-base border-white/30 text-white hover:bg-white hover:text-primary-dark">
                    Request Project Quote
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT VISUAL COMPOSITION COLUMN */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="foundation-visual-wrap relative">
              {/* Outer decorative glow frame */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-accent/20 via-transparent to-primary-light/30 blur-xl opacity-70" />

              {/* Main Image Container */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-primary-dark">
                <img
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop"
                  alt="Construction Foundation and Site Engineering"
                  className="w-full h-[320px] sm:h-[400px] lg:h-[430px] object-cover object-center"
                />

                {/* Dark gradient overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#071A2B] via-transparent to-transparent opacity-85" />

                {/* Floating Bottom Card: Composition Breakdown */}
                <div className="absolute bottom-4 left-4 right-4 p-4 sm:p-5 rounded-2xl bg-[#071A2B]/90 backdrop-blur-md border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent">
                      Verified Grade Materials
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> Lab Tested
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-1.5">
                    Foundation & Structural Supply
                  </h4>
                  <p className="text-xs text-white/70 flex flex-wrap gap-x-3 gap-y-1">
                    <span>• UltraTech OPC 53</span>
                    <span>• Tata & Jindal Steel</span>
                    <span>• First-Class Red Bricks</span>
                    <span>• Magicrete AAC</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FoundationStory;
