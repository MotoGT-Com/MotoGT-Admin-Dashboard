import { apiClient } from '../api-client';

export interface Car {
    id: string;
    brand: string;
    model: string;
    store_id?: string;
    yearFrom?: number | null;
    yearTo?: number | null;
    engineSize?: string | null;
    fuelType?: string | null;
    transmission?: string | null;
    bodyType?: string | null;
    car_image?: string | null;
    createdAt: string;
    updatedAt: string;
    year_from?: number | null;
    year_to?: number | null;
    engine_size?: string | null;
    fuel_type?: string | null;
    transmission_type?: string | null;
    body_type?: string | null;
}

export interface CarListParams {
  page?: number;
  limit?: number;
  brand?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  store_id?: string;
}

export interface CarListData {
  items: Car[];
  page: number;
  limit: number;
  total: number;
}

export interface BrandData {
  brand: string;
  models: Car[];
  totalModels: number;
}

class CarService {
  /**
   * List all cars with pagination and filters
   * GET /api/cars
   */
  async listCars(params: CarListParams = {}): Promise<Car[]> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination
      queryParams.set('page', String(params.page || 1));
      queryParams.set('limit', String(params.limit || 100)); // Get more cars to group by brand
      
      // Add optional filters
      if (params.brand) queryParams.set('brand', params.brand);
      if (params.model) queryParams.set('model', params.model);
      if (params.yearFrom) queryParams.set('yearFrom', String(params.yearFrom));
      if (params.yearTo) queryParams.set('yearTo', String(params.yearTo));
      if (params.store_id) queryParams.set('store_id', params.store_id);
      
      const response = await apiClient.get<Car[]>(`/cars?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('List cars error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch cars');
    }
  }

  /**
   * Get car by ID
   * GET /api/cars/{carId}
   */
  async getCarById(carId: string): Promise<Car> {
    try {
      const response = await apiClient.get<Car>(`/cars/${carId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get car error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch car details');
    }
  }

  /**
   * Create a new car (admin)
   * POST /api/cars
   */
  async createCar(carData: Partial<Car> & { store_id: string }): Promise<Car> {
    try {
      const response = await apiClient.post<Car>('/cars', carData);
      return response.data.data;
    } catch (error: any) {
      console.error('Create car error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create car');
    }
  }

  /**
   * Update car (admin)
   * PUT /api/cars/{carId}
   */
  async updateCar(carId: string, carData: Partial<Car> & { store_id: string }): Promise<Car> {
    try {
      const response = await apiClient.put<Car>(`/cars/${carId}`, carData);
      return response.data.data;
    } catch (error: any) {
      console.error('Update car error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update car');
    }
  }

  /**
   * Delete car (admin)
   * DELETE /api/cars/{carId}
   */
  async deleteCar(carId: string): Promise<void> {
    try {
      await apiClient.delete(`/cars/${carId}`);
    } catch (error: any) {
      console.error('Delete car error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete car');
    }
  }

  /**
   * Group cars by brand
   * Helper method to organize cars by brand
   */
  groupCarsByBrand(cars: Car[]): BrandData[] {
    const brandMap = new Map<string, Car[]>();
    
    // Group cars by brand
    cars.forEach(car => {
      const existing = brandMap.get(car.brand) || [];
      existing.push(car);
      brandMap.set(car.brand, existing);
    });
    
    // Convert to array and sort
    const brands: BrandData[] = Array.from(brandMap.entries())
      .map(([brand, models]) => ({
        brand,
        models: models.sort((a, b) => a.model.localeCompare(b.model)),
        totalModels: models.length,
      }))
      .sort((a, b) => a.brand.localeCompare(b.brand));
    
    return brands;
  }
}

export const carService = new CarService();
