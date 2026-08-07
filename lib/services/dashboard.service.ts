import { apiClient } from '../api-client';
import { getApiErrorMessage } from '../api-errors';
import { resolveDashboardDateRange } from '../dashboard-utils';
import { orderService, type Order } from './order.service';

/** Preset windows for GET /admin/dashboard (plus custom via from/to). */
export type DashboardPeriod =
  | '7d'
  | '14d'
  | '30d'
  | '90d'
  | '180d'
  | 'custom';

/** Periods the production API accepted before extended-range support. */
const LEGACY_PERIODS = new Set<DashboardPeriod>(['7d', '30d']);

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

export interface DashboardCategorySale {
  categoryId?: string;
  name: string;
  revenue: number;
  /** Share of total category sales (0–100). */
  percentage: number;
}

export interface DashboardData {
  storeId: string;
  period: {
    key: DashboardPeriod | string;
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
  /** Present when the API returns category aggregates; otherwise UI may mock. */
  categorySales?: DashboardCategorySale[];
}

export interface GetDashboardParams {
  storeId: string;
  period?: DashboardPeriod;
  /** Inclusive start date (YYYY-MM-DD). Required when period is `custom`. */
  from?: string;
  /** Inclusive end date (YYYY-MM-DD). Required when period is `custom`. */
  to?: string;
}

function isInvalidInputError(error: unknown): boolean {
  const message = getApiErrorMessage(error, '');
  return /invalid input/i.test(message);
}

function orderAmount(order: Order): number {
  const raw = order.totalAmount;
  return typeof raw === 'number' ? raw : Number(raw) || 0;
}

function orderDay(order: Order): string {
  return order.createdAt.slice(0, 10);
}

function isCancelled(order: Order): boolean {
  return order.status === 'cancelled' || order.status === 'refunded';
}

function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function inclusiveDaySpan(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00`).getTime();
  const end = new Date(`${to}T00:00:00`).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

class DashboardService {
  /**
   * GET /admin/dashboard
   * Store-scoped ops KPIs, charts, and attention lists for the admin home.
   *
   * Extended periods (14d / 90d / 180d / custom) are sent to the API when
   * supported. Against older backends that only accept 7d/30d, we fall back to
   * aggregating from GET /admin/orders so the UI still works.
   */
  async getDashboard(params: GetDashboardParams): Promise<DashboardData> {
    const period = params.period ?? '7d';
    const range = resolveDashboardDateRange(period, {
      from: params.from,
      to: params.to,
    });

    try {
      return await this.fetchFromApi({
        storeId: params.storeId,
        period,
        from: range.from,
        to: range.to,
      });
    } catch (error) {
      // Legacy production enum is today|7d|30d — retry via order aggregation.
      if (!LEGACY_PERIODS.has(period) && isInvalidInputError(error)) {
        return this.buildFromOrdersFallback({
          storeId: params.storeId,
          period,
          from: range.from,
          to: range.to,
        });
      }
      throw new Error(getApiErrorMessage(error, 'Failed to load dashboard'));
    }
  }

  private async fetchFromApi(params: {
    storeId: string;
    period: DashboardPeriod;
    from: string;
    to: string;
  }): Promise<DashboardData> {
    const query: Record<string, string> = {
      storeId: params.storeId,
      period: params.period,
    };

    // Custom always needs bounds. Extended presets also send bounds so
    // backends that prefer from/to can use them.
    if (
      params.period === 'custom' ||
      params.period === '14d' ||
      params.period === '90d' ||
      params.period === '180d'
    ) {
      query.from = params.from;
      query.to = params.to;
    }

    const response = await apiClient.get<DashboardData>(
      '/admin/dashboard',
      query,
    );
    const data = response.data.data;

    if (!data?.kpis) {
      throw new Error(
        'Dashboard API returned an unexpected payload. Deploy the updated motogt-backend (GET /admin/dashboard aggregates) and refresh.',
      );
    }

    return data;
  }

  /**
   * Fallback for APIs that reject extended period keys: pull a 30d dashboard
   * shell (currency, stock, attention) and recompute period KPIs/charts from
   * the orders list.
   */
  private async buildFromOrdersFallback(params: {
    storeId: string;
    period: DashboardPeriod;
    from: string;
    to: string;
  }): Promise<DashboardData> {
    const shell = await this.fetchFromApi({
      storeId: params.storeId,
      period: '30d',
      from: shiftIsoDate(params.to, -29),
      to: params.to,
    });

    const spanDays = inclusiveDaySpan(params.from, params.to);
    const previousTo = shiftIsoDate(params.from, -1);
    const previousFrom = shiftIsoDate(previousTo, -(spanDays - 1));

    const [currentOrders, previousOrders] = await Promise.all([
      this.collectOrdersInRange(params.storeId, params.from, params.to),
      this.collectOrdersInRange(params.storeId, previousFrom, previousTo),
    ]);

    const currentActive = currentOrders.filter((o) => !isCancelled(o));
    const previousActive = previousOrders.filter((o) => !isCancelled(o));

    const revenue = currentActive.reduce((sum, o) => sum + orderAmount(o), 0);
    const revenuePrevious = previousActive.reduce(
      (sum, o) => sum + orderAmount(o),
      0,
    );

    const seriesMap = new Map<string, DashboardRevenuePoint>();
    for (const order of currentActive) {
      const day = orderDay(order);
      const point = seriesMap.get(day) ?? { date: day, revenue: 0, orders: 0 };
      point.revenue += orderAmount(order);
      point.orders += 1;
      seriesMap.set(day, point);
    }
    const revenueSeries = Array.from(seriesMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const statusMap = new Map<string, number>();
    for (const order of currentOrders) {
      statusMap.set(order.status, (statusMap.get(order.status) ?? 0) + 1);
    }
    const ordersByStatus = Array.from(statusMap.entries()).map(
      ([status, count]) => ({ status, count }),
    );

    return {
      ...shell,
      storeId: params.storeId,
      period: {
        key: params.period,
        from: new Date(`${params.from}T00:00:00.000Z`).toISOString(),
        to: new Date(`${params.to}T23:59:59.999Z`).toISOString(),
      },
      kpis: {
        ...shell.kpis,
        revenue,
        revenuePrevious,
        orders: currentActive.length,
        ordersPrevious: previousActive.length,
        // Keep live queue counts from the shell (not period-scoped).
        pendingOrders: shell.kpis.pendingOrders,
        processingOrders: shell.kpis.processingOrders,
        // Users aren't date-filterable on the legacy path — avoid fake deltas.
        newCustomers: shell.kpis.newCustomers,
        newCustomersPrevious: shell.kpis.newCustomersPrevious,
      },
      revenueSeries,
      ordersByStatus:
        ordersByStatus.length > 0 ? ordersByStatus : shell.ordersByStatus,
    };
  }

  private async collectOrdersInRange(
    storeId: string,
    from: string,
    to: string,
  ): Promise<Order[]> {
    const matched: Order[] = [];
    let page = 1;
    const limit = 100;

    // Walk newest → oldest; stop once every remaining order is before `from`.
    while (page <= 40) {
      const response = await orderService.getOrders({
        storeId,
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (!response.items.length) break;

      let reachedBeforeRange = false;
      for (const order of response.items) {
        const day = orderDay(order);
        if (day > to) continue;
        if (day < from) {
          reachedBeforeRange = true;
          break;
        }
        matched.push(order);
      }

      if (reachedBeforeRange) break;
      if (page * limit >= response.total) break;
      page += 1;
    }

    return matched;
  }
}

export const dashboardService = new DashboardService();
