import React, { useEffect, useState } from 'react';
import { useSearchStore } from '@/store/searchStore';
import { filterProducts } from '@/utils/helpers';
import { products } from '@/data/products';
import ProductFilters from '@/components/product/ProductFilters';
import ProductGrid from '@/components/product/ProductGrid';
import SectionReveal from '@/components/ui/SectionReveal';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Filter, Grid, List } from 'lucide-react';
import Button from '@/components/ui/Button';

const ShopPage: React.FC = () => {
  const { filters, query, setFilters } = useSearchStore();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredProducts = filterProducts(products, query, filters);

  return (
    <div className="container-custom py-8">
      <SectionReveal variant="hero">
        <div className="flex items-center justify-between mb-8">
          <ScrollReveal
            baseOpacity={0.2}
            baseRotation={2}
            blurStrength={4}
            as="h1"
            containerClassName="m-0"
            textClassName="text-3xl font-heading font-bold text-primary"
          >
            Shop Materials
          </ScrollReveal>
          <div className="text-gray-600 hidden md:block">
            Showing {filteredProducts.length} results
          </div>
        </div>
      </SectionReveal>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <Button 
            variant="outline" 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={20} />
            Filters
          </Button>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-200'}`}
              aria-label="Grid view"
            >
              <Grid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-200'}`}
              aria-label="List view"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Sidebar Filters */}
        <aside className={`w-full md:w-1/4 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          <div className="sticky top-24">
            <ProductFilters />
          </div>
        </aside>

        {/* Main Content */}
        <main className="w-full md:w-3/4">
          <div className="hidden md:flex justify-end gap-2 mb-6">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-200'}`}
              aria-label="Grid view"
            >
              <Grid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-200'}`}
              aria-label="List view"
            >
              <List size={20} />
            </button>
          </div>
          
          <SectionReveal variant="product">
            {filteredProducts.length > 0 ? (
              <ProductGrid products={filteredProducts} />
            ) : (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No products found</h2>
                <p className="text-gray-600">Try adjusting your filters or search query.</p>
                <Button 
                  className="mt-6"
                  onClick={() => setFilters({})}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </SectionReveal>
        </main>
      </div>
    </div>
  );
};

export default ShopPage;
