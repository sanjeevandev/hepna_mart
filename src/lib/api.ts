/**
 * =========================================================================
 * HEPNA MART — BACKEND API CLIENT FOUNDATION
 * =========================================================================
 * Clean HTTP client for FastAPI backend integration with JWT Bearer auth support.
 * Works seamlessly alongside local Zustand stores for offline fallback.
 */

import type {
  OrgRole,
  BackendOrganization,
  BackendOrgMember,
  BackendInvitation,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
  CreateInvitationPayload,
  AcceptInvitationResponse,
} from '@/types';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://127.0.0.1:8001/api/v1';

const AUTH_TOKEN_KEY = 'hepna_auth_token';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  detail?: any;
}

export interface BackendUserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string | null;
  company_name?: string | null;
  account_type: string;
  role: string;
  is_staff: boolean;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface BackendCurrentUserResponse extends BackendUserResponse {
  permissions: string[];
}

export interface BackendTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: BackendUserResponse;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  account_type?: string;
  company_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // Ignore storage write errors
  }
}

export function removeAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore storage write errors
  }
}

export interface BackendCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  tagline?: string | null;
  icon?: string | null;
  image?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  sort_order: number;
  subcategories?: string[];
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BackendCategoryListItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  tagline?: string | null;
  icon?: string | null;
  image?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  sort_order: number;
  subcategories?: string[];
  product_count: number;
}

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  tagline?: string;
  icon?: string;
  image?: string;
  parent_id?: string;
  is_active?: boolean;
  sort_order?: number;
  subcategories?: string[];
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  tagline?: string;
  icon?: string;
  image?: string;
  parent_id?: string;
  is_active?: boolean;
  sort_order?: number;
  subcategories?: string[];
}

export interface BackendProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  brand: string;
  category_id: string;
  category_slug?: string | null;
  category_name?: string | null;
  subcategory?: string | null;
  description?: string | null;
  short_description?: string | null;
  price: number;
  mrp: number;
  discount_percent: number;
  unit: string;
  rating: number;
  review_count: number;
  bulk_price?: number | null;
  minimum_bulk_quantity?: number | null;
  delivery_available: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_offer: boolean;
  is_active: boolean;
  images: string[];
  specifications?: any;
  features: string[];
  stock: number;
  available_stock?: number;
  reserved_stock?: number;
  category?: BackendCategory | null;
  created_at: string;
  updated_at: string;
}

export interface BackendProductListResponse {
  items: BackendProduct[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ProductQueryParams {
  search?: string;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  rating?: number;
  in_stock?: boolean;
  featured?: boolean;
  new?: boolean;
  offer?: boolean;
  active_only?: boolean;
  sort?: string;
  page?: number;
  page_size?: number;
  limit?: number;
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  sku?: string;
  brand: string;
  category_id: string;
  subcategory?: string;
  description?: string;
  short_description?: string;
  price: number;
  mrp: number;
  discount_percent?: number;
  unit?: string;
  rating?: number;
  review_count?: number;
  bulk_price?: number;
  minimum_bulk_quantity?: number;
  delivery_available?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  is_offer?: boolean;
  is_active?: boolean;
  images?: string[];
  specifications?: any;
  features?: string[];
  initial_stock?: number;
}

export interface UpdateProductPayload {
  name?: string;
  slug?: string;
  sku?: string;
  brand?: string;
  category_id?: string;
  subcategory?: string;
  description?: string;
  short_description?: string;
  price?: number;
  mrp?: number;
  discount_percent?: number;
  unit?: string;
  rating?: number;
  review_count?: number;
  bulk_price?: number;
  minimum_bulk_quantity?: number;
  delivery_available?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  is_offer?: boolean;
  is_active?: boolean;
  images?: string[];
  specifications?: any;
  features?: string[];
}

export interface BackendInventory {
  id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  warehouse: string;
  location?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BackendInventoryListItem extends BackendInventory {
  product_name?: string | null;
  product_slug?: string | null;
  product_sku?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
}

export interface UpdateInventoryPayload {
  quantity?: number;
  reserved_quantity?: number;
  low_stock_threshold?: number;
  warehouse?: string;
  location?: string;
}

export interface BackendCartItemProductSummary {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  mrp: number;
  discount: number;
  unit: string;
  images: string[];
  stock: number;
  is_active: boolean;
}

export interface BackendCartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price_at_addition: number;
  current_price: number;
  has_price_changed: boolean;
  price_change_amount: number;
  subtotal: number;
  product: BackendCartItemProductSummary;
  created_at: string;
  updated_at: string;
}

export interface BackendCartResponse {
  id: string;
  user_id: string;
  items: BackendCartItem[];
  total_items: number;
  subtotal: number;
  tax: number;
  delivery_charge: number;
  total: number;
  has_price_changes: boolean;
}

export interface BackendWishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  product: BackendCartItemProductSummary;
  created_at: string;
}

export interface BackendWishlistResponse {
  id: string;
  user_id: string;
  items: BackendWishlistItem[];
  total_items: number;
  product_ids: string[];
}

export interface BackendOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  product_image: string | null;
  brand: string | null;
  unit: string | null;
  quantity: number;
  unit_price: number;
  mrp: number;
  discount_amount: number;
  tax_amount: number;
  subtotal: number;
  total: number;
  created_at: string;
}

export interface BackendOrderStatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  title: string;
  description: string | null;
  note: string | null;
  completed: boolean;
  active: boolean;
  created_at: string;
}

export interface BackendOrder {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  tax_amount: number;
  delivery_charge: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  estimated_delivery: string | null;
  delivery_window: string | null;
  project_id: string | null;
  project_name: string | null;
  quotation_id: string | null;
  delivery_address: any;
  items: BackendOrderItem[];
  status_history: BackendOrderStatusHistory[];
  created_at: string;
  updated_at: string;
}

