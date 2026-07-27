'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardTopProduct } from '@/lib/services/dashboard.service';
import { formatCompactNumber, formatMoney } from '@/lib/dashboard-utils';

interface TopProductsProps {
  products: DashboardTopProduct[];
  currencyCode: string;
  periodLabel: string;
  loading?: boolean;
}

export function TopProducts({
  products,
  currencyCode,
  periodLabel,
  loading,
}: TopProductsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>Best sellers · {periodLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No product sales in this period
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Units</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.productId} className="border-b last:border-0">
                    <td className="py-3 pr-3">
                      <Link
                        href={`/dashboard/products/${product.productId}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                          {product.mainImage ? (
                            <Image
                              src={product.mainImage}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full bg-muted" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.itemCode}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {formatCompactNumber(product.units)}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {formatMoney(product.revenue, currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
