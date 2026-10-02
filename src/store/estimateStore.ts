import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ConstructionEstimate,
  CalculatorProjectInputs,
  EstimatedMaterialLine,
} from '@/types';
import {
  calculateMaterialEstimate,
  compareEstimateWithCurrentPrices,
} from '@/utils/constructionCalculator';
import { products } from '@/data/products';
import { apiClient, getAuthToken, BackendEstimate } from '@/lib/api';
import { useProjectStore } from './projectStore';
import { useCartStore } from './cartStore';
import toast from 'react-hot-toast';

function transformBackendEstimate(be: BackendEstimate): ConstructionEstimate {
  return {
    id: be.id,
    inputs: be.inputs as CalculatorProjectInputs,
    materials: (be.materials || []) as EstimatedMaterialLine[],
    subtotalAtEstimate: be.subtotal_at_estimate,
    taxAtEstimate: be.tax_at_estimate,
    deliveryAtEstimate: be.delivery_at_estimate,
    totalAtEstimate: be.total_at_estimate,
    currentSubtotal: be.current_subtotal,
    currentTax: be.current_tax,
    currentDelivery: be.current_delivery,
    currentTotal: be.current_total,
    priceDifference: be.price_difference,
    hasPriceChanges: be.has_price_changes,
    createdAt: typeof be.created_at === 'string' ? be.created_at : new Date(be.created_at).toISOString(),
    updatedAt: typeof be.updated_at === 'string' ? be.updated_at : new Date(be.updated_at).toISOString(),
    priceSnapshotTimestamp: typeof be.price_snapshot_timestamp === 'string' ? be.price_snapshot_timestamp : new Date(be.price_snapshot_timestamp).toISOString(),
    validityDays: be.validity_days,
    notes: be.notes || undefined,
  };
}

interface EstimateState {
  estimates: ConstructionEstimate[];
  activeEstimateId: string | null;
  isLoading: boolean;

  fetchEstimates: () => Promise<void>;
  createEstimate: (inputs: CalculatorProjectInputs) => ConstructionEstimate;
  getEstimate: (id: string) => ConstructionEstimate | undefined;
  updateEstimate: (id: string, updates: Partial<ConstructionEstimate>) => void;
  deleteEstimate: (id: string) => void;
  refreshEstimatePricing: (id: string) => ConstructionEstimate | undefined;
  addEstimateToProjectBOQ: (estimateId: string, targetProjectId: string) => boolean;
  addAvailableMaterialsToCart: (estimateId: string) => { added: number; unavailable: number };
  setActiveEstimateId: (id: string | null) => void;
}

// Initial seed estimates for instant demonstration & price-change comparison exploration
const initialInputs1: CalculatorProjectInputs = {
  projectType: 'Villa',
  builtUpArea: 1800,
  areaUnit: 'sq.ft',
  floors: 2,
  quality: 'standard',
  city: 'Pune',
  projectId: 'proj-sample-1',
  projectName: 'Green Villa Construction',
};

const calc1 = calculateMaterialEstimate(initialInputs1);

