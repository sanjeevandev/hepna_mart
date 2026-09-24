import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import Hero from '@/components/home/Hero';
import ScrollExpand from '@/components/ui/ScrollExpand';
import FoundationStory from '@/components/home/FoundationStory';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import ConstructionShowcase from '@/components/home/ConstructionShowcase';
import CategorySection from '@/components/home/CategorySection';
import ToolsFeature from '@/components/home/ToolsFeature';
import DealsSection from '@/components/home/DealsSection';
import BulkOrderBanner from '@/components/home/BulkOrderBanner';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import SectionMotion from '@/components/ui/SectionMotion';
import Button from '@/components/ui/Button';
import heroImage from '@/assets/images/hepna-construction-hero.webp';

const HomePage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col w-full bg-[#071A2B]">
      {/* 1. ORIGINAL HERO — Complete homepage hero section with construction background, headline & CTAs */}
      <Hero />

      {/* 2. SCROLL EXPAND ANIMATION — Compact dedicated animation section directly below hero */}
      <ScrollExpand
        src={heroImage}
        alt="HEPNA MART Construction Site & Engineering"
        eyebrow="HEPNA MART"
        title="Great Buildings Begin With Great Foundations"
        scrollHint="Scroll to build"
        startWidth={55}
        startHeight={62}
        startRadius={24}
        endRadius={0}
        mediaZoom={1.12}
        scrollDistance={0.60}
        holdDistance={0.0}
        overlayScrim={0.52}
      >
        <div className="flex flex-col items-center justify-center max-w-2xl px-4 text-white text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent-light text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>India's Trusted Construction Marketplace</span>
          </div>
          
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight font-heading mb-2 drop-shadow-xl">
            <span className="text-accent">HEPNA MART</span>
          </h3>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-100 font-medium leading-snug mb-5 max-w-xl drop-shadow-md">
            Quality materials. Stronger structures.<br />
            A better tomorrow.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-5">
            <Link to="/shop">
              <Button
                variant="primary"
                size="lg"
                className="px-7 py-3 text-base shadow-2xl shadow-accent/40 flex items-center gap-2 hover-lift"
              >
                <span>Shop Building Materials</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/wholesale">
              <Button
                variant="outline"
                size="lg"
                className="px-7 py-3 text-base border-white/40 text-white hover:bg-white hover:text-[#071A2B] backdrop-blur-md hover-lift"
              >
                Request B2B Quote
              </Button>
            </Link>
          </div>

          <div className="inline-flex items-center gap-6 pt-3 border-t border-white/20 text-xs sm:text-sm text-gray-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-accent" />
              100% Certified Supplies
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-accent" />
              Direct Job-Site Delivery
            </span>
          </div>
        </div>
      </ScrollExpand>

      {/* 3. FOUNDATION STORY (#071A2B) — WHY HEPNA MART: Everything You Need to Build */}
      <FoundationStory />

      {/* 4. FEATURED PRODUCTS (#F7F9FB) — Top Selling Construction Materials */}
      <div className="bg-white">
        <SectionMotion variant="up">
          <FeaturedProducts />
        </SectionMotion>

        {/* 5. CONSTRUCTION JOURNEY (#071D31) — Build From Foundation to Finish */}
        <SectionMotion variant="scale">
          <ConstructionShowcase />
        </SectionMotion>

        {/* 6. POPULAR CATEGORIES (#FFFFFF) — Comprehensive Catalog */}
        <SectionMotion variant="up">
          <CategorySection />
        </SectionMotion>

        {/* 7. TOOLS & SAFETY FEATURE STORY (#0B2742) — Tools Built for Real Work */}
        <SectionMotion variant="right">
          <ToolsFeature />
        </SectionMotion>

        {/* 8. DEALS & PROMOTIONAL OFFERS (#F5F5F3) */}
        <SectionMotion variant="left">
          <DealsSection />
        </SectionMotion>

        {/* 9. B2B WHOLESALE / BULK MATERIALS (#071A2B) */}
        <SectionMotion variant="up">
          <BulkOrderBanner />
        </SectionMotion>

        {/* 10. THE HEPNA MART STANDARD / TRUST (#FFFFFF) */}
        <SectionMotion variant="fade">
          <WhyChooseUs />
        </SectionMotion>
      </div>
    </div>
  );
};

export default HomePage;
