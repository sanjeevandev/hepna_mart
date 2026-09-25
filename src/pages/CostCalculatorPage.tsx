import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Calculator,
  HardHat,
  FileText,
  Boxes,
  ShieldCheck,
  RotateCcw,
  ShoppingCart,
  Send,
  Printer,
  ChevronRight,
} from 'lucide-react';
import {
  CalculatorProjectInputs,
  ConstructionEstimate,
  EstimatedMaterialLine,
} from '@/types';
import { calculateMaterialEstimate } from '@/utils/constructionCalculator';
import { useEstimateStore } from '@/store/estimateStore';
import { useProjectStore } from '@/store/projectStore';
import CalculatorHero from '@/components/calculator/CalculatorHero';
import ProjectInputsForm from '@/components/calculator/ProjectInputsForm';
import MaterialEstimateTable from '@/components/calculator/MaterialEstimateTable';
import CostBreakdownChart from '@/components/calculator/CostBreakdownChart';
import CostSummaryPanel from '@/components/calculator/CostSummaryPanel';
import TransferToProjectModal from '@/components/calculator/TransferToProjectModal';
import EstimatePrintModal from '@/components/calculator/EstimatePrintModal';
import QuotationModal from '@/components/cart/QuotationModal';
import Button from '@/components/ui/Button';
import SectionReveal from '@/components/ui/SectionReveal';

const CostCalculatorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const calcSectionRef = useRef<HTMLDivElement>(null);

  const { createEstimate, addAvailableMaterialsToCart } = useEstimateStore();
  const { projects } = useProjectStore();

  const projectIdParam = searchParams.get('projectId');
  const linkedProject = projectIdParam
    ? projects.find((p) => p.id === projectIdParam)
    : undefined;

  // Initial State from query params or default
  const [inputs, setInputs] = useState<CalculatorProjectInputs>({
    projectType: linkedProject?.type || (searchParams.get('type') as any) || 'House',
    builtUpArea: linkedProject?.builtUpArea || Number(searchParams.get('area')) || 1500,
    areaUnit: linkedProject?.areaUnit || 'sq.ft',
    floors: linkedProject?.floors || Number(searchParams.get('floors')) || 2,
    quality: (searchParams.get('quality') as any) || 'standard',
    city: linkedProject?.city || searchParams.get('city') || 'Pune',
    projectId: linkedProject?.id,
    projectName: linkedProject?.name || searchParams.get('name') || '',
  });

  const [savedEstimate, setSavedEstimate] = useState<ConstructionEstimate | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Compute live estimate on any input change
  const estimateResult = useMemo(() => {
    return calculateMaterialEstimate(inputs);
  }, [inputs]);

  // Construct active estimate object for modals
  const activeEstimateObject: ConstructionEstimate = useMemo(() => {
    return {
      id: savedEstimate?.id || 'EST-TEMP',
      inputs,
      materials: estimateResult.materials,
      subtotalAtEstimate: estimateResult.subtotal,
      taxAtEstimate: estimateResult.tax,
      deliveryAtEstimate: estimateResult.delivery,
      totalAtEstimate: estimateResult.total,
      currentSubtotal: estimateResult.subtotal,
      currentTax: estimateResult.tax,
      currentDelivery: estimateResult.delivery,
      currentTotal: estimateResult.total,
      priceDifference: 0,
      hasPriceChanges: false,
      createdAt: savedEstimate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceSnapshotTimestamp: new Date().toISOString(),
      validityDays: 7,
    };
  }, [inputs, estimateResult, savedEstimate]);

  const handleScrollToCalc = () => {
    calcSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveEstimate = () => {
    const created = createEstimate(inputs);
    setSavedEstimate(created);
  };

  const handleAddToCart = () => {
    let estId = savedEstimate?.id;
    if (!estId) {
      const created = createEstimate(inputs);
      setSavedEstimate(created);
      estId = created.id;
    }
    const res = addAvailableMaterialsToCart(estId);
    if (res.added > 0) {
      navigate('/cart');
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* 1. Calculator Hero Section */}
      <CalculatorHero onScrollToCalculator={handleScrollToCalc} />

      {/* 2. Main Calculator Workspace */}
      <div ref={calcSectionRef} className="container-custom py-10 sm:py-14">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-xs text-slate-500 mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight size={14} className="mx-1.5 text-slate-400" />
          <Link to="/projects" className="hover:text-primary transition-colors">
            Projects
          </Link>
          <ChevronRight size={14} className="mx-1.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Cost Calculator</span>
        </nav>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN (8/12): Step 1 Inputs + Step 2 Materials + Cost Breakdown */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Project Specifications Form */}
            <SectionReveal>
              <ProjectInputsForm
                inputs={inputs}
                onChange={(newInputs) => {
                  setInputs(newInputs);
                  setSavedEstimate(null); // invalidate previous saved state on input change
                }}
              />
            </SectionReveal>

            {/* Step 2: Itemized Material Estimate Table */}
            <SectionReveal>
              <MaterialEstimateTable
                materials={estimateResult.materials}
                onOpenAddToProject={() => setIsTransferModalOpen(true)}
              />
            </SectionReveal>

            {/* Cost Breakdown Visual Distribution */}
            <SectionReveal>
              <CostBreakdownChart
                materials={estimateResult.materials}
                subtotal={estimateResult.subtotal}
              />
            </SectionReveal>
          </div>

          {/* RIGHT COLUMN (4/12): Sticky Financial Summary & Procurement Actions */}
          <div className="lg:col-span-4">
            <CostSummaryPanel
              inputs={inputs}
              subtotal={estimateResult.subtotal}
              tax={estimateResult.tax}
              delivery={estimateResult.delivery}
              total={estimateResult.total}
              materials={estimateResult.materials}
              onSaveEstimate={handleSaveEstimate}
              onOpenAddToProject={() => setIsTransferModalOpen(true)}
              onAddToCart={handleAddToCart}
              onOpenBulkQuote={() => setIsQuoteModalOpen(true)}
              onOpenPrint={() => setIsPrintModalOpen(true)}
              savedEstimateId={savedEstimate?.id}
            />
          </div>
        </div>
      </div>

      {/* Transfer to Project BOQ Modal */}
      <TransferToProjectModal
        estimate={activeEstimateObject}
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      {/* Printable Estimate Modal */}
      <EstimatePrintModal
        estimate={activeEstimateObject}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* Wholesale / Bulk Quotation Modal */}
      <QuotationModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
};

export default CostCalculatorPage;
