import React, { useState } from 'react';
import { Boxes, Search, AlertTriangle, CheckCircle2, TrendingDown, RefreshCw } from 'lucide-react';
import { products } from '@/data/products';
import { formatPrice } from '@/utils/formatPrice';

const AdminInventoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    if (filterLowStockOnly) {
      return matchesSearch && p.stock && p.stock < 150;
    }
    return matchesSearch;
  });

  const lowStockCount = products.filter((p) => p.stock && p.stock < 150).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-black text-slate-900">
          Inventory & Central Yard Stock
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time warehouse inventory, restock thresholds, and construction materials tracking
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 block">Total Tracked SKUs</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{products.length}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 block">Low Stock Alerts</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{lowStockCount} SKUs</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 block">Primary Logistics Yard</span>
          <div className="text-sm font-black text-[#071A2B] mt-1">Pune Central Yard (Hinjawadi)</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory items..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-accent"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
          <input
            type="checkbox"
            checked={filterLowStockOnly}
            onChange={(e) => setFilterLowStockOnly(e.target.checked)}
            className="rounded text-accent focus:ring-accent w-4 h-4"
          />
          <span>Show Low Stock Only ({lowStockCount})</span>
        </label>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Item & SKU</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center">Min Threshold</th>
                <th className="py-3.5 px-4 text-right">Unit Value</th>
                <th className="py-3.5 px-4 text-right">Total Valuation</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const stock = item.stock || 0;
                const isLow = stock < 150;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block font-bold">{item.name}</strong>
                      <span className="text-slate-400 text-[11px]">{item.brand} • SKU-{item.id.toUpperCase()}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-900 text-sm">
                      {stock} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-semibold">
                      150 {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {formatPrice(item.price)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatPrice(item.price * stock)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Reorder Warning</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Adequate</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminInventoryPage;
