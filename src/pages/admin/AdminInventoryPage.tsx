import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Boxes, Search, AlertTriangle, CheckCircle2, TrendingDown, RefreshCw, Edit3, Save, X } from 'lucide-react';
import { products as defaultProducts } from '@/data/products';
import { catalogService } from '@/services/catalogService';
import apiClient, { BackendInventoryListItem } from '@/lib/api';
import { Product } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

interface InventoryDisplayRow {
  productId: string;
  name: string;
  brand: string;
  category: string;
  sku: string;
  unit: string;
  price: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  warehouse: string;
  isLow: boolean;
}

const AdminInventoryPage: React.FC = () => {
  const [inventoryList, setInventoryList] = useState<InventoryDisplayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editThreshold, setEditThreshold] = useState<number>(150);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      // First try live backend inventory endpoint
      const invRes = await apiClient.inventory.list(false);
      if (invRes.data && Array.isArray(invRes.data) && invRes.data.length > 0) {
        // We have backend inventory items
        const prodsRes = await catalogService.getProducts({ page_size: 100 });
        const prodsMap = new Map<string, Product>();
        prodsRes.products.forEach((p) => prodsMap.set(p.id, p));

        const rows: InventoryDisplayRow[] = invRes.data.map((inv) => {
          const prod = prodsMap.get(inv.product_id);
          const name = inv.product_name || prod?.name || 'Material Item';
          const brand = prod?.brand || 'Hepna Verified';
          const category = inv.category_name || prod?.category || 'General';
          const sku = inv.product_sku || `SKU-${inv.product_id.slice(0, 8).toUpperCase()}`;
          const unit = prod?.unit || 'Units';
          const price = prod?.price || 0;
          const isLow = inv.available_quantity <= inv.low_stock_threshold;

          return {
            productId: inv.product_id,
            name,
            brand,
            category,
            sku,
            unit,
            price,
            quantity: inv.quantity,
            reservedQuantity: inv.reserved_quantity,
            availableQuantity: inv.available_quantity,
            lowStockThreshold: inv.low_stock_threshold,
            warehouse: inv.warehouse || 'Pune Central Yard',
            isLow,
          };
        });
        setInventoryList(rows);
        setLoading(false);
        return;
      }
    } catch {
      // Backend not running or auth failed, fall back to local products
    }

    // Fallback: construct from catalogService products
    try {
      const prodsRes = await catalogService.getProducts({ page_size: 100 });
      const prods = prodsRes.products.length > 0 ? prodsRes.products : defaultProducts;
      const rows: InventoryDisplayRow[] = prods.map((p) => {
        const qty = p.stock !== undefined ? p.stock : 100;
        const isLow = qty < 150;
        return {
          productId: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          sku: `SKU-${p.id.toUpperCase()}`,
          unit: p.unit,
          price: p.price,
          quantity: qty,
          reservedQuantity: 0,
          availableQuantity: qty,
          lowStockThreshold: 150,
          warehouse: 'Pune Central Yard (Hinjawadi)',
          isLow,
        };
      });
      setInventoryList(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartEdit = (row: InventoryDisplayRow) => {
    setEditingId(row.productId);
    setEditQty(row.quantity);
    setEditThreshold(row.lowStockThreshold);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (productId: string) => {
    setSaving(true);
    setActionMessage(null);
    try {
      const res = await apiClient.inventory.update(productId, {
        quantity: editQty,
        low_stock_threshold: editThreshold,
      });

      if (res.ok) {
        setInventoryList((prev) =>
          prev.map((row) => {
            if (row.productId === productId) {
              const updatedQty = res.data?.quantity ?? editQty;
              const updatedThreshold = res.data?.low_stock_threshold ?? editThreshold;
              const avail = res.data?.available_quantity ?? (updatedQty - row.reservedQuantity);
              return {
                ...row,
                quantity: updatedQty,
                availableQuantity: avail,
                lowStockThreshold: updatedThreshold,
                isLow: avail <= updatedThreshold,
              };
            }
            return row;
          })
        );
        setActionMessage({ type: 'success', text: 'Stock updated successfully.' });
      }
    } catch (err: any) {
      // If offline, update locally
      setInventoryList((prev) =>
        prev.map((row) => {
          if (row.productId === productId) {
            const avail = editQty - row.reservedQuantity;
            return {
              ...row,
              quantity: editQty,
              availableQuantity: avail,
              lowStockThreshold: editThreshold,
              isLow: avail <= editThreshold,
            };
          }
          return row;
        })
      );
      setActionMessage({ type: 'success', text: 'Stock level updated in local session.' });
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const filtered = useMemo(() => {
    return inventoryList.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase());
      if (filterLowStockOnly) {
        return matchesSearch && item.isLow;
      }
      return matchesSearch;
    });
  }, [inventoryList, search, filterLowStockOnly]);

  const lowStockCount = useMemo(() => {
    return inventoryList.filter((item) => item.isLow).length;
  }, [inventoryList]);

  const totalValuation = useMemo(() => {
    return inventoryList.reduce((sum, item) => sum + (item.price * item.availableQuantity), 0);
  }, [inventoryList]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black text-slate-900">
            Inventory & Central Yard Stock
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time warehouse inventory, restock thresholds, and construction materials tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : 'text-slate-400'}`} />
            <span>{loading ? 'Syncing...' : 'Sync Stock'}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 block">Total Tracked SKUs</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{inventoryList.length}</div>
          <span className="text-[11px] text-slate-400 block mt-1">Valuation: {formatPrice(totalValuation)}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 block">Low Stock Alerts</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{lowStockCount} SKUs</div>
          <span className="text-[11px] text-slate-400 block mt-1">Requires procurement action</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500 block">Primary Logistics Yard</span>
          <div className="text-sm font-black text-[#071A2B] mt-1">Pune Central Yard (Hinjawadi)</div>
          <span className="text-[11px] text-emerald-600 font-bold block mt-1">● Active Dispatch Node</span>
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
            placeholder="Search inventory items by name, brand, SKU..."
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
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isEditing = editingId === item.productId;
                return (
                  <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block font-bold">{item.name}</strong>
                      <span className="text-slate-400 text-[11px]">{item.brand} • {item.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-900 text-sm">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editQty}
                          onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-20 px-2 py-1 text-center bg-slate-50 border border-accent rounded-lg text-xs font-bold"
                        />
                      ) : (
                        <span>{item.availableQuantity} {item.unit}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-semibold">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs"
                        />
                      ) : (
                        <span>{item.lowStockThreshold} {item.unit}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {formatPrice(item.price)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatPrice(item.price * item.availableQuantity)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isLow ? (
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
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(item.productId)}
                            disabled={saving}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                            title="Save changes"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-accent rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                          title="Quick update stock"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
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
