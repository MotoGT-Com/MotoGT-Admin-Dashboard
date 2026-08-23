'use client';

import Link from 'next/link';
import { AlertTriangle, PackageX } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardLowStockItem } from '@/lib/services/dashboard.service';
import { formatCompactNumber } from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';

interface CatalogHealthProps {
  lowStockProducts: number;
  outOfStockProducts: number;
  lowStock: DashboardLowStockItem[];
  threshold: number;
  loading?: boolean;
}

/** Absolute count where a fixed ≤N threshold is flagging a systemic issue. */
const URGENT_LOW_STOCK_COUNT = 50;

export function CatalogHealth({
  lowStockProducts,
  outOfStockProducts,
  lowStock,
  threshold,
  loading,
}: CatalogHealthProps) {
  const isUrgent = !loading && lowStockProducts >= URGENT_LOW_STOCK_COUNT;

  return (
    <Card
      className={cn(
        isUrgent &&
          'border-amber-500/50 bg-amber-500/[0.04] shadow-[0_0_0_1px_rgba(245,158,11,0.15)]',
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {isUrgent ? (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              ) : null}
              Catalog health
            </CardTitle>
            <CardDescription>
              Low stock ≤ {threshold} units · active products
              {isUrgent
                ? ' · this threshold is flagging a large share of the catalog'
                : ''}
            </CardDescription>
          </div>
          {isUrgent ? (
            <Badge className="bg-amber-600 text-white hover:bg-amber-600 shrink-0">
              Needs review
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            {isUrgent ? (
              <p className="text-sm text-amber-900 dark:text-amber-200/90 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                {formatCompactNumber(lowStockProducts)} products are at or below{' '}
                {threshold} units. A single fixed threshold can over-flag
                trim-specific parts that never stock deeply — review whether{' '}
                {threshold} is the right bar, or treat this as a real inventory
                risk.
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div
                className={cn(
                  'rounded-lg border p-3',
                  isUrgent && 'border-amber-500/40 bg-background/60',
                )}
              >
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Low stock</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCompactNumber(lowStockProducts)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <PackageX className="h-4 w-4" />
                  <span className="text-xs font-medium">Out of stock</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCompactNumber(outOfStockProducts)}
                </p>
              </div>
            </div>

            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No low-stock SKUs in the sample list
              </p>
            ) : (
              <ul className="divide-y">
                {lowStock.map((item) => (
                  <li key={item.productId}>
                    <Link
                      href={`/dashboard/products/${item.productId}`}
                      className="flex items-center justify-between gap-2 py-2.5 hover:underline"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.itemCode}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 tabular-nums shrink-0">
                        {item.stockQuantity} left
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/dashboard/products"
              className="text-sm text-primary hover:underline inline-block"
            >
              Manage products
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
