import React, { useEffect } from 'react';
import Hero from '@/components/home/Hero';
import FoundationStory from '@/components/home/FoundationStory';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import ConstructionShowcase from '@/components/home/ConstructionShowcase';
import CategorySection from '@/components/home/CategorySection';
import ToolsFeature from '@/components/home/ToolsFeature';
import DealsSection from '@/components/home/DealsSection';
import BulkOrderBanner from '@/components/home/BulkOrderBanner';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import SectionMotion from '@/components/ui/SectionMotion';

const HomePage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-white">
      {/* 1. Cinematic Hero (85-90vh desktop, deep navy overlay, 4 trust badges) */}
      <Hero />

      {/* 2. Foundation Story Section (#071A2B) — Replaces ScrollExpand, removes all white gaps */}
      <FoundationStory />

      {/* 3. Featured Products (#F7F9FB) — Top Selling Construction Materials */}
      <SectionMotion variant="up">
        <FeaturedProducts />
      </SectionMotion>

      {/* 4. Construction Journey (#071D31) — Build From Foundation to Finish */}
      <SectionMotion variant="scale">
        <ConstructionShowcase />
      </SectionMotion>

      {/* 5. Popular Categories (#FFFFFF) — Comprehensive Catalog */}
      <SectionMotion variant="up">
        <CategorySection />
      </SectionMotion>

      {/* 6. Tools & Safety Feature Story (#0B2742) — Tools Built for Real Work */}
      <SectionMotion variant="right">
        <ToolsFeature />
      </SectionMotion>

      {/* 7. Deals & Promotional Offers (#F5F5F3) */}
      <SectionMotion variant="left">
        <DealsSection />
      </SectionMotion>

      {/* 8. B2B Wholesale / Bulk Materials (#071A2B) */}
      <SectionMotion variant="up">
        <BulkOrderBanner />
      </SectionMotion>

      {/* 9. The HEPNA MART Standard / Trust (#FFFFFF) */}
      <SectionMotion variant="fade">
        <WhyChooseUs />
      </SectionMotion>
    </div>
  );
};

export default HomePage;
