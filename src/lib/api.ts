/**
 * =========================================================================
 * HEPNA MART — BACKEND API CLIENT FOUNDATION
 * =========================================================================
 * Clean HTTP client for FastAPI backend integration with JWT Bearer auth support.
 * Works seamlessly alongside local Zustand stores for offline fallback.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1';

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

