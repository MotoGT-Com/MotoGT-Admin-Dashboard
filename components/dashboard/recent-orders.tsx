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
import type { Order } from '@/lib/services/order.service';
import {
  formatMoney,
  formatRelativeTime,
  formatStatusLabel,
} from '@/lib/dashboard-utils';

interface RecentOrdersProps {
  orders: Order[];
  currencyCode: string;
  loading?: boolean;
}

function customerName(order: Order): string {
  const first = order.customer?.firstName?.trim() ?? '';
  const last = order.customer?.lastName?.trim() ?? '';
  const name = `${first} ${last}`.trim();
  if (name) return name;
  return order.customer?.email || order.customer?.phone || 'Customer';
}

function orderAmount(order: Order): number {
  const raw = order.totalAmount;
  return typeof raw === 'number' ? raw : Number(raw) || 0;
}

export function RecentOrders({
  orders,
  currencyCode,
  loading,
}: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Latest orders across all statuses</CardDescription>
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
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No orders yet
          </p>
        ) : (
          <ul className="divide-y">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/dashboard/orders/${order.id}`}
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
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {customerName(order)} ·{' '}
                      {formatRelativeTime(order.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-medium shrink-0 tabular-nums">
                    {formatMoney(
                      orderAmount(order),
                      order.currency || currencyCode,
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
