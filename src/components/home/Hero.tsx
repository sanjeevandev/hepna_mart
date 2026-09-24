import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, Tag, Truck, Users } from 'lucide-react';
import heroImage from '@/assets/images/hepna-construction-hero.webp';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (bgRef.current && heroRef.current) {
          const rect = heroRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          if (rect.bottom > 0 && rect.top < viewportHeight) {
            const scrollProgress = -rect.top / viewportHeight;
            const translateY = scrollProgress * 20;
            const scale = 1.04 + scrollProgress * 0.04;
            bgRef.current.style.transform = `scale(${scale}) translateY(${translateY}px)`;
          }
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[75vh] lg:min-h-[82vh] max-h-[880px] flex items-center overflow-hidden bg-[#071A2B]"
    >
      {/* ─── Layer 1: Background Construction Image (Directly visible) ─── */}
      <img
        ref={bgRef}
        src={heroImage}
        alt="HEPNA MART Construction Site"
        loading="eager"
        decoding="sync"
        className="absolute inset-0 w-full h-full object-cover object-center will-change-transform opacity-100"
        style={{
          filter: 'blur(2px)',
          transform: 'scale(1.04)',
        }}
      />

      {/* ─── Layer 2: Directional Cinematic Overlay ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(7,26,43,0.80) 0%, rgba(7,26,43,0.58) 50%, rgba(7,26,43,0.30) 100%)',
        }}
      />

      {/* ─── Layer 3: Subtle Orange Ambient Glow ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 80% 30%, rgba(232,122,45,0.12), transparent 45%)',
        }}
      />

      {/* ─── Layer 4: Sharp Foreground Content (Always 100% visible) ─── */}
      <div className="container-custom relative z-10 text-white py-12 md:py-20 flex flex-col justify-center h-full">
        <div className="max-w-3xl">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full bg-accent/20 border border-accent/40 text-accent-light text-xs sm:text-sm font-bold tracking-wider uppercase backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>India's Trusted Construction Marketplace</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading mb-6 leading-[1.12] tracking-tight text-white">
            Everything You Need <br />
            <span className="text-accent underline decoration-accent/40 decoration-4 underline-offset-8">
              to Build.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed font-normal">
            Quality materials for stronger structures and smarter construction. Certified building supplies, heavy structural materials, and professional tools delivered directly to your job site.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <Link to="/shop">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-3.5 shadow-xl shadow-accent/30 flex items-center justify-center gap-2.5 hover-lift"
              >
                <span>Shop Building Materials</span>
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

      {/* ─── Bottom Transition Line into ScrollExpand ─── */}
      <div className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none z-10 flex flex-col justify-end">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </div>
    </section>
  );
};

export default Hero;
