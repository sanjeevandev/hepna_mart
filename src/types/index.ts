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
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled';

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
