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

interface AttentionOrdersProps {
  orders: DashboardAttentionOrder[];
  currencyCode: string;
  loading?: boolean;
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
          <CardDescription>Open pending &amp; processing orders</CardDescription>
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
              return (
                <li key={order.id}>
                  <Link
                    href={href}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {order.orderNumber}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {formatStatusLabel(order.status)}
                        </Badge>
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
