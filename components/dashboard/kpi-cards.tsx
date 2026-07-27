'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  DollarSign,
  Loader2,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardKpis } from '@/lib/services/dashboard.service';
import {
  formatCompactNumber,
  formatMoney,
  formatPercentDelta,
  percentDelta,
} from '@/lib/dashboard-utils';

interface KpiCardsProps {
  kpis: DashboardKpis;
  currencyCode: string;
  loading?: boolean;
}

function DeltaLine({ current, previous }: { current: number; previous: number }) {
  const delta = percentDelta(current, previous);
  const label = formatPercentDelta(delta);
  if (!label || delta === null) {
    return <div className="h-5 mt-1" />;
  }
  const positive = delta >= 0;
  return (
    <p
      className={`text-xs flex items-center gap-1 mt-1 ${
        positive ? 'text-green-600' : 'text-red-600'
      }`}
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
}: {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  delta?: { current: number; previous: number };
  loading?: boolean;
}) {
  const content = (
    <Card
      className={`min-h-[140px] ${
        href ? 'cursor-pointer hover:border-primary transition-colors' : ''
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-1">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {delta ? (
              <DeltaLine current={delta.current} previous={delta.previous} />
            ) : (
              <div className="h-5 mt-1" />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export function KpiCards({ kpis, currencyCode, loading }: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        title="Revenue"
        value={formatMoney(kpis.revenue, currencyCode)}
        icon={DollarSign}
        delta={{ current: kpis.revenue, previous: kpis.revenuePrevious }}
        loading={loading}
      />
      <KpiCard
        title="Orders"
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
      />
      <KpiCard
        title="Processing"
        value={formatCompactNumber(kpis.processingOrders)}
        icon={Clock}
        href="/dashboard/orders"
        loading={loading}
      />
      <KpiCard
        title="New customers"
        value={formatCompactNumber(kpis.newCustomers)}
        icon={Users}
        delta={{
          current: kpis.newCustomers,
          previous: kpis.newCustomersPrevious,
        }}
        loading={loading}
      />
    </div>
  );
}
