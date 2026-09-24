import React from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';
import { ShieldCheck, FileText, ArrowRight } from 'lucide-react';

interface OrderSummaryProps {
  onGenerateQuote?: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ onGenerateQuote }) => {
  const { getSubtotal, getTax, getDeliveryCharge, getTotal, items } = useCartStore();

  const subtotal = getSubtotal();
  const tax = getTax();
  const delivery = getDeliveryCharge();
  const total = getTotal();
  const discount = 0; // Placeholder for future coupon implementation

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-heading font-bold text-lg text-primary-dark mb-5">Order Summary</h3>
      
      <div className="space-y-3.5 text-sm text-gray-600 mb-6">
        <div className="flex justify-between">
          <span>Subtotal ({items.length} items)</span>
          <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span className="font-medium">-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <span>GST (18% estimated)</span>
          </span>
          <span className="font-semibold text-gray-900">{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Charge</span>
          <span className="font-semibold text-gray-900">
            {delivery === 0 ? <span className="text-emerald-700 font-bold">Free</span> : formatPrice(delivery)}
          </span>
        </div>
        {delivery === 0 && (
          <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/60 p-2.5 rounded-xl text-center font-medium">
            🎉 Free site delivery applied on orders above ₹5,000!
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-900">Total Amount</span>
          <span className="text-2xl font-black text-accent">{formatPrice(total)}</span>
        </div>
      </div>
      
      <div className="space-y-2.5">
        <Link to="/checkout" className="block">
          <Button variant="primary" fullWidth size="lg" className="text-base py-3.5 shadow-md shadow-accent/20">
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>

        {/* Generate Digital Quote Button */}
        {onGenerateQuote && (
          <button
            type="button"
            onClick={onGenerateQuote}
            className="w-full py-3 px-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4 text-accent" />
            <span>Generate Official Quote (PDF)</span>
          </button>
        )}
        
        <Link to="/shop" className="block text-center text-xs font-semibold text-gray-500 hover:text-primary transition-colors pt-2">
          or Continue Shopping
        </Link>
      </div>
      
      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>100% Secure Checkout & GST Invoices</span>
      </div>
    </div>
  );
};

export default OrderSummary;
