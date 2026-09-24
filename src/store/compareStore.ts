import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';
import toast from 'react-hot-toast';

interface CompareState {
  items: Product[];
  isModalOpen: boolean;
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  toggleCompare: (product: Product) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  setModalOpen: (open: boolean) => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      isModalOpen: false,

      addToCompare: (product: Product) => {
        const { items } = get();
        if (items.some((item) => item.id === product.id)) {
          toast('Product is already in comparison', { icon: 'ℹ️' });
          return false;
        }
        if (items.length >= 4) {
          toast.error('You can compare up to 4 products at a time');
          return false;
        }
        set({ items: [...items, product] });
        toast.success(`Added ${product.name} to compare list`);
        return true;
      },

      removeFromCompare: (productId: string) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
        toast.success('Removed from compare list');
      },

      toggleCompare: (product: Product) => {
        const { items, addToCompare, removeFromCompare } = get();
        if (items.some((item) => item.id === product.id)) {
          removeFromCompare(product.id);
        } else {
          addToCompare(product);
        }
      },

      isInCompare: (productId: string) => {
        return get().items.some((item) => item.id === productId);
      },

      clearCompare: () => {
        set({ items: [], isModalOpen: false });
        toast.success('Cleared compare list');
      },

      setModalOpen: (open: boolean) => {
        set({ isModalOpen: open });
      },
    }),
    {
      name: 'hepna-compare',
    }
  )
);
