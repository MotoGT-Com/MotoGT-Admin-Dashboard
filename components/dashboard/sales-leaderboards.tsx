'use client';

import { RankedListCard } from './ranked-list-card';

interface SalesLeaderboardsProps {
  loading?: boolean;
}

/**
 * Sales ranking cards. Empty until the API exposes real aggregates —
 * invented numbers are not shown (they previously dwarfed real KPIs).
 */
export function SalesLeaderboards({ loading }: SalesLeaderboardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <RankedListCard
        title="Best Selling Products"
        description="Top performers this period"
        rankBy="Ranked by units sold"
        items={[]}
        loading={loading}
      />
      <RankedListCard
        title="Best Selling Categories"
        description="Top category performance"
        rankBy="Ranked by order count"
        items={[]}
        loading={loading}
      />
      <RankedListCard
        title="Best Selling Subcategories"
        description="Popular subcategory items"
        rankBy="Ranked by units sold · units & revenue when available"
        items={[]}
        loading={loading}
      />
      <RankedListCard
        title="Top Locations"
        description="Best selling regions"
        rankBy="Ranked by order count"
        items={[]}
        loading={loading}
      />
      <RankedListCard
        title="Best Selling Car Makes"
        description="Most popular vehicle brands"
        rankBy="Ranked by units sold"
        items={[]}
        loading={loading}
      />
      <RankedListCard
        title="Best Selling Car Models"
        description="Top vehicle models"
        rankBy="Ranked by units sold"
        items={[]}
        loading={loading}
      />
    </div>
  );
}
