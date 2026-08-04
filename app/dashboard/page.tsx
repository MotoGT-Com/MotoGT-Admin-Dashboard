'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { OrdersStatusChart } from '@/components/dashboard/orders-status-chart';
import { AttentionOrders } from '@/components/dashboard/attention-orders';
import { TopProducts } from '@/components/dashboard/top-products';
import { CatalogHealth } from '@/components/dashboard/catalog-health';
import {
  dashboardService,
  type DashboardData,
  type DashboardPeriod,
} from '@/lib/services/dashboard.service';
import { settingsService } from '@/lib/services/settings.service';
import { periodLabel } from '@/lib/dashboard-utils';

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

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('7d');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [data, setData] = useState<DashboardData | null>(null);
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

  const loadDashboard = useCallback(async (sid: string, p: DashboardPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getDashboard({
        storeId: sid,
        period: p,
      });
      setData(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!storeId) return;
    loadDashboard(storeId, period);
  }, [storeId, period, loadDashboard]);

  const label = periodLabel(period);
  const currencyCode = data?.currencyCode ?? 'JOD';
  const kpis = data?.kpis ?? EMPTY_KPIS;
  const displayKpis = applyChannelMock(kpis, channelFilter);
  const showLoading = bootstrapping || (loading && !data);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {storeName
              ? `Ops overview for ${storeName}`
              : 'Store operations overview'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={channelFilter}
            onValueChange={(value) => setChannelFilter(value as ChannelFilter)}
            disabled={bootstrapping || !storeId}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="in_store">In-Store</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as DashboardPeriod)}
            disabled={bootstrapping || !storeId}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            disabled={!storeId || loading}
            onClick={() => storeId && loadDashboard(storeId, period)}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

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
      />
      {channelFilter !== 'all' && (
        <p className="text-xs text-muted-foreground -mt-2">
          Showing a mock breakdown for the{' '}
          {channelFilter === 'in_store'
            ? 'In-Store'
            : channelFilter === 'whatsapp'
              ? 'WhatsApp'
              : 'Online'}{' '}
          channel — channel-level reporting isn&apos;t tracked by the API yet.
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
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AttentionOrders
          orders={data?.attentionOrders ?? []}
          currencyCode={currencyCode}
          loading={showLoading}
        />
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
      </div>

      {data?.newCustomersScope === 'platform' && (
        <p className="text-xs text-muted-foreground">
          New customers counts are platform-wide (users are not store-scoped
          yet). Revenue and orders include guest checkouts.
        </p>
      )}
    </div>
  );
}
