import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import CartItem from '@/components/cart/CartItem';
import OrderSummary from '@/components/cart/OrderSummary';
import { ShoppingCart } from 'lucide-react';

const CartPage: React.FC = () => {
  const { items, getItemCount } = useCartStore();
  const count = getItemCount();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container-custom py-12">
      <h1 className="text-3xl font-heading font-bold text-primary mb-8">
        Shopping Cart ({count} {count === 1 ? 'item' : 'items'})
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
              <ShoppingCart size={48} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Looks like you haven't added any construction materials to your cart yet.
          </p>
          <Link 
            to="/shop" 
            className="inline-block bg-accent text-white px-8 py-3 rounded-md font-medium hover:bg-accent-dark transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3 space-y-4">
            {items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))}
          </div>
          
          <aside className="w-full lg:w-1/3">
            <div className="sticky top-24">
              <OrderSummary />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default CartPage;
