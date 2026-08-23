import type { DashboardPeriod } from './services/dashboard.service';

const PRESET_DAYS: Record<Exclude<DashboardPeriod, 'custom'>, number> = {
  today: 1,
  '7d': 7,
  '14d': 14,
  '30d': 30,
  '90d': 90,
  '180d': 180,
};

/** Format a Date as YYYY-MM-DD in local calendar time. */
export function toIsoDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Resolve inclusive YYYY-MM-DD bounds for a dashboard period selection.
 */
export function resolveDashboardDateRange(
  period: DashboardPeriod,
  custom?: { from?: string; to?: string },
  now: Date = new Date(),
): { from: string; to: string } {
  if (period === 'custom') {
    const to = custom?.to || toIsoDate(now);
    const from = custom?.from || to;
    return { from, to };
  }

  const days = PRESET_DAYS[period];
  const to = toIsoDate(now);
  const fromDate = new Date(now);
  // Inclusive window of N days ending today → go back (N - 1) days.
  fromDate.setDate(fromDate.getDate() - (days - 1));
  return { from: toIsoDate(fromDate), to };
}

/** Coerce API amounts that may arrive as strings ("10.00") to numbers. */
export function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value == null || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(
  amount: string | number,
  currencyCode: string,
): string {
  const n = parseAmount(amount);
  try {
    return new Intl.NumberFormat('en-JO', {
      style: 'currency',
      currency: currencyCode || 'JOD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(n);
  } catch {
    return `${currencyCode} ${n.toFixed(2)}`;
  }
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value);
}

/**
 * Percent change vs previous window. Returns null when previous is 0 and current is 0.
 * When previous is 0 and current > 0, returns +100 (new activity).
 */
export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export function formatPercentDelta(delta: number | null): string | null {
  if (delta === null || Number.isNaN(delta)) return null;
  const rounded = Math.round(delta);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}% vs prior period`;
}

export function periodLabel(
  period: DashboardPeriod,
  range?: { from?: string; to?: string },
): string {
  switch (period) {
    case 'today':
      return 'Today';
    case '7d':
      return 'Last 7 days';
    case '14d':
      return 'Last 2 weeks';
    case '30d':
      return 'Last 30 days';
    case '90d':
      return 'Last 3 months';
    case '180d':
      return 'Last 6 months';
    case 'custom': {
      if (range?.from && range?.to) {
        return `${formatShortDate(range.from)} – ${formatShortDate(range.to)}`;
      }
      return 'Custom dates';
    }
    default:
      return period;
  }
}

function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatStatusLabel(status: string): string {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
