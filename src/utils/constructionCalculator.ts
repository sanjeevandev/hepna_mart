import {
  CalculatorProjectInputs,
  EstimatedMaterialLine,
  ConstructionEstimate,
  ConstructionQuality,
  ProjectType,
} from '@/types';
import { products } from '@/data/products';

// ============================================================================
// HEPNA MART — Centralized Construction Estimation Coefficients & Mappings
// ============================================================================

/**
 * Baseline coefficients per 1,000 sq.ft of standard residential construction.
 * All quantities scale linearly with effective area (built-up area * floors * multipliers).
 */
export interface CategoryCoefficientConfig {
  id: string;
  categoryName: string;
  categorySlug: string;
  unit: string;
  /** Quantity required per 1,000 sq.ft for standard single-floor residential */
  baseQuantityPer1000SqFt: number;
  coefficientDescription: string;
  /** Product mapping by quality level */
  productMapping: {
    economy: string; // product ID
    standard: string;
    premium: string;
  };
}

export const CONSTRUCTION_MATERIAL_CONFIGS: CategoryCoefficientConfig[] = [
  {
    id: 'mat-cement',
    categoryName: 'Cement & Concrete',
    categorySlug: 'cement-concrete',
    unit: 'Bag',
    baseQuantityPer1000SqFt: 400, // ~0.4 bags per sq.ft
    coefficientDescription: '0.40 Bags / sq.ft for structural slab, columns, beams & masonry mortar',
    productMapping: {
      economy: 'prod-2', // ACC PPC Cement (₹370)
      standard: 'prod-1', // UltraTech OPC 53 Grade (₹390)
      premium: 'prod-1', // UltraTech OPC 53 Grade (₹390)
    },
  },
  {
    id: 'mat-bricks',
    categoryName: 'Bricks & Masonry Blocks',
    categorySlug: 'bricks-blocks',
    unit: 'Piece',
    baseQuantityPer1000SqFt: 1200, // ~1.2 blocks per sq.ft (or 8000 red bricks)
    coefficientDescription: '1.20 High-strength AAC Blocks / sq.ft for external & internal partition walls',
    productMapping: {
      economy: 'prod-7', // Fly Ash Bricks (₹7)
      standard: 'prod-9', // AAC Blocks (₹65)
      premium: 'prod-9', // AAC Blocks (₹65)
    },
  },
  {
    id: 'mat-steel',
    categoryName: 'Structural Steel & Roofing',
    categorySlug: 'roofing',
    unit: 'Sheet',
    baseQuantityPer1000SqFt: 18,
    coefficientDescription: 'Galvanized high-tensile structural sheets & frame supports',
    productMapping: {
      economy: 'prod-11', // Galvanized Metal Roofing Sheet (₹850)
      standard: 'prod-11', // Galvanized Metal Roofing Sheet (₹850)
      premium: 'prod-11', // Galvanized Metal Roofing Sheet (₹850)
    },
  },
  {
    id: 'mat-plumbing',
    categoryName: 'Plumbing & Drainage',
    categorySlug: 'plumbing',
    unit: 'Piece',
    baseQuantityPer1000SqFt: 25,
    coefficientDescription: 'CPVC hot/cold distribution lines, fittings & drainage conduits',
    productMapping: {
      economy: 'prod-16', // PVC Pipe (₹250)
      standard: 'prod-17', // Astral CPVC Pro Pipe (₹480)
      premium: 'prod-17', // Astral CPVC Pro Pipe (₹480)
    },
  },
  {
    id: 'mat-electrical',
    categoryName: 'Electrical Wiring & Protection',
    categorySlug: 'electrical',
    unit: 'Roll',
    baseQuantityPer1000SqFt: 8,
    coefficientDescription: 'FRLS multi-strand copper cables & safety distribution MCB runs',
    productMapping: {
      economy: 'prod-21', // Polycab FRLS Wire (₹1,850)
      standard: 'prod-21', // Polycab FRLS Wire (₹1,850)
      premium: 'prod-21', // Polycab FRLS Wire (₹1,850)
    },
  },
  {
    id: 'mat-flooring',
    categoryName: 'Flooring & Vitrified Tiles',
    categorySlug: 'flooring',
    unit: 'Box',
    baseQuantityPer1000SqFt: 45,
    coefficientDescription: '1.10 sq.ft tile coverage per sq.ft including wastage & skirting',
    productMapping: {
      economy: 'prod-26', // Ceramic Floor Tiles (₹650)
      standard: 'prod-27', // Vitrified Tiles (₹850)
      premium: 'prod-27', // Vitrified Tiles (₹850)
    },
  },
  {
    id: 'mat-paint',
    categoryName: 'Paint, Primer & Surface Finishing',
    categorySlug: 'paint-finishing',
    unit: 'Bucket',
    baseQuantityPer1000SqFt: 6,
    coefficientDescription: 'Interior putty coats, exterior primer & weather-shield topcoat',
    productMapping: {
      economy: 'prod-36', // Asian Paints Tractor (₹2,450)
      standard: 'prod-36', // Asian Paints Apex Ultima (₹2,450)
      premium: 'prod-36', // Asian Paints Apex Ultima (₹2,450)
    },
  },
  {
    id: 'mat-waterproofing',
    categoryName: 'Waterproofing & Construction Chemicals',
    categorySlug: 'roofing',
    unit: 'Can',
    baseQuantityPer1000SqFt: 5,
    coefficientDescription: 'Sunken slab, foundation damp-proof membrane & roof sealants',
    productMapping: {
      economy: 'prod-15', // Dr. Fixit Waterproofing (₹1,250)
      standard: 'prod-15', // Dr. Fixit Waterproofing (₹1,250)
      premium: 'prod-15', // Dr. Fixit Waterproofing (₹1,250)
    },
  },
  {
    id: 'mat-doors',
    categoryName: 'Doors, Windows & Hardware',
    categorySlug: 'doors-windows',
    unit: 'Set',
    baseQuantityPer1000SqFt: 4,
    coefficientDescription: 'Flush door frames, brass hinges & security mortise locks',
    productMapping: {
      economy: 'prod-31', // Wooden Door Frame (₹3,200)
      standard: 'prod-31', // Wooden Door Frame (₹3,200)
      premium: 'prod-31', // Wooden Door Frame (₹3,200)
    },
  },
  {
    id: 'mat-safety',
    categoryName: 'Job-Site Safety Equipment',
    categorySlug: 'hardware',
    unit: 'Set',
    baseQuantityPer1000SqFt: 2,
    coefficientDescription: 'Industrial helmets, high-visibility jackets & safety footwear',
    productMapping: {
      economy: 'prod-46', // Safety Kit (₹1,650)
      standard: 'prod-46', // Safety Kit (₹1,650)
      premium: 'prod-46', // Safety Kit (₹1,650)
    },
  },
];

