'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarRange, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { OrdersStatusChart } from '@/components/dashboard/orders-status-chart';
import { AttentionOrders } from '@/components/dashboard/attention-orders';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { TopProducts } from '@/components/dashboard/top-products';
import { CatalogHealth } from '@/components/dashboard/catalog-health';
import { CategorySalesBreakdown } from '@/components/dashboard/category-sales-breakdown';
import { SalesLeaderboards } from '@/components/dashboard/sales-leaderboards';
import {
  dashboardService,
  type DashboardCategorySale,
  type DashboardData,
  type DashboardPeriod,
} from '@/lib/services/dashboard.service';
import { orderService, type Order } from '@/lib/services/order.service';
import { settingsService } from '@/lib/services/settings.service';
import { periodLabel, resolveDashboardDateRange } from '@/lib/dashboard-utils';

const RECENT_ORDERS_LIMIT = 8;

const PRESET_PERIODS: Exclude<DashboardPeriod, 'custom'>[] = [
  '7d',
  '14d',
  '30d',
  '90d',
  '180d',
];

function todayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function daysAgoIsoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const EMPTY_KPIS: DashboardData['kpis'] = {
  revenue: 0,
  revenuePrevious: 0,
  orders: 0,
  ordersPrevious: 0,
  pendingOrders: 0,
  processingOrders: 0,
  newCustomers: 0,
  newCustomersPrevious: 0,
  lowStockProducts: 0,
  outOfStockProducts: 0,
};

// Channel breakdown isn't tracked by the real API yet — this mock multiplier
// fakes a plausible split so the filter visibly does something. Remove once
// order records carry a real channel field.
type ChannelFilter = 'all' | 'online' | 'whatsapp' | 'in_store';

const channelMockMultipliers: Record<ChannelFilter, number> = {
  all: 1,
  online: 0.55,
  whatsapp: 0.18,
  in_store: 0.27,
};

const CHANNEL_TABS: { value: ChannelFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in_store', label: 'In-Store' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'online', label: 'Online' },
];

function applyChannelMock(
  kpis: DashboardData['kpis'],
  channel: ChannelFilter
): DashboardData['kpis'] {
  const factor = channelMockMultipliers[channel];
  if (factor === 1) return kpis;
  return {
    ...kpis,
    revenue: kpis.revenue * factor,
    revenuePrevious: kpis.revenuePrevious * factor,
    orders: Math.round(kpis.orders * factor),
    ordersPrevious: Math.round(kpis.ordersPrevious * factor),
    pendingOrders: Math.round(kpis.pendingOrders * factor),
    processingOrders: Math.round(kpis.processingOrders * factor),
    newCustomers: Math.round(kpis.newCustomers * factor),
    newCustomersPrevious: Math.round(kpis.newCustomersPrevious * factor),
  };
}

/**
 * Category sales aren't on the dashboard API yet.
 * Cars get ~70% of total sales (top 5); motorcycle equipment ~30%.
 */
const MOCK_CAR_CATEGORY_SHARES: { name: string; share: number }[] = [
  { name: 'Exterior', share: 0.28 },
  { name: 'Interior', share: 0.24 },
  { name: 'Performance', share: 0.2 },
  { name: 'Maintenance', share: 0.16 },
  { name: 'Electronics', share: 0.12 },
];

const MOCK_MOTORCYCLE_CATEGORY_SHARES: { name: string; share: number }[] = [
  { name: 'Riding Gear', share: 0.34 },
  { name: 'Helmets', share: 0.28 },
  { name: 'Parts & Accessories', share: 0.22 },
  { name: 'Maintenance', share: 0.16 },
];

