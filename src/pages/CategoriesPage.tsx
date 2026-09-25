import React, { useEffect, useState } from 'react';
import { Category } from '@/types';
import catalogService from '@/services/catalogService';
import CategoryCard from '@/components/category/CategoryCard';
import SectionMotion from '@/components/ui/SectionMotion';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Loader2 } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = () => {
    setLoading(true);
    setError(null);
    catalogService.getCategories()
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Unable to load categories. Please try again.');
        setLoading(false);
      });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCategories();
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
            <p className="text-xs font-bold text-gray-500">Loading catalog taxonomy...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-md mx-auto">
            <h3 className="text-base font-bold text-red-600 mb-2">Failed to load categories</h3>
            <p className="text-xs text-gray-500 mb-4">{error}</p>
            <button
              onClick={loadCategories}
              className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-bold transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </SectionMotion>
    </div>
  );
};

export default CategoriesPage;
