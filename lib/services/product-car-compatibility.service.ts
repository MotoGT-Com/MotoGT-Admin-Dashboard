import { apiClient } from '../api-client';

// API Response interface (snake_case from backend)
interface ProductCarCompatibilityResponse {
  id: string;
  product_id: string;
  car_id: string;
  car_brand?: string;
  car_model?: string;
  year_from: number;
  year_to: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCarCompatibility {
  id: string;
  productId: string;
  carId: string;
  carBrand: string;
  carModel: string;
  yearFrom: number;
  yearTo: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddCompatibilityRequest {
  carId: string;
  yearFrom: number;
  yearTo: number | null;
}

export interface UpdateCompatibilityRequest {
  yearFrom?: number;
  yearTo?: number | null;
}

export interface CompatibleCar {
  carId: string;
  carBrand: string;
  carModel: string;
  yearFrom: number;
  yearTo: number | null;
}

class ProductCarCompatibilityService {
  /**
   * Map API response (snake_case) to interface (camelCase)
   */
  private mapResponseToCompatibility(response: ProductCarCompatibilityResponse): ProductCarCompatibility {
    return {
      id: response.id,
      productId: response.product_id,
      carId: response.car_id,
      carBrand: response.car_brand || 'Unknown',
      carModel: response.car_model || 'Unknown',
      yearFrom: response.year_from,
      yearTo: response.year_to,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
    };
  }

  /**
   * Add car compatibility to product
   * POST /api/admin/products/:productId/compatibility
   */
  async addCompatibility(
    productId: string,
    data: AddCompatibilityRequest
  ): Promise<ProductCarCompatibility> {
    const response = await apiClient.post<{ data: ProductCarCompatibilityResponse }>(
      `/admin/products/${productId}/compatibility`,
      data
    );
    return this.mapResponseToCompatibility(response.data.data);
  }

  /**
   * List all compatibilities for a product
   * GET /api/admin/products/:productId/compatibility
   */
  async listCompatibilities(productId: string): Promise<ProductCarCompatibility[]> {
    const response = await apiClient.get<{ data: ProductCarCompatibilityResponse[] }>(
      `/admin/products/${productId}/compatibility`
    );
    
    // Map each compatibility and try to get car details
    const compatibilities = await Promise.all(
      response.data.data.compatibilities.map(async (item) => {
        let carBrand = item.car_brand || 'Unknown';
        let carModel = item.car_model || 'Unknown';
        
        // If car details are missing, try to fetch them
        if (!item.car_brand || !item.car_model) {
          try {
            const carResponse = await apiClient.get(`/cars/${item.car_id}`);
            const car = carResponse.data.data;
            carBrand = car.brand || 'Unknown';
            carModel = car.model || 'Unknown';
          } catch (error) {
            console.warn(`Failed to fetch car details for ${item.car_id}`, error);
          }
        }
        
        return {
          id: item.id,
          productId: item.product_id,
          carId: item.car_id,
          carBrand,
          carModel,
          yearFrom: item.year_from,
          yearTo: item.year_to,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        };
      })
    );
    
    return compatibilities;
  }

  /**
   * Update compatibility year range
   * PUT /api/admin/products/:productId/car-compatibility/:compatibilityId
   */
  async updateCompatibility(
    productId: string,
    compatibilityId: string,
    data: UpdateCompatibilityRequest
  ): Promise<ProductCarCompatibility> {
    const response = await apiClient.put<{ data: ProductCarCompatibilityResponse }>(
      `/admin/products/${productId}/compatibility/${compatibilityId}`,
      data
    );
    return this.mapResponseToCompatibility(response.data.data);
  }

  /**
   * Delete compatibility record
   * DELETE /api/admin/products/:productId/car-compatibility/:compatibilityId
   */
  async deleteCompatibility(
    productId: string,
    compatibilityId: string
  ): Promise<void> {
    await apiClient.delete(
      `/admin/products/${productId}/compatibility/${compatibilityId}`
    );
  }

  /**
   * Get compatible cars (with optional year filter)
   * GET /api/admin/products/:productId/compatible-cars?year=2022
   */
  async getCompatibleCars(
    productId: string,
    year?: number
  ): Promise<CompatibleCar[]> {
    const url = year
      ? `/admin/products/${productId}/compatible-cars?year=${year}`
      : `/admin/products/${productId}/compatible-cars`;
    
    const response = await apiClient.get<{ data: CompatibleCar[] }>(url);
    return response.data.data;
  }

  /**
   * Format year range for display
   */
  formatYearRange(yearFrom: number, yearTo: number | null): string {
    if (yearTo === null) {
      return `${yearFrom}-Present`;
    }
    if (yearFrom === yearTo) {
      return `${yearFrom}`;
    }
    return `${yearFrom}-${yearTo}`;
  }

  /**
   * Check if a year is within a compatibility range
   */
  isYearCompatible(year: number, yearFrom: number, yearTo: number | null): boolean {
    return year >= yearFrom && (yearTo === null || year <= yearTo);
  }
}

export const productCarCompatibilityService = new ProductCarCompatibilityService();
