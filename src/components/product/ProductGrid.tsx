import React, { ReactNode } from 'react';
import ProductCard from '@/components/product/ProductCard';
import ProductSection from '@/components/product/ProductSection';
import { Product } from '@/types';

export interface ProductGridProps {
  products: Product[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  action?: ReactNode;
  dark?: boolean;
  className?: string;
  withGlow?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  eyebrow,
  title,
  subtitle,
  columns = 4,
  action,
  dark = false,
  className = '',
  withGlow = true,
}) => {
  const colClasses = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  };

  return (
    <ProductSection
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      action={action}
      dark={dark}
      className={className}
      withGlow={withGlow}
    >
      {products.length > 0 ? (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${colClasses[columns]} gap-5 sm:gap-6`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your filters or search query.</p>
        </div>
      )}
    </ProductSection>
  );
};

export default ProductGrid;
