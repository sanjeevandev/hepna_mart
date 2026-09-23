import { create } from 'zustand';
import { SearchFilters } from '@/types';

interface SearchState {
  query: string;
  filters: SearchFilters;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  resetSearch: () => void;
}

const initialFilters: SearchFilters = {};

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  filters: initialFilters,
  setQuery: (query: string) => set({ query }),
  setFilters: (newFilters: Partial<SearchFilters>) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  clearFilters: () => set({ filters: initialFilters }),
  resetSearch: () => set({ query: '', filters: initialFilters }),
}));
