'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
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
  currencyCode: string;
  loading?: boolean;
}

const STALE_DAYS = 14;
const WARNING_DAYS = 7;

function orderAgeDays(iso: string): number {
  const diffMs = Date.now() - new Date(iso).getTime();
  return Math.floor(diffMs / 86400000);
}

function urgencyStyles(ageDays: number): {
  row: string;
  badge?: string;
  label?: string;
} {
  if (ageDays >= STALE_DAYS) {
    return {
      row: 'border-l-2 border-l-red-500 bg-red-500/[0.04]',
      badge: 'border-red-500/40 text-red-700 dark:text-red-400',
      label: 'Stale',
    };
  }
  if (ageDays >= WARNING_DAYS) {
    return {
      row: 'border-l-2 border-l-amber-500 bg-amber-500/[0.04]',
      badge: 'border-amber-500/40 text-amber-800 dark:text-amber-300',
      label: 'Aging',
    };
  }
  return { row: 'border-l-2 border-l-transparent' };
}

export function AttentionOrders({
  orders,
  currencyCode,
  loading,
}: AttentionOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Needs attention</CardTitle>
          <CardDescription>
            Open pending &amp; processing orders · highlighted after {WARNING_DAYS}
            + / {STALE_DAYS}+ days
          </CardDescription>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No pending or processing orders
          </p>
        ) : (
          <ul className="divide-y">
            {orders.map((order) => {
              const href = order.isGuest
                ? `/dashboard/orders/${order.id}?guest=true`
                : `/dashboard/orders/${order.id}`;
              const ageDays = orderAgeDays(order.createdAt);
              const urgency = urgencyStyles(ageDays);
              return (
                <li key={order.id}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center justify-between gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors',
                      urgency.row,
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {order.orderNumber}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {formatStatusLabel(order.status)}
                        </Badge>
                        {urgency.label ? (
                          <Badge
                            variant="outline"
                            className={cn('text-xs', urgency.badge)}
                          >
                            {urgency.label}
                          </Badge>
                        ) : null}
                        {order.isGuest && (
                          <Badge variant="secondary" className="text-xs">
                            Guest
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {order.customerName} ·{' '}
                        {formatRelativeTime(order.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-medium shrink-0">
                      {formatMoney(order.totalAmount, currencyCode)}
                    </span>
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
