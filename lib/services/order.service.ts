import { apiClient } from '../api-client';
import { User } from './user.service';

// Types based on API spec
export interface PaymentMethod {
  type: 'credit_card' | 'cod' | 'cliq' | 'card_on_delivery' | string;
  isPrepaid: boolean;
  isPostpaid: boolean;
  isCOD: boolean;
  isCliq: boolean;
}

export interface Payment {
  id: string;
  status: 'pending' | 'captured' | 'failed' | 'refunded';
  provider: string;
  amount: string;
  currency: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  storeId: string;
  totalAmount: number | string;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: PaymentMethod | null;
  payment: Payment | null;
  isPaid: boolean;
  customer: Customer;
  shippingAddress?: any;
  billingAddress?: any;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

export interface OrdersListParams {
  storeId: string;
  page?: number;
  limit?: number;
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_method?: string;
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

export interface ShipOrderRequest {
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: Date;
  shipmentNotes?: string;
}

export interface DeliverOrderRequest {
  deliveredAt?: Date;
  deliveryNotes?: string;
}

export interface CancelOrderRequest {
  reason: string;
  notes?: string;
}

export interface RefundOrderRequest {
  amount?: number;
  reason: string;
  refundDescription: string;
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

  /**
   * Ship order (admin)
   * POST /admin/orders/{orderId}/ship
   */
  async shipOrder(orderId: string, data: ShipOrderRequest): Promise<any> {
    try {
      const response = await apiClient.post(`/admin/orders/${orderId}/ship`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Ship order error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to ship order');
    }
  }

  /**
   * Deliver order (admin)
   * POST /admin/orders/{orderId}/deliver
   */
  async deliverOrder(orderId: string, data: DeliverOrderRequest): Promise<any> {
    try {
      const response = await apiClient.post(`/admin/orders/${orderId}/deliver`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Deliver order error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to deliver order');
    }
  }

  /**
   * Cancel order (admin)
   * POST /admin/orders/{orderId}/cancel
   */
  async cancelOrder(orderId: string, data: CancelOrderRequest): Promise<any> {
    try {
      const response = await apiClient.post(`/admin/orders/${orderId}/cancel`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Cancel order error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to cancel order');
    }
  }

  /**
   * Refund order (admin)
   * POST /admin/orders/{orderId}/refund
   */
  async refundOrder(orderId: string, data: RefundOrderRequest): Promise<any> {
    try {
      const response = await apiClient.post(`/admin/orders/${orderId}/refund`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Refund order error:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to refund order');
    }
  }
}

export const orderService = new OrderService();
