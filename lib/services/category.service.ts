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
  isActive: boolean;
  sortOrder: number;
  categoryImage: string | null;
  createdAt: string;
  updatedAt: string;
  translations: CategoryTranslation[];
  subcategories?: Category[];
  name?: string; // Computed field for display
}

export interface CategoryListParams {
  storeId: string;
  languageId: string;
  parentId?: string;
  isActive?: boolean;
  includeSubcategories?: boolean;
  page?: number;
  limit?: number;
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
}

export const categoryService = new CategoryService();
