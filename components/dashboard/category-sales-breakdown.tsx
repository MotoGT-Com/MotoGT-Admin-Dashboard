'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardCategorySale } from '@/lib/services/dashboard.service';

interface CategorySalesBreakdownProps {
  title: string;
  description: string;
  totalLabel?: string;
  categories: DashboardCategorySale[];
  currencyCode: string;
  loading?: boolean;
  skeletonRows?: number;
  /** Persistent badge when figures are a placeholder split. */
  preview?: boolean;
}

function formatCategoryMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-JO', {
      style: 'currency',
      currency: currencyCode || 'JOD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${Math.round(amount).toLocaleString('en')}`;
  }
}

export function CategorySalesBreakdown({
  title,
  description,
  totalLabel = 'Total Category Sales',
  categories,
  currencyCode,
  loading,
  skeletonRows = 5,
  preview = false,
}: CategorySalesBreakdownProps) {
  const total = categories.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {preview ? (
            <Badge
              variant="outline"
              className="shrink-0 border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
            >
              Preview data
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 || total <= 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No category sales in this period
          </p>
        ) : (
          <div className="space-y-5">
            {categories.map((category) => {
              const pct =
                category.percentage > 0
                  ? category.percentage
                  : total > 0
                    ? (category.revenue / total) * 100
                    : 0;
              const roundedPct = Math.round(pct);

              return (
                <div
                  key={category.categoryId ?? category.name}
                  className="space-y-2"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium">{category.name}</p>
                    <p className="text-sm tabular-nums text-muted-foreground shrink-0">
                      <span className="font-medium text-foreground">
                        {formatCategoryMoney(category.revenue, currencyCode)}
                      </span>{' '}
                      ({roundedPct}%)
                    </p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">{totalLabel}</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatCategoryMoney(total, currencyCode)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
