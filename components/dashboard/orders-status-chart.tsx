'use client';

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
}

export function OrdersStatusChart({
  data,
  periodLabel,
  loading,
}: OrdersStatusChartProps) {
  const chartData = data.map((row) => ({
    status: formatStatusLabel(row.status),
    statusKey: row.status,
    count: row.count,
    fill: STATUS_COLORS[row.status] || '#64748B',
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by status</CardTitle>
        <CardDescription>{periodLabel}</CardDescription>
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
