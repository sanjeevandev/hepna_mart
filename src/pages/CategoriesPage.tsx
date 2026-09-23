import React, { useEffect } from 'react';
import { categories } from '@/data/categories';
import CategoryCard from '@/components/category/CategoryCard';

const CategoriesPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container-custom py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-heading font-bold text-primary mb-4">All Categories</h1>
        <p className="text-lg text-gray-600 section-subtitle">
          Browse our complete range of construction materials.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;
