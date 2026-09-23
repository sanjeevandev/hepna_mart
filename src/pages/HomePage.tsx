import React, { useEffect } from 'react';
import Hero from '@/components/home/Hero';
import CategorySection from '@/components/home/CategorySection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import DealsSection from '@/components/home/DealsSection';
import BulkOrderBanner from '@/components/home/BulkOrderBanner';
import WhyChooseUs from '@/components/home/WhyChooseUs';

const HomePage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col gap-12 md:gap-16 pb-12 md:pb-16 bg-surface">
      <Hero />
      <CategorySection />
      <FeaturedProducts />
      <DealsSection />
      <BulkOrderBanner />
      <WhyChooseUs />
    </div>
  );
};

export default HomePage;
