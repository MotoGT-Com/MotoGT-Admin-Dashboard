import { apiClient } from '../api-client';
import type {
  AccountStatus,
  ChannelPaymentMethod,
  OrderChannel,
  OrderKind,
} from '../domain/channels';

export interface PaymentMethod {
  type: 'credit_card' | 'cod' | 'cliq' | 'card_on_delivery' | string;
  isPrepaid: boolean;
  isPostpaid: boolean;
  isCOD: boolean;
  isCliq: boolean;
}

export interface Payment {
  id: string;
  status: 'pending' | 'captured' | 'failed' | 'refunded' | string;
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
  accountStatus?: AccountStatus | null;
}

export interface OrderLineItem {
  productId?: string;
  sku?: string;
  name?: string;
  quantity: number;
  unitPrice?: number | string;
  totalPrice?: number | string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  storeId: string;
  totalAmount: number | string;
  currency: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded'
    | string;
  paymentMethod: PaymentMethod | null;
  payment: Payment | null;
  isPaid: boolean;
  customer: Customer | null;
  shippingAddress?: any;
  billingAddress?: any;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  channel?: OrderChannel | string;
  orderType?: OrderKind | OrderChannel | string;
  accountStatus?: AccountStatus | null;
  discountAmount?: number | string;
  discountCode?: string | null;
  notes?: string | null;
  city?: string | null;
  staffMember?: string | null;
  staffUserId?: string | null;
  lineItems?: OrderLineItem[];
}

export interface OrdersListParams {
  storeId: string;
  page?: number;
  limit?: number;
  status?: string;
  payment_method?: string;
  sortBy?: 'createdAt' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
  channel?: OrderChannel | string;
  orderType?: OrderChannel | OrderKind | string;
  customerId?: string;
  q?: string;
  city?: string;
  from?: string;
  to?: string;
  amountMin?: number;
  amountMax?: number;
  hasDiscount?: boolean;
  needsAttention?: boolean;
}

export interface OrdersListResponse {
  items: Order[];
  page: number;
  limit: number;
  total: number;
}

export interface UpdateOrderStatusRequest {
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';
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

export interface CreateChannelOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateChannelOrderRequest {
  storeId: string;
  channel: 'in_store' | 'whatsapp';
  customerId?: string | null;
  newCustomer?: {
    name: string;
    phone: string;
    email?: string;
  };
  items: CreateChannelOrderItem[];
  paymentMethod: ChannelPaymentMethod;
  markPaid?: boolean;
  notes?: string;
  discountAmount?: number;
  discountCode?: string | null;
}

export interface GuestOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currencyCode: string;
  productSnapshot: {
    images: string[];
    mainImage: string;
    productCode: string;
    currentPrice: number;
    translations: {
      en: {
        name: string;
        tags?: string | null;
        metaTitle?: string | null;
        description?: string | null;
        metaDescription?: string | null;
        shortDescription?: string | null;
      };
    };
    stockQuantity: number;
    snapshotCreatedAt: string;
  };
}

export interface GuestOrder {
  id: string;
  orderNumber: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';
  storeId: string;
  guestEmail: string;
  guestPhone: string;
  totalAmount: number;
  currencyCode: string;
  paymentMethod: string;
  itemCount: number;
  items: GuestOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GuestOrdersListParams {
  storeId: string;
  page?: number;
  limit?: number;
  status?:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';
  email?: string;
}

export interface GuestOrdersListResponse {
  items: GuestOrder[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class OrderService {
  /**
   * Get list of orders (admin)
   * GET /admin/orders
   */
  async getOrders(params: OrdersListParams): Promise<OrdersListResponse> {
    try {
      const response = await apiClient.get<OrdersListResponse>(
        '/admin/orders',
        params,
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Get orders error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to fetch orders',
      );
    }
  }

  /**
   * Create in-store / WhatsApp channel order (admin)
   * POST /admin/orders
   */
  async createChannelOrder(
    data: CreateChannelOrderRequest,
    idempotencyKey: string,
  ): Promise<Order> {
    try {
      const response = await apiClient.post<Order>('/admin/orders', data, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Create channel order error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to create order',
      );
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
      throw new Error(
        error.response?.data?.error?.message || 'Failed to fetch order details',
      );
    }
  }

  /**
   * Update order status (admin)
   * PATCH /admin/orders/{orderId}/status
   */
  async updateOrderStatus(
    orderId: string,
    status: UpdateOrderStatusRequest['status'],
  ): Promise<any> {
    try {
      const response = await apiClient.patch(`/admin/orders/${orderId}/status`, {
        status,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Update order status error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to update order status',
      );
    }
  }

  /**
   * Ship order (admin)
   * POST /admin/orders/{orderId}/ship
   */
  async shipOrder(orderId: string, data: ShipOrderRequest): Promise<any> {
    try {
      const response = await apiClient.post(
        `/admin/orders/${orderId}/ship`,
        data,
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Ship order error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to ship order',
      );
    }
  }

  /**
   * Deliver order (admin)
   * POST /admin/orders/{orderId}/deliver
   */
  async deliverOrder(orderId: string, data: DeliverOrderRequest): Promise<any> {
    try {
      const response = await apiClient.post(
        `/admin/orders/${orderId}/deliver`,
        data,
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Deliver order error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to deliver order',
      );
    }
  }

  /**
   * Cancel order (admin)
   * POST /admin/orders/{orderId}/cancel
   */
  async cancelOrder(orderId: string, data: CancelOrderRequest): Promise<any> {
    try {
      const response = await apiClient.post(
        `/admin/orders/${orderId}/cancel`,
        data,
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Cancel order error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to cancel order',
      );
    }
  }

  /**
   * Get guest order details by ID (admin)
   * GET /admin/orders/guest/{orderId}
   */
  async getGuestOrderById(orderId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/admin/orders/guest/${orderId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get guest order error:', error);
      throw new Error(
        error.response?.data?.error?.message ||
          'Failed to fetch guest order details',
      );
    }
  }

  /**
   * Get list of guest orders (admin)
   * GET /admin/orders/guest
   */
  async getGuestOrders(
    params: GuestOrdersListParams,
  ): Promise<GuestOrdersListResponse> {
    try {
      const response = await apiClient.get<GuestOrdersListResponse>(
        '/admin/orders/guest',
        params,
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Get guest orders error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to fetch guest orders',
      );
    }
  }

  /**
   * Refund order (admin)
   * POST /admin/orders/{orderId}/refund
   */
  async refundOrder(orderId: string, data: RefundOrderRequest): Promise<any> {
    try {
      const response = await apiClient.post(
        `/admin/orders/${orderId}/refund`,
        data,
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Refund order error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Failed to refund order',
      );
    }
  }
}

export const orderService = new OrderService();
