/**
 * =========================================================================
 * HEPNA MART — BACKEND API CLIENT FOUNDATION
 * =========================================================================
 * Clean HTTP client prepared for Phase 2 FastAPI backend integration.
 * In Phase 2A, the frontend continues using local state / stores.
 * Future phases will progressively plug API calls through this module.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1';

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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Helper to execute fetch requests with automatic JSON parsing and error wrapping.
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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
