import { apiClient } from '../api-client';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface PromoCode {
  id: string;
  code: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  discountType: DiscountType;
  discountValue: number;
  currency: string | null;
  maxDiscountAmount: number | null;
  minOrderSubtotal: number | null;
  usageLimitTotal: number | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromoCodeRequest {
  code: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  discountType: DiscountType;
  discountValue: number;
  currency?: string | null;
  maxDiscountAmount?: number | null;
  minOrderSubtotal?: number | null;
  usageLimitTotal?: number | null;
}

export interface UpdatePromoCodeRequest {
  code?: string;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  discountType?: DiscountType;
  discountValue?: number;
  currency?: string | null;
  maxDiscountAmount?: number | null;
  minOrderSubtotal?: number | null;
  usageLimitTotal?: number | null;
}

export interface GetPromoCodesParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface PromoCodesResponse {
  promoCodes: PromoCode[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
}

class PromoCodeService {
  /**
   * Get all promo codes with pagination and filters
   * GET /api/admin/promo-codes
   */
  async getPromoCodes(params?: GetPromoCodesParams): Promise<PromoCodesResponse> {
    try {
      const response = await apiClient.get<PromoCodesResponse>('/admin/promo-codes', params);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      throw error;
    }
  }

  /**
   * Get a single promo code by ID
   * GET /api/admin/promo-codes/{promoCodeId}
   */
  async getPromoCodeById(promoCodeId: string): Promise<PromoCode> {
    try {
      const response = await apiClient.get<PromoCode>(`/admin/promo-codes/${promoCodeId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching promo code:', error);
      throw error;
    }
  }

  /**
   * Create a new promo code
   * POST /api/admin/promo-codes
   */
  async createPromoCode(data: CreatePromoCodeRequest): Promise<PromoCode> {
    try {
      const response = await apiClient.post<PromoCode>('/admin/promo-codes', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      throw error;
    }
  }

  /**
   * Update an existing promo code
   * PUT /api/admin/promo-codes/{promoCodeId}
   */
  async updatePromoCode(promoCodeId: string, data: UpdatePromoCodeRequest): Promise<PromoCode> {
    try {
      const response = await apiClient.put<PromoCode>(`/admin/promo-codes/${promoCodeId}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating promo code:', error);
      throw error;
    }
  }

  /**
   * Disable a promo code
   * Sets isActive to false using the update API
   */
  async disablePromoCode(promoCodeId: string): Promise<PromoCode> {
    try {
      const response = await apiClient.put<PromoCode>(`/admin/promo-codes/${promoCodeId}`, {
        isActive: false
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error disabling promo code:', error);
      throw error;
    }
  }

  /**
   * Enable a promo code
   * Sets isActive to true using the update API
   */
  async enablePromoCode(promoCodeId: string): Promise<PromoCode> {
    try {
      const response = await apiClient.put<PromoCode>(`/admin/promo-codes/${promoCodeId}`, {
        isActive: true
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error enabling promo code:', error);
      throw error;
    }
  }

  /**
   * Delete a promo code
   * DELETE /api/admin/promo-codes/{promoCodeId}
   */
  async deletePromoCode(promoCodeId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/promo-codes/${promoCodeId}`);
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const promoCodeService = new PromoCodeService();
