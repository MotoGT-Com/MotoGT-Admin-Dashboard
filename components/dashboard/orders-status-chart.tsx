'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { DashboardStatusCount } from '@/lib/services/dashboard.service';
import { formatStatusLabel } from '@/lib/dashboard-utils';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_COLORS: Record<string, string> = {
  pending: '#EAB308',
  confirmed: '#3B82F6',
  processing: '#2563EB',
  shipped: '#8B5CF6',
  delivered: '#059669',
  cancelled: '#EF4444',
  refunded: '#F97316',
};

const STATUS_ORDER = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const chartConfig = {
  count: {
    label: 'Orders',
    color: '#CF172F',
  },
} satisfies ChartConfig;

interface OrdersStatusChartProps {
  data: DashboardStatusCount[];
  periodLabel: string;
  loading?: boolean;
  /**
   * Live open-queue counts. Injected into the chart when the period payload
   * omits a nonzero open status (common when queue orders are older than the
   * selected window).
   */
  openQueue?: {
    pending: number;
    processing: number;
  };
}

export function OrdersStatusChart({
  data,
  periodLabel,
  loading,
  openQueue,
}: OrdersStatusChartProps) {
  const { chartData, injectedOpenStatuses } = useMemo(() => {
    const byStatus = new Map<string, number>();
    for (const row of data) {
      byStatus.set(row.status, row.count);
    }

    const injected: string[] = [];
    if (openQueue) {
      if (
        openQueue.processing > 0 &&
        (byStatus.get('processing') ?? 0) === 0
      ) {
        byStatus.set('processing', openQueue.processing);
        injected.push('processing');
      }
      if (openQueue.pending > 0 && (byStatus.get('pending') ?? 0) === 0) {
        byStatus.set('pending', openQueue.pending);
        injected.push('pending');
      }
    }

    const rows = Array.from(byStatus.entries())
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => {
        const ai = STATUS_ORDER.indexOf(a);
        const bi = STATUS_ORDER.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
      .map(([status, count]) => ({
        status: formatStatusLabel(status),
        statusKey: status,
        count,
        fill: STATUS_COLORS[status] || '#64748B',
      }));

    return { chartData: rows, injectedOpenStatuses: injected };
  }, [data, openQueue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by status</CardTitle>
        <CardDescription>
          {periodLabel}
          {injectedOpenStatuses.length > 0
            ? ` · ${injectedOpenStatuses
                .map(formatStatusLabel)
                .join(' & ')} include open queue (may predate this period)`
            : ' · orders created in this period'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No orders in this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={chartData} margin={{ left: 4, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="status"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={56}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.statusKey} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
