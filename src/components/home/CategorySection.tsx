import React from 'react';
import CategoryCard from '@/components/category/CategoryCard';
import { categories } from '@/data/categories';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import ScrollReveal from '@/components/ui/ScrollReveal';

const CategorySection: React.FC = () => {
  return (
    <section className="py-12 md:py-16 bg-surface">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-4">
          <div>
            <ScrollReveal
              baseOpacity={0.2}
              baseRotation={2}
              blurStrength={6}
              as="h2"
              containerClassName="mb-1"
              textClassName="section-title text-primary-dark"
            >
              Shop by Category
            </ScrollReveal>
            <p className="section-subtitle mt-1">Everything you need for your construction project</p>
          </div>
          <Link to="/categories" className="hidden md:block">
            <Button variant="outline" size="sm">View All Categories</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.slice(0, 12).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <Link to="/categories">
            <Button variant="outline" fullWidth>View All Categories</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
