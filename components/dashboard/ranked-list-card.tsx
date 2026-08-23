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
import { BarChart3 } from 'lucide-react';

export interface RankedListItem {
  id: string;
  name: string;
  /** Secondary line under the name (e.g. "245 units"). */
  subtitle?: string;
  /** Right-aligned metric (e.g. "JOD 12,250" or "456 units"). */
  value: string;
}

interface RankedListCardProps {
  title: string;
  description: string;
  /** Explicit ranking basis, e.g. "Ranked by units sold". */
  rankBy?: string;
  items: RankedListItem[];
  loading?: boolean;
  emptyMessage?: string;
  /** Show a persistent preview badge when items are mock/demo data. */
  preview?: boolean;
}

export function RankedListCard({
  title,
  description,
  rankBy,
  items,
  loading,
  emptyMessage = 'Rankings will appear here once enough sales data accumulates',
  preview = false,
}: RankedListCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            {rankBy ? (
              <p className="text-xs text-muted-foreground">{rankBy}</p>
            ) : null}
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
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item, index) => (
              <li key={item.id} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight truncate">
                    {item.name}
                  </p>
                  {item.subtitle ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.subtitle}
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-medium tabular-nums shrink-0 pt-0.5">
                  {item.value}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
