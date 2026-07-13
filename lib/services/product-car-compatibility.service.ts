import { apiClient } from '../api-client';
import { getApiErrorMessage } from '../api-errors';

// API Response interface (snake_case from backend)
interface ProductCarCompatibilityResponse {
  id: string;
  product_id: string;
  car_id: string;
  car_brand?: string;
  car_model?: string;
  car_trim?: string | null;
  year_from: number;
  year_to: number | null;
  trim?: string | null;
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
  /** Optional vehicle trim; null/empty means all trims */
  trim: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddCompatibilityRequest {
  carId: string;
  yearFrom: number;
  yearTo: number | null;
  /** Optional; null/empty = all trims. Persisted on product_car_compatibility.trim */
  trim?: string | null;
}

export interface UpdateCompatibilityRequest {
  yearFrom?: number;
  yearTo?: number | null;
  /** Optional; null/empty = all trims. Persisted on product_car_compatibility.trim */
  trim?: string | null;
}

export interface CompatibleCar {
  carId: string;
  carBrand: string;
  carModel: string;
  yearFrom: number;
  yearTo: number | null;
  trim?: string | null;
}

class ProductCarCompatibilityService {
  /**
   * Map API response (snake_case) to interface (camelCase)
   */
  private mapResponseToCompatibility(
    response: ProductCarCompatibilityResponse,
    fallbackTrim?: string | null,
  ): ProductCarCompatibility {
    // Only use product_car_compatibility.trim — never cars.trim (shared across products).
    const compatibilityTrim =
      response.trim !== undefined && response.trim !== null
        ? String(response.trim).trim() || null
        : fallbackTrim !== undefined
          ? fallbackTrim
          : null;

    return {
      id: response.id,
      productId: response.product_id,
      carId: response.car_id,
      carBrand: response.car_brand || 'Unknown',
      carModel: response.car_model || 'Unknown',
      yearFrom: response.year_from,
      yearTo: response.year_to,
      trim: compatibilityTrim,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
    };
  }

  /**
   * Use snake_case to match the admin ↔ API contract.
   * Includes optional trim on product_car_compatibility.
   */
  private toApiPayload(
    data: AddCompatibilityRequest | UpdateCompatibilityRequest,
  ) {
    const payload: Record<string, unknown> = {};
    if ('carId' in data && data.carId !== undefined) {
      payload.car_id = data.carId;
    }
    if (data.yearFrom !== undefined) {
      payload.year_from = data.yearFrom;
    }
    if (data.yearTo !== undefined) {
      payload.year_to = data.yearTo;
    }
    if (data.trim !== undefined) {
      payload.trim = data.trim === '' ? null : data.trim;
    }
    return payload;
  }

  private getErrorMessage(error: any, fallback: string) {
    return (
      error?.response?.data?.error?.message ||
      getApiErrorMessage(error, error?.message || fallback)
    );
  }

  /**
   * Add car compatibility to product
   * POST /api/admin/products/:productId/compatibility
   */
  private isTrimSchemaError(error: any) {
    const message = String(
      error?.response?.data?.error?.message || error?.message || '',
    ).toLowerCase();
    return (
      message.includes('trim') &&
      (message.includes('does not exist') ||
        message.includes('column') ||
        message.includes('undefined'))
    );
  }

  async addCompatibility(
    productId: string,
    data: AddCompatibilityRequest
  ): Promise<ProductCarCompatibility> {
    try {
      const response = await apiClient.post<{ data: ProductCarCompatibilityResponse }>(
        `/admin/products/${productId}/compatibility`,
        this.toApiPayload(data),
      );
      return this.mapResponseToCompatibility(response.data.data, data.trim);
    } catch (error: any) {
      // DB may not have migration 053 yet — save years without trim.
      if (
        data.trim !== undefined &&
        (this.isTrimSchemaError(error) || error?.response?.status === 500)
      ) {
        try {
          const response = await apiClient.post<{ data: ProductCarCompatibilityResponse }>(
            `/admin/products/${productId}/compatibility`,
            this.toApiPayload({ ...data, trim: undefined }),
          );
          const mapped = this.mapResponseToCompatibility(response.data.data, null);
          (mapped as any).__trimSkipped = true;
          return mapped;
        } catch (retryError: any) {
          throw new Error(
            this.getErrorMessage(retryError, 'Failed to add compatibility'),
          );
        }
      }
      throw new Error(this.getErrorMessage(error, 'Failed to add compatibility'));
    }
  }

