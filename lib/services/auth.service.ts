import { apiClient } from '../api-client';
import type { AdminRole } from '../domain/admin-roles';
import { normalizeAdminRole } from '../domain/admin-roles';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  userId: string;
  email: string;
  name?: string | null;
  role: AdminRole;
  isEmailVerified: boolean;
  requiresEmailVerification?: boolean;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface User {
  userId: string;
  email: string;
  name?: string | null;
  role: AdminRole;
  isEmailVerified: boolean;
}

function toStoredUser(data: LoginResponse): User {
  const role = normalizeAdminRole(data.role) ?? 'admin';
  return {
    userId: data.userId,
    email: data.email,
    name: data.name ?? null,
    role,
    isEmailVerified: data.isEmailVerified,
  };
}

class AuthService {
  /**
   * Admin login
   * POST /admin/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/admin/login',
        credentials,
      );

      const payload = response.data.data;
      const { accessToken, refreshToken, ...rest } = payload;

      apiClient.setAccessToken(accessToken);
      apiClient.setRefreshToken(refreshToken);

      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(toStoredUser(payload)));
      }

      return {
        ...rest,
        role: normalizeAdminRole(rest.role) ?? 'admin',
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      const apiMessage = error.response?.data?.error?.message;
      const status = error.response?.status;

      if (status === 401 || status === 404) {
        throw new Error(apiMessage || 'Invalid email or password');
      }
      if (status === 400) {
        throw new Error(apiMessage || 'Invalid credentials');
      }
      if (error.message && !error.response) {
        throw new Error(error.message);
      }
      throw new Error(
        apiMessage || 'An error occurred during login. Please try again.',
      );
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
      const parsed = JSON.parse(userStr) as User & { role: string };
      const role = normalizeAdminRole(parsed.role);
      if (!role) return null;
      return {
        userId: parsed.userId,
        email: parsed.email,
        name: parsed.name ?? null,
        role,
        isEmailVerified: parsed.isEmailVerified,
      };
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
    const refreshToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('refreshToken')
        : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
      }>('/auth/refresh', { refreshToken });

      const { accessToken, refreshToken: newRefreshToken } =
        response.data.data;

      apiClient.setAccessToken(accessToken);
      apiClient.setRefreshToken(newRefreshToken);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      apiClient.clearTokens();
      throw error;
    }
  }
}

export const authService = new AuthService();
