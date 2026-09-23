import React from 'react';
import ProductGrid from '@/components/product/ProductGrid';
import { products } from '@/data/products';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const FeaturedProducts: React.FC = () => {
  const featured = products.filter(p => p.featured).slice(0, 8);

  return (
    <section className="bg-white">
      <ProductGrid 
        products={featured} 
        title="Featured Products" 
        subtitle="Handpicked premium materials for your projects" 
        columns={4}
      />
      
      <div className="text-center pb-16">
        <Link to="/shop">
          <Button variant="outline" size="lg" className="px-8">
            View All Products →
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default FeaturedProducts;
