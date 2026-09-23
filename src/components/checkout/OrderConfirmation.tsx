import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

interface OrderConfirmationProps {
  orderId: string;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ orderId }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Simple animation trigger
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 text-center max-w-2xl mx-auto">
      <div className={`flex justify-center mb-6 transition-all duration-700 transform ${show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        <CheckCircle2 className="w-24 h-24 text-success" />
      </div>
      
      <h2 className="text-3xl font-bold font-heading text-primary-dark mb-4">Order Placed Successfully!</h2>
      <p className="text-gray-600 mb-8 text-lg">
        Thank you for your order. We've received it and are preparing it for dispatch.
      </p>
      
      <div className="bg-surface p-6 rounded-lg border border-gray-100 inline-block text-left mb-8 w-full max-w-md">
        <div className="flex justify-between mb-3 border-b border-gray-200 pb-3">
          <span className="text-gray-500 font-medium">Order ID</span>
          <span className="font-bold text-gray-900">{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">Estimated Delivery</span>
          <span className="font-semibold text-primary">3-5 Business Days</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/orders">
          <Button variant="outline" className="w-full sm:w-auto">
            View Orders
          </Button>
        </Link>
        <Link to="/shop">
          <Button variant="primary" className="w-full sm:w-auto">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
