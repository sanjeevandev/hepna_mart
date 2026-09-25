import React, { useEffect, useState } from 'react';
import ProductGrid from '@/components/product/ProductGrid';
import { Product } from '@/types';
import catalogService from '@/services/catalogService';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

const FeaturedProducts: React.FC = () => {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    catalogService.getFeaturedProducts(8).then(setFeatured);
  }, []);

  return (
    <section className="py-14 md:py-20 bg-[#F7F9FB] border-y border-gray-100/80">
      <div className="container-custom">
        <ProductGrid 
          products={featured}
          eyebrow="FEATURED PRODUCTS"
          title="Top Selling Construction Materials" 
          subtitle="High quality products, trusted by professionals and homeowners alike." 
          columns={4}
          action={
            <Link to="/shop" className="group">
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:inline-flex items-center gap-1.5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all hover-lift"
              >
                <span>View All Products</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          }
        />
        
        <div className="text-center pt-6 sm:hidden">
          <Link to="/shop" className="block">
            <Button variant="outline" size="md" className="w-full flex items-center justify-center gap-2">
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
