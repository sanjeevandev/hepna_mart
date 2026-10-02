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
  specifications?: Record<string, string> | Array<{ key: string; value: string }>;
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
  priceAtAddition?: number;
  hasPriceChanged?: boolean;
  priceChangeAmount?: number;
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

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: OrgRole;
  email?: string | null;
  name?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AddProjectMemberPayload {
  user_id: string;
  role: OrgRole;
}

export interface UpdateProjectMemberPayload {
  role: OrgRole;
}

export interface TransferProjectPayload {
  target_organization_id: string | null;
}

export interface ProjectActivityActor {
  id: string;
  email: string;
  name?: string | null;
}

export interface NotificationActorSummary {
  id?: string | null;
  email?: string | null;
  name?: string | null;
}

export interface ProjectNotification {
  id: string;
  recipient_user_id: string;
  organization_id?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  activity_log_id?: string | null;
  notification_type: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  actor?: NotificationActorSummary | null;
}

export interface ProjectNotificationListResponse {
  notifications: ProjectNotification[];
  total: number;
  page: number;
  limit: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface ProjectActivityEvent {
  id: string;
  organization_id?: string | null;
  project_id?: string | null;
  actor_user_id?: string | null;
  actor?: ProjectActivityActor | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  metadata: Record<string, any>;
  created_at: string;
}


// --- Project Collaboration & Comment Types (Phase 2L.6) ---

export interface CommentAuthorSummary {
  id: string;
  name?: string | null;
  email: string;
  role?: string | null;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  author?: CommentAuthorSummary | null;
}

export interface ProjectCommentCreatePayload {
  content: string;
}

export interface ProjectCommentUpdatePayload {
  content: string;
}

export interface ProjectCommentListResponse {
  comments: ProjectComment[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectActivityListResponse {
  activities: ProjectActivityEvent[];
  total: number;
  page: number;
  limit: number;
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
  organizationId?: string | null;
  organization_id?: string | null;
  organizationName?: string | null;
  organization_name?: string | null;
  currentUserRole?: OrgRole | null;
  current_user_role?: OrgRole | null;
  memberCount?: number;
  member_count?: number;
  isShared?: boolean;
  is_shared?: boolean;
  members?: ProjectMember[];
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
  licenseNumber?: string;
  projectCount?: number;
  preferredMaterials?: string[];
  verificationStatus?: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt?: string;
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
  contactEmail?: string;
  taxVerificationStatus?: string;
  taxVerificationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrgRole =
  | 'owner'
  | 'admin'
  | 'procurement_manager'
  | 'project_manager'
  | 'site_supervisor'
  | 'viewer';

export type TeamMemberRole =
  | 'Owner'
  | 'Admin'
  | 'Procurement Manager'
  | 'Project Manager'
  | 'Site Supervisor'
  | 'Viewer';

export interface BackendOrganization {
  id: string;
  name: string;
  owner_id: string;
  slug?: string | null;
  business_type: string;
  is_active: boolean;
  current_user_role?: OrgRole | null;
  member_count: number;
  created_at: string;
  updated_at?: string | null;
}

export interface BackendOrgMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  email?: string | null;
  name?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface BackendInvitation {
  id: string;
  organization_id: string;
  invited_by_user_id: string;
  email: string;
  role: OrgRole;
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at?: string | null;
}

export interface CreateOrganizationPayload {
  name: string;
  slug?: string;
  business_type?: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  slug?: string;
  business_type?: string;
  is_active?: boolean;
}

export interface CreateInvitationPayload {
  email: string;
  role: OrgRole;
}

export interface AcceptInvitationResponse {
  status: string;
  message: string;
  organization_id: string;
  organization_name: string;
  role: OrgRole;
}

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
  | 'categories.view'
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
  | 'estimates.view'
  | 'quotes.view'
  | 'quotes.manage'
  | 'suppliers.view'
  | 'suppliers.manage'
  | 'pricing.view'
  | 'pricing.manage'
  | 'reports.view'
  | 'payments.view'
  | 'payments.verify'
  | 'payments.reject'
  | 'payments.refund'
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
  paymentStatus?: string;
  payment_status?: string;
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
  minPrice?: number;
  maxPrice?: number;
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
  discountPercent?: number;
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

// --- Payment Types ---

export type PaymentStatus =
  | 'pending'
  | 'awaiting_verification'
  | 'verified'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'upi' | 'cod' | 'card' | 'netbanking';

export interface PaymentEvent {
  id: string;
  payment_id: string;
  event_type: string;
  old_status?: string | null;
  new_status: string;
  provider_event_id?: string | null;
  metadata?: Record<string, any> | null;
  created_by_user_id?: string | null;
  created_at: string;
}

export interface PaymentOrderSummary {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  payment_status: string;
  status: string;
}

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  payment_reference?: string;
  provider_reference?: string;
  provider: string;
  payment_method: string;
  payment_status: PaymentStatus;
  amount: number;
  currency: string;
  failure_reason?: string;
  verified_by_user_id?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  order?: PaymentOrderSummary;
  events?: PaymentEvent[];
}

export interface PaymentMetrics {
  pending_verification: number;
  verified_today: number;
  failed_payments: number;
  cod_orders: number;
  upi_volume: number;
  refund_pending: number;
  total_payments: number;
}

export interface PaymentConfig {
  upi_id: string;
  upi_display_name: string;
  upi_qr_path: string;
  currency: string;
  manual_upi_enabled: boolean;
  cod_enabled: boolean;
  gateway_enabled: boolean;
}
