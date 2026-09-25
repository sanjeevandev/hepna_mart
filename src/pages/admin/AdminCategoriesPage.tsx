import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Search, Eye, Package, Tag, ArrowRight, RefreshCw } from 'lucide-react';
import { categories as defaultCategories } from '@/data/categories';
import { products as defaultProducts } from '@/data/products';
import { catalogService } from '@/services/catalogService';
import { Category, Product } from '@/types';
import { Link } from 'react-router-dom';

export const AdminCategoriesPage: React.FC = () => {
  const [categoriesList, setCategoriesList] = useState<Category[]>(defaultCategories);
  const [productsList, setProductsList] = useState<Product[]>(defaultProducts);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, prodsRes] = await Promise.all([
        catalogService.getCategories(false),
        catalogService.getProducts({ page_size: 100 }),
      ]);
      if (cats && cats.length > 0) {
        setCategoriesList(cats);
      }
      if (prodsRes && prodsRes.products.length > 0) {
        setProductsList(prodsRes.products);
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCategories = categoriesList.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-black text-slate-900">
              Material Categories & Taxonomy
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
              {categoriesList.length} Categories
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage product category taxonomy, subcategory assignments, and catalog hierarchy
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : 'text-slate-400'}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const categoryProducts = productsList.filter((p) => p.category === cat.slug);

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-accent/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    {categoryProducts.length > 0 ? categoryProducts.length : (cat.productCount || 0)} SKUs in Catalog
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                {/* Subcategories tags */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Subcategories
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cat.subcategories.map((sub) => (
                      <span
                        key={sub}
                        className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Slug: /{cat.slug}
                </span>
                <Link
                  to={`/category/${cat.slug}`}
                  target="_blank"
                  className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                >
                  <span>Store View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
