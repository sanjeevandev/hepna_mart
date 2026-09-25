import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearchStore } from '@/store/searchStore';
import { filterProducts } from '@/utils/helpers';
import { products } from '@/data/products';
import ProductFilters from '@/components/product/ProductFilters';
import ProductGrid from '@/components/product/ProductGrid';
import SectionReveal from '@/components/ui/SectionReveal';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Filter, Grid, List, RotateCcw, Package, Search } from 'lucide-react';
import Button from '@/components/ui/Button';

const ShopPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { filters, query, setFilters, setQuery, clearFilters } = useSearchStore();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Synchronize URL search params (e.g. /shop?q=cement or /shop?category=cement-concrete)
  useEffect(() => {
    window.scrollTo(0, 0);
    const urlQuery = searchParams.get('q');
    const urlCategory = searchParams.get('category');

    if (urlQuery !== null && urlQuery !== query) {
      setQuery(urlQuery);
    }
    if (urlCategory && urlCategory !== filters.category) {
      setFilters({ ...filters, category: urlCategory });
    }
  }, [searchParams]);

  // Safe product filtering
  const safeProducts = Array.isArray(products) ? products : [];
  const filteredProducts = filterProducts(safeProducts, filters, query);

  const activeFilterCount = Object.keys(filters).filter(
    (k) => filters[k as keyof typeof filters] !== undefined && filters[k as keyof typeof filters] !== ''
  ).length + (query ? 1 : 0);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 sm:py-10">
      <div className="container-custom">
        {/* Page Header Banner */}
        <SectionReveal variant="hero">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
            <div>
              <ScrollReveal
                baseOpacity={0.2}
                baseRotation={1.5}
                blurStrength={4}
                as="h1"
                containerClassName="m-0"
                textClassName="text-2xl sm:text-3xl font-heading font-black text-[#071A2B]"
              >
                Construction Materials Catalog
              </ScrollReveal>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Showing {filteredProducts.length} of {safeProducts.length} certified supplies
                {query && (
                  <span>
                    {' '}
                    for query &ldquo;<strong className="text-gray-900">{query}</strong>&rdquo;
                  </span>
                )}
              </p>
            </div>

            {/* Quick Actions & Clear */}
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    clearFilters();
                    setQuery('');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-accent flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All ({activeFilterCount})</span>
                </button>
              )}

              {/* View Mode Switcher */}
              <div className="hidden sm:flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-[#071A2B] text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-[#071A2B] text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  aria-label="List view"
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </SectionReveal>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile Filter Toggle Button */}
          <div className="md:hidden flex justify-between items-center mb-2">
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2 text-xs font-bold"
            >
              <Filter size={16} />
              <span>{showMobileFilters ? 'Close Filters' : `Filters (${activeFilterCount})`}</span>
            </Button>

            <div className="text-xs font-bold text-gray-600">
              {filteredProducts.length} Supplies
            </div>
          </div>

          {/* Sidebar Filter Component */}
          <aside className={`w-full md:w-1/4 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
            <div className="sticky top-24">
              <ProductFilters
                products={safeProducts}
                currentFilters={filters}
                onFilterChange={setFilters}
              />
            </div>
          </aside>

          {/* Main Product Grid Content */}
          <main className="w-full md:w-3/4">
            <SectionReveal variant="product">
              {filteredProducts.length > 0 ? (
                <ProductGrid
                  products={filteredProducts}
                  columns={viewMode === 'list' ? 2 : 3}
                  withGlow={false}
                />
              ) : (
                /* Clean Empty Results State */
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-orange-50 text-accent mx-auto flex items-center justify-center mb-4">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No matching materials found</h3>
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    We couldn't find any products matching your current search or filter combination.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      clearFilters();
                      setQuery('');
                    }}
                    className="px-6 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-accent/20"
                  >
                    Clear All Filters & Search
                  </button>
                </div>
              )}
            </SectionReveal>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
