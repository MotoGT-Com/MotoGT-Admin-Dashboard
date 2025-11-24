import { apiClient } from '../api-client';

export interface CarCompatibility {
  carId: string;
  carBrand: string;
  carModel: string;
  carYearFrom: number;
  carYearTo: number;
}

export interface ProductSpec {
  isFilterable: boolean;
  sortOrder: number;
  type: string;
  unit: string | null;
  value: string;
}

export interface ProductSpecs {
  [key: string]: ProductSpec;
}

export interface ProductTranslation {
  languageCode: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string[];
}

export interface Product {
  id: string;
  itemCode: string;
  storeId: string;
  categoryId: string;
  subCategoryId: string;
  isActive: boolean;
  price: number;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
  mainImage: string;
  secondaryImage: string;
  images: string[];
  in_favs: boolean;
  carCompatibility: CarCompatibility[];
  specs: {
    [languageCode: string]: ProductSpecs;
  };
  translations: ProductTranslation[];
  // Computed fields for display
  name?: string;
  description?: string;
  color?: string;
  material?: string;
  carInfo?: string;
}

export interface ProductListParams {
  storeId: string;
  languageId: string;
  categoryId?: string;
  subCategoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
  carBrand?: string;
  carModel?: string;
}

export interface ProductListResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateProductRequest {
  itemCode: string;
  storeId: string;
  categoryId: string;
  subCategoryId?: string;
  price: number;
  costPrice?: number;
  discountPrice?: number;
  stockQuantity: number;
  isActive?: boolean;
  isFeatured?: boolean;
  carCompatibility?: {
    carId: string;
    isCompatible?: boolean;
    notes?: string;
  }[];
  translations: {
    languageId: string;
    name: string;
    description?: string;
    material?: string;
    color?: string;
  }[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

class ProductService {
  /**
   * List products (admin)
   * GET /api/admin/products
   */
  async listProducts(params: ProductListParams): Promise<ProductListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Required params
      queryParams.set('storeId', params.storeId);
      queryParams.set('languageId', params.languageId);
      
      // Pagination params for server-side pagination
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      
      // Optional filters
      if (params.categoryId) queryParams.set('categoryId', params.categoryId);
      if (params.subCategoryId) queryParams.set('subCategoryId', params.subCategoryId);
      if (params.search) queryParams.set('search', params.search);
      if (params.carBrand) queryParams.set('carBrand', params.carBrand);
      if (params.carModel) queryParams.set('carModel', params.carModel);
      
      const response = await apiClient.get<any>(`/admin/products?${queryParams.toString()}`);
      
      // API returns { success: true, data: [...], meta: {...} }
      return {
        data: response.data.data as Product[],
        meta: response.data.meta as {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        }
      };
    } catch (error: any) {
      console.error('List products error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch products');
    }
  }

  /**
   * Get product by ID (admin)
   * GET /api/admin/products/{productId}
   */
  async getProductById(productId: string, languageId: string): Promise<Product> {
    try {
      const response = await apiClient.get<Product>(`/admin/products/${productId}?languageId=${languageId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get product error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch product details');
    }
  }

  /**
   * Create product (admin)
   * POST /api/admin/products
   */
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      const response = await apiClient.post<Product>('/admin/products', productData);
      return response.data.data;
    } catch (error: any) {
      console.error('Create product error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create product');
    }
  }

  /**
   * Update product (admin)
   * PUT /api/admin/products/{productId}
   */
  async updateProduct(productId: string, productData: UpdateProductRequest): Promise<Product> {
    try {
      const response = await apiClient.put<Product>(`/admin/products/${productId}`, productData);
      return response.data.data;
    } catch (error: any) {
      console.error('Update product error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update product');
    }
  }

  /**
   * Delete product (admin)
   * DELETE /api/admin/products/{productId}
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/products/${productId}`);
    } catch (error: any) {
      console.error('Delete product error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete product');
    }
  }
}

export const productService = new ProductService();
