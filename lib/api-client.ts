import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from './config';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    correlationId?: string;
    timestamp?: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    correlationId?: string;
    timestamp?: string;
  };
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      // false: `Allow-Origin: *` is incompatible with credentialed XHR; tokens live in localStorage.
      withCredentials: false,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token to requests
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              // Try to refresh the token
              const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
                `${config.apiBaseUrl}/auth/refresh`,
                { refreshToken }
              );

              const { accessToken, refreshToken: newRefreshToken } = response.data.data;
              
              // Update stored tokens
              this.setAccessToken(accessToken);
              this.setRefreshToken(newRefreshToken);

              // Retry the original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management methods
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  public setAccessToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  public setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    }
  }

  public clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // HTTP methods
  public get<T = any>(url: string, params?: any) {
    return this.client.get<ApiResponse<T>>(url, { params });
  }

  public post<T = any>(url: string, data?: any) {
    // If data is FormData, we need to let the browser set the Content-Type with boundary
    const config = data instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    } : undefined;
    
    return this.client.post<ApiResponse<T>>(url, data, config);
  }

  public put<T = any>(url: string, data?: any) {
    // If data is FormData, we need to let the browser set the Content-Type with boundary
    const config = data instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    } : undefined;
    
    return this.client.put<ApiResponse<T>>(url, data, config);
  }

  public patch<T = any>(url: string, data?: any) {
    return this.client.patch<ApiResponse<T>>(url, data);
  }

  public delete<T = any>(url: string) {
    return this.client.delete<ApiResponse<T>>(url);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
