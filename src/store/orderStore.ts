import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderStatus, OrderStatusHistoryItem } from '@/types';
import { products } from '@/data/products';
import { useCartStore } from './cartStore';
import toast from 'react-hot-toast';

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  getOrder: (orderId: string) => Order | undefined;
  cancelOrder: (orderId: string, reason: string) => boolean;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  reorderItems: (orderId: string) => { added: number; unavailable: number };
}

// Deterministic seed orders for demonstration and persistent exploration
const getProductById = (id: string) => {
  return products.find((p) => p.id === id) || products[0];
};

const defaultSeedOrders: Order[] = [
  {
    id: 'HM-10245',
    items: [
      { product: getProductById('prod-1'), quantity: 60 },
      { product: getProductById('prod-6'), quantity: 2000 },
      { product: getProductById('prod-16'), quantity: 15 },
    ],
    subtotal: 390 * 60 + 9 * 2000 + 480 * 15, // 23400 + 18000 + 7200 = 48600
    discount: 0,
    deliveryCharge: 0,
    tax: 48600 * 0.18, // 8748
    total: 48600 + 48600 * 0.18, // 57348
    status: 'out-for-delivery',
    date: '2026-09-24T14:30:00.000Z',
    estimatedDelivery: '2026-09-25',
    deliveryWindow: '11:00 AM – 03:00 PM',
    projectId: 'proj-sample-1',
    projectName: 'Green Villa Construction',
    quotationId: 'HM-QT-2026-894721',
    paymentMethod: 'Net Banking / RTGS (Verified)',
    deliveryAddress: {
      id: 'addr-seed-1',
      fullName: 'Ramesh Patil',
      phone: '+91 98765 43210',
      addressLine1: 'Plot 42, Green Valley Enclave, Near Ring Road',
      addressLine2: 'Phase 2 Construction Gate #3',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      isConstructionSite: true,
      siteName: 'Green Villa Site #42',
      siteType: 'Residential Villa (G+2)',
      deliveryPreference: 'Standard 10-Wheeler Commercial Lorry',
      requiredDeliveryDate: '2026-09-25',
      siteContactPerson: 'Vikram Shinde (Site Engineer)',
      sitePhone: '+91 98230 11223',
      deliveryInstructions: 'Enter via North Commercial Gate. Unloading crane space kept clear near foundation pit.',
    },
    statusHistory: [
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        description: 'Payment verified and material allocations locked.',
        timestamp: '24 Sep 2026, 02:30 PM',
        completed: true,
      },
      {
        status: 'processing',
        title: 'Materials Being Prepared',
        description: 'Batch test verification and quality inspection passed at factory depot.',
        timestamp: '24 Sep 2026, 05:15 PM',
        completed: true,
      },
      {
        status: 'packed',
        title: 'Packed & Palletized',
        description: 'Waterproof pallet wrap applied for heavy transit.',
        timestamp: '25 Sep 2026, 06:30 AM',
        completed: true,
      },
      {
        status: 'shipped',
        title: 'Dispatched from Central Warehouse',
        description: 'Vehicle #MH-12-QX-4091 departed from Pune Logistics Hub.',
        timestamp: '25 Sep 2026, 08:45 AM',
        completed: true,
      },
      {
        status: 'out-for-delivery',
        title: 'Out for Delivery to Site',
        description: 'Heavy vehicle in transit to Green Valley Enclave. Driver in contact with site engineer.',
        timestamp: '25 Sep 2026, 10:15 AM',
        completed: false,
        active: true,
      },
      {
        status: 'delivered',
        title: 'Delivered & Offloaded',
        description: 'Physical offloading and signed delivery challan acknowledgement.',
        completed: false,
      },
    ],
  },
  {
    id: 'HM-10228',
    items: [
      { product: getProductById('prod-11'), quantity: 8 },
      { product: getProductById('prod-21'), quantity: 4 },
      { product: getProductById('prod-46'), quantity: 2 },
    ],
    subtotal: 1250 * 8 + 3200 * 4 + 8500 * 2, // 10000 + 12800 + 17000 = 39800
    discount: 0,
    deliveryCharge: 0,
    tax: 39800 * 0.18, // 7164
    total: 39800 + 7164, // 46964
    status: 'processing',
    date: '2026-09-25T07:15:00.000Z',
    estimatedDelivery: '2026-09-27',
    deliveryWindow: '10:00 AM – 02:00 PM',
    projectId: 'proj-sample-1',
    projectName: 'Green Villa Construction',
    paymentMethod: 'UPI / Corporate Card',
    deliveryAddress: {
      id: 'addr-seed-2',
      fullName: 'Ramesh Patil',
      phone: '+91 98765 43210',
      addressLine1: 'Plot 42, Green Valley Enclave, Near Ring Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      isConstructionSite: true,
      siteName: 'Green Villa Site #42',
      siteType: 'Residential Villa (G+2)',
      deliveryPreference: 'Mini Truck / Tempo',
      requiredDeliveryDate: '2026-09-27',
      siteContactPerson: 'Vikram Shinde',
      sitePhone: '+91 98230 11223',
      deliveryInstructions: 'Electrical conduits and fixtures require covered shed placement upon delivery.',
    },
    statusHistory: [
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        description: 'Order placed and scheduled with central inventory depot.',
        timestamp: '25 Sep 2026, 07:15 AM',
        completed: true,
      },
      {
        status: 'processing',
        title: 'Materials Being Prepared',
        description: 'Pipes and electrical cables being measured and batch-tested.',
        timestamp: '25 Sep 2026, 09:00 AM',
        completed: false,
        active: true,
      },
      {
        status: 'packed',
        title: 'Packed & Secured',
        description: 'Crates prepared for secure loading.',
        completed: false,
      },
      {
        status: 'shipped',
        title: 'Dispatched',
        description: 'Handed over to site delivery fleet.',
        completed: false,
      },
      {
        status: 'out-for-delivery',
        title: 'Out for Delivery',
        description: 'Vehicle en route to job site.',
        completed: false,
      },
      {
        status: 'delivered',
        title: 'Delivered',
        description: 'Materials safely handed over at site.',
        completed: false,
      },
    ],
  },
  {
    id: 'HM-10190',
    items: [
      { product: getProductById('prod-36'), quantity: 6 },
      { product: getProductById('prod-37'), quantity: 4 },
    ],
    subtotal: 2450 * 6 + 1850 * 4, // 14700 + 7400 = 22100
    discount: 0,
    deliveryCharge: 0,
    tax: 22100 * 0.18, // 3978
    total: 22100 + 3978, // 26078
    status: 'delivered',
    date: '2026-09-20T11:00:00.000Z',
    estimatedDelivery: '2026-09-22',
    deliveryWindow: '09:00 AM – 01:00 PM',
    paymentMethod: 'Credit Card / Net Banking',
    deliveryAddress: {
      id: 'addr-seed-3',
      fullName: 'Aarav Builders & Developers',
      phone: '+91 91234 56789',
      addressLine1: 'Bhavani Complex, Sector 4, Hinjewadi',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
      isConstructionSite: true,
      siteName: 'Commercial Office Tower B',
      siteType: 'Commercial Complex',
      deliveryPreference: 'Medium Commercial Vehicle',
      requiredDeliveryDate: '2026-09-22',
      siteContactPerson: 'Sunil Rao',
      sitePhone: '+91 91234 56780',
      deliveryInstructions: 'Material receipt signed by security office gate.',
    },
    statusHistory: [
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        description: 'Order confirmed and scheduled.',
        timestamp: '20 Sep 2026, 11:00 AM',
        completed: true,
      },
      {
        status: 'processing',
        title: 'Materials Being Prepared',
        description: 'Paint buckets color-mixed and sealed.',
        timestamp: '21 Sep 2026, 09:30 AM',
        completed: true,
      },
      {
        status: 'packed',
        title: 'Packed',
        description: 'Secured on wooden pallets.',
        timestamp: '21 Sep 2026, 03:00 PM',
        completed: true,
      },
      {
        status: 'shipped',
        title: 'Dispatched',
        description: 'Dispatched via Express Site Fleet.',
        timestamp: '22 Sep 2026, 07:45 AM',
        completed: true,
      },
      {
        status: 'out-for-delivery',
        title: 'Out for Delivery',
        description: 'Vehicle arrived at Hinjewadi sector.',
        timestamp: '22 Sep 2026, 10:00 AM',
        completed: true,
      },
      {
        status: 'delivered',
        title: 'Delivered Successfully',
        description: 'Signed e-challan acknowledged by Sunil Rao.',
        timestamp: '22 Sep 2026, 12:45 PM',
        completed: true,
        active: true,
      },
    ],
  },
  {
    id: 'HM-10154',
    items: [{ product: getProductById('prod-2'), quantity: 30 }],
    subtotal: 370 * 30, // 11100
    discount: 0,
    deliveryCharge: 0,
    tax: 11100 * 0.18, // 1998
    total: 11100 + 1998, // 13098
    status: 'cancelled',
    date: '2026-09-18T09:20:00.000Z',
    estimatedDelivery: '2026-09-20',
    paymentMethod: 'Cash on Delivery (COD)',
    cancellationReason: 'Construction schedule postponed by project architect.',
    cancelledAt: '2026-09-18T14:10:00.000Z',
    deliveryAddress: {
      id: 'addr-seed-4',
      fullName: 'Kiran Desai',
      phone: '+91 97654 32109',
      addressLine1: 'Survey No 18, Near Baner Hills',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      isConstructionSite: true,
      siteName: 'Desai Bungalow Project',
      siteType: 'Residential',
    },
    statusHistory: [
      {
        status: 'confirmed',
        title: 'Order Placed',
        description: 'Order registered via web portal.',
        timestamp: '18 Sep 2026, 09:20 AM',
        completed: true,
      },
      {
        status: 'cancelled',
        title: 'Order Cancelled',
        description: 'Cancelled by customer: Construction schedule postponed.',
        timestamp: '18 Sep 2026, 02:10 PM',
        completed: true,
        active: true,
      },
    ],
  },
];

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: defaultSeedOrders,

      addOrder: (order: Order) => {
        set((state) => ({
          orders: [order, ...state.orders],
        }));
        toast.success(`Order #${order.id} confirmed successfully!`);
      },

      getOrder: (orderId: string) => {
        return get().orders.find(
          (o) =>
            o.id.toLowerCase() === orderId.toLowerCase() ||
            o.id.replace(/^(ORD-|HM-)/i, '').toLowerCase() === orderId.replace(/^(ORD-|HM-)/i, '').toLowerCase()
        );
      },

      cancelOrder: (orderId: string, reason: string) => {
        const order = get().getOrder(orderId);
        if (!order) {
          toast.error('Order not found');
          return false;
        }

        if (order.status !== 'confirmed' && order.status !== 'processing') {
          toast.error('Orders that are already dispatched cannot be cancelled online. Please contact site support.');
          return false;
        }

        const now = new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const updatedHistory: OrderStatusHistoryItem[] = [
          ...(order.statusHistory || []),
          {
            status: 'cancelled',
            title: 'Order Cancelled',
            description: `Cancelled: ${reason}`,
            timestamp: now,
            completed: true,
            active: true,
          },
        ];

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  status: 'cancelled',
                  cancellationReason: reason,
                  cancelledAt: new Date().toISOString(),
                  statusHistory: updatedHistory,
                }
              : o
          ),
        }));

        toast.success(`Order #${order.id} has been cancelled.`);
        return true;
      },

      updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status } : o
          ),
        }));
      },

      reorderItems: (orderId: string) => {
        const order = get().getOrder(orderId);
        if (!order || !order.items || order.items.length === 0) {
          toast.error('No items found in this order');
          return { added: 0, unavailable: 0 };
        }

        const { addToCart } = useCartStore.getState();
        let addedCount = 0;
        let unavailableCount = 0;

        order.items.forEach((item) => {
          // Look up current product from catalog to ensure latest stock and price
          const currentProduct = products.find((p) => p.id === item.product.id);
          if (currentProduct && currentProduct.stock && currentProduct.stock > 0) {
            addToCart(currentProduct, item.quantity);
            addedCount++;
          } else {
            unavailableCount++;
          }
        });

        if (addedCount > 0 && unavailableCount === 0) {
          toast.success(`Added ${addedCount} materials to your cart with current rates!`);
        } else if (addedCount > 0 && unavailableCount > 0) {
          toast(`Added ${addedCount} items. Note: ${unavailableCount} item(s) currently out of stock.`, {
            icon: '⚠️',
          });
        } else {
          toast.error('The items in this order are currently out of stock.');
        }

        return { added: addedCount, unavailable: unavailableCount };
      },
    }),
    {
      name: 'hepna-orders',
    }
  )
);
