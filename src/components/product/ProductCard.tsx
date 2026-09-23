import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import toast from 'react-hot-toast';
import Rating from '@/components/ui/Rating';
import PriceDisplay from '@/components/ui/PriceDisplay';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const [quantity, setQuantity] = useState(1);

  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    if (wishlisted) {
      toast.success('Removed from wishlist');
    } else {
      toast.success('Added to wishlist');
    }
  };

  return (
    <div className="card h-full flex flex-col group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover border border-gray-100/80 bg-white">
      <Link 
        to={`/product/${product.slug}`} 
        className="flex flex-col h-full relative"
      >
        <div className="relative aspect-square overflow-hidden bg-surface flex items-center justify-center">
          <img 
            src={product.images?.[0] || 'https://placehold.co/400?text=No+Image'} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.discount > 0 && (
              <Badge variant="discount">{product.discount}% OFF</Badge>
            )}
            {product.newArrival && (
              <Badge variant="new">New</Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <button 
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/95 shadow-md hover:bg-white hover:text-accent transition-all z-10"
            aria-label="Toggle wishlist"
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${wishlisted ? 'fill-accent text-accent' : 'text-gray-400'}`} />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">{product.brand}</span>
          <h3 className="font-semibold text-primary-dark mb-2 line-clamp-2 min-h-[2.75rem] text-sm md:text-base group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          
          <div className="mb-2">
            <Rating rating={product.rating || 0} reviews={product.reviews || 0} size="sm" showCount />
          </div>

          <div className="mt-auto mb-4">
            <PriceDisplay price={product.price} mrp={product.mrp} discount={product.discount} unit={product.unit} size="md" showUnit />
          </div>

          <div className="flex items-center gap-2 mt-auto" onClick={(e) => e.preventDefault()}>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={1} max={product.stock || 10} size="sm" />
            </div>
            <Button 
              variant="primary" 
              className="flex-grow text-xs sm:text-sm py-1.5 px-2"
              onClick={handleAddToCart}
              disabled={!product.stock || product.stock === 0}
              icon={<ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            >
              {product.stock && product.stock > 0 ? 'Add' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
