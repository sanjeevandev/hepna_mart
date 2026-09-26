/**
 * =========================================================================
 * HEPNA MART — BACKEND API CLIENT FOUNDATION
 * =========================================================================
 * Clean HTTP client for FastAPI backend integration with JWT Bearer auth support.
 * Works seamlessly alongside local Zustand stores for offline fallback.
 */

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
      if (params.sort) query.set('sort', params.sort);
      if (params.page !== undefined) query.set('page', String(params.page));
      if (params.page_size !== undefined) query.set('page_size', String(params.page_size));

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

  patch<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

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

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;


