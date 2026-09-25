import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '@/store/wishlistStore';
import { catalogService } from '@/services/catalogService';
import { Product } from '@/types';
import ProductGrid from '@/components/product/ProductGrid';
import SectionReveal from '@/components/ui/SectionReveal';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Heart, Loader2 } from 'lucide-react';

const WishlistPage: React.FC = () => {
  const { items } = useWishlistStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    catalogService.getProducts({ limit: 100 })
      .then((res) => {
        if (isMounted) {
          setProducts(res.items);
        }
      })
      .catch((err) => {
        console.error('Failed to load products for wishlist:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const wishlistedProducts = products.filter(p => items.includes(p.id));

  return (
    <div className="container-custom py-12">
      <SectionReveal variant="hero">
        <ScrollReveal
          baseOpacity={0.2}
          baseRotation={2}
          blurStrength={4}
          as="h1"
          containerClassName="mb-6"
          textClassName="text-3xl font-heading font-bold text-primary"
        >
          {`My Wishlist (${items.length} ${items.length === 1 ? 'item' : 'items'})`}
        </ScrollReveal>
      </SectionReveal>

      {wishlistedProducts.length === 0 ? (
        <SectionReveal>
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                <Heart size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Save items you like to your wishlist to buy them later.
            </p>
            <Link 
              to="/shop" 
              className="inline-block bg-accent text-white px-8 py-3 rounded-md font-medium hover:bg-accent-dark transition-colors"
            >
              Explore Products
            </Link>
          </div>
        </SectionReveal>
      ) : (
        <SectionReveal variant="product">
          <ProductGrid products={wishlistedProducts} columns={4} />
        </SectionReveal>
      )}
    </div>
  );
};

export default WishlistPage;
