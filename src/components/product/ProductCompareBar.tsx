import React from 'react';
import { Layers, X, ArrowRight, Trash2 } from 'lucide-react';
import { useCompareStore } from '@/store/compareStore';
import ProductCompareModal from './ProductCompareModal';

const ProductCompareBar: React.FC = () => {
  const { items, removeFromCompare, clearCompare, setModalOpen } = useCompareStore();

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating Bottom Comparison Drawer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl bg-[#071A2B]/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-white/15 p-3 sm:p-4 animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left Info */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold tracking-tight">
                  Compare Products
                </h4>
                <p className="text-[11px] text-white/70">
                  {items.length} of 4 selected
                </p>
              </div>
            </div>

            <button
              onClick={clearCompare}
              className="sm:hidden text-white/60 hover:text-red-400 p-1 rounded transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Center Product Thumbnails */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative group flex items-center gap-2 bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-xl border border-white/10 shrink-0 transition-colors"
              >
                <img
                  src={item.images?.[0] || 'https://placehold.co/100?text=HEPNA'}
                  alt={item.name}
                  className="w-8 h-8 rounded-lg object-cover bg-white shrink-0"
                />
                <span className="text-xs font-semibold max-w-[110px] truncate hidden md:inline">
                  {item.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCompare(item.id)}
                  className="text-white/60 hover:text-red-400 p-0.5 rounded transition-colors"
                  aria-label={`Remove ${item.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={clearCompare}
              className="hidden sm:flex items-center gap-1 text-xs text-white/70 hover:text-red-400 px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-accent/20 active:scale-95"
            >
              <span>Compare Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Full Compare Modal */}
      <ProductCompareModal />
    </>
  );
};

export default ProductCompareBar;
