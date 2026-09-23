import React, { useState } from 'react';
import { SearchFilters, Product, SortOption } from '@/types';
import Button from '@/components/ui/Button';

interface ProductFiltersProps {
  onFilterChange: (filters: SearchFilters) => void;
  currentFilters: SearchFilters;
  products: Product[];
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ onFilterChange, currentFilters, products }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  const brands = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);

  const handleClear = () => {
    onFilterChange({});
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFilterChange({ ...currentFilters, [key]: value });
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-lg text-primary-dark">Filters</h3>
        <button onClick={handleClear} className="text-sm text-accent hover:text-accent-dark font-medium transition-colors">
          Clear All
        </button>
      </div>
      
      <div className="md:hidden mb-4">
        <Button variant="outline" fullWidth onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} md:block space-y-6`}>
        {/* Sort By */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">Sort By</h4>
          <select 
            className="input-field w-full text-sm border-gray-300 rounded-md focus:border-primary focus:ring-primary py-2"
            value={currentFilters.sortBy || 'relevance'}
            onChange={(e) => updateFilter('sortBy', e.target.value as SortOption)}
          >
            <option value="relevance">Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest Arrivals</option>
            <option value="discount">Biggest Discount</option>
          </select>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Category</h4>
            <select 
              className="input-field w-full text-sm border-gray-300 rounded-md py-2"
              value={currentFilters.category || ''}
              onChange={(e) => updateFilter('category', e.target.value || undefined)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Brands */}
        {brands.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Brands</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {brands.map(brand => (
                <label key={brand} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="brand"
                    className="text-primary focus:ring-primary w-4 h-4"
                    checked={currentFilters.brand === brand}
                    onChange={() => updateFilter('brand', brand)}
                  />
                  <span className="group-hover:text-primary-dark transition-colors">{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">Price Range</h4>
          <div className="space-y-2">
            {[
              { label: 'Under ₹500', value: '0-500' },
              { label: '₹500 - ₹2000', value: '500-2000' },
              { label: '₹2000 - ₹5000', value: '2000-5000' },
              { label: '₹5000 - ₹10000', value: '5000-10000' },
              { label: 'Above ₹10000', value: '10000-1000000' },
            ].map(range => (
              <label key={range.value} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer group">
                <input 
                  type="radio" 
                  name="priceRange"
                  className="text-primary focus:ring-primary w-4 h-4"
                  checked={currentFilters.priceRange === range.value}
                  onChange={() => updateFilter('priceRange', range.value)}
                />
                <span className="group-hover:text-primary-dark transition-colors">{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">Rating</h4>
          <div className="space-y-2">
            {[4, 3, 2].map(rating => (
              <label key={rating} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer group">
                <input 
                  type="radio" 
                  name="rating"
                  className="text-primary focus:ring-primary w-4 h-4"
                  checked={currentFilters.rating === rating}
                  onChange={() => updateFilter('rating', rating)}
                />
                <span className="group-hover:text-primary-dark transition-colors">{rating}★ & above</span>
              </label>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-800 font-semibold cursor-pointer">
            <input 
              type="checkbox"
              className="rounded text-primary focus:ring-primary w-4 h-4"
              checked={currentFilters.inStock || false}
              onChange={(e) => updateFilter('inStock', e.target.checked)}
            />
            <span>In Stock Only</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
