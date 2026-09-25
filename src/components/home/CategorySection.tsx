import React, { useState, useEffect } from 'react';
import CategoryCard from '@/components/category/CategoryCard';
import { categories as defaultCategories } from '@/data/categories';
import { catalogService } from '@/services/catalogService';
import { Category } from '@/types';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { ArrowRight } from 'lucide-react';

const CategorySection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let mounted = true;
    catalogService.getCategories()
      .then((cats) => {
        if (mounted && cats && cats.length > 0) {
          setCategories(cats);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 gap-4">
          <div>
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-accent mb-2 block">
              COMPREHENSIVE CATALOG
            </span>
            <ScrollReveal
              baseOpacity={0.15}
              baseRotation={0}
              blurStrength={6}
              as="h2"
              containerClassName="mb-1"
              textClassName="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-primary-dark tracking-tight"
            >
              Popular Categories
            </ScrollReveal>
            <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
              Everything you need for your construction project, from raw foundation materials to architectural finishing.
            </p>
          </div>
          
          <Link to="/categories" className="hidden md:inline-flex group">
            <Button variant="outline" size="sm" className="items-center gap-1.5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all hover-lift">
              <span>View All Categories</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {categories.slice(0, 12).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <Link to="/categories" className="block">
            <Button variant="outline" fullWidth className="flex items-center justify-center gap-2">
              <span>View All Categories</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
