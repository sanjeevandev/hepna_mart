import React, { useEffect } from 'react';
import Hero from '@/components/home/Hero';
import ScrollExpand from '@/components/ui/ScrollExpand';
import CategorySection from '@/components/home/CategorySection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import ConstructionShowcase from '@/components/home/ConstructionShowcase';
import DealsSection from '@/components/home/DealsSection';
import BulkOrderBanner from '@/components/home/BulkOrderBanner';
import WhyChooseUs from '@/components/home/WhyChooseUs';

const HomePage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col gap-10 md:gap-14 pb-12 md:pb-16 bg-surface overflow-x-hidden">
      {/* 1. Main Hero */}
      <Hero />

      {/* 2. ScrollExpand Transition */}
      <section className="relative w-full">
        <ScrollExpand
          src="https://images.unsplash.com/photo-1541888086225-ee5315b8823f?q=80&w=2070&auto=format&fit=crop"
          alt="HEPNA MART Construction Marketplace"
          title="Everything You Need to Build."
          scrollHint="Scroll to Explore"
          startWidth={50}
          startHeight={60}
          startRadius={24}
          endRadius={0}
          mediaZoom={1.25}
          scrollDistance={0.7}
          holdDistance={0.15}
          useWindowScroll={true}
        />
      </section>

      {/* 3. Category Section */}
      <CategorySection />

      {/* 4. Featured Products (Wrapped in ProductSection with BorderGlow) */}
      <FeaturedProducts />

      {/* 5. Construction Stages ScrollStack Showcase */}
      <ConstructionShowcase />

      {/* 6. Deals Section */}
      <DealsSection />

      {/* 7. Bulk Order Banner */}
      <BulkOrderBanner />

      {/* 8. Trust & Benefits Section */}
      <WhyChooseUs />
    </div>
  );
};

export default HomePage;
