import { apiClient } from '../api-client';

export interface SupportedLanguage {
  languageId: string;
  languageCode: string;
  languageName: string;
  isDefault: boolean;
}

export interface Store {
  id: string;
  code?: string;
  name: string;
  description?: string;
  country: string;
  currencyCode: string;
  timezone?: string;
  domain?: string;
  isActive: boolean;
  supportedLanguages?: SupportedLanguage[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  country?: string;
  currencyCode?: string;
}

export interface StoreListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateStoreData {
  name: string;
  description?: string;
  country: string;
  currencyCode: string;
  languageCode: string;
  isActive?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
}

export interface UpdateStoreData extends Partial<CreateStoreData> {}

class StoreService {
  /**
   * List stores with pagination and filters
   * GET /api/stores
   */
  async listStores(params: StoreListParams = {}): Promise<Store[]> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination
      queryParams.set('page', String(params.page || 1));
      queryParams.set('limit', String(params.limit || 100));
      
      // Add optional filters
      if (params.isActive !== undefined) queryParams.set('isActive', String(params.isActive));
      if (params.country) queryParams.set('country', params.country);
      if (params.currencyCode) queryParams.set('currencyCode', params.currencyCode);
      
      const response = await apiClient.get<Store[]>(`/stores?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('List stores error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch stores');
    }
  }

  /**
   * Get store by ID
   * GET /api/stores/{storeId}
   */
  async getStoreById(storeId: string): Promise<Store> {
    try {
      const response = await apiClient.get<Store>(`/stores/${storeId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get store error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch store details');
    }
  }

  /**
   * Create a new store (admin)
   * POST /api/stores
   */
  async createStore(storeData: CreateStoreData): Promise<Store> {
    try {
      const response = await apiClient.post<Store>('/stores', storeData);
      return response.data.data;
    } catch (error: any) {
      console.error('Create store error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create store');
    }
  }

  /**
   * Update store (admin)
   * PUT /api/stores/{storeId}
   */
  async updateStore(storeId: string, storeData: UpdateStoreData): Promise<Store> {
    try {
      const response = await apiClient.put<Store>(`/stores/${storeId}`, storeData);
      return response.data.data;
    } catch (error: any) {
      console.error('Update store error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update store');
    }
  }

  /**
   * Delete store (admin)
   * DELETE /api/stores/{storeId}
   */
  async deleteStore(storeId: string): Promise<void> {
    try {
      await apiClient.delete(`/stores/${storeId}`);
    } catch (error: any) {
      console.error('Delete store error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete store');
    }
  }
}

export const storeService = new StoreService();
