import { apiClient } from '../api-client';

export type UserRole = 'admin' | 'customer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  q?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

// This is what the backend returns in the data field
export interface UserListData {
  items: User[];
  page: number;
  limit: number;
  total: number;
}

export interface UserDetailData {
  user: User;
}

export interface VerifyUserData {
  userId: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  updatedAt: string;
}

class UserService {
  /**
   * List users with pagination and filters (admin)
   * GET /api/admin/users
   */
  async listUsers(params: UserListParams = {}): Promise<UserListData> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination (required in backend)
      queryParams.set('page', String(params.page || 1));
      queryParams.set('limit', String(params.limit || 20));
      
      // Add optional filters
      if (params.q) queryParams.set('q', params.q);
      if (params.role) queryParams.set('role', params.role);
      if (params.status) queryParams.set('status', params.status);
      if (params.emailVerified !== undefined) queryParams.set('emailVerified', String(params.emailVerified));
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
      
      const response = await apiClient.get<UserListData>(`/admin/users?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('List users error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch users');
    }
  }

  /**
   * Get user by ID (admin)
   * GET /api/admin/users/{userId}
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/admin/users/${userId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get user error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch user details');
    }
  }

  /**
   * Verify user email (admin)
   * POST /api/admin/users/{userId}/verify
   */
  async verifyUser(userId: string): Promise<VerifyUserData> {
    try {
      const response = await apiClient.post<VerifyUserData>(`/admin/users/${userId}/verify`);
      return response.data.data;
    } catch (error: any) {
      console.error('Verify user error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to verify user');
    }
  }

  /**
   * Unverify user email (admin)
   * POST /api/admin/users/{userId}/unverify
   */
  async unverifyUser(userId: string): Promise<VerifyUserData> {
    try {
      const response = await apiClient.post<VerifyUserData>(`/admin/users/${userId}/unverify`);
      return response.data.data;
    } catch (error: any) {
      console.error('Unverify user error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to unverify user');
    }
  }

  /**
   * Get multiple users by IDs (batch request)
   */
  async getUsersByIds(userIds: string[]): Promise<Map<string, User>> {
    try {
      // Fetch all users in parallel
      const userPromises = userIds.map(id => this.getUserById(id).catch(() => null));
      const users = await Promise.all(userPromises);
      
      // Create a map of userId -> user
      const userMap = new Map<string, User>();
      users.forEach((user) => {
        if (user) {
          userMap.set(user.id, user);
        }
      });
      
      return userMap;
    } catch (error: any) {
      console.error('Get users by IDs error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch users');
    }
  }
}

export const userService = new UserService();
