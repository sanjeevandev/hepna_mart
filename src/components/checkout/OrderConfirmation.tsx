import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { CheckCircle2, Truck, ArrowRight, Package, Calendar } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

interface OrderConfirmationProps {
  orderId: string;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ orderId }) => {
  const [show, setShow] = useState(false);
  const { getOrder } = useOrderStore();
  const order = getOrder(orderId);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const estDateStr = order?.estimatedDelivery || '2-3 Business Days';

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div
        className={`flex justify-center transition-all duration-700 transform ${
          show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
      </div>

      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
          Order Confirmed & Scheduled
        </span>
        <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#071A2B] mt-3">
          Materials Confirmed for Dispatch!
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mt-2">
          Thank you for choosing HEPNA MART. Your order has been registered and scheduled with our warehouse logistics fleet.
        </p>
      </div>

      <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 text-left text-xs sm:text-sm space-y-3">
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
          <span className="text-slate-500 font-medium">Order Number</span>
          <span className="font-extrabold text-[#071A2B] text-base">#{orderId}</span>
        </div>

        {order?.projectName && (
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Project</span>
            <span className="font-bold text-accent">{order.projectName}</span>
          </div>
        )}

        <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
          <span className="text-slate-500 font-medium">Site Destination</span>
          <span className="font-semibold text-slate-800">
            {order?.deliveryAddress?.city || 'Pune'}, {order?.deliveryAddress?.state || 'Maharashtra'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>Estimated Site Drop</span>
          </span>
          <span className="font-bold text-emerald-700">{estDateStr}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link to={`/orders/${orderId}`} className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto shadow-md shadow-accent/20"
            icon={<Truck className="w-4 h-4" />}
          >
            Track Site Delivery
          </Button>
        </Link>

        <Link to="/orders" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full sm:w-auto" icon={<Package className="w-4 h-4" />}>
            View All Orders
          </Button>
        </Link>

        <Link to="/shop" className="w-full sm:w-auto">
          <Button variant="ghost" size="lg" className="w-full sm:w-auto">
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
