import React, { useState } from 'react';
import { SearchFilters, Product, SortOption } from '@/types';
import { products as allProducts } from '@/data/products';
import { useSearchStore } from '@/store/searchStore';
import { Filter, X, RotateCcw, Check } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ProductFiltersProps {
  onFilterChange?: (filters: SearchFilters) => void;
  currentFilters?: SearchFilters;
  products?: Product[];
}

const PRICE_RANGES: { label: string; range: [number, number] }[] = [
  { label: 'All Prices', range: [0, 1000000] },
  { label: 'Under ₹500', range: [0, 500] },
  { label: '₹500 - ₹2,000', range: [500, 2000] },
  { label: '₹2,000 - ₹5,000', range: [2000, 5000] },
  { label: '₹5,000 - ₹10,000', range: [5000, 10000] },
  { label: 'Above ₹10,000', range: [10000, 1000000] },
];

const ProductFilters: React.FC<ProductFiltersProps> = ({
  onFilterChange,
  currentFilters,
  products = allProducts,
}) => {
  const store = useSearchStore();
  const [isOpen, setIsOpen] = useState(false);

  const activeFilters = currentFilters || store.filters || {};
  const handleFilterUpdate = onFilterChange || store.setFilters;
  const productList = products && products.length > 0 ? products : allProducts;

  const categories = Array.from(new Set(productList.map((p) => p.category))).filter(Boolean);
  const brands = Array.from(new Set(productList.map((p) => p.brand))).filter(Boolean);

  const handleClear = () => {
    if (onFilterChange) {
      onFilterChange({});
    } else {
      store.clearFilters();
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    handleFilterUpdate({ ...activeFilters, [key]: value });
  };

  const activeCount = Object.keys(activeFilters).filter(
    (k) => activeFilters[k as keyof SearchFilters] !== undefined && activeFilters[k as keyof SearchFilters] !== ''
  ).length;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-bold text-base text-[#071A2B]">Filter Supplies</h3>
          {activeCount > 0 && (
            <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-accent hover:text-accent-dark font-bold transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="md:hidden mb-4">
        <Button variant="outline" fullWidth onClick={() => setIsOpen(!isOpen)} className="text-xs font-bold">
          <Filter className="w-3.5 h-3.5 mr-2" />
          <span>{isOpen ? 'Hide Filter Panel' : 'Show Filter Panel'}</span>
        </Button>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} md:block space-y-6 text-xs sm:text-sm`}>
        {/* Sort By */}
        <div>
          <label className="block font-bold text-gray-800 mb-2 text-xs uppercase tracking-wider text-slate-400">
            Sort Order
          </label>
          <select
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            value={activeFilters.sortBy || 'relevance'}
            onChange={(e) => updateFilter('sortBy', e.target.value as SortOption)}
          >
            <option value="relevance">Most Relevant / Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Customer Rating</option>
            <option value="newest">Newest Arrivals</option>
            <option value="discount">Biggest Discount (%)</option>
          </select>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <label className="block font-bold text-gray-800 mb-2 text-xs uppercase tracking-wider text-slate-400">
              Category
            </label>
            <select
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent capitalize"
              value={activeFilters.category || ''}
              onChange={(e) => updateFilter('category', e.target.value || undefined)}
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/-/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Brands */}
        {brands.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-bold text-gray-800 text-xs uppercase tracking-wider text-slate-400">
                Brand
              </label>
              {activeFilters.brand && (
                <button
                  onClick={() => updateFilter('brand', undefined)}
                  className="text-[10px] text-gray-400 hover:text-red-500"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-xs font-medium text-gray-700">
                <input
                  type="radio"
                  name="brand"
                  className="text-accent focus:ring-accent w-3.5 h-3.5"
                  checked={!activeFilters.brand}
                  onChange={() => updateFilter('brand', undefined)}
                />
                <span>All Brands</span>
              </label>
              {brands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-xs font-medium text-gray-700"
                >
                  <input
                    type="radio"
                    name="brand"
                    className="text-accent focus:ring-accent w-3.5 h-3.5"
                    checked={activeFilters.brand === brand}
                    onChange={() => updateFilter('brand', brand)}
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        <div>
          <label className="block font-bold text-gray-800 mb-2 text-xs uppercase tracking-wider text-slate-400">
            Price Range
          </label>
          <div className="space-y-1.5">
            {PRICE_RANGES.map((item, idx) => {
              const isSelected =
                activeFilters.priceRange &&
                activeFilters.priceRange[0] === item.range[0] &&
                activeFilters.priceRange[1] === item.range[1];

              return (
                <label
                  key={idx}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 cursor-pointer text-xs text-gray-700 font-medium"
                >
                  <input
                    type="radio"
                    name="priceRange"
                    className="text-accent focus:ring-accent w-3.5 h-3.5"
                    checked={isSelected || (!activeFilters.priceRange && idx === 0)}
                    onChange={() => updateFilter('priceRange', idx === 0 ? undefined : item.range)}
                  />
                  <span>{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Minimum Rating */}
        <div>
          <label className="block font-bold text-gray-800 mb-2 text-xs uppercase tracking-wider text-slate-400">
            Customer Rating
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[4, 3, 2].map((r) => {
              const isSelected = activeFilters.rating === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => updateFilter('rating', isSelected ? undefined : r)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 select-none ${
                    isSelected
                      ? 'border-accent bg-accent text-white hover:bg-accent-dark'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  ★ {r}+
                </button>
              );
            })}
          </div>
        </div>

        {/* Checkbox Toggles: In Stock & Wholesale */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-800 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded text-accent focus:ring-accent w-4 h-4 cursor-pointer"
              checked={activeFilters.inStock || false}
              onChange={(e) => updateFilter('inStock', e.target.checked ? true : undefined)}
            />
            <span>In Stock Supplies Only</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-gray-800 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded text-accent focus:ring-accent w-4 h-4 cursor-pointer"
              checked={activeFilters.wholesale || false}
              onChange={(e) => updateFilter('wholesale', e.target.checked ? true : undefined)}
            />
            <span>Bulk Project Discount Available</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
