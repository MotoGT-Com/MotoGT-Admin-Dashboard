import type { DashboardPeriod } from './services/dashboard.service';

export function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-JO', {
      style: 'currency',
      currency: currencyCode || 'JOD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
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

export function periodLabel(period: DashboardPeriod): string {
  switch (period) {
    case 'today':
      return 'Today';
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    default:
      return period;
  }
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
