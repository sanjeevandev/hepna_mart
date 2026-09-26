import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, getAuthToken } from '@/lib/api';
import toast from 'react-hot-toast';

interface WishlistState {
  items: string[];
  isLoading: boolean;
  
  // Actions
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  
  // Backend Synchronization
  fetchWishlist: () => Promise<void>;
  mergeGuestWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      toggleWishlist: async (productId: string) => {
        const token = getAuthToken();
        const currentlyWishlisted = get().items.includes(productId);

        if (token) {
          try {
            set({ isLoading: true });
            if (currentlyWishlisted) {
              const res = await apiClient.wishlist.removeItem(productId);
              set({
                items: res.data?.product_ids || get().items.filter((id) => id !== productId),
                isLoading: false,
              });
            } else {
              const res = await apiClient.wishlist.addItem(productId);
              set({
                items: res.data?.product_ids || [...get().items, productId],
                isLoading: false,
              });
            }
          } catch (err: any) {
            set({ isLoading: false });
            toast.error(err.message || 'Unable to update wishlist');
          }
        } else {
          // Guest local wishlist
          set((state) => {
            if (state.items.includes(productId)) {
              return { items: state.items.filter((id) => id !== productId) };
            }
            return { items: [...state.items, productId] };
          });
        }
      },

      isWishlisted: (productId: string) => {
        return get().items.includes(productId);
      },

      clearWishlist: async () => {
        set({ items: [] });
      },

      fetchWishlist: async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
          set({ isLoading: true });
          const res = await apiClient.wishlist.get();
          if (res.data) {
            set({
              items: res.data.product_ids || [],
              isLoading: false,
            });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      mergeGuestWishlist: async () => {
        const token = getAuthToken();
        if (!token) return;

        const localIds = get().items;
        if (localIds.length === 0) {
          return get().fetchWishlist();
        }

        try {
          set({ isLoading: true });
          const res = await apiClient.wishlist.merge(localIds);
          if (res.data) {
            set({
              items: res.data.product_ids || [],
              isLoading: false,
            });
          }
        } catch {
          await get().fetchWishlist();
        }
      },
    }),
    {
      name: 'hepna-wishlist',
    }
  )
);
