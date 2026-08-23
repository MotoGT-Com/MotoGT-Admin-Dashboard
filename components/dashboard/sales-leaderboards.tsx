'use client';

import { RankedListCard, type RankedListItem } from './ranked-list-card';
import type {
  DashboardLeaderboards,
  DashboardLeaderboardItem,
} from '@/lib/services/dashboard.service';
import {
  formatCompactNumber,
  formatMoney,
  parseAmount,
} from '@/lib/dashboard-utils';

interface SalesLeaderboardsProps {
  leaderboards?: DashboardLeaderboards | null;
  currencyCode?: string;
  loading?: boolean;
}

function unitsLabel(raw: string | number | undefined): string {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return String(raw ?? '—');
  return `${formatCompactNumber(n)} ${n === 1 ? 'unit' : 'units'}`;
}

function ordersLabel(raw: string | number | undefined): string {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return String(raw ?? '—');
  return `${formatCompactNumber(n)} ${n === 1 ? 'order' : 'orders'}`;
}

function revenueLabel(
  raw: string | number | undefined,
  currencyCode: string,
): string {
  return formatMoney(parseAmount(raw), currencyCode);
}

/** Products: title + SKU code; primary metric = units. */
function toProductItems(
  items: DashboardLeaderboardItem[] | undefined,
): RankedListItem[] {
  if (!items?.length) return [];
  return items.map((item) => {
    const code =
      item.secondaryValue != null && String(item.secondaryValue).trim() !== ''
        ? String(item.secondaryValue)
        : undefined;
    return {
      id: item.id,
      name: item.name,
      subtitle: code ? `Code ${code}` : undefined,
      value: unitsLabel(item.value),
    };
  });
}

/** Categories / locations: primary = order count. */
function toOrderItems(
  items: DashboardLeaderboardItem[] | undefined,
): RankedListItem[] {
  if (!items?.length) return [];
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    value: ordersLabel(item.value),
  }));
}

/**
 * Subcategories by units: primary units, secondary revenue labeled.
 * API: value = units, secondaryValue = revenue.
 */
function toSubcategoryUnitsItems(
  items: DashboardLeaderboardItem[] | undefined,
  currencyCode: string,
): RankedListItem[] {
  if (!items?.length) return [];
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    value: unitsLabel(item.value),
    subtitle:
      item.secondaryValue != null && String(item.secondaryValue).trim() !== ''
        ? `${revenueLabel(item.secondaryValue, currencyCode)} revenue`
        : undefined,
  }));
}

/**
 * Subcategories by revenue: primary revenue, secondary units labeled.
 * API: value = revenue, secondaryValue = units.
 */
function toSubcategoryRevenueItems(
  items: DashboardLeaderboardItem[] | undefined,
  currencyCode: string,
): RankedListItem[] {
  if (!items?.length) return [];
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    value: revenueLabel(item.value, currencyCode),
    subtitle:
      item.secondaryValue != null && String(item.secondaryValue).trim() !== ''
        ? unitsLabel(item.secondaryValue)
        : undefined,
  }));
}

/** Vehicles: primary = units; bare numeric secondary → revenue. */
function toVehicleItems(
  items: DashboardLeaderboardItem[] | undefined,
  currencyCode: string,
): RankedListItem[] {
  if (!items?.length) return [];
  return items.map((item) => {
    let subtitle: string | undefined;
    if (item.secondaryValue != null && String(item.secondaryValue).trim() !== '') {
      const raw = String(item.secondaryValue).trim();
      const asNumber = Number(raw);
      subtitle =
        Number.isFinite(asNumber) && /^-?\d+(\.\d+)?$/.test(raw)
          ? `${revenueLabel(asNumber, currencyCode)} revenue`
          : raw;
    }
    return {
      id: item.id,
      name: item.name,
      value: unitsLabel(item.value),
      subtitle,
    };
  });
}

export function SalesLeaderboards({
  leaderboards,
  currencyCode = 'JOD',
  loading,
}: SalesLeaderboardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <RankedListCard
        title="Best Selling Products"
        description="Top performers this period"
        rankBy="Ranked by units sold"
        items={toProductItems(leaderboards?.productsByUnits)}
        loading={loading}
      />
      <RankedListCard
        title="Best Selling Categories"
        description="Top category performance"
        rankBy="Ranked by order count"
        items={toOrderItems(leaderboards?.categoriesByOrderCount)}
        loading={loading}
      />
      <RankedListCard
        title="Best Selling Subcategories"
        description="Popular subcategory items"
        rankBy="Ranked by units sold"
        items={toSubcategoryUnitsItems(
          leaderboards?.subcategoriesByUnits,
          currencyCode,
        )}
        loading={loading}
      />
      <RankedListCard
        title="Top Locations"
        description="Best selling regions"
        rankBy="Ranked by order count"
        items={toOrderItems(leaderboards?.locationsByOrderCount)}
        loading={loading}
      />
      <RankedListCard
        title="Subcategories by Revenue"
        description="Highest revenue subcategories"
        rankBy="Ranked by revenue"
        items={toSubcategoryRevenueItems(
          leaderboards?.subcategoriesByRevenue,
          currencyCode,
        )}
        loading={loading}
      />
      <RankedListCard
        title="Best Selling Car Makes / Models"
        description="Most popular vehicles"
        rankBy="Ranked by units sold"
        items={toVehicleItems(leaderboards?.carMakesModels, currencyCode)}
        loading={loading}
      />
    </div>
  );
}
