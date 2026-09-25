// ============================================
// HEPNA MART — Type Definitions
// ============================================

// --- Product Types ---

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  images: string[];
  price: number;
  mrp: number;
  discount: number;
  unit: string;
  stock: number;
  rating: number;
  reviews: number;
  variants?: ProductVariant[];
  bulkPrice?: number;
  minimumBulkQuantity?: number;
  deliveryAvailable: boolean;
  featured: boolean;
  newArrival: boolean;
  specifications?: Record<string, string>;
  features?: string[];
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
}

// --- Category Types ---

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  icon: string;
  image: string;
  productCount: number;
  subcategories: string[];
}

// --- Cart Types ---

export interface CartItem {
  product: Product;
  quantity: number;
}

// --- Project & BOQ Types ---

export type ProjectType =
  | 'House'
  | 'Villa'
  | 'Apartment'
  | 'Commercial'
  | 'Industrial'
  | 'Renovation';

export type ProjectStage =
  | 'Foundation'
  | 'Structure'
  | 'Masonry'
  | 'Plumbing & Electrical'
  | 'Flooring'
  | 'Finishing'
  | 'Complete Project';

export interface ProjectMaterialItem {
  productId: string;
  quantity: number;
  unit: string;
  purchasedQuantity?: number;
  wastagePercent?: number;
  stage?: string;
  notes?: string;
  addedAt: string;
  priceAtAddition?: number;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  builtUpArea: number;
  areaUnit: 'sq.ft' | 'sq.m';
  floors: number;
  stage: ProjectStage;
  city: string;
  pincode: string;
  createdAt: string;
  updatedAt: string;
  materials: ProjectMaterialItem[];
  completedStages: string[];
  ownerUserId?: string;
  businessId?: string;
  memberIds?: string[];
}

// --- Account, RBAC & Organization Types ---

export type AccountType = 'individual' | 'contractor' | 'business';

export type UserRole =
  | 'customer'
  | 'super_admin'
  | 'admin'
  | 'procurement_manager'
  | 'inventory_manager'
  | 'order_manager'
  | 'support_staff';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: AccountType;
  role: UserRole;
  avatar?: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractorSpecialization =
  | 'Residential Construction'
  | 'Commercial Construction'
  | 'Renovation'
  | 'Civil Works'
  | 'Roofing'
  | 'Plumbing'
  | 'Electrical'
  | 'Interior / Finishing'
  | 'General Contractor';

export interface ContractorProfile {
  contractorId: string;
  userId: string;
  businessName: string;
  specialization: ContractorSpecialization[];
  yearsOfExperience: number;
  serviceArea: string;
  projectCount?: number;
  preferredMaterials?: string[];
  createdAt: string;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  gstin?: string;
  pan?: string;
  registeredAddress: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
}

export type TeamMemberRole =
  | 'Owner'
  | 'Admin'
  | 'Procurement Manager'
  | 'Project Manager'
  | 'Viewer';

export interface TeamMember {
  id: string;
  businessId: string;
  userId?: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  status: 'active' | 'invited' | 'inactive';
  joinedAt: string;
}

export interface ConstructionSite {
  id: string;
  userId: string;
  projectId?: string;
  siteName: string;
  contactPerson: string;
  contactPhone: string;
  address: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  accessRoad?: string;
  vehicleAccess?: string;
  unloadingInstructions?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Permission =
  | 'dashboard.view'
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'inventory.view'
  | 'inventory.update'
  | 'orders.view'
  | 'orders.update'
  | 'orders.cancel'
  | 'customers.view'
  | 'customers.edit'
  | 'projects.view'
  | 'projects.edit'
  | 'boq.view'
  | 'boq.edit'
  | 'quotes.view'
  | 'quotes.manage'
  | 'suppliers.view'
  | 'suppliers.manage'
  | 'pricing.view'
  | 'pricing.manage'
  | 'reports.view'
  | 'settings.manage';

// --- Address & Delivery ---

export interface DeliveryAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isConstructionSite: boolean;
  siteName?: string;
  siteType?: string;
  deliveryPreference?: string;
  requiredDeliveryDate?: string;
  siteContactPerson?: string;
  sitePhone?: string;
  deliveryInstructions?: string;
}

// --- Order Types ---

export type OrderStatus =
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  active?: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  tax: number;
  total: number;
  status: OrderStatus;
  date: string;
  deliveryAddress: DeliveryAddress;
  paymentMethod: string;
  estimatedDelivery: string;
  deliveryWindow?: string;
  projectId?: string;
  projectName?: string;
  quotationId?: string;
  statusHistory?: OrderStatusHistoryItem[];
  cancellationReason?: string;
  cancelledAt?: string;
}

// --- Wholesale / Bulk ---

export interface BulkQuoteItem {
  productName: string;
  quantity: number;
  unit: string;
}

export interface BulkQuoteRequest {
  products: BulkQuoteItem[];
  deliveryLocation: string;
  requiredDate: string;
  additionalRequirements: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

// --- Search & Filters ---

export type SortOption =
  | 'relevance'
  | 'price-low'
  | 'price-high'
  | 'rating'
  | 'newest'
  | 'discount';

export interface SearchFilters {
  category?: string;
  brand?: string;
  priceRange?: [number, number];
  rating?: number;
  inStock?: boolean;
  material?: string;
  size?: string;
  unit?: string;
  wholesale?: boolean;
  sortBy?: SortOption;
}

// --- Offers ---

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  discountType: 'percentage' | 'flat';
  type: 'deal' | 'combo' | 'bulk' | 'limited' | 'new';
  products: string[];
  validUntil: string;
  image: string;
  badge?: string;
}

// --- Reviews ---

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

// --- Construction Calculator & Estimate Types ---

export type ConstructionQuality = 'economy' | 'standard' | 'premium';

export interface CalculatorProjectInputs {
  projectType: ProjectType;
  builtUpArea: number;
  areaUnit: 'sq.ft' | 'sq.m';
  floors: number;
  quality: ConstructionQuality;
  city: string;
  projectId?: string;
  projectName?: string;
}

export interface EstimatedMaterialLine {
  id: string;
  categoryName: string;
  categorySlug: string;
  categoryIcon?: string;
  coefficientDescription: string;
  quantity: number;
  unit: string;
  matchedProductId: string;
  productName: string;
  brand: string;
  image?: string;
  priceAtEstimate: number;
  lineTotalAtEstimate: number;
  currentPrice: number;
  currentLineTotal: number;
  priceStatus: 'current' | 'updated' | 'unavailable' | 'no-price';
  inStock: boolean;
  stockCount: number;
}

export interface ConstructionEstimate {
  id: string;
  inputs: CalculatorProjectInputs;
  materials: EstimatedMaterialLine[];
  subtotalAtEstimate: number;
  taxAtEstimate: number;
  deliveryAtEstimate: number;
  totalAtEstimate: number;
  currentSubtotal: number;
  currentTax: number;
  currentDelivery: number;
  currentTotal: number;
  priceDifference: number;
  hasPriceChanges: boolean;
  createdAt: string;
  updatedAt: string;
  priceSnapshotTimestamp: string;
  validityDays: number;
  notes?: string;
}
