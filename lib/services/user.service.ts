import { apiClient } from '../api-client';

export interface User {
    id: string;
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    role: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    phone?: string;
}

class UserService {
  /**
   * Get user by ID (admin)
   * GET /admin/users/{userId}
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
          userMap.set(user.userId, user);
        }
      });
      
      return userMap;
    } catch (error: any) {
      console.error('Get users error:', error);
      return new Map();
    }
  }
}

export const userService = new UserService();
