import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import { Package, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';

// Mock orders data
const mockOrders = [
  {
    id: 'ORD-894721',
    date: 'Oct 15, 2023',
    status: 'delivered',
    total: 45000,
    items: 3,
    firstItem: 'UltraTech Premium Portland Cement - 50kg'
  },
  {
    id: 'ORD-752189',
    date: 'Nov 02, 2023',
    status: 'shipped',
    total: 12500,
    items: 1,
    firstItem: 'TATA Tiscon 550SD Rebar - 12mm'
  },
  {
    id: 'ORD-623145',
    date: 'Nov 18, 2023',
    status: 'pending',
    total: 8900,
    items: 2,
    firstItem: 'Asian Paints Royale Play - 4L'
  }
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'delivered': return { variant: 'success' as const, text: 'Delivered' };
    case 'shipped': return { variant: 'primary' as const, text: 'Shipped' };
    case 'pending': return { variant: 'warning' as const, text: 'Processing' };
    case 'cancelled': return { variant: 'danger' as const, text: 'Cancelled' };
    default: return { variant: 'secondary' as const, text: status };
  }
};

const OrdersPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container-custom py-12">
      <div className="flex items-center gap-4 mb-8">
        <Package className="text-primary" size={32} />
        <h1 className="text-3xl font-heading font-bold text-primary">My Orders</h1>
      </div>

      <div className="space-y-6">
        {mockOrders.map((order) => {
          const statusConfig = getStatusConfig(order.status);
          
          return (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <span className="font-bold text-lg text-gray-900">{order.id}</span>
                  <Badge variant={statusConfig.variant} text={statusConfig.text} />
                </div>
                <div className="text-sm text-gray-500 mb-4">Placed on {order.date}</div>
                
                <div className="text-gray-700">
                  <span className="font-medium">{order.firstItem}</span>
                  {order.items > 1 && (
                    <span className="text-gray-500 ml-2">and {order.items - 1} other items</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col md:items-end justify-between min-w-[150px]">
                <div className="text-xl font-bold text-gray-900 mb-4 md:mb-0">
                  {formatPrice(order.total)}
                </div>
                <Link 
                  to={`/account/orders/${order.id}`}
                  className="flex items-center gap-1 text-primary hover:text-primary-light font-medium"
                >
                  View Details
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersPage;
