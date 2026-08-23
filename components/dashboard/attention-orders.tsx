'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardAttentionOrder } from '@/lib/services/dashboard.service';
import {
  formatMoney,
  formatRelativeTime,
  formatStatusLabel,
} from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';

interface AttentionOrdersProps {
  orders: DashboardAttentionOrder[];
  /** Total open queue (pending + processing), may exceed listed rows. */
  openCount?: number;
  currencyCode: string;
  loading?: boolean;
}

function statusTone(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'text-amber-700 dark:text-amber-400';
    case 'processing':
      return 'text-sky-700 dark:text-sky-400';
    default:
      return 'text-muted-foreground';
  }
}

export function AttentionOrders({
  orders,
  openCount,
  currencyCode,
  loading,
}: AttentionOrdersProps) {
  const count = openCount ?? orders.length;

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
            Needs attention
            {!loading ? (
              <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md bg-muted text-xs font-semibold tabular-nums text-foreground">
                {count}
              </span>
            ) : null}
          </CardTitle>
          <CardDescription className="text-xs">
            {count === 0
              ? 'No pending or processing orders'
              : `${count} open order${count === 1 ? '' : 's'} waiting on action`}
          </CardDescription>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 pt-0.5"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-0 divide-y divide-border/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3.5">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-3.5 w-16" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nothing waiting right now
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {orders.map((order) => {
              const href = order.isGuest
                ? `/dashboard/orders/${order.id}?guest=true`
                : `/dashboard/orders/${order.id}`;
              return (
                <li key={order.id}>
                  <Link
                    href={href}
                    className="group grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 py-3.5 -mx-1 px-1 rounded-sm hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex items-baseline gap-2">
                      <span className="font-mono text-[13px] font-medium tracking-tight truncate group-hover:underline underline-offset-2">
                        {order.orderNumber}
                      </span>
                      <span
                        className={cn(
                          'text-[11px] font-medium uppercase tracking-wide shrink-0',
                          statusTone(order.status),
                        )}
                      >
                        {formatStatusLabel(order.status)}
                      </span>
                      {order.isGuest ? (
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          Guest
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[13px] font-medium tabular-nums text-right self-center">
                      {formatMoney(order.totalAmount, currencyCode)}
                    </span>
                    <p className="text-xs text-muted-foreground truncate col-span-2 sm:col-span-1">
                      {order.customerName}
                      <span className="text-muted-foreground/50 mx-1.5">·</span>
                      {formatRelativeTime(order.createdAt)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
