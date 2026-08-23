import { settingsService } from '@/lib/services/settings.service';

/**
 * Resolve the active store id from settings / store list.
 * Does not hardcode local-dev store UUIDs (those break against production).
 */
export async function resolveStoreId(): Promise<string> {
  try {
    const stores = await settingsService.getStores();
    const saved = settingsService.getSelectedStore();
    const selected =
      stores.find((s) => s.id === saved?.id) ?? stores[0] ?? null;
    if (selected) {
      settingsService.setSelectedStore(selected.id);
      return selected.id;
    }
  } catch {
    // fall through to cached selection
  }

  const cached = settingsService.getSelectedStore();
  if (cached?.id) return cached.id;

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('motogt_selected_store');
    if (stored) return stored;
  }

  throw new Error(
    'No store configured. Sign in and select a store, or check that GET /stores returns data.',
  );
}
