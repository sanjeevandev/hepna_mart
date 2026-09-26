import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import CartItem from '@/components/cart/CartItem';
import OrderSummary from '@/components/cart/OrderSummary';
import QuotationModal from '@/components/cart/QuotationModal';
import { ShoppingCart, FileText, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';

const CartPage: React.FC = () => {
  const { items, getItemCount, fetchCart, hasPriceChanges, isLoading } = useCartStore();
  const count = getItemCount();
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCart().catch(() => {});
  }, []);

  return (
    <div className="container-custom py-10 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#071A2B]">
              Shopping Cart
            </h1>
            {isLoading && <Loader2 className="w-5 h-5 text-accent animate-spin" />}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {count} {count === 1 ? 'item' : 'items'} in your active material list
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setIsQuoteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-colors self-start sm:self-auto"
          >
            <FileText className="w-4 h-4 text-accent" />
            <span>Generate Digital Quotation</span>
          </button>
        )}
      </div>

      {/* Global Price Change Notification Banner */}
      {hasPriceChanges && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs sm:text-sm animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Catalog Price Update Notice</h4>
            <p className="text-amber-800 mt-0.5">
              One or more item prices in your cart have been updated to match current live factory rates. The current selling price is applied to your order total.
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
              <ShoppingCart size={40} />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Looks like you haven't added any construction supplies or materials to your cart yet.
          </p>
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-colors"
          >
            <span>Start Exploring Supplies</span>
            <ArrowRight className="w-4 h-4" />
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
              <OrderSummary onGenerateQuote={() => setIsQuoteOpen(true)} />
            </div>
          </aside>
        </div>
      )}

      {/* Digital Quotation System Modal */}
      <QuotationModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </div>
  );
};

export default CartPage;
