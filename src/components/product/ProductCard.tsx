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
    <div className="card h-full flex flex-col group relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-card-hover">
      <Link 
        to={`/product/${product.slug}`} 
        className="flex flex-col h-full relative"
      >
        {/* Product Image Area with Subtle Hover Zoom */}
        <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-[#F9FAFB] flex items-center justify-center p-3">
          <img 
            src={product.images?.[0] || 'https://placehold.co/400?text=No+Image'} 
            alt={product.name} 
            loading="lazy"
            className="w-full h-full object-cover rounded-xl transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
          
          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.discount > 0 && (
              <Badge variant="discount" className="text-[11px] font-bold shadow-sm">
                {product.discount}% OFF
              </Badge>
            )}
            {product.newArrival && (
              <Badge variant="new" className="text-[11px] font-bold shadow-sm">
                New
              </Badge>
            )}
          </div>

          {/* Wishlist Button with Micro-Interaction */}
          <button 
            onClick={handleWishlist}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/95 shadow-md hover:bg-white hover:text-accent transition-all duration-200 z-10 active:scale-90"
            aria-label="Toggle wishlist"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-accent text-accent' : 'text-gray-400 hover:text-accent'}`} />
          </button>
        </div>

        {/* Content Details */}
        <div className="p-4 sm:p-5 flex flex-col flex-grow">
          {/* Metadata */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">
              {product.brand}
            </span>
            {product.stock && product.stock < 20 && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Only {product.stock} left
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-heading font-semibold text-primary-dark mb-2 line-clamp-2 min-h-[2.5rem] text-sm sm:text-base leading-snug group-hover:text-accent transition-colors duration-200">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="mb-3">
            <Rating rating={product.rating || 0} reviews={product.reviews || 0} size="sm" showCount />
          </div>

          {/* Pricing */}
          <div className="mt-auto mb-4 pt-1">
            <PriceDisplay 
              price={product.price} 
              mrp={product.mrp} 
              discount={product.discount} 
              unit={product.unit} 
              size="md" 
              showUnit 
            />
          </div>

          {/* Actions: Quantity Selector & Add Button */}
          <div className="flex items-center gap-2 mt-auto" onClick={(e) => e.preventDefault()}>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <QuantitySelector 
                quantity={quantity} 
                onQuantityChange={setQuantity} 
                min={1} 
                max={product.stock || 10} 
                size="sm" 
              />
            </div>
            <Button 
              variant="primary" 
              className="flex-grow text-xs sm:text-sm py-2 px-3 transition-all duration-200 hover:brightness-110 active:scale-[0.98] shadow-sm hover:shadow-md"
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