export const QUALITY_MULTIPLIERS: Record<ConstructionQuality, number> = {
  economy: 0.88,
  standard: 1.0,
  premium: 1.22,
};

export const PROJECT_TYPE_MULTIPLIERS: Record<ProjectType, number> = {
  House: 1.0,
  Villa: 1.12,
  Apartment: 0.95,
  Commercial: 1.18,
  Industrial: 1.25,
  Renovation: 0.48,
};

/**
 * Calculates indicative material quantities and reads current live catalog prices.
 */
export function calculateMaterialEstimate(inputs: CalculatorProjectInputs): {
  materials: EstimatedMaterialLine[];
  subtotal: number;
  tax: number;
  delivery: number;
  total: number;
} {
  // Convert area to sq.ft baseline if needed
  const areaInSqFt = inputs.areaUnit === 'sq.m' ? inputs.builtUpArea * 10.7639 : inputs.builtUpArea;
  const numFloors = Math.max(1, inputs.floors || 1);
  const totalFloorArea = areaInSqFt * numFloors;

  const qualityFactor = QUALITY_MULTIPLIERS[inputs.quality] || 1.0;
  const projectFactor = PROJECT_TYPE_MULTIPLIERS[inputs.projectType] || 1.0;

  const effectiveScale = (totalFloorArea / 1000) * projectFactor * qualityFactor;

  const materials: EstimatedMaterialLine[] = CONSTRUCTION_MATERIAL_CONFIGS.map((config) => {
    const rawQuantity = config.baseQuantityPer1000SqFt * effectiveScale;
    const finalQuantity = Math.max(1, Math.round(rawQuantity));

    // Lookup mapped catalog product by quality
    const targetProductId =
      config.productMapping[inputs.quality] || config.productMapping.standard || 'prod-1';
    const catalogProduct = products.find((p) => p.id === targetProductId) || products[0];

    const currentPrice = catalogProduct?.price || 0;
    const currentLineTotal = currentPrice * finalQuantity;

    const inStock = Boolean(catalogProduct && catalogProduct.stock && catalogProduct.stock > 0);
    const stockCount = catalogProduct?.stock || 0;

    let priceStatus: 'current' | 'updated' | 'unavailable' | 'no-price' = 'current';
    if (!catalogProduct) {
      priceStatus = 'unavailable';
    } else if (currentPrice <= 0) {
      priceStatus = 'no-price';
    }

    return {
      id: config.id,
      categoryName: config.categoryName,
      categorySlug: config.categorySlug,
      coefficientDescription: config.coefficientDescription,
      quantity: finalQuantity,
      unit: catalogProduct?.unit || config.unit,
      matchedProductId: catalogProduct.id,
      productName: catalogProduct.name,
      brand: catalogProduct.brand,
      image: catalogProduct.images?.[0],
      priceAtEstimate: currentPrice,
      lineTotalAtEstimate: currentLineTotal,
      currentPrice: currentPrice,
      currentLineTotal: currentLineTotal,
      priceStatus,
      inStock,
      stockCount,
    };
  });

  const subtotal = materials.reduce((acc, m) => acc + m.lineTotalAtEstimate, 0);
  const tax = subtotal * 0.18; // Standard 18% GST for construction supplies
  const delivery = subtotal > 5000 ? 0 : 199; // Standard HEPNA MART policy
  const total = subtotal + tax + delivery;

  return { materials, subtotal, tax, delivery, total };
}

