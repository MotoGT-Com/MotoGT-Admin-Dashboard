import { apiClient } from '../api-client';
import { User } from './user.service';

// Types based on API spec
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  storeId: string;
  totalAmount: number | string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus?: string;
  shippingAddress?: any;
  billingAddress?: any;
  createdAt: string;
  updatedAt: string;
  // User details (fetched separately and merged)
  user?: User;
  itemCount?: number;
}

export interface OrdersListParams {
  storeId: string;
  page?: number;
  limit?: number;
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface OrdersListResponse {
  items: Order[];
  page: number;
  limit: number;
  total: number;
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
}

class OrderService {
  /**
   * Get list of orders (admin)
   * GET /admin/orders
   */
  async getOrders(params: OrdersListParams): Promise<OrdersListResponse> {
    try {
      const response = await apiClient.get<OrdersListResponse>('/admin/orders', params);
      return response.data.data;
    } catch (error: any) {
      console.error('Get orders error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch orders');
    }
  }

  /**
   * Get order details by ID (admin)
   * GET /admin/orders/{orderId}
   */
  async getOrderById(orderId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/admin/orders/${orderId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get order error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch order details');
    }
  }

  /**
   * Update order status (admin)
   * PATCH /admin/orders/{orderId}/status
   */
  async updateOrderStatus(orderId: string, status: UpdateOrderStatusRequest['status']): Promise<any> {
    try {
      const response = await apiClient.patch(`/admin/orders/${orderId}/status`, { status });
      return response.data.data;
    } catch (error: any) {
      console.error('Update order status error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update order status');
    }
  }
}

export const orderService = new OrderService();
