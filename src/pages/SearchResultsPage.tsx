import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSearchStore } from '@/store/searchStore';
import { filterProducts } from '@/utils/helpers';
import { products as defaultProducts } from '@/data/products';
import { catalogService } from '@/services/catalogService';
import { Product } from '@/types';
import ProductFilters from '@/components/product/ProductFilters';
import ProductGrid from '@/components/product/ProductGrid';
import { Filter, Search } from 'lucide-react';
import Button from '@/components/ui/Button';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const { setQuery, filters } = useSearchStore();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [allProductsList, setAllProductsList] = useState<Product[]>(defaultProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setQuery(queryParam);
  }, [queryParam, setQuery]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    catalogService.getProducts({ page_size: 100 }).then((res) => {
      if (mounted && res && res.products.length > 0) {
        setAllProductsList(res.products);
      }
      if (mounted) setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = filterProducts(allProductsList, queryParam, filters);

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Search Results for "{queryParam}"
        </h1>
        <p className="text-gray-600 mt-2">
          {loading ? 'Searching catalog...' : `Found ${filteredProducts.length} ${filteredProducts.length === 1 ? 'result' : 'results'}`}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden">
          <Button 
            variant="outline" 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 w-full justify-center mb-4"
          >
            <Filter size={20} />
            Filters
          </Button>
        </div>

        {/* Sidebar Filters */}
        <aside className={`w-full md:w-1/4 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          <div className="sticky top-24">
            <ProductFilters
              products={allProductsList}
              currentFilters={filters}
              onFilterChange={useSearchStore.getState().setFilters}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="w-full md:w-3/4">
          {filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                  <Search size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No results found for "{queryParam}"</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Try checking your spelling or use more general terms. You can also explore our categories.
              </p>
              <Link to="/categories">
                <Button variant="primary">Browse Categories</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResultsPage;
