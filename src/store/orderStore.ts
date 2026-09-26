import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderStatus, OrderStatusHistoryItem, CartItem } from '@/types';
import { products } from '@/data/products';
import { useCartStore } from './cartStore';
import { apiClient, getAuthToken, BackendOrder } from '@/lib/api';
import toast from 'react-hot-toast';

export function mapBackendOrderToOrder(bo: BackendOrder): Order {
  const mappedItems: CartItem[] = (bo.items || []).map((item) => ({
    product: {
      id: item.product_id || item.id,
      name: item.product_name,
      slug: item.product_sku || '',
      brand: item.brand || 'HEPNA',
      category: '',
      subcategory: '',
      description: '',
      images: item.product_image ? [item.product_image] : ['https://placehold.co/400?text=HEPNA'],
      price: Number(item.unit_price),
      mrp: Number(item.mrp),
      discount: Number(item.discount_amount),
      unit: item.unit || 'unit',
      stock: 100,
      rating: 4.5,
      reviews: 10,
      deliveryAvailable: true,
      featured: false,
      newArrival: false,
    },
    quantity: item.quantity,
    priceAtAddition: Number(item.unit_price),
  }));

  const mappedHistory: OrderStatusHistoryItem[] = (bo.status_history || []).map((h) => ({
    status: h.new_status as OrderStatus,
    title: h.title,
    description: h.description || '',
    timestamp: new Date(h.created_at).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    completed: h.completed,
    active: h.active,
  }));

  const addr = bo.delivery_address || {};

  return {
    id: bo.order_number || bo.id,
    items: mappedItems,
    subtotal: Number(bo.subtotal),
    discount: Number(bo.discount_amount || 0),
    deliveryCharge: Number(bo.delivery_charge || 0),
    tax: Number(bo.tax_amount || 0),
    total: Number(bo.total_amount),
    status: bo.status as OrderStatus,
    date: bo.created_at,
    estimatedDelivery: bo.estimated_delivery || '',
    deliveryWindow: bo.delivery_window || '10:00 AM – 02:00 PM',
    projectId: bo.project_id || undefined,
    projectName: bo.project_name || addr.site_name || undefined,
    quotationId: bo.quotation_id || undefined,
    paymentMethod: bo.payment_method === 'cod' ? 'Cash on Site Offloading (COD)' : 'Online Payment (Verified)',
    cancellationReason: bo.cancellation_reason || undefined,
    cancelledAt: bo.cancelled_at || undefined,
    deliveryAddress: {
      id: addr.id || 'addr-snapshot',
      fullName: addr.full_name || bo.customer_name,
      phone: addr.phone || bo.customer_phone,
      addressLine1: addr.address_line1 || '',
      addressLine2: addr.address_line2 || '',
      city: addr.city || '',
      state: addr.state || 'Maharashtra',
      pincode: addr.pincode || '',
      isConstructionSite: addr.is_construction_site ?? true,
      siteName: addr.site_name || '',
      siteType: addr.site_type || '',
      deliveryPreference: addr.delivery_preference || '',
      requiredDeliveryDate: addr.required_delivery_date || '',
      siteContactPerson: addr.site_contact_person || '',
      sitePhone: addr.site_phone || '',
      deliveryInstructions: addr.delivery_instructions || '',
    },
    statusHistory: mappedHistory,
  };
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;

  fetchOrders: () => Promise<Order[]>;
  fetchOrderById: (orderId: string) => Promise<Order | undefined>;
  addOrder: (order: Order) => void;
  getOrder: (orderId: string) => Order | undefined;
  cancelOrder: (orderId: string, reason: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
  reorderItems: (orderId: string) => Promise<{ added: number; unavailable: number }>;
}

// Deterministic seed orders for demonstration and persistent offline exploration
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
    subtotal: 390 * 60 + 9 * 2000 + 480 * 15,
    discount: 0,
    deliveryCharge: 0,
    tax: 48600 * 0.18,
    total: 48600 + 48600 * 0.18,
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
    subtotal: 1250 * 8 + 3200 * 4 + 8500 * 2,
    discount: 0,
    deliveryCharge: 0,
    tax: 39800 * 0.18,
    total: 39800 + 7164,
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
    subtotal: 2450 * 6 + 1850 * 4,
    discount: 0,
    deliveryCharge: 0,
    tax: 22100 * 0.18,
    total: 22100 + 3978,
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
];

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: defaultSeedOrders,
      isLoading: false,

      fetchOrders: async () => {
        const token = getAuthToken();
        if (!token) return get().orders;

        try {
          set({ isLoading: true });
          const res = await apiClient.orders.list();
          if (res.data && res.data.orders) {
            const mappedOrders = res.data.orders.map(mapBackendOrderToOrder);
            set({ orders: mappedOrders, isLoading: false });
            return mappedOrders;
          }
        } catch (err) {
          console.warn('[orderStore] Could not fetch backend orders, using local storage fallback.', err);
        } finally {
          set({ isLoading: false });
        }
        return get().orders;
      },

      fetchOrderById: async (orderId: string) => {
        const token = getAuthToken();
        if (token) {
          try {
            const res = await apiClient.orders.get(orderId);
            if (res.data) {
              const mapped = mapBackendOrderToOrder(res.data);
              set((state) => ({
                orders: [mapped, ...state.orders.filter((o) => o.id !== mapped.id)],
              }));
              return mapped;
            }
          } catch (err) {
            console.warn(`[orderStore] Backend lookup failed for ${orderId}, using local match.`, err);
          }
        }
        return get().getOrder(orderId);
      },

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
            o.id.replace(/^(ORD-|HM-|HEP-)/i, '').toLowerCase() ===
              orderId.replace(/^(ORD-|HM-|HEP-)/i, '').toLowerCase()
        );
      },

      cancelOrder: async (orderId: string, reason: string) => {
        const token = getAuthToken();
        if (token) {
          try {
            const res = await apiClient.orders.cancel(orderId, reason);
            if (res.data) {
              const mapped = mapBackendOrderToOrder(res.data);
              set((state) => ({
                orders: state.orders.map((o) => (o.id === mapped.id ? mapped : o)),
              }));
              toast.success(`Order #${mapped.id} has been cancelled.`);
              return true;
            }
          } catch (err: any) {
            toast.error(err.message || 'Could not cancel order.');
            return false;
          }
        }

        // Offline / Local fallback
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

      updateOrderStatus: async (orderId: string, status: OrderStatus, note?: string) => {
        const token = getAuthToken();
        if (token) {
          try {
            const res = await apiClient.adminOrders.updateStatus(orderId, { status, note });
            if (res.data) {
              const mapped = mapBackendOrderToOrder(res.data);
              set((state) => ({
                orders: state.orders.map((o) => (o.id === mapped.id ? mapped : o)),
              }));
              toast.success(`Order #${mapped.id} status updated to ${status}`);
              return;
            }
          } catch (err: any) {
            toast.error(err.message || 'Failed to update order status');
          }
        }

        // Local fallback
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status } : o
          ),
        }));
      },

      reorderItems: async (orderId: string) => {
        const token = getAuthToken();
        if (token) {
          try {
            const res = await apiClient.orders.reorder(orderId);
            if (res.data) {
              await useCartStore.getState().fetchCart();
              if (res.data.added_count > 0 && res.data.unavailable_items.length === 0) {
                toast.success(res.data.message || `Added ${res.data.added_count} materials to your cart!`);
              } else if (res.data.added_count > 0 && res.data.unavailable_items.length > 0) {
                toast(`Added ${res.data.added_count} items. (${res.data.unavailable_items.length} items unavailable)`, { icon: '⚠️' });
              } else {
                toast.error('The items in this order are currently out of stock.');
              }
              return { added: res.data.added_count, unavailable: res.data.unavailable_items.length };
            }
          } catch (err: any) {
            console.warn('[orderStore] Backend reorder failed, falling back to local reorder.', err);
          }
        }

        // Offline / Local reorder fallback
        const order = get().getOrder(orderId);
        if (!order || !order.items || order.items.length === 0) {
          toast.error('No items found in this order');
          return { added: 0, unavailable: 0 };
        }

        const { addToCart } = useCartStore.getState();
        let addedCount = 0;
        let unavailableCount = 0;

        order.items.forEach((item) => {
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