/**
 * Compares an existing historical estimate against the current live catalog prices.
 */
export function compareEstimateWithCurrentPrices(
  estimate: ConstructionEstimate
): ConstructionEstimate {
  let hasPriceChanges = false;
  let currentSubtotal = 0;

  const updatedMaterials = estimate.materials.map((mat) => {
    const currentCatalogProduct = products.find((p) => p.id === mat.matchedProductId);
    const currentPrice = currentCatalogProduct?.price || 0;
    const currentLineTotal = currentPrice * mat.quantity;
    const inStock = Boolean(
      currentCatalogProduct && currentCatalogProduct.stock && currentCatalogProduct.stock > 0
    );
    const stockCount = currentCatalogProduct?.stock || 0;

    let priceStatus: 'current' | 'updated' | 'unavailable' | 'no-price' = 'current';

    if (!currentCatalogProduct) {
      priceStatus = 'unavailable';
      hasPriceChanges = true;
    } else if (currentPrice <= 0) {
      priceStatus = 'no-price';
      hasPriceChanges = true;
    } else if (currentPrice !== mat.priceAtEstimate) {
      priceStatus = 'updated';
      hasPriceChanges = true;
    }

    currentSubtotal += currentLineTotal;

    return {
      ...mat,
      currentPrice,
      currentLineTotal,
      priceStatus,
      inStock,
      stockCount,
    };
  });

  const currentTax = currentSubtotal * 0.18;
  const currentDelivery = currentSubtotal > 5000 ? 0 : 199;
  const currentTotal = currentSubtotal + currentTax + currentDelivery;
  const priceDifference = currentTotal - estimate.totalAtEstimate;

  return {
    ...estimate,
    materials: updatedMaterials,
    currentSubtotal,
    currentTax,
    currentDelivery,
    currentTotal,
    priceDifference,
    hasPriceChanges,
    updatedAt: new Date().toISOString(),
  };
}