const defaultSeedEstimates: ConstructionEstimate[] = [
  {
    id: 'EST-89214',
    inputs: initialInputs1,
    materials: calc1.materials.map((m) =>
      m.id === 'mat-cement'
        ? {
            ...m,
            priceAtEstimate: 375, // Historical snapshot was ₹375 (now ₹390 in catalog)
            lineTotalAtEstimate: 375 * m.quantity,
          }
        : m
    ),
    subtotalAtEstimate: calc1.subtotal - 15 * 720,
    taxAtEstimate: (calc1.subtotal - 15 * 720) * 0.18,
    deliveryAtEstimate: 0,
    totalAtEstimate: (calc1.subtotal - 15 * 720) * 1.18,
    currentSubtotal: calc1.subtotal,
    currentTax: calc1.tax,
    currentDelivery: calc1.delivery,
    currentTotal: calc1.total,
    priceDifference: calc1.total - (calc1.subtotal - 15 * 720) * 1.18,
    hasPriceChanges: true, // Demonstrates price-change alert out of the box!
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    priceSnapshotTimestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
    validityDays: 7,
    notes: 'Standard 2-floor RCC Villa structure estimate with vitrified flooring & CPVC plumbing.',
  },
  {
    id: 'EST-74102',
    inputs: {
      projectType: 'House',
      builtUpArea: 1200,
      areaUnit: 'sq.ft',
      floors: 1,
      quality: 'economy',
      city: 'Coimbatore',
      projectName: 'Coimbatore Residential Project',
    },
    ...(() => {
      const c = calculateMaterialEstimate({
        projectType: 'House',
        builtUpArea: 1200,
        areaUnit: 'sq.ft',
        floors: 1,
        quality: 'economy',
        city: 'Coimbatore',
      });
      return {
        materials: c.materials,
        subtotalAtEstimate: c.subtotal,
        taxAtEstimate: c.tax,
        deliveryAtEstimate: c.delivery,
        totalAtEstimate: c.total,
        currentSubtotal: c.subtotal,
        currentTax: c.tax,
        currentDelivery: c.delivery,
        currentTotal: c.total,
        priceDifference: 0,
        hasPriceChanges: false,
      };
    })(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    priceSnapshotTimestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    validityDays: 7,
    notes: 'Single floor economy budget estimate with fly ash brick masonry.',
  },
];

export const useEstimateStore = create<EstimateState>()(
  persist(
    (set, get) => ({
      estimates: defaultSeedEstimates,
      activeEstimateId: 'EST-89214',
      isLoading: false,

      fetchEstimates: async () => {
        const token = getAuthToken();
        if (!token) return;
        set({ isLoading: true });
        try {
          const res = await apiClient.estimates.list();
          if (res.data?.estimates) {
            const transformed = res.data.estimates.map(transformBackendEstimate);
            set({ estimates: transformed, isLoading: false });
            if (transformed.length > 0 && !get().activeEstimateId) {
              set({ activeEstimateId: transformed[0].id });
            }
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      createEstimate: (inputs: CalculatorProjectInputs) => {
        const id = 'EST-' + Math.floor(10000 + Math.random() * 90000);
        const { materials, subtotal, tax, delivery, total } = calculateMaterialEstimate(inputs);

        const newEstimate: ConstructionEstimate = {
          id,
          inputs,
          materials,
          subtotalAtEstimate: subtotal,
          taxAtEstimate: tax,
          deliveryAtEstimate: delivery,
          totalAtEstimate: total,
          currentSubtotal: subtotal,
          currentTax: tax,
          currentDelivery: delivery,
          currentTotal: total,
          priceDifference: 0,
          hasPriceChanges: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          priceSnapshotTimestamp: new Date().toISOString(),
          validityDays: 7,
        };

        set((state) => ({
          estimates: [newEstimate, ...state.estimates],
          activeEstimateId: id,
        }));

        toast.success(`Estimate #${id} created & saved to your dashboard!`);

        if (getAuthToken()) {
          apiClient.estimates.create({
            id,
            project_id: inputs.projectId,
            inputs: inputs as Record<string, any>,
            materials: materials as Record<string, any>[],
            subtotal_at_estimate: subtotal,
            tax_at_estimate: tax,
            delivery_at_estimate: delivery,
            total_at_estimate: total,
            validity_days: 7,
          }).then((res) => {
            if (res.data?.id) {
              const serverEstimate = transformBackendEstimate(res.data);
              set((state) => ({
                estimates: state.estimates.map((e) => (e.id === id ? serverEstimate : e)),
                activeEstimateId: state.activeEstimateId === id ? serverEstimate.id : state.activeEstimateId,
              }));
            }
          }).catch(() => {});
        }

        return newEstimate;
      },

      getEstimate: (id: string) => {
        const raw = get().estimates.find(
          (e) =>
            e.id.toLowerCase() === id.toLowerCase() ||
            e.id.replace(/^EST-/i, '').toLowerCase() === id.replace(/^EST-/i, '').toLowerCase()
        );
        if (!raw) return undefined;

        // Perform live price check against current products.ts catalog
        return compareEstimateWithCurrentPrices(raw);
      },

      updateEstimate: (id: string, updates: Partial<ConstructionEstimate>) => {
        set((state) => ({
          estimates: state.estimates.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        }));

        if (getAuthToken()) {
          apiClient.estimates.update(id, {
            notes: updates.notes,
            project_id: updates.inputs?.projectId,
          }).catch(() => {});
        }
      },

      deleteEstimate: (id: string) => {
        const target = get().estimates.find((e) => e.id === id);
        set((state) => ({
          estimates: state.estimates.filter((e) => e.id !== id),
          activeEstimateId: state.activeEstimateId === id ? null : state.activeEstimateId,
        }));
        toast.success(`Estimate #${target?.id || id} removed.`);

        if (getAuthToken()) {
          apiClient.estimates.delete(id).catch(() => {});
        }
      },

      refreshEstimatePricing: (id: string) => {
        const current = get().getEstimate(id);
        if (!current) return undefined;

        // Take snapshot of live current prices
        const refreshedMaterials: EstimatedMaterialLine[] = current.materials.map((m) => ({
          ...m,
          priceAtEstimate: m.currentPrice,
          lineTotalAtEstimate: m.currentLineTotal,
          priceStatus: 'current',
        }));

        const refreshedSubtotal = refreshedMaterials.reduce(
          (acc, m) => acc + m.lineTotalAtEstimate,
          0
        );
        const refreshedTax = refreshedSubtotal * 0.18;
        const refreshedDelivery = refreshedSubtotal > 5000 ? 0 : 199;
        const refreshedTotal = refreshedSubtotal + refreshedTax + refreshedDelivery;

        const updated: ConstructionEstimate = {
          ...current,
          materials: refreshedMaterials,
          subtotalAtEstimate: refreshedSubtotal,
          taxAtEstimate: refreshedTax,
          deliveryAtEstimate: refreshedDelivery,
          totalAtEstimate: refreshedTotal,
          currentSubtotal: refreshedSubtotal,
          currentTax: refreshedTax,
          currentDelivery: refreshedDelivery,
          currentTotal: refreshedTotal,
          priceDifference: 0,
          hasPriceChanges: false,
          priceSnapshotTimestamp: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          estimates: state.estimates.map((e) => (e.id === id ? updated : e)),
        }));

        toast.success(`Estimate #${id} updated with today's live catalog pricing!`);

        if (getAuthToken()) {
          apiClient.estimates.refreshPricing(id).catch(() => {});
        }

        return updated;
      },

      addEstimateToProjectBOQ: (estimateId: string, targetProjectId: string) => {
        const estimate = get().getEstimate(estimateId);
        if (!estimate) {
          toast.error('Estimate not found');
          return false;
        }

        const { projects, addMaterialToProject } = useProjectStore.getState();
        const targetProject = projects.find((p) => p.id === targetProjectId);

        if (!targetProject) {
          toast.error('Target project not found');
          return false;
        }

        let addedCount = 0;
        estimate.materials.forEach((mat) => {
          if (mat.matchedProductId) {
            addMaterialToProject(
              targetProjectId,
              mat.matchedProductId,
              mat.quantity,
              mat.unit,
              targetProject.stage || 'Foundation'
            );
            addedCount++;
          }
        });

        toast.success(`Transferred ${addedCount} estimated materials to "${targetProject.name}" BOQ!`);

        if (getAuthToken()) {
          apiClient.estimates.transferToProject(estimateId, {
            target_project_id: targetProjectId,
            stage: targetProject.stage || 'Foundation',
          }).catch(() => {});
        }

        return true;
      },

      addAvailableMaterialsToCart: (estimateId: string) => {
        const estimate = get().getEstimate(estimateId);
        if (!estimate) {
          toast.error('Estimate not found');
          return { added: 0, unavailable: 0 };
        }

        const { addToCart } = useCartStore.getState();
        let addedCount = 0;
        let unavailableCount = 0;

        estimate.materials.forEach((mat) => {
          // ALWAYS fetch the current live product from catalog for active cart
          const liveProduct = products.find((p) => p.id === mat.matchedProductId);
          if (liveProduct && liveProduct.stock && liveProduct.stock > 0) {
            addToCart(liveProduct, mat.quantity);
            addedCount++;
          } else {
            unavailableCount++;
          }
        });

        if (addedCount > 0 && unavailableCount === 0) {
          toast.success(`Added ${addedCount} materials to cart at current catalog rates!`);
        } else if (addedCount > 0 && unavailableCount > 0) {
          toast(
            `Added ${addedCount} available items to cart. ${unavailableCount} item(s) are currently out of stock.`,
            { icon: '⚠️' }
          );
        } else {
          toast.error('All materials in this estimate are currently out of stock.');
        }

        return { added: addedCount, unavailable: unavailableCount };
      },

      setActiveEstimateId: (id: string | null) => {
        set({ activeEstimateId: id });
      },
    }),
    {
      name: 'hepna-estimates',
    }
  )
);
