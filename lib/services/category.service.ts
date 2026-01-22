import { apiClient } from '../api-client';

export interface CategoryTranslation {
  languageCode: string;
  name: string;
  description: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface Category {
  id: string;
  storeId: string;
  parentId: string | null;
  productTypeId: string;
  isActive: boolean;
  sortOrder: number;
  categoryImage: string | null;
  createdAt: string;
  updatedAt: string;
  translations: CategoryTranslation[];
  subcategories?: Category[];
  name?: string; // Computed field for display
  productType?: {
    id: string;
    code: string;
    slug: string;
    name: string;
  };
  productsCount?: number;
}

export interface CategoryListParams {
  storeId: string;
  languageId: string;
  parentId?: string;
  productTypeId?: string;
  isActive?: boolean;
  includeSubcategories?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateCategoryDto {
  storeId: string;
  productTypeId: string;
  parentId?: string | null;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  translations: Array<{
    languageId: string;
    name: string;
    description?: string;
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
  }>;
}

export interface UpdateCategoryDto {
  productTypeId?: string;
  parentId?: string | null;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
  translations?: Array<{
    languageId: string;
    name: string;
    description?: string;
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
  }>;
}

class CategoryService {
  /**
   * List categories
   * GET /api/categories/public
   */
  async listCategories(params: CategoryListParams): Promise<Category[]> {
    try {
      const queryParams = new URLSearchParams();
      
      // Required params
      queryParams.set('storeId', params.storeId);
      queryParams.set('languageId', params.languageId);
      
      // Optional params
      if (params.parentId) queryParams.set('parentId', params.parentId);
      if (params.productTypeId) queryParams.set('productTypeId', params.productTypeId);
      if (params.isActive !== undefined) queryParams.set('isActive', String(params.isActive));
      if (params.includeSubcategories !== undefined) queryParams.set('includeSubcategories', String(params.includeSubcategories));
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      
      const response = await apiClient.get<any>(`/categories/public?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('List categories error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch categories');
    }
  }

  /**
   * Get category by ID
   * GET /api/categories/public/{categoryId}
   */
  async getCategoryById(categoryId: string, languageId: string): Promise<Category> {
    try {
      const response = await apiClient.get<any>(`/categories/public/${categoryId}?languageId=${languageId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get category error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch category details');
    }
  }

  /**
   * Extract category name from translations or direct name field
   */
  getCategoryName(category: any, languageCode: string = 'en'): string {
    // If category already has a name field (from subcategories), use it
    if (category.name && typeof category.name === 'string') {
      return category.name;
    }
    
    // Otherwise, try to find it in translations
    const translation = category.translations?.find((t: any) => t.languageCode === languageCode);
    return translation?.name || 'Unnamed Category';
  }
  
  /**
   * Get category name by ID from a list of categories
   */
  getCategoryNameById(categoryId: string, categories: Category[], languageCode: string = 'en'): string {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return 'Unknown Category';
    return this.getCategoryName(category, languageCode);
  }
  
  /**
   * Get subcategory name by ID from a category's subcategories
   */
  getSubcategoryNameById(categoryId: string, subcategoryId: string, categories: Category[], languageCode: string = 'en'): string {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category || !category.subcategories) return 'Unknown Subcategory';
    
    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
    if (!subcategory) return 'Unknown Subcategory';
    
    return this.getCategoryName(subcategory, languageCode);
  }

  /**
   * List categories (Admin)
   * GET /api/admin/categories
   */
  async listCategoriesAdmin(params: CategoryListParams): Promise<Category[]> {
    try {
      const queryParams = new URLSearchParams();
      
      // Required params
      queryParams.set('storeId', params.storeId);
      queryParams.set('languageId', params.languageId);
      
      // Optional params
      if (params.parentId) queryParams.set('parentId', params.parentId);
      if (params.productTypeId) queryParams.set('productTypeId', params.productTypeId);
      if (params.isActive !== undefined) queryParams.set('isActive', String(params.isActive));
      if (params.includeSubcategories !== undefined) queryParams.set('includeSubcategories', String(params.includeSubcategories));
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      
      const response = await apiClient.get<any>(`/admin/categories?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('List categories admin error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch categories');
    }
  }

  /**
   * Get category by ID (Admin)
   * GET /api/admin/categories/:id
   */
  async getCategoryByIdAdmin(categoryId: string, languageId: string): Promise<Category> {
    try {
      const response = await apiClient.get<any>(`/admin/categories/${categoryId}?languageId=${languageId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get category admin error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch category details');
    }
  }

  /**
   * Create category
   * POST /api/admin/categories
   */
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      const response = await apiClient.post<any>('/admin/categories', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Create category error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create category');
    }
  }

  /**
   * Update category
   * PATCH /api/admin/categories/:id
   */
  async updateCategory(categoryId: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      const response = await apiClient.put<any>(`/admin/categories/${categoryId}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Update category error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update category');
    }
  }

  /**
   * Delete category
   * DELETE /api/admin/categories/:id
   */
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/categories/${categoryId}`);
    } catch (error: any) {
      console.error('Delete category error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete category');
    }
  }
}

export const categoryService = new CategoryService();
