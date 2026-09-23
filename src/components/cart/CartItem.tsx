import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/formatPrice';
import QuantitySelector from '@/components/ui/QuantitySelector';
import PriceDisplay from '@/components/ui/PriceDisplay';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { product, quantity } = item;
  const { updateQuantity, removeFromCart } = useCartStore();

  const handleRemove = () => {
    removeFromCart(product.id);
  };

  const handleQuantityChange = (newQty: number) => {
    updateQuantity(product.id, newQty);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <Link to={`/product/${product.slug}`} className="flex-shrink-0 w-24 h-24 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <img 
          src={product.images?.[0] || 'https://placehold.co/100?text=Image'} 
          alt={product.name} 
          className="w-full h-full object-contain p-2"
        />
      </Link>
      
      <div className="flex-grow min-w-0 flex flex-col justify-center h-full">
        <div className="flex justify-between items-start gap-4">
          <div>
            <span className="text-xs text-gray-500 uppercase font-medium">{product.brand}</span>
            <Link to={`/product/${product.slug}`}>
              <h4 className="font-semibold text-primary-dark hover:text-accent transition-colors line-clamp-2">
                {product.name}
              </h4>
            </Link>
          </div>
          <button 
            onClick={handleRemove}
            className="text-gray-400 hover:text-danger p-2 -mr-2 transition-colors sm:hidden"
            aria-label="Remove item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-2">
          <PriceDisplay price={product.price} mrp={product.mrp} discount={product.discount} unit={product.unit} size="sm" showUnit />
        </div>
      </div>
      
      <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-6">
        <QuantitySelector 
          quantity={quantity} 
          onQuantityChange={handleQuantityChange} 
          min={1} 
          max={product.stock || 10} 
        />
        
        <div className="text-right sm:min-w-[100px]">
          <div className="font-semibold text-primary-dark whitespace-nowrap">
            {formatPrice(product.price * quantity)}
          </div>
        </div>

        <button 
          onClick={handleRemove}
          className="text-gray-400 hover:text-danger p-2 transition-colors hidden sm:block"
          aria-label="Remove item"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
