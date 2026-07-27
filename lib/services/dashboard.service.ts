import { apiClient } from '../api-client';
import { getApiErrorMessage } from '../api-errors';

export type DashboardPeriod = 'today' | '7d' | '30d';

export interface DashboardKpis {
  revenue: number;
  revenuePrevious: number;
  orders: number;
  ordersPrevious: number;
  pendingOrders: number;
  processingOrders: number;
  newCustomers: number;
  newCustomersPrevious: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface DashboardRevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardStatusCount {
  status: string;
  count: number;
}

export interface DashboardAttentionOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  customerName: string;
  createdAt: string;
  isGuest: boolean;
}

export interface DashboardTopProduct {
  productId: string;
  name: string;
  itemCode: string;
  units: number;
  revenue: number;
  mainImage: string | null;
}

export interface DashboardLowStockItem {
  productId: string;
  name: string;
  itemCode: string;
  stockQuantity: number;
}

export interface DashboardData {
  storeId: string;
  period: {
    key: DashboardPeriod;
    from: string;
    to: string;
  };
  currencyCode: string;
  lowStockThreshold: number;
  newCustomersScope: 'platform';
  kpis: DashboardKpis;
  revenueSeries: DashboardRevenuePoint[];
  ordersByStatus: DashboardStatusCount[];
  attentionOrders: DashboardAttentionOrder[];
  topProducts: DashboardTopProduct[];
  lowStock: DashboardLowStockItem[];
}

export interface GetDashboardParams {
  storeId: string;
  period?: DashboardPeriod;
}

class DashboardService {
  /**
   * GET /admin/dashboard
   * Store-scoped ops KPIs, charts, and attention lists for the admin home.
   */
  async getDashboard(params: GetDashboardParams): Promise<DashboardData> {
    let data: DashboardData;
    try {
      const response = await apiClient.get<DashboardData>('/admin/dashboard', {
        storeId: params.storeId,
        period: params.period ?? '7d',
      });
      data = response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load dashboard'));
    }

    // Production may still be on the legacy stub until motogt-backend is deployed.
    if (!data?.kpis) {
      throw new Error(
        'Dashboard API returned an unexpected payload. Deploy the updated motogt-backend (GET /admin/dashboard aggregates) and refresh.'
      );
    }

    return data;
  }
}

export const dashboardService = new DashboardService();
