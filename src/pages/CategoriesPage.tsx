import React, { useEffect } from 'react';
import { categories } from '@/data/categories';
import CategoryCard from '@/components/category/CategoryCard';
import SectionMotion from '@/components/ui/SectionMotion';
import ScrollReveal from '@/components/ui/ScrollReveal';

const CategoriesPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container-custom py-12 md:py-16">
      <SectionMotion variant="hero">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-accent mb-2 block">
            MARKETPLACE CATALOG
          </span>
          <ScrollReveal
            baseOpacity={0.15}
            baseRotation={0}
            blurStrength={6}
            as="h1"
            containerClassName="mb-3"
            textClassName="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-primary-dark tracking-tight"
          >
            All Building Categories
          </ScrollReveal>
          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Browse our complete range of certified construction materials, structural supplies, and professional tools.
          </p>
        </div>
      </SectionMotion>

      <SectionMotion variant="up">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </SectionMotion>
    </div>
  );
};

export default CategoriesPage;
