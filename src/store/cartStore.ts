import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem } from '@/types';
import { apiClient, getAuthToken, BackendCartItem, BackendCartResponse } from '@/lib/api';
import toast from 'react-hot-toast';

export const GST_RATE = 0.18;
export const FREE_DELIVERY_THRESHOLD = 5000;
export const STANDARD_DELIVERY_FEE = 199;

function mapBackendCartToItems(backendItems: BackendCartItem[]): CartItem[] {
  return backendItems.map((bi) => ({
    product: {
      id: bi.product.id,
      name: bi.product.name,
      slug: bi.product.slug,
      brand: bi.product.brand,
      category: '',
      subcategory: '',
      description: '',
      images: bi.product.images && bi.product.images.length > 0
        ? bi.product.images
        : ['https://placehold.co/400?text=HEPNA'],
      price: bi.current_price,
      mrp: bi.product.mrp,
      discount: bi.product.discount,
      unit: bi.product.unit,
      stock: bi.product.stock,
      rating: 4.5,
      reviews: 12,
      deliveryAvailable: true,
      featured: false,
      newArrival: false,
    },
    quantity: bi.quantity,
    priceAtAddition: bi.price_at_addition,
    hasPriceChanged: bi.has_price_changed,
    priceChangeAmount: bi.price_change_amount,
  }));
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  hasPriceChanges: boolean;
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Backend Synchronization
  fetchCart: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  
  // Computed values
  getSubtotal: () => number;
  getItemCount: () => number;
  getTax: () => number;
  getDeliveryCharge: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      hasPriceChanges: false,

      addToCart: async (product: Product, quantity: number = 1) => {
        const token = getAuthToken();
        if (token) {
          try {
            set({ isLoading: true });
            const res = await apiClient.cart.addItem(product.id, quantity);
            if (res.data) {
              const mapped = mapBackendCartToItems(res.data.items);
              set({
                items: mapped,
                hasPriceChanges: res.data.has_price_changes,
                isLoading: false,
              });
            }
          } catch (err: any) {
            set({ isLoading: false });
            toast.error(err.message || 'Failed to add item to cart');
            throw err;
          }
        } else {
          // Guest local cart
          set((state) => {
            const existingItem = state.items.find((item) => item.product.id === product.id);
            if (existingItem) {
              const maxStock = product.stock || 999;
              const newQty = Math.min(existingItem.quantity + quantity, maxStock);
              return {
                items: state.items.map((item) =>
                  item.product.id === product.id
                    ? { ...item, quantity: newQty }
                    : item
                ),
              };
            }
            return {
              items: [
                ...state.items,
                {
                  product,
                  quantity,
                  priceAtAddition: product.price,
                  hasPriceChanged: false,
                  priceChangeAmount: 0,
                },
              ],
            };
          });
        }
      },

      removeFromCart: async (productId: string) => {
        const token = getAuthToken();
        if (token) {
          try {
            set({ isLoading: true });
            const res = await apiClient.cart.removeItem(productId);
            if (res.data) {
              const mapped = mapBackendCartToItems(res.data.items);
              set({
                items: mapped,
                hasPriceChanges: res.data.has_price_changes,
                isLoading: false,
              });
            }
          } catch (err: any) {
            set({ isLoading: false });
            toast.error(err.message || 'Failed to remove item');
          }
        } else {
          set((state) => ({
            items: state.items.filter((item) => item.product.id !== productId),
          }));
        }
      },

      updateQuantity: async (productId: string, quantity: number) => {
        if (quantity <= 0) {
          return get().removeFromCart(productId);
        }

        const token = getAuthToken();
        if (token) {
          try {
            set({ isLoading: true });
            const res = await apiClient.cart.updateQuantity(productId, quantity);
            if (res.data) {
              const mapped = mapBackendCartToItems(res.data.items);
              set({
                items: mapped,
                hasPriceChanges: res.data.has_price_changes,
                isLoading: false,
              });
            }
          } catch (err: any) {
            set({ isLoading: false });
            toast.error(err.message || 'Failed to update quantity');
          }
        } else {
          set((state) => ({
            items: state.items.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
          }));
        }
      },

      clearCart: async () => {
        const token = getAuthToken();
        if (token) {
          try {
            set({ isLoading: true });
            await apiClient.cart.clear();
            set({ items: [], hasPriceChanges: false, isLoading: false });
          } catch {
            set({ items: [], hasPriceChanges: false, isLoading: false });
          }
        } else {
          set({ items: [], hasPriceChanges: false });
        }
      },

      fetchCart: async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
          set({ isLoading: true });
          const res = await apiClient.cart.get();
          if (res.data) {
            const mapped = mapBackendCartToItems(res.data.items);
            set({
              items: mapped,
              hasPriceChanges: res.data.has_price_changes,
              isLoading: false,
            });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      mergeGuestCart: async () => {
        const token = getAuthToken();
        if (!token) return;

        const currentLocalItems = get().items;
        if (currentLocalItems.length === 0) {
          return get().fetchCart();
        }

        try {
          set({ isLoading: true });
          const payload = currentLocalItems.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          }));
          const res = await apiClient.cart.merge(payload);
          if (res.data) {
            const mapped = mapBackendCartToItems(res.data.items);
            set({
              items: mapped,
              hasPriceChanges: res.data.has_price_changes,
              isLoading: false,
            });
          }
        } catch {
          // Fallback to fetch cart
          await get().fetchCart();
        }
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
      getTax: () => {
        return Math.round(get().getSubtotal() * GST_RATE * 100) / 100;
      },
      getDeliveryCharge: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        return subtotal > FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
      },
      getTotal: () => {
        return get().getSubtotal() + get().getTax() + get().getDeliveryCharge();
      },
    }),
    {
      name: 'hepna-cart',
    }
  )
);
