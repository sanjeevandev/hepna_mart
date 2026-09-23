import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '@/store/wishlistStore';
import { products } from '@/data/products';
import ProductGrid from '@/components/product/ProductGrid';
import { Heart } from 'lucide-react';

const WishlistPage: React.FC = () => {
  const { items } = useWishlistStore();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const wishlistedProducts = products.filter(p => items.includes(p.id));

  return (
    <div className="container-custom py-12">
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">
        My Wishlist ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h1>

      {wishlistedProducts.length === 0 ? (
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
      ) : (
        <ProductGrid products={wishlistedProducts} columns={4} />
      )}
    </div>
  );
};

export default WishlistPage;
