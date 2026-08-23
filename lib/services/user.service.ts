import { apiClient } from '../api-client';
import type { AccountStatus, OrderChannel } from '../domain/channels';
import { phonesMatch } from '../phone';

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
  accountStatus?: AccountStatus;
  channels?: OrderChannel[] | string[];
  totalOrders?: number;
  emailVerified: boolean;
  isEmailVerified?: boolean;
  inviteSent?: boolean;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
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

export interface UserListData {
  items: User[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateUserRequest {
  name: string;
  phone: string;
  email?: string;
  sendInvite?: boolean;
  storeId?: string;
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

      queryParams.set('page', String(params.page || 1));
      queryParams.set('limit', String(params.limit || 20));

      if (params.q) queryParams.set('q', params.q);
      if (params.role) queryParams.set('role', params.role);
      if (params.status) queryParams.set('status', params.status);
      if (params.emailVerified !== undefined) {
        queryParams.set('emailVerified', String(params.emailVerified));
      }
      if (params.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

      const response = await apiClient.get<UserListData>(
        `/admin/users?${queryParams.toString()}`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error('List users error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to fetch users',
      );
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
      throw new Error(
        error.response?.data?.error?.message || 'Failed to fetch user details',
      );
    }
  }

  /**
   * Create walk-in or invited customer (admin)
   * POST /api/admin/users
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    try {
      const response = await apiClient.post<User>('/admin/users', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Create user error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to create customer',
      );
    }
  }

  /**
   * Resend activation invite (admin)
   * POST /api/admin/users/{userId}/resend-invite
   */
  async resendInvite(userId: string): Promise<User> {
    try {
      const response = await apiClient.post<User>(
        `/admin/users/${userId}/resend-invite`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Resend invite error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to resend invite',
      );
    }
  }

  /**
   * Find a customer by phone.
   *
   * Strategy (fast-path first):
   * 1. Parallel `q` searches with phone format variants (one round-trip batch).
   * 2. If nothing matches, scan only the first few recent-customer pages in
   *    parallel — never walk the full customer list (that was multi-second).
   *
   * Production `q` often indexes name/email more reliably than phone; when
   * both steps miss, return null quickly so the walk-in create flow can run.
   */
  async findCustomerByPhone(
    phone: string,
    options?: { national?: string; qVariants?: string[] },
  ): Promise<User | null> {
    const seen = new Map<string, User>();

    const consider = (users: User[]): User | null => {
      for (const user of users) {
        seen.set(user.id, user);
      }
      for (const user of seen.values()) {
        const stored = user.phoneNumber || user.phone || '';
        if (phonesMatch(stored, phone)) return user;
        if (options?.national && phonesMatch(stored, options.national)) {
          return user;
        }
      }
      return null;
    };

    const variants = [
      ...new Set(
        [...(options?.qVariants ?? []), phone].filter(
          (q): q is string => Boolean(q && q.length >= 7),
        ),
      ),
    ];

    // 1) Parallel q attempts — typically 1 network RTT for all variants.
    if (variants.length > 0) {
      const qResults = await Promise.all(
        variants.map((q) =>
          this.listUsers({
            q,
            role: 'customer',
            limit: 50,
            page: 1,
          }).catch(() => null),
        ),
      );
      for (const result of qResults) {
        if (!result?.items?.length) continue;
        const hit = consider(result.items);
        if (hit) return hit;
      }
    }

    // 2) Bounded parallel recent-customer scan (≤ ~100 users, 1 RTT).
    const pageSize = 50;
    const maxPages = 2;
    const pageResults = await Promise.all(
      Array.from({ length: maxPages }, (_, i) =>
        this.listUsers({
          role: 'customer',
          page: i + 1,
          limit: pageSize,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }).catch(() => null),
      ),
    );
    for (const result of pageResults) {
      if (!result?.items?.length) continue;
      const hit = consider(result.items);
      if (hit) return hit;
    }

    return null;
  }

  /**
   * Find customer by exact email (case-insensitive) via q + local filter.
   */
  async findCustomerByEmail(email: string): Promise<User | null> {
    const needle = email.trim().toLowerCase();
    if (!needle) return null;
    const result = await this.listUsers({
      q: needle,
      role: 'customer',
      limit: 25,
      page: 1,
    });
    return (
      result.items.find((u) => (u.email || '').trim().toLowerCase() === needle) ??
      null
    );
  }

  /**
   * Verify user email (admin)
   * POST /api/admin/users/{userId}/verify
   */
  async verifyUser(userId: string): Promise<VerifyUserData> {
    try {
      const response = await apiClient.post<VerifyUserData>(
        `/admin/users/${userId}/verify`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Verify user error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to verify user',
      );
    }
  }

  /**
   * Unverify user email (admin)
   * POST /api/admin/users/{userId}/unverify
   */
  async unverifyUser(userId: string): Promise<VerifyUserData> {
    try {
      const response = await apiClient.post<VerifyUserData>(
        `/admin/users/${userId}/unverify`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Unverify user error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to unverify user',
      );
    }
  }

  /**
   * Get multiple users by IDs (batch request)
   */
  async getUsersByIds(userIds: string[]): Promise<Map<string, User>> {
    try {
      const userPromises = userIds.map((id) =>
        this.getUserById(id).catch(() => null),
      );
      const users = await Promise.all(userPromises);

      const userMap = new Map<string, User>();
      users.forEach((user) => {
        if (user) {
          userMap.set(user.id, user);
        }
      });

      return userMap;
    } catch (error: any) {
      console.error('Get users by IDs error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to fetch users',
      );
    }
  }
}

export const userService = new UserService();
