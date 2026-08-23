import { apiClient } from '../api-client';
import { getApiErrorMessage } from '../api-errors';
import { resolveDashboardDateRange } from '../dashboard-utils';
import type { OrderChannel } from '../domain/channels';
import { orderService, type Order } from './order.service';

/** Preset windows for GET /admin/dashboard (plus custom via from/to). */
export type DashboardPeriod =
  | 'today'
  | '7d'
  | '14d'
  | '30d'
  | '90d'
  | '180d'
  | 'custom';

export type DashboardChannelFilter = 'all' | OrderChannel;

/** Periods the production API accepted before extended-range support. */
const LEGACY_PERIODS = new Set<DashboardPeriod>(['7d', '30d', 'today']);

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
  /** Fitment label, e.g. "BMW 3 Series (2019-2024)". */
  car?: string | null;
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
  units?: number;
  revenue: number;
  /** Share of total category sales (0–100) — may be computed client-side. */
  percentage?: number;
}

export interface DashboardLeaderboardItem {
  id: string;
  name: string;
  value: string | number;
  secondaryValue?: string | number;
}

export interface DashboardLeaderboards {
  productsByUnits?: DashboardLeaderboardItem[];
  categoriesByOrderCount?: DashboardLeaderboardItem[];
  subcategoriesByUnits?: DashboardLeaderboardItem[];
  subcategoriesByRevenue?: DashboardLeaderboardItem[];
  locationsByOrderCount?: DashboardLeaderboardItem[];
  carMakesModels?: DashboardLeaderboardItem[];
}

export interface DashboardData {
  storeId: string;
  period: {
    key: DashboardPeriod | string;
    from: string;
    to: string;
  };
  channel?: DashboardChannelFilter | string;
  currencyCode: string;
  lowStockThreshold: number;
  newCustomersScope: 'platform';
  kpis: DashboardKpis;
  revenueSeries: DashboardRevenuePoint[];
  ordersByStatus: DashboardStatusCount[];
  attentionOrders: DashboardAttentionOrder[];
  topProducts: DashboardTopProduct[];
  lowStock: DashboardLowStockItem[];
  categorySales?: DashboardCategorySale[];
  leaderboards?: DashboardLeaderboards;
}

export interface GetDashboardParams {
  storeId: string;
  period?: DashboardPeriod;
  /** Inclusive start date (YYYY-MM-DD). Required when period is `custom`. */
  from?: string;
  /** Inclusive end date (YYYY-MM-DD). Required when period is `custom`. */
  to?: string;
  channel?: DashboardChannelFilter;
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

function normalizeTopProduct(raw: DashboardTopProduct & Record<string, unknown>): DashboardTopProduct {
  const carBrand =
    typeof raw.carBrand === 'string' ? raw.carBrand : undefined;
  const carModel =
    typeof raw.carModel === 'string' ? raw.carModel : undefined;
  const carFromApi =
    typeof raw.car === 'string'
      ? raw.car
      : typeof raw.carInfo === 'string'
        ? raw.carInfo
        : carBrand || carModel
          ? [carBrand, carModel].filter(Boolean).join(' ')
          : null;

  const title =
    (typeof raw.title === 'string' && raw.title) ||
    (typeof raw.productName === 'string' && raw.productName) ||
    raw.name;

  return {
    productId: raw.productId,
    name: title || raw.itemCode || raw.productId,
    itemCode: raw.itemCode || '',
    units: Number(raw.units) || 0,
    revenue: Number(raw.revenue) || 0,
    mainImage: raw.mainImage ?? null,
    car: carFromApi,
  };
}

class DashboardService {
  /**
   * GET /admin/dashboard
   * Store-scoped ops KPIs, charts, and attention lists for the admin home.
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
        channel: params.channel,
      });
    } catch (error) {
      // Legacy production enum is today|7d|30d — retry via order aggregation.
      if (!LEGACY_PERIODS.has(period) && isInvalidInputError(error)) {
        return this.buildFromOrdersFallback({
          storeId: params.storeId,
          period,
          from: range.from,
          to: range.to,
          channel: params.channel,
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
    channel?: DashboardChannelFilter;
  }): Promise<DashboardData> {
    const query: Record<string, string> = {
      storeId: params.storeId,
      period: params.period,
    };

    if (params.channel && params.channel !== 'all') {
      query.channel = params.channel;
    } else if (params.channel === 'all') {
      query.channel = 'all';
    }

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

    return {
      ...data,
      topProducts: (data.topProducts ?? []).map(normalizeTopProduct),
    };
  }

  private async buildFromOrdersFallback(params: {
    storeId: string;
    period: DashboardPeriod;
    from: string;
    to: string;
    channel?: DashboardChannelFilter;
  }): Promise<DashboardData> {
    const shell = await this.fetchFromApi({
      storeId: params.storeId,
      period: '30d',
      from: shiftIsoDate(params.to, -29),
      to: params.to,
      channel: params.channel,
    });

    const spanDays = inclusiveDaySpan(params.from, params.to);
    const previousTo = shiftIsoDate(params.from, -1);
    const previousFrom = shiftIsoDate(previousTo, -(spanDays - 1));

    const [currentOrders, previousOrders] = await Promise.all([
      this.collectOrdersInRange(
        params.storeId,
        params.from,
        params.to,
        params.channel,
      ),
      this.collectOrdersInRange(
        params.storeId,
        previousFrom,
        previousTo,
        params.channel,
      ),
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
        pendingOrders: shell.kpis.pendingOrders,
        processingOrders: shell.kpis.processingOrders,
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
    channel?: DashboardChannelFilter,
  ): Promise<Order[]> {
    const matched: Order[] = [];
    let page = 1;
    const limit = 100;

    while (page <= 40) {
      const response = await orderService.getOrders({
        storeId,
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        channel: channel && channel !== 'all' ? channel : undefined,
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
