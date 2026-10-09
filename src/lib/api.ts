// RealSalePro REST API Client for Node.js + PostgreSQL Backend

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:5001/api');

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // use fallback
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // HTTP Helper Methods
  public get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let query = '';
    if (params) {
      const cleanParams: Record<string, string> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== 'skip') {
          cleanParams[k] = String(v);
        }
      }
      const search = new URLSearchParams(cleanParams).toString();
      if (search) query = `?${search}`;
    }
    return this.request<T>(`${endpoint}${query}`, { method: 'GET' });
  }

  public post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
