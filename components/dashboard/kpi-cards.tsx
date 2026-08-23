'use client';

import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardKpis } from '@/lib/services/dashboard.service';
import {
  formatCompactNumber,
  formatMoney,
  formatPercentDelta,
  percentDelta,
} from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';

/** Soften / hide % deltas when the sample is too small to be meaningful. */
const DELTA_MIN_SAMPLE = 20;

interface KpiCardsProps {
  kpis: DashboardKpis;
  currencyCode: string;
  loading?: boolean;
  /** When true, New Customers is not store-scoped — surface that on the card. */
  newCustomersPlatformScoped?: boolean;
}

function DeltaLine({
  current,
  previous,
  sampleSize,
}: {
  current: number;
  previous: number;
  sampleSize?: { current: number; previous: number };
}) {
  const sampleCurrent = sampleSize?.current ?? current;
  const samplePrevious = sampleSize?.previous ?? previous;

  if (sampleCurrent < DELTA_MIN_SAMPLE && samplePrevious < DELTA_MIN_SAMPLE) {
    return (
      <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
        Too few data points for a reliable trend
      </p>
    );
  }

  const delta = percentDelta(current, previous);
  const label = formatPercentDelta(delta);
  if (!label || delta === null) {
    return null;
  }
  const positive = delta >= 0;
  return (
    <p
      className={cn(
        'text-xs flex items-center gap-1 leading-snug',
        positive
          ? 'text-green-600/80 dark:text-green-500/80'
          : 'text-red-600/80 dark:text-red-500/80',
      )}
    >
      {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {label}
    </p>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  href,
  delta,
  loading,
  hint,
  badge,
}: {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  delta?: {
    current: number;
    previous: number;
    sampleSize?: { current: number; previous: number };
  };
  loading?: boolean;
  hint?: string;
  badge?: ReactNode;
}) {
  const content = (
    <Card
      className={cn(
        'h-full shadow-none flex flex-col',
        href && 'hover:border-primary/60 transition-colors',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 gap-2">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <CardTitle className="text-sm font-medium leading-none">
            {title}
          </CardTitle>
          {badge}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3 pt-0">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold tabular-nums tracking-tight leading-none truncate">
            {value}
          </div>
        )}
        <div className="min-h-[2.25rem] flex items-end">
          {loading ? null : hint ? (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
              {hint}
            </p>
          ) : delta ? (
            <DeltaLine
              current={delta.current}
              previous={delta.previous}
              sampleSize={delta.sampleSize}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full min-h-0">
        {content}
      </Link>
    );
  }
  return content;
}

export function KpiCards({
  kpis,
  currencyCode,
  loading,
  newCustomersPlatformScoped,
}: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-stretch">
      <KpiCard
        title="Total Sales"
        value={formatMoney(kpis.revenue, currencyCode)}
        icon={DollarSign}
        delta={{
          current: kpis.revenue,
          previous: kpis.revenuePrevious,
          sampleSize: {
            current: kpis.orders,
            previous: kpis.ordersPrevious,
          },
        }}
        loading={loading}
      />
      <KpiCard
        title="Total Orders"
        value={formatCompactNumber(kpis.orders)}
        icon={ShoppingCart}
        href="/dashboard/orders"
        delta={{ current: kpis.orders, previous: kpis.ordersPrevious }}
        loading={loading}
      />
      <KpiCard
        title="Pending"
        value={formatCompactNumber(kpis.pendingOrders)}
        icon={Package}
        href="/dashboard/orders"
        loading={loading}
        hint="Open queue · not limited to this period"
      />
      <KpiCard
        title="Processing"
        value={formatCompactNumber(kpis.processingOrders)}
        icon={Clock}
        href="/dashboard/orders"
        loading={loading}
        hint="Open queue · not limited to this period"
      />
      <KpiCard
        title="New Customers"
        value={formatCompactNumber(kpis.newCustomers)}
        icon={Users}
        delta={{
          current: kpis.newCustomers,
          previous: kpis.newCustomersPrevious,
        }}
        loading={loading}
        badge={
          newCustomersPlatformScoped ? (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[10px] px-1.5 py-0 h-5 leading-none"
            >
              Platform-wide
            </Badge>
          ) : undefined
        }
      />
    </div>
  );
}
