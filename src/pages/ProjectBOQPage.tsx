import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart,
  Send,
  Printer,
  ShieldCheck,
  AlertCircle,
  HardHat,
  Check,
  Building,
  Calculator,
  Search,
  Filter,
  ArrowUpDown,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useCartStore } from '@/store/cartStore';
import { products } from '@/data/products';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';
import QuotationModal from '@/components/cart/QuotationModal';
import BOQSummaryCards from '@/components/boq/BOQSummaryCards';
import BOQPriceAlertBanner from '@/components/boq/BOQPriceAlertBanner';
import BOQMaterialRow, { BOQItemComputed } from '@/components/boq/BOQMaterialRow';
import BOQMaterialCard from '@/components/boq/BOQMaterialCard';
import BOQCategoryGroup from '@/components/boq/BOQCategoryGroup';
import AddBOQMaterialModal from '@/components/boq/AddBOQMaterialModal';
import AddAllRemainingModal from '@/components/boq/AddAllRemainingModal';
import BOQPrintView from '@/components/boq/BOQPrintView';
import toast from 'react-hot-toast';

type StatusFilter = 'ALL' | 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'PRICE_CHANGED' | 'OUT_OF_STOCK';
type GroupByMode = 'NONE' | 'CATEGORY' | 'STAGE';
type SortOption =
  | 'DEFAULT'
  | 'NAME_ASC'
  | 'REQUIRED_DESC'
  | 'REMAINING_DESC'
  | 'PRICE_DESC'
  | 'TOTAL_DESC'
  | 'PROGRESS_DESC'
  | 'VARIANCE_DESC';

const ProjectBOQPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    getProject,
    updateMaterialQuantity,
    updatePurchasedQuantity,
    updateWastagePercent,
    updateMaterialNotes,
    removeMaterialFromProject,
    addMaterialToProject,
    refreshBOQPricing,
  } = useProjectStore();
  const { addToCart } = useCartStore();

  // Modals state
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddAllRemainingOpen, setIsAddAllRemainingOpen] = useState(false);

  // Filters & Controls state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [groupBy, setGroupBy] = useState<GroupByMode>('STAGE');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');

  const project = projectId ? getProject(projectId) : undefined;

  if (!project) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 text-accent mx-auto flex items-center justify-center mb-4 border border-orange-200">
          <HardHat className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-heading">
          Project BOQ Not Found
        </h2>
        <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
          The project you requested does not exist or has been removed from this device.
        </p>
        <Link to="/projects">
          <Button variant="primary" size="md">
            Return to Projects Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // 1. Compute enriched & derived metrics for all materials
  const computedItems: BOQItemComputed[] = useMemo(() => {
    return project.materials
      .map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return null;

        const baseQty = item.quantity;
        const wastePct = item.wastagePercent || 0;
        const wastageQty = Math.round(baseQty * (wastePct / 100));
        const effectiveRequiredQty = baseQty + wastageQty;
        const purchasedQty = item.purchasedQuantity || 0;
        const remainingQty = Math.max(0, effectiveRequiredQty - purchasedQty);

        const currentPrice = prod.price;
        const originalPrice = item.priceAtAddition !== undefined ? item.priceAtAddition : prod.price;
        const unitPriceDiff = currentPrice - originalPrice;

        const lineTotalRequired = currentPrice * effectiveRequiredQty;
        const lineTotalPurchased = currentPrice * Math.min(purchasedQty, effectiveRequiredQty);
        const lineTotalRemaining = currentPrice * remainingQty;

        let status: BOQItemComputed['status'] = 'PENDING';
        if (!prod.stock || prod.stock <= 0) {
          status = 'OUT_OF_STOCK';
        } else if (purchasedQty > effectiveRequiredQty) {
          status = 'OVER_PROCURED';
        } else if (purchasedQty >= effectiveRequiredQty) {
          status = 'COMPLETED';
        } else if (purchasedQty > 0) {
          status = 'PARTIAL';
        }

        const progressPercent =
          effectiveRequiredQty > 0
            ? Math.min(100, (purchasedQty / effectiveRequiredQty) * 100)
            : 0;

        return {
          ...item,
          product: prod,
          wastageQty,
          effectiveRequiredQty,
          remainingQty,
          currentPrice,
          originalPrice,
          unitPriceDiff,
          lineTotalRequired,
          lineTotalPurchased,
          lineTotalRemaining,
          status,
          progressPercent,
        };
      })
      .filter(Boolean) as BOQItemComputed[];
  }, [project.materials]);

  // Overall Financial Totals
  const totalRequiredValue = computedItems.reduce((acc, it) => acc + it.lineTotalRequired, 0);
  const totalPurchasedValue = computedItems.reduce((acc, it) => acc + it.lineTotalPurchased, 0);
  const totalRemainingValue = computedItems.reduce((acc, it) => acc + it.lineTotalRemaining, 0);
  const overallCompletionPercent =
    totalRequiredValue > 0 ? (totalPurchasedValue / totalRequiredValue) * 100 : 0;

  // Price Variance across all items
  const totalOriginalRequiredValue = computedItems.reduce(
    (acc, it) => acc + it.originalPrice * it.effectiveRequiredQty,
    0
  );
  const priceVariance = totalRequiredValue - totalOriginalRequiredValue;
  const changedPriceItemsCount = computedItems.filter((it) => it.unitPriceDiff !== 0).length;

  const completedItemsCount = computedItems.filter(
    (it) => it.status === 'COMPLETED' || it.status === 'OVER_PROCURED'
  ).length;
  const pendingItemsCount = computedItems.filter((it) => it.remainingQty > 0).length;

  // 2. Filter & Sort Items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...computedItems];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (it) =>
          it.product.name.toLowerCase().includes(q) ||
          it.product.brand.toLowerCase().includes(q) ||
          it.product.category.toLowerCase().includes(q) ||
          (it.stage && it.stage.toLowerCase().includes(q)) ||
          (it.notes && it.notes.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter === 'PENDING') {
      result = result.filter((it) => it.status === 'PENDING');
    } else if (statusFilter === 'PARTIAL') {
      result = result.filter((it) => it.status === 'PARTIAL');
    } else if (statusFilter === 'COMPLETED') {
      result = result.filter(
        (it) => it.status === 'COMPLETED' || it.status === 'OVER_PROCURED'
      );
    } else if (statusFilter === 'PRICE_CHANGED') {
      result = result.filter((it) => it.unitPriceDiff !== 0);
    } else if (statusFilter === 'OUT_OF_STOCK') {
      result = result.filter((it) => it.status === 'OUT_OF_STOCK');
    }

    // Stage filter
    if (stageFilter !== 'ALL') {
      result = result.filter((it) => it.stage === stageFilter);
    }

    // Sorting
    if (sortBy === 'NAME_ASC') {
      result.sort((a, b) => a.product.name.localeCompare(b.product.name));
    } else if (sortBy === 'REQUIRED_DESC') {
      result.sort((a, b) => b.effectiveRequiredQty - a.effectiveRequiredQty);
    } else if (sortBy === 'REMAINING_DESC') {
      result.sort((a, b) => b.remainingQty - a.remainingQty);
    } else if (sortBy === 'PRICE_DESC') {
      result.sort((a, b) => b.currentPrice - a.currentPrice);
    } else if (sortBy === 'TOTAL_DESC') {
      result.sort((a, b) => b.lineTotalRequired - a.lineTotalRequired);
    } else if (sortBy === 'PROGRESS_DESC') {
      result.sort((a, b) => b.progressPercent - a.progressPercent);
    } else if (sortBy === 'VARIANCE_DESC') {
      result.sort((a, b) => Math.abs(b.unitPriceDiff) - Math.abs(a.unitPriceDiff));
    }

    return result;
  }, [computedItems, searchQuery, statusFilter, stageFilter, sortBy]);

  // Group items by Category or Stage if requested
  const groupedItems = useMemo(() => {
    if (groupBy === 'NONE') return null;

    const groups: { [key: string]: BOQItemComputed[] } = {};
    filteredAndSortedItems.forEach((it) => {
      let key = 'General';
      if (groupBy === 'CATEGORY') {
        key = it.product.subcategory || it.product.category.replace(/-/g, ' ');
        key = key.charAt(0).toUpperCase() + key.slice(1);
      } else if (groupBy === 'STAGE') {
        key = it.stage || 'General Construction';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    });

    return groups;
  }, [filteredAndSortedItems, groupBy]);

  // Unique stages for filter dropdown
  const uniqueStages = useMemo(() => {
    const set = new Set<string>();
    computedItems.forEach((it) => {
      if (it.stage) set.add(it.stage);
    });
    return Array.from(set);
  }, [computedItems]);

  // Handlers for cart actions
  const handleAddToCart = (productId: string, qty: number) => {
    const item = computedItems.find((it) => it.productId === productId);
    if (!item) return;

    if (!item.product.stock || item.product.stock <= 0) {
      toast.error('Item is currently out of stock.');
      return;
    }

    addToCart(item.product, qty);
    toast.success(
      `Added ${qty} ${item.unit} of "${item.product.name}" to cart at ${formatPrice(item.currentPrice)}/unit!`,
      { icon: '🛒' }
    );
  };

  const handleAddGroupRemainingToCart = (groupItems: BOQItemComputed[]) => {
    let addedCount = 0;
    groupItems.forEach((it) => {
      if (it.remainingQty > 0 && it.product.stock && it.product.stock > 0) {
        addToCart(it.product, it.remainingQty);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`Added remaining quantities for ${addedCount} materials in this group to cart!`);
    } else {
      toast.error('No items with remaining quantities available to add.');
    }
  };

  const handleConfirmAddAllRemaining = () => {
    let addedCount = 0;
    computedItems.forEach((it) => {
      if (it.remainingQty > 0 && it.product.stock && it.product.stock > 0) {
        addToCart(it.product, it.remainingQty);
        addedCount++;
      }
    });

    setIsAddAllRemainingOpen(false);
    if (addedCount > 0) {
      toast.success(`Successfully added remaining materials for ${addedCount} items to your cart!`, {
        duration: 4500,
      });
    } else {
      toast.error('No remaining materials in stock to add.');
    }
  };

  const handleRequestBulkQuote = () => {
    const unprocured = computedItems.filter((it) => it.remainingQty > 0);
    const targetItems = unprocured.length > 0 ? unprocured : computedItems;

    navigate('/wholesale', {
      state: {
        prefillProjectName: project.name,
        prefillCity: project.city,
        prefillMaterials: targetItems.map((it) => ({
          material: it.product.name,
          quantity: it.remainingQty > 0 ? it.remainingQty.toString() : it.effectiveRequiredQty.toString(),
          unit: it.unit,
        })),
      },
    });
  };

  const handlePrintBOQ = () => {
    window.print();
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      {/* High-Resolution Printable View (Only visible during print) */}
      <BOQPrintView
        project={project}
        items={computedItems}
        totalRequiredValue={totalRequiredValue}
        purchasedValue={totalPurchasedValue}
        remainingValue={totalRemainingValue}
      />

      <div className="container-custom print:hidden space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to={`/projects/${project.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to &ldquo;{project.name}&rdquo; Details</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/calculator?projectId=${project.id}`}>
              <button
                type="button"
                className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Calculator className="w-4 h-4 text-accent" />
                <span>Cost Calculator</span>
              </button>
            </Link>

            <button
              onClick={handlePrintBOQ}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print BOQ Sheet</span>
            </button>

            <button
              onClick={() => setIsQuoteOpen(true)}
              className="px-3.5 py-2 bg-[#071A2B] hover:bg-[#0B2742] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileText className="w-4 h-4 text-accent" />
              <span>Generate Official Quote</span>
            </button>
          </div>
        </div>

        {/* BOQ Header Banner */}
        <div className="bg-[#071A2B] text-white p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent-light text-xs font-bold uppercase tracking-wider mb-3">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>BOQ 2.0 Procurement Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-white">
                {project.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 flex items-center gap-2 flex-wrap">
                <span>{project.type} Construction</span>
                <span className="text-slate-500">•</span>
                <span>{project.builtUpArea} {project.areaUnit}</span>
                <span className="text-slate-500">•</span>
                <span>{project.floors} Floors</span>
                <span className="text-slate-500">•</span>
                <span>{project.city} (PIN: {project.pincode || 'N/A'})</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAddMaterialOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-accent/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Material</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddAllRemainingOpen(true)}
                disabled={pendingItemsCount === 0}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4 text-accent" />
                <span>Procure Remaining ({pendingItemsCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Summary Metrics Cards */}
        <BOQSummaryCards
          totalItemsCount={computedItems.length}
          totalRequiredValue={totalRequiredValue}
          purchasedValue={totalPurchasedValue}
          remainingValue={totalRemainingValue}
          completionPercent={overallCompletionPercent}
          priceVariance={priceVariance}
          pendingItemsCount={pendingItemsCount}
          completedItemsCount={completedItemsCount}
        />

        {/* Price Variance & Market Alerts Banner */}
        <BOQPriceAlertBanner
          priceVariance={priceVariance}
          changedItemsCount={changedPriceItemsCount}
          onRefreshPrices={() => refreshBOQPricing(project.id)}
        />

        {/* Indicative Calculation Disclaimer Alert */}
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="uppercase font-bold tracking-wider text-[10px] block text-amber-950">
              Procurement & Engineering Disclaimer:
            </strong>
            <span>
              Material quantities and wastage allowances are calculated based on standard architectural estimation rules. Actual on-site requirements should be checked and verified by your structural engineer or site supervisor prior to final orders.
            </span>
          </div>
        </div>

        {/* Filter, Search & Display Controls Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search materials by name, brand, category, stage, notes..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-accent focus:bg-white transition-all"
              />
            </div>

            {/* Stage Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden sm:inline">
                Stage:
              </span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-accent"
              >
                <option value="ALL">All Stages ({computedItems.length})</option>
                {uniqueStages.map((stg) => (
                  <option key={stg} value={stg}>
                    {stg}
                  </option>
                ))}
              </select>

              {/* Group By Toggle */}
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByMode)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-accent"
              >
                <option value="STAGE">Group by Stage</option>
                <option value="CATEGORY">Group by Category</option>
                <option value="NONE">Flat Table View</option>
              </select>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-accent"
              >
                <option value="DEFAULT">Default Order</option>
                <option value="NAME_ASC">Material Name (A-Z)</option>
                <option value="TOTAL_DESC">Highest Total Cost</option>
                <option value="REMAINING_DESC">Highest Remaining Qty</option>
                <option value="PROGRESS_DESC">Highest Procured %</option>
                <option value="VARIANCE_DESC">Highest Price Variance</option>
              </select>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Items', count: computedItems.length },
              {
                id: 'PENDING',
                label: 'Pending (0%)',
                count: computedItems.filter((it) => it.status === 'PENDING').length,
              },
              {
                id: 'PARTIAL',
                label: 'Partially Procured',
                count: computedItems.filter((it) => it.status === 'PARTIAL').length,
              },
              {
                id: 'COMPLETED',
                label: 'Completed',
                count: completedItemsCount,
              },
              {
                id: 'PRICE_CHANGED',
                label: 'Price Changed',
                count: changedPriceItemsCount,
              },
              {
                id: 'OUT_OF_STOCK',
                label: 'Out of Stock',
                count: computedItems.filter((it) => it.status === 'OUT_OF_STOCK').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as StatusFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-[#071A2B] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Materials List Section */}
        {filteredAndSortedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-800">
              No materials match your current filter
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try resetting your search query or status filter, or add new construction materials to this BOQ.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setStageFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setIsAddMaterialOpen(true)}
                className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Material</span>
              </button>
            </div>
          </div>
        ) : groupedItems ? (
          /* Grouped View (by Stage or Category) */
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([groupTitle, groupMaterials]) => (
              <BOQCategoryGroup
                key={groupTitle}
                groupTitle={groupTitle}
                items={groupMaterials}
                onUpdateBaseQty={(prodId, qty) =>
                  updateMaterialQuantity(project.id, prodId, qty)
                }
                onUpdateUnit={(prodId, u) => {
                  const m = project.materials.find((x) => x.productId === prodId);
                  if (m) updateMaterialQuantity(project.id, prodId, m.quantity, u);
                }}
                onUpdatePurchasedQty={(prodId, qty) =>
                  updatePurchasedQuantity(project.id, prodId, qty)
                }
                onUpdateWastagePercent={(prodId, pct) =>
                  updateWastagePercent(project.id, prodId, pct)
                }
                onUpdateNotes={(prodId, notes) =>
                  updateMaterialNotes(project.id, prodId, notes)
                }
                onRemove={(prodId) => removeMaterialFromProject(project.id, prodId)}
                onAddToCart={(prodId, qty) => handleAddToCart(prodId, qty)}
                onAddGroupRemainingToCart={(items) => handleAddGroupRemainingToCart(items)}
              />
            ))}
          </div>
        ) : (
          /* Flat Table View */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-4">Material & Specification</th>
                    <th className="py-3 px-3 text-center">Required</th>
                    <th className="py-3 px-3 text-center">Wastage %</th>
                    <th className="py-3 px-3 text-center">Procured</th>
                    <th className="py-3 px-3 text-center">Remaining</th>
                    <th className="py-3 px-3 text-right">Unit Rate</th>
                    <th className="py-3 px-3 text-right">Line Total</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedItems.map((it, idx) => (
                    <BOQMaterialRow
                      key={it.productId}
                      item={it}
                      index={idx}
                      onUpdateBaseQty={(qty) =>
                        updateMaterialQuantity(project.id, it.productId, qty)
                      }
                      onUpdateUnit={(u) =>
                        updateMaterialQuantity(project.id, it.productId, it.quantity, u)
                      }
                      onUpdatePurchasedQty={(qty) =>
                        updatePurchasedQuantity(project.id, it.productId, qty)
                      }
                      onUpdateWastagePercent={(pct) =>
                        updateWastagePercent(project.id, it.productId, pct)
                      }
                      onUpdateNotes={(notes) =>
                        updateMaterialNotes(project.id, it.productId, notes)
                      }
                      onRemove={() => removeMaterialFromProject(project.id, it.productId)}
                      onAddToCart={(qty) => handleAddToCart(it.productId, qty)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="md:hidden p-3 space-y-3">
              {filteredAndSortedItems.map((it, idx) => (
                <BOQMaterialCard
                  key={it.productId}
                  item={it}
                  index={idx}
                  onUpdateBaseQty={(qty) =>
                    updateMaterialQuantity(project.id, it.productId, qty)
                  }
                  onUpdateUnit={(u) =>
                    updateMaterialQuantity(project.id, it.productId, it.quantity, u)
                  }
                  onUpdatePurchasedQty={(qty) =>
                    updatePurchasedQuantity(project.id, it.productId, qty)
                  }
                  onUpdateWastagePercent={(pct) =>
                    updateWastagePercent(project.id, it.productId, pct)
                  }
                  onUpdateNotes={(notes) =>
                    updateMaterialNotes(project.id, it.productId, notes)
                  }
                  onRemove={() => removeMaterialFromProject(project.id, it.productId)}
                  onAddToCart={(qty) => handleAddToCart(it.productId, qty)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom Procurement & Financial Valuation Hub */}
        {computedItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Financial Valuation Card */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-3.5">
              <h3 className="font-heading font-bold text-sm text-slate-900 uppercase tracking-wider">
                Financial Schedule Valuation
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Scheduled Budget:</span>
                  <span className="font-bold text-slate-900">{formatPrice(totalRequiredValue)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Procured Material Value:</span>
                  <span className="font-bold text-emerald-700">-{formatPrice(totalPurchasedValue)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Remaining Material Value:</span>
                  <span className="font-bold text-accent">{formatPrice(totalRemainingValue)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimated GST (18% Input Tax):</span>
                  <span className="font-bold text-slate-900">{formatPrice(totalRemainingValue * 0.18)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Construction-Site Logistics ({project.city}):</span>
                  <span className="font-bold text-emerald-700">Free Direct Site Drop</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-[#071A2B]">
                <div>
                  <span>Total Remaining Cost:</span>
                  <span className="block text-[10px] text-slate-500 font-normal">Incl. 18% GST</span>
                </div>
                <span className="text-xl font-black text-accent">
                  {formatPrice(totalRemainingValue + totalRemainingValue * 0.18)}
                </span>
              </div>
            </div>

            {/* Procurement Execution Hub */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    HEPNA Direct Supply Chain
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    Site Delivery Ready
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  Procure Materials for &ldquo;{project.name}&rdquo;
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Easily batch-add all remaining materials into your cart at verified live catalog prices, request tailored wholesale bulk container pricing, or export an official digital quotation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Add All Available Remaining to Cart */}
                <button
                  type="button"
                  onClick={() => setIsAddAllRemainingOpen(true)}
                  disabled={pendingItemsCount === 0}
                  className="py-3 px-4 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-accent/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add Remaining to Cart</span>
                </button>

                {/* 2. Request Wholesale Bulk Quote */}
                <button
                  type="button"
                  onClick={handleRequestBulkQuote}
                  className="py-3 px-4 rounded-xl bg-[#071A2B] hover:bg-[#0B2742] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow active:scale-[0.99]"
                >
                  <Send className="w-4 h-4 text-accent" />
                  <span>Request Bulk Quote</span>
                </button>

                {/* 3. Generate Quote (PDF) */}
                <button
                  type="button"
                  onClick={() => setIsQuoteOpen(true)}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4 text-accent" />
                  <span>Generate Quote (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar on Mobile */}
      {computedItems.length > 0 && pendingItemsCount > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-between gap-3 shadow-lg print:hidden">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">
              {pendingItemsCount} Items Remaining
            </div>
            <div className="text-sm font-black text-accent">
              {formatPrice(totalRemainingValue + totalRemainingValue * 0.18)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddAllRemainingOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-accent/20"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      )}

      {/* Add Material Modal */}
      <AddBOQMaterialModal
        isOpen={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
        onAddMaterial={(prodId, qty, u, stg, waste, notes) => {
          addMaterialToProject(
            project.id,
            prodId,
            qty,
            u,
            stg,
            waste,
            0,
            undefined,
            notes
          );
        }}
        defaultStage={project.stage || 'Foundation'}
      />

      {/* Add All Remaining Confirmation Modal */}
      <AddAllRemainingModal
        isOpen={isAddAllRemainingOpen}
        onClose={() => setIsAddAllRemainingOpen(false)}
        items={computedItems}
        onConfirm={handleConfirmAddAllRemaining}
        projectName={project.name}
      />

      {/* Digital Quotation System Modal */}
      <QuotationModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </div>
  );
};

export default ProjectBOQPage;
