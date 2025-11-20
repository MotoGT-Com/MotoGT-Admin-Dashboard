import { apiClient } from '../api-client';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  userId: string;
  email: string;
  role: 'admin';
  isEmailVerified: boolean;
  requiresEmailVerification?: boolean;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface User {
  userId: string;
  email: string;
  role: 'admin';
  isEmailVerified: boolean;
}

class AuthService {
  /**
   * Admin login
   * POST /admin/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/admin/login', credentials);
      
      const { accessToken, refreshToken, ...userData } = response.data.data;

      // Store tokens
      apiClient.setAccessToken(accessToken);
      apiClient.setRefreshToken(refreshToken);

      // Store user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
      }

      return response.data.data;
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.error?.message || 'Invalid credentials');
      } else {
        throw new Error('An error occurred during login. Please try again.');
      }
    }
  }

  /**
   * Logout user
   * POST /auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user data regardless of API response
      apiClient.clearTokens();
    }
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const accessToken = localStorage.getItem('accessToken');
    const user = this.getCurrentUser();
    
    return !!(accessToken && user);
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      // Update stored tokens
      apiClient.setAccessToken(accessToken);
      apiClient.setRefreshToken(newRefreshToken);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      // Refresh failed - clear everything
      apiClient.clearTokens();
      throw error;
    }
  }
}

export const authService = new AuthService();
