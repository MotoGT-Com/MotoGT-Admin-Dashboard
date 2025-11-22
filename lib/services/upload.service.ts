import { apiClient } from '../api-client';

export interface UploadImageResponse {
  url: string;
  entityType: string;
  entityId: string;
}

type EntityType = 'store' | 'product' | 'category' | 'car';
type ImageField = 'car_image' | 'main_image' | 'secondary_image' | 'images';

class UploadService {
  /**
   * Upload an image for an entity
   * POST /api/upload/image
   */
  async uploadImage(
    file: File,
    entityType: EntityType,
    entityId: string,
    imageField: ImageField
  ): Promise<UploadImageResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);
      formData.append('imageField', imageField);

      // Use apiClient.post which will handle auth headers automatically
      // The Content-Type will be set automatically by the browser for FormData
      const response = await apiClient.post<UploadImageResponse>(
        '/upload-image',
        formData
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Upload image error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to upload image');
    }
  }

  /**
   * Validate image file before upload
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 10 MB limit.',
      };
    }

    return { valid: true };
  }
}

export const uploadService = new UploadService();
