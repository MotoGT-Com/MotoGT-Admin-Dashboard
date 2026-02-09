import { apiClient } from '../api-client';

export interface ProductType {
  id: string;
  code: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations?: Array<{
    languageId: string;
    languageCode: string;
    name: string;
  }>;
}

export interface CreateProductTypeDto {
  code: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  translations: Array<{
    languageId: string;
    name: string;
  }>;
}

export interface UpdateProductTypeDto {
  sortOrder?: number;
  isActive?: boolean;
  translations?: Array<{
    languageId: string;
    name: string;
  }>;
}

class ProductTypeService {
  /**
   * Get all product types
   * GET /api/product-types
   */
  async getAll(languageId?: string): Promise<ProductType[]> {
    try {
      const params = languageId ? { languageId } : {};
      const response = await apiClient.get<any>('/admin/product-types', { params });
      return response.data.data.productTypes;
    } catch (error: any) {
      console.error('Get product types error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch product types');
    }
  }

  /**
   * Get single product type with all translations
   * GET /api/product-types/:id
   */
  async getById(id: string, languageId?: string): Promise<ProductType> {
    try {
      const params = languageId ? { languageId } : {};
      const response = await apiClient.get<any>(`/product-types/${id}`, { params });
      return response.data.data;
    } catch (error: any) {
      console.error('Get product type error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch product type');
    }
  }

  /**
   * Create new product type
   * POST /api/admin/product-types
   */
  async create(data: CreateProductTypeDto): Promise<ProductType> {
    try {
      const response = await apiClient.post<any>('/admin/product-types', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Create product type error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create product type');
    }
  }

  /**
   * Update product type
   * PUT /api/admin/product-types/:id
   */
  async update(id: string, data: UpdateProductTypeDto): Promise<ProductType> {
    try {
      const response = await apiClient.put<any>(`/admin/product-types/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Update product type error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update product type');
    }
  }

  /**
   * Delete product type
   * DELETE /api/admin/product-types/:id
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/product-types/${id}`);
    } catch (error: any) {
      console.error('Delete product type error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete product type');
    }
  }

  /**
   * Get public product types (active only)
   * GET /api/product-types/public
   */
  async getPublic(languageId?: string): Promise<ProductType[]> {
    try {
      const params = languageId ? { languageId } : {};
      const response = await apiClient.get<any>('/product-types/public', { params });
      return response.data.data;
    } catch (error: any) {
      console.error('Get public product types error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch public product types');
    }
  }
}

export const productTypeService = new ProductTypeService();
