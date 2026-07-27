'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
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
import type { DashboardRevenuePoint } from '@/lib/services/dashboard.service';
import { formatMoney } from '@/lib/dashboard-utils';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: '#CF172F',
  },
} satisfies ChartConfig;

interface RevenueChartProps {
  series: DashboardRevenuePoint[];
  currencyCode: string;
  periodLabel: string;
  loading?: boolean;
}

export function RevenueChart({
  series,
  currencyCode,
  periodLabel,
  loading,
}: RevenueChartProps) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Revenue over time</CardTitle>
        <CardDescription>{periodLabel} · non-cancelled orders</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : series.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No orders in this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={series} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) => {
                  const d = new Date(value + 'T00:00:00Z');
                  return d.toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={64}
                tickFormatter={(v: number) =>
                  formatMoney(v, currencyCode).replace(/\.00$/, '')
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      formatMoney(Number(value), currencyCode)
                    }
                  />
                }
              />
              <Area
                dataKey="revenue"
                type="monotone"
                fill="var(--color-revenue)"
                fillOpacity={0.2}
                stroke="var(--color-revenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