  /**
   * List all compatibilities for a product
   * GET /api/admin/products/:productId/compatibility
   */
  async listCompatibilities(productId: string): Promise<ProductCarCompatibility[]> {
    try {
      const response = await apiClient.get<{ data: any }>(
        `/admin/products/${productId}/compatibility`
      );

      const raw = response.data.data;
      const items: ProductCarCompatibilityResponse[] = Array.isArray(raw)
        ? raw
        : raw?.compatibilities || [];

      const compatibilities = await Promise.all(
        items.map(async (item) => {
          let carBrand = item.car_brand || 'Unknown';
          let carModel = item.car_model || 'Unknown';
          // Per-product trim only — never fall back to cars.trim (shared car row).
          const compatibilityTrim: string | null =
            item.trim !== undefined && item.trim !== null
              ? String(item.trim).trim() || null
              : null;

          if (!item.car_brand || !item.car_model) {
            try {
              const carResponse = await apiClient.get(`/cars/${item.car_id}`);
              const car = carResponse.data.data;
              carBrand = car.brand || carBrand;
              carModel = car.model || carModel;
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
            trim: compatibilityTrim,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          };
        })
      );

      return compatibilities;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error, 'Failed to load compatibilities'));
    }
  }

  /**
   * Update compatibility year range / trim
   * PUT /api/admin/products/:productId/compatibility/:compatibilityId
   */
  async updateCompatibility(
    productId: string,
    compatibilityId: string,
    data: UpdateCompatibilityRequest
  ): Promise<ProductCarCompatibility> {
    try {
      const response = await apiClient.put<{ data: ProductCarCompatibilityResponse }>(
        `/admin/products/${productId}/compatibility/${compatibilityId}`,
        this.toApiPayload(data),
      );
      return this.mapResponseToCompatibility(response.data.data, data.trim);
    } catch (error: any) {
      // DB may not have migration 053 yet — save years without trim.
      if (data.trim !== undefined && this.isTrimSchemaError(error)) {
        const response = await apiClient.put<{ data: ProductCarCompatibilityResponse }>(
          `/admin/products/${productId}/compatibility/${compatibilityId}`,
          this.toApiPayload({ ...data, trim: undefined }),
        );
        const mapped = this.mapResponseToCompatibility(response.data.data, null);
        (mapped as any).__trimSkipped = true;
        return mapped;
      }
      // Retry once without trim on schema errors only — generic 500 retries
      // double-fail on production and spam the console.
      throw new Error(
        this.getErrorMessage(error, 'Failed to update compatibility'),
      );
    }
  }

  /**
   * Delete compatibility record
   * DELETE /api/admin/products/:productId/compatibility/:compatibilityId
   */
  async deleteCompatibility(
    productId: string,
    compatibilityId: string
  ): Promise<void> {
    try {
      await apiClient.delete(
        `/admin/products/${productId}/compatibility/${compatibilityId}`
      );
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error, 'Failed to delete compatibility'));
    }
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
   * Format compatibility label including optional trim
   */
  formatCompatibilityLabel(
    carBrand: string,
    carModel: string,
    trim: string | null | undefined,
    yearFrom: number,
    yearTo: number | null
  ): string {
    const vehicle = trim
      ? `${carBrand} ${carModel} · ${trim}`
      : `${carBrand} ${carModel}`;
    return `${vehicle} (${this.formatYearRange(yearFrom, yearTo)})`;
  }

  /**
   * Check if a year is within a compatibility range
   */
  isYearCompatible(year: number, yearFrom: number, yearTo: number | null): boolean {
    return year >= yearFrom && (yearTo === null || year <= yearTo);
  }
}

export const productCarCompatibilityService = new ProductCarCompatibilityService();
