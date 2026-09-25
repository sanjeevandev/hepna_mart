import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, Search, Plus, Filter, Tag, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { products as defaultProducts } from '@/data/products';
import { categories as defaultCategories } from '@/data/categories';
import { catalogService } from '@/services/catalogService';
import { Product, Category } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

const AdminProductsPage: React.FC = () => {
  const [productsList, setProductsList] = useState<Product[]>(defaultProducts);
  const [categoriesList, setCategoriesList] = useState<Category[]>(defaultCategories);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        catalogService.getProducts({ page_size: 100 }),
        catalogService.getCategories(false),
      ]);
      if (prodsRes && prodsRes.products.length > 0) {
        setProductsList(prodsRes.products);
      }
      if (catsRes && catsRes.length > 0) {
        setCategoriesList(catsRes);
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

  const uniqueCategories = useMemo(() => {
    const map = new Map<string, string>();
    categoriesList.forEach((c) => map.set(c.slug, c.name));
    productsList.forEach((p) => {
      if (!map.has(p.category)) {
        map.set(p.category, p.category.replace(/-/g, ' ').toUpperCase());
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [categoriesList, productsList]);

  const filteredProducts = useMemo(() => {
    let list = [...productsList];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'ALL') {
      list = list.filter((p) => p.category === categoryFilter);
    }
    return list;
  }, [productsList, searchQuery, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-black text-slate-900">
              Product Catalog Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
              {productsList.length} SKUs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage construction materials, live rates, bulk tiers, and stock availability
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title, brand, category..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-accent"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-accent w-full sm:w-auto"
        >
          <option value="ALL">All Categories ({productsList.length})</option>
          {uniqueCategories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Material & Brand</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Standard Rate</th>
                <th className="py-3.5 px-4 text-right">Wholesale Tier</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.images?.[0] || 'https://placehold.co/40?text=HEPNA'}
                        alt={prod.name}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0"
                      />
                      <div>
                        <strong className="text-slate-900 font-bold block">{prod.name}</strong>
                        <span className="text-slate-500 text-[11px]">Brand: {prod.brand}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">
                      {prod.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatPrice(prod.price)}
                    <span className="text-[10px] text-slate-400 block font-normal">/{prod.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {prod.bulkPrice ? (
                      <div>
                        <strong className="text-emerald-700 font-bold">{formatPrice(prod.bulkPrice)}</strong>
                        <span className="text-[10px] text-slate-400 block">Min: {prod.minimumBulkQuantity} {prod.unit}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-bold">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] ${
                        !prod.stock || prod.stock <= 0
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : prod.stock < 150
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {prod.stock || 0} {prod.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;
