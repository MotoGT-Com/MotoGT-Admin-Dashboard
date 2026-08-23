'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  type DashboardData,
  type DashboardPeriod,
  type DashboardChannelFilter,
} from '@/lib/services/dashboard.service';
import { orderService, type Order } from '@/lib/services/order.service';
import { settingsService } from '@/lib/services/settings.service';
import {
  enrichProductsByUnitsLeaderboard,
  enrichTopProducts,
  getCachedProductCatalogMeta,
  loadProductCatalogMeta,
  type ProductCatalogMeta,
} from '@/lib/dashboard/enrich-top-products';
import {
  applyEnglishCategoryNames,
  applyEnglishCategorySalesNames,
  getCachedCategoryEnglishNames,
  loadCategoryEnglishNames,
  looksArabic,
  resolveRemainingArabicCategoryNames,
} from '@/lib/dashboard/enrich-category-names';
import { periodLabel, resolveDashboardDateRange } from '@/lib/dashboard-utils';

const RECENT_ORDERS_LIMIT = 5;

const PRESET_PERIODS: Exclude<DashboardPeriod, 'custom' | 'today'>[] = [
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

type ChannelFilter = DashboardChannelFilter;

const CHANNEL_TABS: { value: ChannelFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in_store', label: 'In-Store' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'online', label: 'Online' },
];

function withCategoryPercentages(
  rows: NonNullable<DashboardData['categorySales']>,
): NonNullable<DashboardData['categorySales']> {
  const total = rows.reduce((sum, row) => sum + (row.revenue || 0), 0);
  return rows.map((row) => ({
    ...row,
    percentage:
      row.percentage ??
      (total > 0 ? ((row.revenue || 0) / total) * 100 : 0),
  }));
}

function collectEnrichmentProductIds(result: DashboardData): string[] {
  return [
    ...(result.topProducts ?? []).map((p) => p.productId),
    ...(result.leaderboards?.productsByUnits?.map((p) => p.id) ?? []),
  ];
}

/** Apply catalog + English category labels when maps are already available. */
async function applyDashboardEnrichment(
  result: DashboardData,
  languageId: string,
  catalog: Map<string, ProductCatalogMeta>,
  categoryNames: Map<string, string> | null,
): Promise<Pick<DashboardData, 'topProducts' | 'leaderboards' | 'categorySales'>> {
  let topProducts = result.topProducts ?? [];
  let leaderboards = result.leaderboards;
  let categorySales = result.categorySales;

  if (catalog.size > 0) {
    topProducts = await enrichTopProducts(topProducts, languageId, catalog);
    const productsByUnits = await enrichProductsByUnitsLeaderboard(
      leaderboards?.productsByUnits,
      languageId,
      catalog,
    );
    leaderboards = leaderboards
      ? { ...leaderboards, productsByUnits }
      : productsByUnits
        ? { productsByUnits }
        : leaderboards;
  }

  if (categoryNames && categoryNames.size > 0) {
    leaderboards = applyEnglishCategoryNames(leaderboards, categoryNames);
    if (categorySales?.length) {
      categorySales = applyEnglishCategorySalesNames(
        categorySales,
        categoryNames,
      );
    }
  }

  return { topProducts, leaderboards, categorySales };
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

  const dashboardRequestIdRef = useRef(0);
  const recentOrdersRequestIdRef = useRef(0);

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

  const loadRecentOrders = useCallback(
    async (sid: string, channel: ChannelFilter) => {
      const requestId = ++recentOrdersRequestIdRef.current;
      setRecentOrdersLoading(true);
      try {
        const response = await orderService.getOrders({
          storeId: sid,
          page: 1,
          limit: RECENT_ORDERS_LIMIT,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          channel: channel === 'all' ? undefined : channel,
        });
        if (requestId !== recentOrdersRequestIdRef.current) return;
        setRecentOrders(response.items ?? []);
      } catch {
        // Keep previous recent orders on failure.
      } finally {
        if (requestId === recentOrdersRequestIdRef.current) {
          setRecentOrdersLoading(false);
        }
      }
    },
    [],
  );

  const loadDashboard = useCallback(
    async (
      sid: string,
      p: DashboardPeriod,
      channel: ChannelFilter,
      range?: { from?: string; to?: string },
    ) => {
      if (p === 'custom' && (!range?.from || !range?.to)) {
        return;
      }
      const resolved = resolveDashboardDateRange(p, range);
      const requestId = ++dashboardRequestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const [result] = await Promise.all([
          dashboardService.getDashboard({
            storeId: sid,
            period: p,
            from: resolved.from,
            to: resolved.to,
            channel,
          }),
          loadRecentOrders(sid, channel),
        ]);
        if (requestId !== dashboardRequestIdRef.current) return;

        // Paint core KPIs/charts immediately; apply any session-cached enrichment first.
        let topProducts = result.topProducts ?? [];
        let leaderboards = result.leaderboards;
        let categorySales = result.categorySales;
        let languageId: string | null = null;
        let englishLanguageId: string | null = null;
        const productIds = collectEnrichmentProductIds(result);

        try {
          const languages = await settingsService.getLanguages();
          if (requestId !== dashboardRequestIdRef.current) return;
          const language =
            settingsService.getSelectedLanguage() ?? languages[0] ?? null;
          languageId = language?.id ?? null;
          if (languageId) {
            const englishLanguage =
              languages.find((l) => {
                const code = (l.code || '').toLowerCase();
                return code === 'en' || code.startsWith('en-');
              }) ?? language;
            englishLanguageId = englishLanguage?.id ?? languageId;
            const cached = await applyDashboardEnrichment(
              result,
              languageId,
              getCachedProductCatalogMeta(productIds),
              getCachedCategoryEnglishNames(sid, englishLanguageId),
            );
            topProducts = cached.topProducts;
            leaderboards = cached.leaderboards;
            categorySales = cached.categorySales;
          }
        } catch {
          // Cache apply is best-effort.
        }

        if (requestId !== dashboardRequestIdRef.current) return;
        setData({ ...result, topProducts, leaderboards, categorySales });
        setLoading(false);

        // Enrich titles/cars + English category names without blocking the soft refresh.
        if (!languageId || !englishLanguageId) return;

        const uniqueProductIds = [
          ...new Set(productIds.filter(Boolean)),
        ];
        const alreadyCachedCatalog = getCachedProductCatalogMeta(uniqueProductIds);
        const alreadyCachedCategories = getCachedCategoryEnglishNames(
          sid,
          englishLanguageId,
        );

        const leaderboardStillArabic = [
          ...(leaderboards?.categoriesByOrderCount ?? []),
          ...(leaderboards?.subcategoriesByUnits ?? []),
          ...(leaderboards?.subcategoriesByRevenue ?? []),
        ].some((item) => looksArabic(item.name));
        const salesStillArabic = (categorySales ?? []).some((row) =>
          looksArabic(row.name),
        );

        const catalogComplete =
          uniqueProductIds.length === alreadyCachedCatalog.size;
        const categoriesComplete =
          !!alreadyCachedCategories &&
          alreadyCachedCategories.size > 0 &&
          !leaderboardStillArabic &&
          !salesStillArabic;

        if (catalogComplete && categoriesComplete) {
          return;
        }

        try {
          const [catalog, categoryNames] = await Promise.all([
            loadProductCatalogMeta(productIds, languageId),
            loadCategoryEnglishNames(sid, englishLanguageId),
          ]);
          if (requestId !== dashboardRequestIdRef.current) return;

          let enriched = await applyDashboardEnrichment(
            result,
            languageId,
            catalog,
            categoryNames,
          );

          // Per-id English lookup for any rows still Arabic after the list map.
          const resolved = await resolveRemainingArabicCategoryNames(
            enriched.leaderboards,
            enriched.categorySales,
            sid,
            englishLanguageId,
            categoryNames,
          );
          if (requestId !== dashboardRequestIdRef.current) return;

          enriched = {
            ...enriched,
            leaderboards: resolved.leaderboards,
            categorySales: resolved.categorySales,
          };

          setData({ ...result, ...enriched });
        } catch {
          // Keep dashboard payload if catalog enrichment fails.
        }
      } catch (err) {
        if (requestId !== dashboardRequestIdRef.current) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(message);
        toast.error(message);
      } finally {
        if (requestId === dashboardRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [loadRecentOrders],
  );

  useEffect(() => {
    if (!storeId) return;
    if (period === 'custom') {
      if (customFrom && customTo) {
        loadDashboard(storeId, period, channelFilter, {
          from: customFrom,
          to: customTo,
        });
      }
      return;
    }
    loadDashboard(storeId, period, channelFilter);
  }, [
    storeId,
    period,
    customFrom,
    customTo,
    channelFilter,
    loadDashboard,
  ]);

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
    if (
      PRESET_PERIODS.includes(
        value as Exclude<DashboardPeriod, 'custom' | 'today'>,
      )
    ) {
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
  const displayKpis = kpis;
  // Full skeletons only on first load; filter changes keep prior content visible.
  const showLoading = bootstrapping || (loading && !data);
  const isRefreshing = loading && !!data;
  const showRecentOrdersLoading =
    showLoading || (recentOrdersLoading && recentOrders.length === 0);
  const categorySales = withCategoryPercentages(data?.categorySales ?? []);
  // Split API categorySales into two visual groups when names hint at bikes;
  // otherwise show all in the primary card.
  const motorcycleCategorySales = categorySales.filter((row) =>
    /motor|helmet|riding|bike/i.test(row.name),
  );
  const carCategorySales =
    motorcycleCategorySales.length > 0
      ? categorySales.filter(
          (row) => !/motor|helmet|riding|bike/i.test(row.name),
        )
      : categorySales;

  return (
    <div className="flex-1 space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {storeName
                ? `Sales across In-Store, WhatsApp, and Online — ${storeName}`
                : 'Sales across In-Store, WhatsApp, and Online'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Select
              value={period}
              onValueChange={handlePeriodChange}
              disabled={bootstrapping || !storeId}
            >
              <SelectTrigger className="h-9 w-full max-w-full sm:w-fit sm:max-w-[min(100%,20rem)] *:data-[slot=select-value]:line-clamp-none">
                {/* Controlled label avoids blank Radix SelectValue when value is custom. */}
                <SelectValue placeholder="Period">{label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 2 weeks</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="180d">Last 6 months</SelectItem>
                <SelectItem value="custom">
                  {period === 'custom' && customFrom && customTo
                    ? label
                    : 'Custom dates'}
                </SelectItem>
              </SelectContent>
            </Select>
            {period === 'custom' && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
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
              className="h-9 w-9 shrink-0"
              disabled={!storeId || loading}
              onClick={() =>
                storeId &&
                loadDashboard(
                  storeId,
                  period,
                  channelFilter,
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
              'h-auto w-full sm:w-auto flex-wrap justify-start',
              (bootstrapping || !storeId) && 'pointer-events-none opacity-60',
            )}
          >
            {CHANNEL_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 sm:flex-none"
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

      {isRefreshing && (
        <div
          className="h-0.5 w-full overflow-hidden rounded-full bg-muted"
          aria-hidden
        >
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary/70" />
        </div>
      )}

      <div
        className={cn(
          'space-y-6 transition-opacity duration-200',
          isRefreshing && 'opacity-60',
        )}
      >
        <KpiCards
          kpis={displayKpis}
          currencyCode={currencyCode}
          loading={showLoading}
          newCustomersPlatformScoped={data?.newCustomersScope === 'platform'}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <AttentionOrders
            orders={data?.attentionOrders ?? []}
            openCount={
              displayKpis.pendingOrders + displayKpis.processingOrders
            }
            currencyCode={currencyCode}
            loading={showLoading}
          />
          <RecentOrders
            orders={recentOrders}
            currencyCode={currencyCode}
            loading={showRecentOrdersLoading}
          />
        </div>

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
            title="Top categories"
            description="Category sales for the selected period and channel"
            totalLabel="Total category sales"
            categories={carCategorySales}
            currencyCode={currencyCode}
            loading={showLoading}
            skeletonRows={5}
          />
          <CategorySalesBreakdown
            title="Top Motorcycle & riding"
            description="Categories matched as motorcycle / riding gear"
            totalLabel="Total motorcycle category sales"
            categories={motorcycleCategorySales}
            currencyCode={currencyCode}
            loading={showLoading}
            skeletonRows={4}
          />
        </div>

        <TopProducts
          products={data?.topProducts ?? []}
          periodLabel={label}
          loading={showLoading}
        />

        <SalesLeaderboards
          leaderboards={data?.leaderboards}
          currencyCode={currencyCode}
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
    </div>
  );
}