export interface BackendOrderListResponse {
  orders: BackendOrder[];
  total_count: number;
}

export interface CheckoutPayload {
  items?: { product_id: string; quantity: number }[];
  delivery_address: any;
  payment_method: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  project_id?: string;
  project_name?: string;
  notes?: string;
}

export interface OrderStatusUpdatePayload {
  status: string;
  title?: string;
  description?: string;
  note?: string;
}

export interface ReorderResponseData {
  added_count: number;
  unavailable_items: string[];
  message: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Helper to execute fetch requests with automatic JSON parsing, Authorization header, and error wrapping.
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
    const token = getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      let data: any = null;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        throw {
          message: data?.detail || data?.message || `HTTP Error ${res.status}`,
          status: res.status,
          detail: data,
        } as ApiError;
      }

      return {
        data,
        status: res.status,
        ok: res.ok,
      };
    } catch (err: any) {
      if (err.status) throw err;
      throw {
        message: err.message || 'Network request failed. Is the FastAPI backend running?',
        status: 0,
        detail: err,
      } as ApiError;
    }
  }

  // Convenience methods
  get<T = any>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  delete<T = any>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  /**
   * Auth API Namespace
   */
  readonly auth = {
    register: async (payload: RegisterPayload): Promise<ApiResponse<BackendTokenResponse>> => {
      const res = await this.post<BackendTokenResponse>('auth/register', payload);
      if (res.data?.access_token) {
        setAuthToken(res.data.access_token);
      }
      return res;
    },

    login: async (payload: LoginPayload): Promise<ApiResponse<BackendTokenResponse>> => {
      const res = await this.post<BackendTokenResponse>('auth/login', payload);
      if (res.data?.access_token) {
        setAuthToken(res.data.access_token);
      }
      return res;
    },

    getMe: async (): Promise<ApiResponse<BackendCurrentUserResponse>> => {
      return this.get<BackendCurrentUserResponse>('auth/me');
    },

    changePassword: async (payload: ChangePasswordPayload): Promise<ApiResponse<{ detail: string }>> => {
      return this.post<{ detail: string }>('auth/change-password', payload);
    },

    logout: async (): Promise<void> => {
      try {
        await this.post('auth/logout');
      } catch {
        // Continue even if backend call fails
      } finally {
        removeAuthToken();
      }
    },
  };

  /**
   * Categories API Namespace
   */
  readonly categories = {
    list: async (activeOnly: boolean = true): Promise<ApiResponse<BackendCategoryListItem[]>> => {
      return this.get<BackendCategoryListItem[]>(`categories?active_only=${activeOnly}`);
    },

    getBySlug: async (slug: string): Promise<ApiResponse<BackendCategory>> => {
      return this.get<BackendCategory>(`categories/slug/${encodeURIComponent(slug)}`);
    },

    getById: async (id: string): Promise<ApiResponse<BackendCategory>> => {
      return this.get<BackendCategory>(`categories/${encodeURIComponent(id)}`);
    },

    create: async (payload: CreateCategoryPayload): Promise<ApiResponse<BackendCategory>> => {
      return this.post<BackendCategory>('categories', payload);
    },

    update: async (id: string, payload: UpdateCategoryPayload): Promise<ApiResponse<BackendCategory>> => {
      return this.put<BackendCategory>(`categories/${encodeURIComponent(id)}`, payload);
    },

    delete: async (id: string): Promise<ApiResponse<{ detail: string; deleted: boolean }>> => {
      return this.delete<{ detail: string; deleted: boolean }>(`categories/${encodeURIComponent(id)}`);
    },
  };

  /**
   * Products API Namespace
   */
  readonly products = {
    list: async (params: ProductQueryParams = {}): Promise<ApiResponse<BackendProductListResponse>> => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.category) query.set('category', params.category);
      if (params.brand) query.set('brand', params.brand);
      if (params.min_price !== undefined) query.set('min_price', String(params.min_price));
      if (params.max_price !== undefined) query.set('max_price', String(params.max_price));
      if (params.rating !== undefined) query.set('rating', String(params.rating));
      if (params.in_stock !== undefined) query.set('in_stock', String(params.in_stock));
      if (params.featured !== undefined) query.set('featured', String(params.featured));
      if (params.new !== undefined) query.set('new', String(params.new));
      if (params.offer !== undefined) query.set('offer', String(params.offer));
      if (params.active_only !== undefined) query.set('active_only', String(params.active_only));
      if (params.sort) {
        const sortMap: Record<string, string> = {
          'relevance': 'popular',
          'price-low': 'price_asc',
          'price-high': 'price_desc',
          'rating': 'rating_desc',
          'discount': 'discount_desc',
          'newest': 'newest',
        };
        const mappedSort = sortMap[params.sort] || params.sort;
        query.set('sort', mappedSort);
      }
      if (params.page !== undefined) query.set('page', String(params.page));
      const effectivePageSize = params.page_size !== undefined ? params.page_size : params.limit;
      if (effectivePageSize !== undefined) query.set('page_size', String(effectivePageSize));

      const qs = query.toString();
      return this.get<BackendProductListResponse>(`products${qs ? `?${qs}` : ''}`);
    },

    getBySlug: async (slug: string): Promise<ApiResponse<BackendProduct>> => {
      return this.get<BackendProduct>(`products/slug/${encodeURIComponent(slug)}`);
    },

    getById: async (id: string): Promise<ApiResponse<BackendProduct>> => {
      return this.get<BackendProduct>(`products/${encodeURIComponent(id)}`);
    },

    create: async (payload: CreateProductPayload): Promise<ApiResponse<BackendProduct>> => {
      return this.post<BackendProduct>('products', payload);
    },

    update: async (id: string, payload: UpdateProductPayload): Promise<ApiResponse<BackendProduct>> => {
      return this.put<BackendProduct>(`products/${encodeURIComponent(id)}`, payload);
    },

    delete: async (id: string, hardDelete: boolean = false): Promise<ApiResponse<{ detail: string; deleted: boolean }>> => {
      return this.delete<{ detail: string; deleted: boolean }>(`products/${encodeURIComponent(id)}?hard_delete=${hardDelete}`);
    },
  };

  /**
   * Inventory API Namespace
   */
  readonly inventory = {
    list: async (lowStockOnly: boolean = false, warehouse?: string): Promise<ApiResponse<BackendInventoryListItem[]>> => {
      const query = new URLSearchParams();
      if (lowStockOnly) query.set('low_stock_only', 'true');
      if (warehouse) query.set('warehouse', warehouse);
      const qs = query.toString();
      return this.get<BackendInventoryListItem[]>(`inventory${qs ? `?${qs}` : ''}`);
    },

    getLowStock: async (warehouse?: string): Promise<ApiResponse<BackendInventoryListItem[]>> => {
      const query = new URLSearchParams();
      if (warehouse) query.set('warehouse', warehouse);
      const qs = query.toString();
      return this.get<BackendInventoryListItem[]>(`inventory/low-stock${qs ? `?${qs}` : ''}`);
    },

    getByProductId: async (productId: string): Promise<ApiResponse<BackendInventory>> => {
      return this.get<BackendInventory>(`inventory/${encodeURIComponent(productId)}`);
    },

    update: async (productId: string, payload: UpdateInventoryPayload): Promise<ApiResponse<BackendInventory>> => {
      return this.put<BackendInventory>(`inventory/${encodeURIComponent(productId)}`, payload);
    },
  };

  /**
   * Cart API Namespace
   */
  readonly cart = {
    get: async (): Promise<ApiResponse<BackendCartResponse>> => {
      return this.get<BackendCartResponse>('cart');
    },

    addItem: async (productId: string, quantity: number = 1): Promise<ApiResponse<BackendCartResponse>> => {
      return this.post<BackendCartResponse>('cart/items', { product_id: productId, quantity });
    },

    updateQuantity: async (productId: string, quantity: number): Promise<ApiResponse<BackendCartResponse>> => {
      return this.patch<BackendCartResponse>(`cart/items/${encodeURIComponent(productId)}`, { quantity });
    },

    removeItem: async (productId: string): Promise<ApiResponse<BackendCartResponse>> => {
      return this.delete<BackendCartResponse>(`cart/items/${encodeURIComponent(productId)}`);
    },

    clear: async (): Promise<ApiResponse<BackendCartResponse>> => {
      return this.delete<BackendCartResponse>('cart');
    },

    merge: async (items: { product_id: string; quantity: number }[]): Promise<ApiResponse<BackendCartResponse>> => {
      return this.post<BackendCartResponse>('cart/merge', { items });
    },
  };

  /**
   * Wishlist API Namespace
   */
  readonly wishlist = {
    get: async (): Promise<ApiResponse<BackendWishlistResponse>> => {
      return this.get<BackendWishlistResponse>('wishlist');
    },

    addItem: async (productId: string): Promise<ApiResponse<BackendWishlistResponse>> => {
      return this.post<BackendWishlistResponse>(`wishlist/${encodeURIComponent(productId)}`);
    },

    removeItem: async (productId: string): Promise<ApiResponse<BackendWishlistResponse>> => {
      return this.delete<BackendWishlistResponse>(`wishlist/${encodeURIComponent(productId)}`);
    },

    merge: async (productIds: string[]): Promise<ApiResponse<BackendWishlistResponse>> => {
      return this.post<BackendWishlistResponse>('wishlist/merge', { product_ids: productIds });
    },
  };

  /**
   * Orders API Namespace
   */
  readonly orders = {
    checkout: async (payload: CheckoutPayload): Promise<ApiResponse<BackendOrder>> => {
      return this.post<BackendOrder>('orders/checkout', payload);
    },

    list: async (skip: number = 0, limit: number = 50): Promise<ApiResponse<BackendOrderListResponse>> => {
      return this.get<BackendOrderListResponse>(`orders?skip=${skip}&limit=${limit}`);
    },

    get: async (orderId: string): Promise<ApiResponse<BackendOrder>> => {
      return this.get<BackendOrder>(`orders/${encodeURIComponent(orderId)}`);
    },

    cancel: async (orderId: string, reason: string): Promise<ApiResponse<BackendOrder>> => {
      return this.post<BackendOrder>(`orders/${encodeURIComponent(orderId)}/cancel`, { reason });
    },

    reorder: async (orderId: string): Promise<ApiResponse<ReorderResponseData>> => {
      return this.post<ReorderResponseData>(`orders/${encodeURIComponent(orderId)}/reorder`);
    },
  };

  /**
   * Staff / Admin Orders API Namespace
   */
  readonly adminOrders = {
    list: async (params: { status?: string; search?: string; skip?: number; limit?: number } = {}): Promise<ApiResponse<BackendOrderListResponse>> => {
      const query = new URLSearchParams();
      if (params.status && params.status !== 'ALL') query.set('status', params.status);
      if (params.search) query.set('search', params.search);
      if (params.skip !== undefined) query.set('skip', String(params.skip));
      if (params.limit !== undefined) query.set('limit', String(params.limit));
      const qs = query.toString();
      return this.get<BackendOrderListResponse>(`admin/orders${qs ? `?${qs}` : ''}`);
    },

    get: async (orderId: string): Promise<ApiResponse<BackendOrder>> => {
      return this.get<BackendOrder>(`admin/orders/${encodeURIComponent(orderId)}`);
    },

    updateStatus: async (orderId: string, payload: OrderStatusUpdatePayload): Promise<ApiResponse<BackendOrder>> => {
      return this.patch<BackendOrder>(`admin/orders/${encodeURIComponent(orderId)}/status`, payload);
    },
  };

  /**
   * Wholesale RFQs API Namespace
   */
  readonly rfqs = {
    create: async (payload: CreateRFQPayload): Promise<ApiResponse<BackendRFQ>> => {
      return this.post<BackendRFQ>('rfqs', payload);
    },

    list: async (params: { page?: number; pageSize?: number; status?: string } = {}): Promise<ApiResponse<BackendRFQListResponse>> => {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.pageSize) query.set('page_size', String(params.pageSize));
      if (params.status) query.set('status', params.status);
      const qs = query.toString();
      return this.get<BackendRFQListResponse>(`rfqs${qs ? `?${qs}` : ''}`);
    },

    get: async (rfqId: string): Promise<ApiResponse<BackendRFQ>> => {
      return this.get<BackendRFQ>(`rfqs/${encodeURIComponent(rfqId)}`);
    },

    submit: async (rfqId: string): Promise<ApiResponse<BackendRFQ>> => {
      return this.post<BackendRFQ>(`rfqs/${encodeURIComponent(rfqId)}/submit`);
    },

    cancel: async (rfqId: string, reason?: string): Promise<ApiResponse<BackendRFQ>> => {
      const qs = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      return this.post<BackendRFQ>(`rfqs/${encodeURIComponent(rfqId)}/cancel${qs}`);
    },

    requestRevision: async (rfqId: string, payload: RFQRevisionPayload): Promise<ApiResponse<BackendRFQ>> => {
      return this.post<BackendRFQ>(`rfqs/${encodeURIComponent(rfqId)}/request-revision`, payload);
    },

    listQuotes: async (rfqId: string): Promise<ApiResponse<BackendQuote[]>> => {
      return this.get<BackendQuote[]>(`rfqs/${encodeURIComponent(rfqId)}/quotes`);
    },
  };

  /**
   * Customer Quotes API Namespace
   */
  readonly quotes = {
    get: async (quoteId: string): Promise<ApiResponse<BackendQuote>> => {
      return this.get<BackendQuote>(`quotes/${encodeURIComponent(quoteId)}`);
    },

    accept: async (quoteId: string, params: { paymentMethod?: string; notes?: string } = {}): Promise<ApiResponse<AcceptQuoteResponse>> => {
      const query = new URLSearchParams();
      if (params.paymentMethod) query.set('payment_method', params.paymentMethod);
      if (params.notes) query.set('notes', params.notes);
      const qs = query.toString();
      return this.post<AcceptQuoteResponse>(`quotes/${encodeURIComponent(quoteId)}/accept${qs ? `?${qs}` : ''}`);
    },

    reject: async (quoteId: string, reason?: string): Promise<ApiResponse<BackendQuote>> => {
      return this.post<BackendQuote>(`quotes/${encodeURIComponent(quoteId)}/reject`, { reason });
    },
  };

  /**
   * Staff / Admin Wholesale API Namespace
   */
  readonly adminRfqs = {
    list: async (params: { page?: number; pageSize?: number; status?: string; search?: string } = {}): Promise<ApiResponse<BackendRFQListResponse>> => {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.pageSize) query.set('page_size', String(params.pageSize));
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);
      const qs = query.toString();
      return this.get<BackendRFQListResponse>(`admin/rfqs${qs ? `?${qs}` : ''}`);
    },

    get: async (rfqId: string): Promise<ApiResponse<BackendRFQ>> => {
      return this.get<BackendRFQ>(`admin/rfqs/${encodeURIComponent(rfqId)}`);
    },

    updateStatus: async (rfqId: string, payload: { status: string; notes?: string }): Promise<ApiResponse<BackendRFQ>> => {
      return this.patch<BackendRFQ>(`admin/rfqs/${encodeURIComponent(rfqId)}/status`, payload);
    },

    createQuote: async (rfqId: string, payload: CreateQuotePayload): Promise<ApiResponse<BackendQuote>> => {
      return this.post<BackendQuote>(`admin/rfqs/${encodeURIComponent(rfqId)}/quotes`, payload);
    },
  };

  /**
   * Staff / Admin Quotations API Namespace
   */
  readonly adminQuotes = {
    update: async (quoteId: string, payload: UpdateQuotePayload): Promise<ApiResponse<BackendQuote>> => {
      return this.patch<BackendQuote>(`admin/quotes/${encodeURIComponent(quoteId)}`, payload);
    },

    send: async (quoteId: string): Promise<ApiResponse<BackendQuote>> => {
      return this.post<BackendQuote>(`admin/quotes/${encodeURIComponent(quoteId)}/send`);
    },

    revise: async (quoteId: string, payload: CreateQuotePayload): Promise<ApiResponse<BackendQuote>> => {
      return this.post<BackendQuote>(`admin/quotes/${encodeURIComponent(quoteId)}/revise`, payload);
    },

    expire: async (quoteId: string): Promise<ApiResponse<BackendQuote>> => {
      return this.post<BackendQuote>(`admin/quotes/${encodeURIComponent(quoteId)}/expire`);
    },
  };

  /**
   * Customer Payments & UPI API Namespace
   */
  readonly payments = {
    getConfig: async (): Promise<ApiResponse<BackendPaymentConfig>> => {
      return this.get<BackendPaymentConfig>('payments/config');
    },

    create: async (payload: { order_id: string; payment_method?: string; provider?: string }): Promise<ApiResponse<BackendPayment>> => {
      return this.post<BackendPayment>('payments/create', payload);
    },

    get: async (paymentId: string): Promise<ApiResponse<BackendPayment>> => {
      return this.get<BackendPayment>(`payments/${encodeURIComponent(paymentId)}`);
    },

    getForOrder: async (orderId: string): Promise<ApiResponse<BackendPayment | null>> => {
      return this.get<BackendPayment | null>(`payments/order/${encodeURIComponent(orderId)}`);
    },

    submitUPI: async (paymentId: string, utr_reference: string): Promise<ApiResponse<BackendPayment>> => {
      return this.post<BackendPayment>(`payments/${encodeURIComponent(paymentId)}/submit-upi`, { utr_reference });
    },

    cancel: async (paymentId: string): Promise<ApiResponse<BackendPayment>> => {
      return this.post<BackendPayment>(`payments/${encodeURIComponent(paymentId)}/cancel`);
    },
  };

  /**
   * Staff / Admin Payments & Verification API Namespace
   */
  readonly adminPayments = {
    list: async (params: { page?: number; limit?: number; status?: string; method?: string; search?: string } = {}): Promise<ApiResponse<BackendPaymentListResponse>> => {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.status) query.set('status', params.status);
      if (params.method) query.set('method', params.method);
      if (params.search) query.set('search', params.search);
      const qs = query.toString();
      return this.get<BackendPaymentListResponse>(`admin/payments${qs ? `?${qs}` : ''}`);
    },

    getMetrics: async (): Promise<ApiResponse<BackendPaymentMetrics>> => {
      return this.get<BackendPaymentMetrics>('admin/payments/metrics');
    },

    getReconciliation: async (): Promise<ApiResponse<any[]>> => {
      return this.get<any[]>('admin/payments/reconciliation');
    },

    reconcile: async (paymentId: string): Promise<ApiResponse<any>> => {
      return this.post<any>(`admin/payments/${encodeURIComponent(paymentId)}/reconcile`);
    },

    get: async (paymentId: string): Promise<ApiResponse<BackendPayment>> => {
      return this.get<BackendPayment>(`admin/payments/${encodeURIComponent(paymentId)}`);
    },

    verify: async (paymentId: string, notes?: string): Promise<ApiResponse<BackendPayment>> => {
      return this.post<BackendPayment>(`admin/payments/${encodeURIComponent(paymentId)}/verify`, { notes });
    },

    reject: async (paymentId: string, reason: string): Promise<ApiResponse<BackendPayment>> => {
      return this.post<BackendPayment>(`admin/payments/${encodeURIComponent(paymentId)}/reject`, { reason });
    },

    refund: async (paymentId: string, reason: string, amount?: number): Promise<ApiResponse<BackendPayment>> => {
      return this.post<BackendPayment>(`admin/payments/${encodeURIComponent(paymentId)}/refund`, { reason, amount });
    },
  };

  /**
   * Customer Projects & BOQ Workspace API Namespace
   */
  readonly projects = {
    list: async (): Promise<ApiResponse<BackendProjectListResponse>> => {
      return this.get<BackendProjectListResponse>('projects');
    },

    get: async (projectId: string): Promise<ApiResponse<BackendProject>> => {
      return this.get<BackendProject>(`projects/${encodeURIComponent(projectId)}`);
    },

    create: async (payload: CreateProjectPayload): Promise<ApiResponse<BackendProject>> => {
      return this.post<BackendProject>('projects', payload);
    },

    update: async (projectId: string, payload: UpdateProjectPayload): Promise<ApiResponse<BackendProject>> => {
      return this.patch<BackendProject>(`projects/${encodeURIComponent(projectId)}`, payload);
    },

    delete: async (projectId: string): Promise<ApiResponse<void>> => {
      return this.delete<void>(`projects/${encodeURIComponent(projectId)}`);
    },

    addMaterial: async (projectId: string, payload: AddProjectMaterialPayload): Promise<ApiResponse<BackendProject>> => {
      return this.post<BackendProject>(`projects/${encodeURIComponent(projectId)}/materials`, payload);
    },

    updateMaterial: async (projectId: string, productId: string, payload: UpdateProjectMaterialPayload): Promise<ApiResponse<BackendProject>> => {
      return this.patch<BackendProject>(`projects/${encodeURIComponent(projectId)}/materials/${encodeURIComponent(productId)}`, payload);
    },

    removeMaterial: async (projectId: string, productId: string): Promise<ApiResponse<BackendProject>> => {
      return this.delete<BackendProject>(`projects/${encodeURIComponent(projectId)}/materials/${encodeURIComponent(productId)}`);
    },

    refreshBOQPricing: async (projectId: string): Promise<ApiResponse<BackendProject>> => {
      return this.post<BackendProject>(`projects/${encodeURIComponent(projectId)}/refresh-pricing`);
    },

    toggleStage: async (projectId: string, stage: string): Promise<ApiResponse<BackendProject>> => {
      return this.post<BackendProject>(`projects/${encodeURIComponent(projectId)}/stages/${encodeURIComponent(stage)}/toggle`);
    },

    listMembers: async (projectId: string): Promise<ApiResponse<BackendProjectMember[]>> => {
      return this.get<BackendProjectMember[]>(`projects/${encodeURIComponent(projectId)}/members`);
    },

    addMember: async (projectId: string, payload: AddProjectMemberPayload): Promise<ApiResponse<BackendProjectMember>> => {
      return this.post<BackendProjectMember>(`projects/${encodeURIComponent(projectId)}/members`, payload);
    },

    updateMemberRole: async (projectId: string, userId: string, payload: UpdateProjectMemberPayload): Promise<ApiResponse<BackendProjectMember>> => {
      return this.patch<BackendProjectMember>(`projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`, payload);
    },

    removeMember: async (projectId: string, userId: string): Promise<ApiResponse<void>> => {
      return this.delete<void>(`projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`);
    },

    transferOrganization: async (projectId: string, payload: TransferProjectPayload): Promise<ApiResponse<BackendProject>> => {
      return this.post<BackendProject>(`projects/${encodeURIComponent(projectId)}/transfer-organization`, payload);
    },

    getActivity: async (
      projectId: string,
      params?: { page?: number; limit?: number; action?: string }
    ): Promise<ApiResponse<BackendProjectActivityListResponse>> => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.action) queryParams.set('action', params.action);
      const qs = queryParams.toString();
      const endpoint = qs
        ? `projects/${encodeURIComponent(projectId)}/activity?${qs}`
        : `projects/${encodeURIComponent(projectId)}/activity`;
      return this.get<BackendProjectActivityListResponse>(endpoint);
    },

  };

  /**
   * Construction Cost Estimates API Namespace
   */
  readonly estimates = {
    list: async (): Promise<ApiResponse<BackendEstimateListResponse>> => {
      return this.get<BackendEstimateListResponse>('estimates');
    },

    get: async (estimateId: string): Promise<ApiResponse<BackendEstimate>> => {
      return this.get<BackendEstimate>(`estimates/${encodeURIComponent(estimateId)}`);
    },

    create: async (payload: CreateEstimatePayload): Promise<ApiResponse<BackendEstimate>> => {
      return this.post<BackendEstimate>('estimates', payload);
    },

    update: async (estimateId: string, payload: UpdateEstimatePayload): Promise<ApiResponse<BackendEstimate>> => {
      return this.patch<BackendEstimate>(`estimates/${encodeURIComponent(estimateId)}`, payload);
    },

    delete: async (estimateId: string): Promise<ApiResponse<void>> => {
      return this.delete<void>(`estimates/${encodeURIComponent(estimateId)}`);
    },

    refreshPricing: async (estimateId: string): Promise<ApiResponse<BackendEstimate>> => {
      return this.post<BackendEstimate>(`estimates/${encodeURIComponent(estimateId)}/refresh-pricing`);
    },

    transferToProject: async (estimateId: string, payload: TransferToProjectPayload): Promise<ApiResponse<{ message: string; project_id: string; materials_added: number }>> => {
      return this.post<{ message: string; project_id: string; materials_added: number }>(`estimates/${encodeURIComponent(estimateId)}/transfer`, payload);
    },
  };

  /**
   * Customer Business & Contractor Profiles API Namespace (Phase 2L.1)
   */
  readonly profile = {
    getBusiness: async (): Promise<ApiResponse<BackendBusinessProfile>> => {
      return this.get<BackendBusinessProfile>('profile/business');
    },

    updateBusiness: async (payload: BusinessProfilePayload): Promise<ApiResponse<BackendBusinessProfile>> => {
      return this.put<BackendBusinessProfile>('profile/business', payload);
    },

    getContractor: async (): Promise<ApiResponse<BackendContractorProfile>> => {
      return this.get<BackendContractorProfile>('profile/contractor');
    },

    updateContractor: async (payload: ContractorProfilePayload): Promise<ApiResponse<BackendContractorProfile>> => {
      return this.put<BackendContractorProfile>('profile/contractor', payload);
    },
  };

  /**
   * Customer Organizations & Team RBAC API Namespace (Phase 2L.2)
   */
  readonly organizations = {
    list: async (): Promise<ApiResponse<BackendOrganization[]>> => {
      return this.get<BackendOrganization[]>('organizations');
    },

    create: async (payload: CreateOrganizationPayload): Promise<ApiResponse<BackendOrganization>> => {
      return this.post<BackendOrganization>('organizations', payload);
    },

    get: async (orgId: string): Promise<ApiResponse<BackendOrganization>> => {
      return this.get<BackendOrganization>(`organizations/${encodeURIComponent(orgId)}`);
    },

    update: async (orgId: string, payload: UpdateOrganizationPayload): Promise<ApiResponse<BackendOrganization>> => {
      return this.put<BackendOrganization>(`organizations/${encodeURIComponent(orgId)}`, payload);
    },

    listMembers: async (orgId: string): Promise<ApiResponse<BackendOrgMember[]>> => {
      return this.get<BackendOrgMember[]>(`organizations/${encodeURIComponent(orgId)}/members`);
    },

    updateMemberRole: async (orgId: string, userId: string, role: OrgRole): Promise<ApiResponse<BackendOrgMember>> => {
      return this.patch<BackendOrgMember>(`organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`, { role });
    },

    removeMember: async (orgId: string, userId: string): Promise<ApiResponse<{ message: string; organization_id: string; user_id: string }>> => {
      return this.delete<{ message: string; organization_id: string; user_id: string }>(`organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`);
    },

    listInvitations: async (orgId: string): Promise<ApiResponse<BackendInvitation[]>> => {
      return this.get<BackendInvitation[]>(`organizations/${encodeURIComponent(orgId)}/invitations`);
    },

    createInvitation: async (orgId: string, payload: CreateInvitationPayload): Promise<ApiResponse<BackendInvitation>> => {
      return this.post<BackendInvitation>(`organizations/${encodeURIComponent(orgId)}/invitations`, payload);
    },

    revokeInvitation: async (orgId: string, invitationId: string): Promise<ApiResponse<{ message: string; invitation_id: string; status: string }>> => {
      return this.delete<{ message: string; invitation_id: string; status: string }>(`organizations/${encodeURIComponent(orgId)}/invitations/${encodeURIComponent(invitationId)}`);
    },
  };

  readonly invitations = {
    accept: async (token: string): Promise<ApiResponse<AcceptInvitationResponse>> => {
      return this.post<AcceptInvitationResponse>(`invitations/${encodeURIComponent(token)}/accept`);
    },
  };

  patch<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  /**
   * Project Notifications & Activity Alerts API Namespace (Phase 2L.5)
   */
  readonly notifications = {
    list: async (params?: {
      page?: number;
      limit?: number;
      is_read?: boolean;
      notification_type?: string;
      project_id?: string;
    }): Promise<ApiResponse<ProjectNotificationListResponse>> => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', params.page.toString());
      if (params?.limit) q.set('limit', params.limit.toString());
      if (params?.is_read !== undefined) q.set('is_read', params.is_read.toString());
      if (params?.notification_type) q.set('notification_type', params.notification_type);
      if (params?.project_id) q.set('project_id', params.project_id);
      const qs = q.toString();
      const ep = qs ? `notifications?${qs}` : 'notifications';
      return this.get<ProjectNotificationListResponse>(ep);
    },

    getUnreadCount: async (): Promise<ApiResponse<UnreadCountResponse>> => {
      return this.get<UnreadCountResponse>('notifications/unread-count');
    },

    markRead: async (notificationId: string): Promise<ApiResponse<ProjectNotification>> => {
      return this.patch<ProjectNotification>(`notifications/${encodeURIComponent(notificationId)}/read`);
    },

    markAllRead: async (): Promise<ApiResponse<{ status: string; marked_read_count: number }>> => {
      return this.post<{ status: string; marked_read_count: number }>('notifications/read-all');
    },
  };

  /**
   * Probes the backend health endpoint.
   */
  async checkHealth(): Promise<{ isHealthy: boolean; service?: string; version?: string }> {
    try {
      const res = await this.get<{ status: string; service: string; version: string }>('health');
      return {
        isHealthy: res.data?.status === 'ok',
        service: res.data?.service,
        version: res.data?.version,
      };
    } catch {
      return { isHealthy: false };
    }
  }
}

