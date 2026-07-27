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
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardLowStockItem } from '@/lib/services/dashboard.service';
import { formatCompactNumber } from '@/lib/dashboard-utils';

interface CatalogHealthProps {
  lowStockProducts: number;
  outOfStockProducts: number;
  lowStock: DashboardLowStockItem[];
  threshold: number;
  loading?: boolean;
}

export function CatalogHealth({
  lowStockProducts,
  outOfStockProducts,
  lowStock,
  threshold,
  loading,
}: CatalogHealthProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Catalog health</CardTitle>
        <CardDescription>
          Low stock ≤ {threshold} units · active products
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
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
                No low-stock SKUs
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
                      <span className="text-sm font-semibold text-amber-700 tabular-nums shrink-0">
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
