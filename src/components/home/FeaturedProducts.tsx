import React from 'react';
import ProductGrid from '@/components/product/ProductGrid';
import { products } from '@/data/products';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const FeaturedProducts: React.FC = () => {
  const featured = products.filter(p => p.featured).slice(0, 8);

  return (
    <section className="container-custom">
      <ProductGrid 
        products={featured} 
        title="Featured Products" 
        subtitle="Handpicked premium materials for your projects" 
        columns={4}
        action={
          <Link to="/shop">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              View All Products →
            </Button>
          </Link>
        }
      />
      
      <div className="text-center pt-2 pb-6 sm:hidden">
        <Link to="/shop">
          <Button variant="outline" size="md" className="w-full">
            View All Products →
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default FeaturedProducts;
