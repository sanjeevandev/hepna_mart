import React, { useState, useMemo } from 'react';
import { X, Search, Plus, HardHat, Check, Layers, AlertCircle, Building } from 'lucide-react';
import { products } from '@/data/products';
import { Product } from '@/types';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';

interface AddBOQMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMaterial: (
    productId: string,
    quantity: number,
    unit: string,
    stage: string,
    wastagePercent: number,
    notes: string
  ) => void;
  defaultStage?: string;
}

const STAGES = [
  'Foundation',
  'Structure',
  'Masonry',
  'Plumbing & Electrical',
  'Flooring',
  'Roofing',
  'Finishing',
  'Bathroom & Sanitary',
  'Safety & Tools',
];

const COMMON_UNITS = [
  'Bag',
  'Piece',
  'Nos',
  'Tonne (MT)',
  'Kg',
  'Metre',
  'Sq. Ft.',
  'Litre',
  'Bundle',
  'Cu.m',
  'Truckload',
];

const WASTAGE_OPTIONS = [0, 3, 5, 8, 10, 15];

export const AddBOQMaterialModal: React.FC<AddBOQMaterialModalProps> = ({
  isOpen,
  onClose,
  onAddMaterial,
  defaultStage = 'Foundation',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState<string>('Piece');
  const [stage, setStage] = useState<string>(defaultStage);
  const [wastagePercent, setWastagePercent] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 12);
    const q = searchQuery.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setUnit(prod.unit || 'Piece');
    if (prod.unit === 'Bag') {
      setQuantity(50);
    } else if (prod.unit === 'Tonne (MT)') {
      setQuantity(2);
    } else if (prod.unit === 'Sq. Ft.') {
      setQuantity(200);
    } else if (prod.unit === 'Piece') {
      setQuantity(100);
    }
  };

  const handleAdd = () => {
    if (!selectedProduct) return;
    onAddMaterial(
      selectedProduct.id,
      Math.max(1, quantity),
      unit,
      stage,
      wastagePercent,
      notes.trim()
    );
    // Reset and close
    setSelectedProduct(null);
    setSearchQuery('');
    setNotes('');
    onClose();
  };

  const wastageQty = Math.round(quantity * (wastagePercent / 100));
  const effectiveQty = quantity + wastageQty;
  const estimatedCost = selectedProduct ? selectedProduct.price * effectiveQty : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-accent border border-orange-200/60 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[#071A2B]">
                Add Material to BOQ Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Select from verified HEPNA MART catalog and configure procurement parameters
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Product Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Search & Select Material
            </label>

            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cement, TMT steel, red bricks, pipes, wires, tiles..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-accent focus:bg-white transition-all"
              />
            </div>

            {/* Product Quick List / Selected Highlight */}
            {selectedProduct ? (
              <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedProduct.images?.[0] || 'https://placehold.co/80?text=HEPNA'}
                    alt={selectedProduct.name}
                    className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                      Selected Item
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {selectedProduct.name}
                    </h4>
                    <div className="text-xs text-slate-500">
                      {selectedProduct.brand} • {formatPrice(selectedProduct.price)}/{selectedProduct.unit}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 border border-slate-100 rounded-xl p-1 bg-slate-50/40">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-accent hover:shadow-xs cursor-pointer transition-all flex items-center gap-2.5"
                  >
                    <img
                      src={prod.images?.[0] || 'https://placehold.co/80?text=HEPNA'}
                      alt={prod.name}
                      className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>{prod.brand}</span>
                        <strong className="text-accent">{formatPrice(prod.price)}/{prod.unit}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Quantity, Unit, Wastage, Stage Configuration */}
          {selectedProduct && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Configure Requirements & Site Specs
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Base Quantity */}
                <div>
                  <span className="block text-xs text-slate-600 font-semibold mb-1">
                    Base Required Qty
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Unit */}
                <div>
                  <span className="block text-xs text-slate-600 font-semibold mb-1">
                    Measurement Unit
                  </span>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wastage Allowance */}
                <div>
                  <span className="block text-xs text-slate-600 font-semibold mb-1">
                    Wastage %
                  </span>
                  <select
                    value={wastagePercent}
                    onChange={(e) => setWastagePercent(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                  >
                    {WASTAGE_OPTIONS.map((pct) => (
                      <option key={pct} value={pct}>
                        +{pct}% Allowance
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Construction Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs text-slate-600 font-semibold mb-1">
                    Construction Stage
                  </span>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                  >
                    {STAGES.map((stg) => (
                      <option key={stg} value={stg}>
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-xs text-slate-600 font-semibold mb-1">
                    Site Notes / Specs (Optional)
                  </span>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Deliver to Block A ground level"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Calculation Preview Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Effective Requirement:</span>{' '}
                  <strong className="text-slate-900">
                    {effectiveQty} {unit} ({quantity} base + {wastageQty} wastage)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Estimated Cost:</span>{' '}
                  <strong className="text-accent text-sm font-black">
                    {formatPrice(estimatedCost)}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedProduct}
            className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item to BOQ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBOQMaterialModal;