// Wholesale Types
export interface BackendRFQItem {
  id: string;
  rfq_id: string;
  product_id?: string | null;
  product_name: string;
  product_sku?: string | null;
  brand?: string | null;
  unit?: string | null;
  requested_quantity: number;
  target_unit_price?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface BackendRFQStatusHistory {
  id: string;
  rfq_id: string;
  old_status?: string | null;
  new_status: string;
  changed_by_user_id?: string | null;
  title: string;
  description?: string | null;
  created_at: string;
}

export interface BackendQuoteItem {
  id: string;
  quote_id: string;
  rfq_item_id?: string | null;
  product_id?: string | null;
  product_name: string;
  product_sku?: string | null;
  brand?: string | null;
  unit?: string | null;
  requested_quantity: number;
  quoted_quantity: number;
  catalog_unit_price_at_quote: number;
  quoted_unit_price: number;
  discount_amount: number;
  tax_amount: number;
  line_subtotal: number;
  line_total: number;
}

export interface BackendQuote {
  id: string;
  quote_number: string;
  rfq_id: string;
  version: number;
  status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  delivery_charge: number;
  total: number;
  valid_until?: string | null;
  customer_notes?: string | null;
  procurement_notes?: string | null;
  created_by_user_id?: string | null;
  items: BackendQuoteItem[];
  created_at: string;
  updated_at: string;
}

export interface BackendRFQ {
  id: string;
  rfq_number: string;
  user_id: string;
  project_id?: string | null;
  project_name?: string | null;
  project_type?: string | null;
  required_by_date?: string | null;
  delivery_address: any;
  gstin?: string | null;
  notes?: string | null;
  status: string;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
  items: BackendRFQItem[];
  status_history: BackendRFQStatusHistory[];
  quotes: BackendQuote[];
  latest_quote?: BackendQuote | null;
}

export interface BackendRFQListResponse {
  items: BackendRFQ[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateRFQItemPayload {
  product_id?: string;
  product_name: string;
  product_sku?: string;
  brand?: string;
  unit?: string;
  requested_quantity: number;
  target_unit_price?: number;
  notes?: string;
}

export interface CreateRFQPayload {
  project_id?: string;
  project_name?: string;
  project_type?: string;
  required_by_date?: string;
  delivery_address: any;
  gstin?: string;
  notes?: string;
  items: CreateRFQItemPayload[];
  submit_now?: boolean;
}

export interface RFQRevisionPayload {
  notes: string;
  items?: CreateRFQItemPayload[];
}

export interface CreateQuoteItemPayload {
  rfq_item_id?: string;
  product_id?: string;
  product_name?: string;
  product_sku?: string;
  brand?: string;
  unit?: string;
  requested_quantity: number;
  quoted_quantity: number;
  quoted_unit_price: number;
  discount_amount?: number;
  tax_amount?: number;
}

export interface CreateQuotePayload {
  items: CreateQuoteItemPayload[];
  delivery_charge?: number;
  discount_amount?: number;
  valid_until?: string;
  customer_notes?: string;
  procurement_notes?: string;
  send_now?: boolean;
}

export interface UpdateQuotePayload {
  delivery_charge?: number;
  discount_amount?: number;
  valid_until?: string;
  customer_notes?: string;
  procurement_notes?: string;
}

export interface AcceptQuoteResponse {
  message: string;
  quote: BackendQuote;
  order: BackendOrder;
}

// Payment Types
export interface BackendPaymentEvent {
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

export interface BackendPaymentOrderSummary {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  payment_status: string;
  status: string;
}

export interface BackendPayment {
  id: string;
  order_id: string;
  user_id: string;
  payment_reference?: string;
  provider_reference?: string;
  provider: string;
  payment_method: string;
  payment_status: string;
  amount: number;
  currency: string;
  failure_reason?: string;
  verified_by_user_id?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  order?: BackendPaymentOrderSummary;
  events?: BackendPaymentEvent[];
}

export interface BackendPaymentMetrics {
  pending_verification: number;
  verified_today: number;
  failed_payments: number;
  cod_orders: number;
  upi_volume: number;
  refund_pending: number;
  total_payments: number;
}

export interface BackendPaymentConfig {
  upi_id: string;
  upi_display_name: string;
  upi_qr_path: string;
  currency: string;
  manual_upi_enabled: boolean;
  cod_enabled: boolean;
  gateway_enabled: boolean;
}

export interface BackendPaymentListResponse {
  payments: BackendPayment[];
  total: number;
  page: number;
  limit: number;
}

// Project & BOQ Types
export interface BackendProjectMaterial {
  id: string;
  project_id: string;
  product_id: string;
  quantity: number;
  unit: string;
  purchased_quantity: number;
  wastage_percent: number;
  stage?: string | null;
  price_at_addition: number;
  notes?: string | null;
  added_at: string;
  product_name?: string | null;
  brand?: string | null;
  image?: string | null;
  current_price?: number | null;
  in_stock?: boolean | null;
  stock?: number | null;
}

export interface BackendProjectActivityActor {
  id: string;
  email: string;
  name?: string | null;
}

export interface BackendProjectActivity {
  id: string;
  organization_id?: string | null;
  project_id?: string | null;
  actor_user_id?: string | null;
  actor?: BackendProjectActivityActor | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface BackendProjectActivityListResponse {
  activities: BackendProjectActivity[];
  total: number;
  page: number;
  limit: number;
}

export interface BackendProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: OrgRole;
  email?: string | null;
  name?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface BackendProject {
  id: string;
  user_id: string;
  organization_id?: string | null;
  organization_name?: string | null;
  current_user_role?: OrgRole | null;
  member_count?: number;
  is_shared?: boolean;
  name: string;
  project_type: string;
  built_up_area: number;
  area_unit: string;
  floors: number;
  stage: string;
  city: string;
  pincode: string;
  completed_stages: string[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
  materials: BackendProjectMaterial[];
  members?: BackendProjectMember[];
}

export interface BackendProjectListResponse {
  projects: BackendProject[];
  total: number;
}

export interface CreateProjectPayload {
  name: string;
  organization_id?: string | null;
  project_type: string;
  built_up_area: number;
  area_unit?: string;
  floors?: number;
  stage?: string;
  city?: string;
  pincode?: string;
  notes?: string;
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

export interface UpdateProjectPayload {
  name?: string;
  project_type?: string;
  built_up_area?: number;
  area_unit?: string;
  floors?: number;
  stage?: string;
  city?: string;
  pincode?: string;
  notes?: string;
  completed_stages?: string[];
}

export interface AddProjectMaterialPayload {
  product_id: string;
  quantity: number;
  unit?: string;
  purchased_quantity?: number;
  wastage_percent?: number;
  stage?: string;
  price_at_addition?: number;
  notes?: string;
}

export interface UpdateProjectMaterialPayload {
  quantity?: number;
  unit?: string;
  purchased_quantity?: number;
  wastage_percent?: number;
  stage?: string;
  notes?: string;
}

// Estimate Types
export interface BackendEstimate {
  id: string;
  user_id: string;
  project_id?: string | null;
  inputs: Record<string, any>;
  materials: Record<string, any>[];
  subtotal_at_estimate: number;
  tax_at_estimate: number;
  delivery_at_estimate: number;
  total_at_estimate: number;
  current_subtotal: number;
  current_tax: number;
  current_delivery: number;
  current_total: number;
  price_difference: number;
  has_price_changes: boolean;
  validity_days: number;
  notes?: string | null;
  price_snapshot_timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface BackendEstimateListResponse {
  estimates: BackendEstimate[];
  total: number;
}

export interface CreateEstimatePayload {
  id?: string;
  project_id?: string;
  inputs: Record<string, any>;
  materials: Record<string, any>[];
  subtotal_at_estimate: number;
  tax_at_estimate: number;
  delivery_at_estimate: number;
  total_at_estimate: number;
  validity_days?: number;
  notes?: string;
}

export interface UpdateEstimatePayload {
  notes?: string;
  project_id?: string;
}

export interface TransferToProjectPayload {
  target_project_id: string;
  stage?: string;
}

// Profile Types (Phase 2L.1)
export interface BackendBusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  gstin?: string | null;
  pan?: string | null;
  registered_address: string;
  city: string;
  state: string;
  pincode: string;
  contact_person: string;
  contact_phone: string;
  contact_email?: string | null;
  tax_verification_status: string;
  tax_verification_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfilePayload {
  business_name: string;
  business_type?: string;
  gstin?: string | null;
  pan?: string | null;
  registered_address: string;
  city: string;
  state: string;
  pincode: string;
  contact_person: string;
  contact_phone: string;
  contact_email?: string | null;
}

export interface BackendContractorProfile {
  id: string;
  user_id: string;
  business_name: string;
  specialization: string[];
  years_of_experience: number;
  service_area: string;
  license_number?: string | null;
  project_count: number;
  preferred_materials: string[];
  verification_status: string;
  verification_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractorProfilePayload {
  business_name: string;
  specialization?: string[];
  years_of_experience?: number;
  service_area?: string;
  license_number?: string | null;
  project_count?: number;
  preferred_materials?: string[];
}

// Organization & Team RBAC Types (Phase 2L.2)
export type {
  OrgRole,
  BackendOrganization,
  BackendOrgMember,
  BackendInvitation,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
  CreateInvitationPayload,
  AcceptInvitationResponse,
} from '@/types';

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;


