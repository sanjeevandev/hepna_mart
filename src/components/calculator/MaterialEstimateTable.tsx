import React from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShoppingCart,
  HardHat,
  Eye,
} from 'lucide-react';
import { EstimatedMaterialLine } from '@/types';
import { formatPrice } from '@/utils/formatPrice';
import { useCartStore } from '@/store/cartStore';
import { products } from '@/data/products';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface MaterialEstimateTableProps {
  materials: EstimatedMaterialLine[];
  onOpenAddToProject?: (material: EstimatedMaterialLine) => void;
  showHistoricalComparison?: boolean;
}

const MaterialEstimateTable: React.FC<MaterialEstimateTableProps> = ({
  materials,
  onOpenAddToProject,
  showHistoricalComparison = false,
}) => {
  const { addToCart } = useCartStore();

  const handleAddSingleItemToCart = (mat: EstimatedMaterialLine) => {
    const liveProduct = products.find((p) => p.id === mat.matchedProductId);
    if (!liveProduct || !liveProduct.stock || liveProduct.stock <= 0) {
      toast.error('Product is currently out of stock.');
      return;
    }
    addToCart(liveProduct, mat.quantity);
    toast.success(`Added ${mat.quantity} ${mat.unit} of "${mat.productName}" to cart!`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
      {/* Table Header Strip */}
      <div className="p-5 sm:p-6 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#071A2B] flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h3 className="font-heading font-bold text-lg sm:text-xl text-[#071A2B]">
              Indicative Material Requirements
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculated material quantities mapped directly to active catalog items
          </p>
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
          {materials.length} Material Categories
        </span>
      </div>

      {/* Desktop & Tablet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold border-y border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 sm:px-6">Material Category</th>
              <th className="py-3 px-3">Catalog Mapped Product</th>
              <th className="py-3 px-3 text-center">Estimated Qty</th>
              <th className="py-3 px-3 text-right">Catalog Rate</th>
              {showHistoricalComparison && (
                <th className="py-3 px-3 text-right">Estimate Rate</th>
              )}
              <th className="py-3 px-3 text-right">Estimated Cost</th>
              <th className="py-3 px-4 sm:px-6 text-center">Availability</th>
              <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {materials.map((mat) => {
              const liveProduct = products.find((p) => p.id === mat.matchedProductId);
              const isPriceChanged =
                showHistoricalComparison && mat.priceAtEstimate !== mat.currentPrice;

              return (
                <tr
                  key={mat.id}
                  className="hover:bg-slate-50/70 transition-colors group text-xs text-slate-700"
                >
                  {/* Category Name & Coefficient Note */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="font-bold text-slate-900 text-sm">{mat.categoryName}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 max-w-xs leading-relaxed">
                      {mat.coefficientDescription}
                    </div>
                  </td>

                  {/* Mapped Product */}
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                      <Link
                        to={`/product/${liveProduct?.slug || mat.matchedProductId}`}
                        className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1"
                      >
                        <img
                          src={mat.image || 'https://placehold.co/100?text=HEPNA'}
                          alt={mat.productName}
                          className="w-full h-full object-cover rounded"
                        />
                      </Link>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
                          {mat.brand}
                        </span>
                        <Link
                          to={`/product/${liveProduct?.slug || mat.matchedProductId}`}
                          className="font-bold text-slate-800 hover:text-accent transition-colors line-clamp-1 text-xs"
                        >
                          {mat.productName}
                        </Link>
                      </div>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="py-4 px-3 text-center">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {mat.quantity.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-500 text-[11px] block">{mat.unit}s</span>
                  </td>

                  {/* Current Catalog Rate */}
                  <td className="py-4 px-3 text-right font-semibold text-slate-800">
                    {formatPrice(mat.currentPrice)}
                    <span className="text-[10px] text-slate-400 block font-normal">
                      /{mat.unit}
                    </span>
                  </td>

                  {/* Historical Rate (if comparison active) */}
                  {showHistoricalComparison && (
                    <td className="py-4 px-3 text-right">
                      <span
                        className={`text-xs font-semibold ${
                          isPriceChanged ? 'line-through text-slate-400' : 'text-slate-700'
                        }`}
                      >
                        {formatPrice(mat.priceAtEstimate)}
                      </span>
                    </td>
                  )}

                  {/* Line Total */}
                  <td className="py-4 px-3 text-right">
                    <span className="font-black text-[#071A2B] text-sm">
                      {formatPrice(mat.currentLineTotal)}
                    </span>
                  </td>

                  {/* In Stock Status */}
                  <td className="py-4 px-4 sm:px-6 text-center">
                    {mat.inStock ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Restocking
                      </span>
                    )}
                  </td>

                  {/* Row Actions */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/product/${liveProduct?.slug || mat.matchedProductId}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="View Product Details"
                        aria-label={`View ${mat.productName}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleAddSingleItemToCart(mat)}
                        disabled={!mat.inStock}
                        className={`p-1.5 rounded-lg transition-colors ${
                          mat.inStock
                            ? 'text-accent hover:bg-orange-50 hover:text-accent-dark'
                            : 'text-slate-300 cursor-not-allowed'
                        }`}
                        title="Add this material to Cart"
                        aria-label={`Add ${mat.productName} to Cart`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mandatory Indicative Planning Disclaimer Alert */}
      <div className="p-4 sm:p-5 m-4 bg-amber-50/70 rounded-xl border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-0.5">
            Indicative Planning Estimate Notice
          </strong>
          Final material quantities must be verified by a qualified civil engineer or structural contractor based on approved architectural drawings, soil bearing capacity, specifications, and physical job-site conditions. Catalog rates reflect current online pricing at time of calculation.
        </div>
      </div>
    </div>
  );
};

export default MaterialEstimateTable;
