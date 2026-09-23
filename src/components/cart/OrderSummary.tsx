import React from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';
import { ShieldCheck } from 'lucide-react';

const OrderSummary: React.FC = () => {
  const { getSubtotal, getTax, getDeliveryCharge, getTotal, items } = useCartStore();

  const subtotal = getSubtotal();
  const tax = getTax();
  const delivery = getDeliveryCharge();
  const total = getTotal();
  const discount = 0; // Placeholder for future coupon implementation

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-heading font-semibold text-lg text-primary-dark mb-6">Order Summary</h3>
      
      <div className="space-y-4 text-sm text-gray-600 mb-6">
        <div className="flex justify-between">
          <span>Subtotal ({items.length} items)</span>
          <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-success">
          <span>Discount</span>
          <span className="font-medium">-{formatPrice(discount)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST (18% estimated)</span>
          <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Charge</span>
          <span className="font-medium text-gray-900">
            {delivery === 0 ? <span className="text-success">Free</span> : formatPrice(delivery)}
          </span>
        </div>
        {delivery === 0 && (
          <div className="text-xs text-success bg-success/10 p-2 rounded text-center mt-2">
            Free delivery applied on order above ₹5,000!
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total Amount</span>
          <span className="text-xl font-bold text-accent">{formatPrice(total)}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <Link to="/checkout" className="block">
          <Button variant="primary" fullWidth size="lg" className="text-base shadow-md shadow-accent/20">
            Proceed to Checkout
          </Button>
        </Link>
        
        <Link to="/shop" className="block text-center text-sm font-medium text-primary hover:text-primary-dark transition-colors mt-4">
          or Continue Shopping
        </Link>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="w-4 h-4 text-success" />
        <span>Safe & Secure Payments</span>
      </div>
    </div>
  );
};

export default OrderSummary;
