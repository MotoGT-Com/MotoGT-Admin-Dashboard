import { apiClient } from '../api-client';
import type { AdminRole } from '../domain/admin-roles';

export type AdminTeamStatus = 'active' | 'inactive' | 'suspended';

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminTeamStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminTeamListParams {
  page?: number;
  limit?: number;
  q?: string;
  role?: AdminRole;
  status?: AdminTeamStatus;
}

export interface AdminTeamListData {
  items: AdminTeamMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateAdminTeamRequest {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

export interface UpdateAdminTeamRequest {
  name?: string;
  role?: AdminRole;
  password?: string;
}

function apiErrorMessage(error: any, fallback: string): string {
  return error?.response?.data?.error?.message || error?.message || fallback;
}

class AdminService {
  /**
   * List dashboard operators.
   * GET /api/admin/admins (super_admin only)
   */
  async listAdmins(
    params: AdminTeamListParams = {},
  ): Promise<AdminTeamListData> {
    try {
      const query = new URLSearchParams();
      query.set('page', String(params.page ?? 1));
      query.set('limit', String(params.limit ?? 50));
      if (params.q) query.set('q', params.q);
      if (params.role) query.set('role', params.role);
      if (params.status) query.set('status', params.status);

      const response = await apiClient.get<AdminTeamListData>(
        `/admin/admins?${query.toString()}`,
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Failed to load admins'));
    }
  }

  /**
   * GET /api/admin/admins/:id
   */
  async getAdmin(id: string): Promise<AdminTeamMember> {
    try {
      const response = await apiClient.get<AdminTeamMember>(
        `/admin/admins/${id}`,
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Failed to load admin'));
    }
  }

  /**
   * POST /api/admin/admins
   */
  async createAdmin(
    data: CreateAdminTeamRequest,
  ): Promise<AdminTeamMember> {
    try {
      const response = await apiClient.post<AdminTeamMember>(
        '/admin/admins',
        data,
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Failed to create admin'));
    }
  }

  /**
   * PATCH /api/admin/admins/:id
   */
  async updateAdmin(
    id: string,
    data: UpdateAdminTeamRequest,
  ): Promise<AdminTeamMember> {
    try {
      const response = await apiClient.patch<AdminTeamMember>(
        `/admin/admins/${id}`,
        data,
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Failed to update admin'));
    }
  }

  /**
   * Soft-deactivate admin access.
   * DELETE /api/admin/admins/:id
   */
  async removeAdmin(id: string): Promise<AdminTeamMember> {
    try {
      const response = await apiClient.delete<AdminTeamMember>(
        `/admin/admins/${id}`,
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Failed to remove access'));
    }
  }
}

export const adminService = new AdminService();
