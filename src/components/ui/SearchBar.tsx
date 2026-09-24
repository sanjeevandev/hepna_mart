import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, ArrowUpRight, Sparkles, Building2, Package, Tag } from 'lucide-react';
import { products } from '@/data/products';
import { categories } from '@/data/categories';
import { formatPrice } from '@/utils/formatPrice';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const RECENT_SEARCHES_KEY = 'hepna_recent_searches';
const MAX_RECENTS = 5;

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search 60+ construction products, cement, tools, steel...',
  className = '',
  autoFocus = false,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENTS);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== termToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearAllRecents = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedQuery = value.trim().toLowerCase();

  // Instant Suggestions computation
  const { matchedCategories, matchedBrands, matchedProducts } = useMemo(() => {
    if (!trimmedQuery) {
      return { matchedCategories: [], matchedBrands: [], matchedProducts: [] };
    }

    // Match categories
    const matchedCats = categories
      .filter(
        (c) =>
          c.name.toLowerCase().includes(trimmedQuery) ||
          c.subcategories.some((sc) => sc.toLowerCase().includes(trimmedQuery))
      )
      .slice(0, 3);

    // Match brands
    const allBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
    const matchedBr = allBrands
      .filter((b) => b.toLowerCase().includes(trimmedQuery))
      .slice(0, 3);

    // Match products by name, brand, category, subcategory, or specifications
    const matchedProds = products
      .filter((p) => {
        if (p.name.toLowerCase().includes(trimmedQuery)) return true;
        if (p.brand.toLowerCase().includes(trimmedQuery)) return true;
        if (p.category.toLowerCase().includes(trimmedQuery)) return true;
        if (p.subcategory.toLowerCase().includes(trimmedQuery)) return true;
        if (p.description.toLowerCase().includes(trimmedQuery)) return true;
        if (
          p.specifications &&
          Object.values(p.specifications).some((spec) =>
            spec.toLowerCase().includes(trimmedQuery)
          )
        ) {
          return true;
        }
        return false;
      })
      .slice(0, 5);

    return {
      matchedCategories: matchedCats,
      matchedBrands: matchedBr,
      matchedProducts: matchedProds,
    };
  }, [trimmedQuery]);

  // Featured / Popular fallback items when query is empty
  const popularCategories = useMemo(() => categories.slice(0, 4), []);
  const popularProducts = useMemo(() => products.filter((p) => p.featured).slice(0, 3), []);

  const handleExecuteSearch = (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;
    saveRecentSearch(term);
    onChange(term);
    onSearch(term);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSearch(value);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleProductClick = (slug: string, productName: string) => {
    saveRecentSearch(productName);
    setIsOpen(false);
    navigate(`/product/${slug}`);
  };

  const handleCategoryClick = (categorySlug: string, categoryName: string) => {
    saveRecentSearch(categoryName);
    setIsOpen(false);
    navigate(`/category/${categorySlug}`);
  };

  const handleBrandClick = (brandName: string) => {
    handleExecuteSearch(brandName);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4.5 w-4.5 text-gray-400 group-focus-within:text-accent" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="block w-full pl-10 pr-10 py-2.5 bg-white text-gray-900 placeholder-gray-400 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent shadow-sm transition-all"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          autoFocus={autoFocus}
        />
        {value && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search input"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Advanced Search Overlay Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-gray-900 animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-gray-100 max-h-[82vh] overflow-y-auto">
          {trimmedQuery ? (
            /* --- STATE A: User is typing (Instant Suggestions) --- */
            <div className="p-3 sm:p-4 space-y-4">
              {/* Category Matches */}
              {matchedCategories.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-2">
                    <Building2 className="w-3.5 h-3.5 text-accent" />
                    <span>Matching Categories</span>
                  </div>
                  <div className="flex flex-wrap gap-2 px-1">
                    {matchedCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.slug, cat.name)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-accent font-semibold text-xs transition-colors border border-orange-200/50"
                      >
                        <span>{cat.name}</span>
                        <ArrowUpRight className="w-3 h-3 text-accent" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand Matches */}
              {matchedBrands.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-2">
                    <Tag className="w-3.5 h-3.5 text-accent" />
                    <span>Matching Brands</span>
                  </div>
                  <div className="flex flex-wrap gap-2 px-1">
                    {matchedBrands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => handleBrandClick(brand)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
                      >
                        <Search className="w-2.5 h-2.5 text-gray-400" />
                        <span>{brand}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Matches */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-2">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-accent" />
                    <span>Matching Products</span>
                  </div>
                  <span className="text-[11px] font-normal text-gray-400 lowercase">
                    {matchedProducts.length} items found
                  </span>
                </div>

                {matchedProducts.length > 0 ? (
                  <div className="space-y-1">
                    {matchedProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleProductClick(p.slug, p.name)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.images?.[0] || 'https://placehold.co/100?text=HEPNA'}
                            alt={p.name}
                            className="w-11 h-11 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100"
                          />
                          <div className="min-w-0">
                            <div className="text-xs text-gray-400 uppercase font-semibold">
                              {p.brand} • {p.subcategory || p.category}
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-accent transition-colors">
                              {p.name}
                            </h4>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <div className="text-sm font-bold text-accent">
                            {formatPrice(p.price)}
                          </div>
                          {p.deliveryAvailable && (
                            <div className="text-[10px] text-emerald-600 font-medium">
                              🚚 Site Delivery
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-gray-500">
                    No exact product matches found. Press Enter to browse all results.
                  </div>
                )}
              </div>

              {/* View All CTA */}
              <button
                type="button"
                onClick={() => handleExecuteSearch(value)}
                className="w-full mt-2 py-2.5 px-4 bg-[#071A2B] hover:bg-[#0B2742] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-accent" />
                <span>View all search results for &ldquo;{value}&rdquo;</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* --- STATE B: Focused without typing (Recents & Popular) --- */
            <div className="p-4 space-y-4">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      onClick={clearAllRecents}
                      className="text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        onClick={() => handleExecuteSearch(term)}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer transition-colors"
                      >
                        <Search className="w-3 h-3 text-gray-400 group-hover:text-accent" />
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, term)}
                          className="text-gray-400 hover:text-gray-600 ml-1 p-0.5"
                          aria-label={`Remove ${term}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Categories */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  <Building2 className="w-3.5 h-3.5 text-accent" />
                  <span>Popular Categories</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {popularCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.slug, cat.name)}
                      className="p-2.5 rounded-xl border border-gray-100 hover:border-accent/40 bg-gray-50/70 hover:bg-orange-50/50 text-left transition-all group"
                    >
                      <div className="text-xs font-bold text-gray-900 group-hover:text-accent truncate">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {cat.productCount}+ items
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Products */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Trending Supplies</span>
                </div>
                <div className="space-y-1">
                  {popularProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleProductClick(p.slug, p.name)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.images?.[0] || 'https://placehold.co/100?text=HEPNA'}
                          alt={p.name}
                          className="w-9 h-9 rounded-md object-cover bg-gray-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-accent">
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-gray-400">
                            {p.brand}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-accent shrink-0 pl-2">
                        {formatPrice(p.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
