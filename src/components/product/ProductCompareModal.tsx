import React, { useMemo } from 'react';
import { X, Check, Minus, ShoppingCart, Trash2, ShieldCheck, Truck } from 'lucide-react';
import { useCompareStore } from '@/store/compareStore';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/formatPrice';
import Rating from '@/components/ui/Rating';
import toast from 'react-hot-toast';

const ProductCompareModal: React.FC = () => {
  const { items, isModalOpen, setModalOpen, removeFromCompare, clearCompare } = useCompareStore();
  const { addToCart } = useCartStore();

  // Aggregate all unique specification keys from all products
  const allSpecKeys = useMemo(() => {
    const keysSet = new Set<string>();
    items.forEach((item) => {
      if (item.specifications) {
        Object.keys(item.specifications).forEach((k) => keysSet.add(k));
      }
    });
    return Array.from(keysSet);
  }, [items]);

  if (!isModalOpen || items.length === 0) return null;

  const handleAddToCart = (product: typeof items[0]) => {
    if (!product.stock || product.stock === 0) return;
    addToCart(product, 1);
    toast.success(`Added ${product.name} to cart!`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-[#071A2B] text-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-heading font-bold text-white">
              Product Specification Comparison
            </h2>
            <span className="bg-accent text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
              {items.length} of 4 items
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearCompare}
              className="text-xs text-white/70 hover:text-red-400 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close comparison"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Side-by-Side Comparison Matrix */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse text-left">
              {/* Product Card Headers */}
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-1/5 p-3 text-xs font-bold uppercase tracking-wider text-gray-400 align-bottom pb-4">
                    Products
                  </th>
                  {items.map((product) => (
                    <th key={product.id} className="p-3 align-top min-w-[200px] w-1/4">
                      <div className="relative bg-gray-50/70 p-3 rounded-xl border border-gray-200 flex flex-col h-full">
                        <button
                          onClick={() => removeFromCompare(product.id)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                          aria-label={`Remove ${product.name}`}
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <img
                          src={product.images?.[0] || 'https://placehold.co/200?text=HEPNA'}
                          alt={product.name}
                          className="w-full h-28 object-cover rounded-lg mb-2 bg-white"
                        />

                        <div className="text-[10px] uppercase font-bold text-accent tracking-wider">
                          {product.brand}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 min-h-[2rem] mb-1">
                          {product.name}
                        </h4>

                        <div className="text-base font-extrabold text-[#071A2B] mb-2">
                          {formatPrice(product.price)}{' '}
                          <span className="text-xs font-normal text-gray-500">/ {product.unit}</span>
                        </div>

                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.stock || product.stock === 0}
                          className="w-full mt-auto py-2 px-3 bg-accent hover:bg-accent-dark text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{product.stock && product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
                        </button>
                      </div>
                    </th>
                  ))}
                  {/* Empty slots placeholders up to 4 */}
                  {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, idx) => (
                    <th key={`empty-${idx}`} className="p-3 align-middle w-1/4">
                      <div className="h-full min-h-[220px] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 text-center text-gray-400">
                        <PlusSquareIcon className="w-6 h-6 mb-1 text-gray-300" />
                        <span className="text-xs font-medium">Add another product to compare</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {/* SECTION: Overview */}
                <tr className="bg-gray-100/60 font-bold text-gray-800">
                  <td colSpan={1 + items.length + Math.max(0, 4 - items.length)} className="p-2.5 text-xs uppercase tracking-wider text-primary">
                    General Overview
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-600">Brand</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-3 font-bold text-gray-900">{p.brand}</td>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                    <td key={i} className="p-3 text-gray-300">—</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-600">Category</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-3 text-gray-800">{p.subcategory || p.category}</td>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                    <td key={i} className="p-3 text-gray-300">—</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-600">Customer Rating</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-3">
                      <Rating rating={p.rating} reviews={p.reviews} size="sm" showCount />
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                    <td key={i} className="p-3 text-gray-300">—</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-600">Stock Status</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-3">
                      {p.stock && p.stock > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> In Stock ({p.stock} units)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <Minus className="w-3.5 h-3.5" /> Out of Stock
                        </span>
                      )}
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                    <td key={i} className="p-3 text-gray-300">—</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-600">Site Delivery</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-3">
                      {p.deliveryAvailable ? (
                        <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
                          <Truck className="w-3.5 h-3.5 text-accent" /> Available
                        </span>
                      ) : (
                        <span className="text-gray-400">Pickup only</span>
                      )}
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                    <td key={i} className="p-3 text-gray-300">—</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-600">Bulk Pricing</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-3">
                      {p.bulkPrice ? (
                        <span className="text-emerald-700 font-bold">
                          {formatPrice(p.bulkPrice)} (Min. {p.minimumBulkQuantity} {p.unit}s)
                        </span>
                      ) : (
                        <span className="text-gray-400">Standard rates</span>
                      )}
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                    <td key={i} className="p-3 text-gray-300">—</td>
                  ))}
                </tr>

                {/* SECTION: Technical Specifications */}
                {allSpecKeys.length > 0 && (
                  <>
                    <tr className="bg-gray-100/60 font-bold text-gray-800">
                      <td colSpan={1 + items.length + Math.max(0, 4 - items.length)} className="p-2.5 text-xs uppercase tracking-wider text-primary">
                        Technical Specifications
                      </td>
                    </tr>
                    {allSpecKeys.map((key) => (
                      <tr key={key}>
                        <td className="p-3 font-semibold text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </td>
                        {items.map((p) => (
                          <td key={p.id} className="p-3 text-gray-800 font-medium">
                            {p.specifications?.[key] ? p.specifications[key] : <span className="text-gray-400">Not specified</span>}
                          </td>
                        ))}
                        {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                          <td key={i} className="p-3 text-gray-300">—</td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}

                {/* SECTION: Key Features */}
                <tr className="bg-gray-100/60 font-bold text-gray-800">
                  <td colSpan={1 + items.length + Math.max(0, 4 - items.length)} className="p-2.5 text-xs uppercase tracking-wider text-primary">
                    Features & Highlights
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-600">Key Features</td>
                  {items.map((p) => (
                    <td key={p.id} className="p-3 align-top">
                      {p.features && p.features.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1 text-xs text-gray-600">
                          {p.features.map((feat, fidx) => (
                            <li key={fidx}>{feat}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-600 line-clamp-3">{p.description}</p>
                      )}
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                    <td key={i} className="p-3 text-gray-300">—</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Genuine Certified Construction Materials Guarantee</span>
          </div>
          <button
            onClick={() => setModalOpen(false)}
            className="w-full sm:w-auto px-6 py-2 bg-[#071A2B] hover:bg-[#0B2742] text-white rounded-xl text-xs sm:text-sm font-bold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};

const PlusSquareIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

export default ProductCompareModal;
