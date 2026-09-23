import React from 'react';
import ProductCard from '@/components/product/ProductCard';
import { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, title, subtitle, columns = 4 }) => {
  const colClasses = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  };

  return (
    <section className="container-custom py-12">
      {(title || subtitle) && (
        <div className="mb-8 text-center md:text-left">
          {title && <h2 className="section-title text-primary-dark">{title}</h2>}
          {subtitle && <p className="section-subtitle mt-2">{subtitle}</p>}
        </div>
      )}
      
      {products.length > 0 ? (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${colClasses[columns]} gap-6`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-surface rounded-xl border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your filters or search query.</p>
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