function buildMockCategorySales(
  segmentRevenue: number,
  shares: { name: string; share: number }[]
): DashboardCategorySale[] {
  if (segmentRevenue <= 0) return [];
  return shares.map(({ name, share }) => ({
    name,
    revenue: segmentRevenue * share,
    percentage: share * 100,
  }));
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const stores = await settingsService.getStores();
        if (cancelled) return;

        const saved = settingsService.getSelectedStore();
        const selected =
          stores.find((s) => s.id === saved?.id) ?? stores[0] ?? null;

        if (!selected) {
          setError('No store configured. Add a store in Settings.');
          setBootstrapping(false);
          setLoading(false);
          return;
        }

        settingsService.setSelectedStore(selected.id);
        setStoreId(selected.id);
        setStoreName(selected.name);
        setBootstrapping(false);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load stores';
        setError(message);
        setBootstrapping(false);
        setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadRecentOrders = useCallback(async (sid: string) => {
    setRecentOrdersLoading(true);
    try {
      const response = await orderService.getOrders({
        storeId: sid,
        page: 1,
        limit: RECENT_ORDERS_LIMIT,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setRecentOrders(response.items ?? []);
    } catch {
      // Keep prior list if refresh fails; dashboard KPIs still load independently.
      setRecentOrders((prev) => prev);
    } finally {
      setRecentOrdersLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(
    async (
      sid: string,
      p: DashboardPeriod,
      range?: { from?: string; to?: string },
    ) => {
      if (p === 'custom' && (!range?.from || !range?.to)) {
        return;
      }
      const resolved = resolveDashboardDateRange(p, range);
      setLoading(true);
      setError(null);
      try {
        const [result] = await Promise.all([
          dashboardService.getDashboard({
            storeId: sid,
            period: p,
            from: resolved.from,
            to: resolved.to,
          }),
          loadRecentOrders(sid),
        ]);
        setData(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [loadRecentOrders],
  );

  useEffect(() => {
    if (!storeId) return;
    if (period === 'custom') {
      if (customFrom && customTo) {
        loadDashboard(storeId, period, { from: customFrom, to: customTo });
      }
      return;
    }
    loadDashboard(storeId, period);
  }, [storeId, period, customFrom, customTo, loadDashboard]);

  const openCustomDialog = (prefill = true) => {
    if (prefill) {
      setDraftFrom(customFrom || daysAgoIsoDate(29));
      setDraftTo(customTo || todayIsoDate());
    }
    setCustomDialogOpen(true);
  };

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      openCustomDialog(true);
      return;
    }
    if (PRESET_PERIODS.includes(value as Exclude<DashboardPeriod, 'custom'>)) {
      setPeriod(value as DashboardPeriod);
    }
  };

  const applyCustomRange = () => {
    if (!draftFrom || !draftTo) {
      toast.error('Choose both a start and end date.');
      return;
    }
    if (draftFrom > draftTo) {
      toast.error('Start date must be on or before the end date.');
      return;
    }
    setCustomFrom(draftFrom);
    setCustomTo(draftTo);
    setPeriod('custom');
    setCustomDialogOpen(false);
  };

  const label = periodLabel(period, { from: customFrom, to: customTo });
  const currencyCode = data?.currencyCode ?? 'JOD';
  const kpis = data?.kpis ?? EMPTY_KPIS;
  const displayKpis = applyChannelMock(kpis, channelFilter);
  const showLoading = bootstrapping || (loading && !data);
  // Placeholder split until the API returns real category aggregates.
  const carSalesTotal = displayKpis.revenue * 0.7;
  const motorcycleSalesTotal = displayKpis.revenue * 0.3;
  const carCategorySales = buildMockCategorySales(
    carSalesTotal,
    MOCK_CAR_CATEGORY_SHARES
  );
  const motorcycleCategorySales = buildMockCategorySales(
    motorcycleSalesTotal,
    MOCK_MOTORCYCLE_CATEGORY_SHARES
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {storeName
                ? `Sales across In-Store, WhatsApp, and Online — ${storeName}`
                : 'Sales across In-Store, WhatsApp, and Online'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Select
              value={period}
              onValueChange={handlePeriodChange}
              disabled={bootstrapping || !storeId}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Period">
                  {period === 'custom' ? label : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 2 weeks</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="180d">Last 6 months</SelectItem>
                <SelectItem value="custom">Custom dates</SelectItem>
              </SelectContent>
            </Select>
            {period === 'custom' && (
              <Button
                variant="outline"
                size="icon"
                disabled={bootstrapping || !storeId}
                onClick={() => openCustomDialog(true)}
                aria-label="Edit custom date range"
                title="Edit custom date range"
              >
                <CalendarRange className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              disabled={!storeId || loading}
              onClick={() =>
                storeId &&
                loadDashboard(
                  storeId,
                  period,
                  period === 'custom'
                    ? { from: customFrom, to: customTo }
                    : undefined,
                )
              }
              aria-label="Refresh dashboard"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>

        <Tabs
          value={channelFilter}
          onValueChange={(value) => setChannelFilter(value as ChannelFilter)}
          className="w-full"
        >
          <TabsList
            aria-label="Sales channel"
            className={cn(
              'h-auto w-full sm:w-auto flex-wrap justify-start gap-1 p-1',
              'bg-muted/80',
              (bootstrapping || !storeId) && 'pointer-events-none opacity-60',
            )}
          >
            {CHANNEL_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'flex-1 sm:flex-none px-3.5 py-1.5 text-sm font-medium',
                  'data-[state=active]:bg-background data-[state=active]:text-foreground',
                  'data-[state=active]:shadow-sm',
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom date range</DialogTitle>
            <DialogDescription>
              Choose the inclusive start and end dates for the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dashboard-from">From</Label>
              <Input
                id="dashboard-from"
                type="date"
                value={draftFrom}
                max={draftTo || todayIsoDate()}
                onChange={(e) => setDraftFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dashboard-to">To</Label>
              <Input
                id="dashboard-to"
                type="date"
                value={draftTo}
                min={draftFrom || undefined}
                max={todayIsoDate()}
                onChange={(e) => setDraftTo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={applyCustomRange}>Apply range</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && !data && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <p className="font-medium">Could not load dashboard</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}

      <KpiCards
        kpis={displayKpis}
        currencyCode={currencyCode}
        loading={showLoading}
        newCustomersPlatformScoped={data?.newCustomersScope === 'platform'}
      />
      {channelFilter !== 'all' && (
        <p className="text-xs text-muted-foreground -mt-2">
          <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300 mr-1.5">
            Preview data
          </span>
          Channel filter uses a mock split — channel-level reporting isn&apos;t
          tracked by the API yet.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <RevenueChart
          series={data?.revenueSeries ?? []}
          currencyCode={currencyCode}
          periodLabel={label}
          loading={showLoading}
        />
        <OrdersStatusChart
          data={data?.ordersByStatus ?? []}
          periodLabel={label}
          loading={showLoading}
          openQueue={{
            pending: displayKpis.pendingOrders,
            processing: displayKpis.processingOrders,
          }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategorySalesBreakdown
          title="Cars — Top 5 Categories"
          description="Top selling car product categories"
          totalLabel="Total Car Category Sales"
          categories={carCategorySales}
          currencyCode={currencyCode}
          loading={showLoading}
          skeletonRows={5}
          preview
        />
        <CategorySalesBreakdown
          title="Motorcycle Equipment"
          description="Category sales breakdown for motorcycle equipment"
          totalLabel="Total Motorcycle Category Sales"
          categories={motorcycleCategorySales}
          currencyCode={currencyCode}
          loading={showLoading}
          skeletonRows={4}
          preview
        />
      </div>

      {/* Ops-first: attention + recent orders, then top products */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AttentionOrders
          orders={data?.attentionOrders ?? []}
          currencyCode={currencyCode}
          loading={showLoading}
        />
        <RecentOrders
          orders={recentOrders}
          currencyCode={currencyCode}
          loading={showLoading || recentOrdersLoading}
        />
      </div>

      <TopProducts
        products={data?.topProducts ?? []}
        currencyCode={currencyCode}
        periodLabel={label}
        loading={showLoading}
      />

      <CatalogHealth
        lowStockProducts={kpis.lowStockProducts}
        outOfStockProducts={kpis.outOfStockProducts}
        lowStock={data?.lowStock ?? []}
        threshold={data?.lowStockThreshold ?? 10}
        loading={showLoading}
      />

      <SalesLeaderboards loading={showLoading} />
    </div>
  );
}
