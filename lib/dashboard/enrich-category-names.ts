import { categoryService, type Category } from '@/lib/services/category.service';
import type { DashboardLeaderboards } from '@/lib/services/dashboard.service';

/** API rejects limit > 100 on category list endpoints. */
const CATEGORY_LIST_LIMIT = 100;

/** Known English language UUID (MotoGT defaults). */
const FALLBACK_ENGLISH_LANGUAGE_ID = '3a59981f-5f2d-4b3e-a12a-2c2b25b4680b';

/** Store-scoped English category name maps (reused across filter changes). */
const categoryNamesCache = new Map<string, Map<string, string>>();

/** Arabic (or other) display name → English, for reverse lookup when ids miss. */
const categoryArabicToEnglishCache = new Map<string, Map<string, string>>();

function cacheKey(storeId: string, languageId?: string): string {
  return `${storeId}:${languageId ?? 'all'}`;
}

function normalizeLookupKey(text: string): string {
  return text.normalize('NFC').trim().replace(/\s+/g, ' ');
}

function translationLangCode(t: {
  languageCode?: string;
  languageId?: string;
  code?: string;
}): string {
  return String(t.languageCode ?? t.code ?? '')
    .trim()
    .toLowerCase();
}

function isEnglishLangCode(code: string): boolean {
  return code === 'en' || code.startsWith('en-') || code.startsWith('en_');
}

function isEnglishTranslation(
  t: { languageCode?: string; languageId?: string; code?: string },
  englishLanguageId?: string,
): boolean {
  if (isEnglishLangCode(translationLangCode(t))) return true;
  if (englishLanguageId && t.languageId === englishLanguageId) return true;
  if (t.languageId === FALLBACK_ENGLISH_LANGUAGE_ID) return true;
  return false;
}

/** True when the string is mostly Arabic script. */
export function looksArabic(text: string | undefined | null): boolean {
  if (!text) return false;
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const letters = (text.match(/\p{L}/gu) || []).length;
  return letters > 0 && arabic / letters > 0.4;
}

/**
 * Prefer English translation; never prefer Arabic `name` over an English translation.
 */
function englishCategoryName(
  category: Category,
  englishLanguageId?: string,
): string {
  const translations = category.translations ?? [];

  const en = translations.find((t) =>
    isEnglishTranslation(t, englishLanguageId),
  );
  if (en?.name?.trim() && !looksArabic(en.name)) return en.name.trim();

  const latin = translations.find((t) => {
    const name = t.name?.trim();
    return !!name && /[A-Za-z]/.test(name) && !looksArabic(name);
  });
  if (latin?.name?.trim()) return latin.name.trim();

  const raw = category.name?.trim();
  if (raw && !looksArabic(raw)) return raw;

  const anyLatin = translations.find(
    (t) => t.name?.trim() && !looksArabic(t.name),
  );
  if (anyLatin?.name?.trim()) return anyLatin.name.trim();

  return raw || '';
}

function nestedChildren(category: Category): Category[] {
  const cat = category as Category & {
    children?: Category[];
    subCategories?: Category[];
  };
  return cat.subcategories ?? cat.children ?? cat.subCategories ?? [];
}

function arabicAliases(category: Category): string[] {
  const aliases = new Set<string>();
  if (looksArabic(category.name)) {
    aliases.add(normalizeLookupKey(category.name!));
  }
  for (const t of category.translations ?? []) {
    const code = translationLangCode(t);
    const name = t.name?.trim();
    if (!name) continue;
    if (code === 'ar' || code.startsWith('ar') || looksArabic(name)) {
      aliases.add(normalizeLookupKey(name));
    }
  }
  return [...aliases];
}

function collectEnglishNames(
  categories: Category[],
  englishLanguageId?: string,
): {
  byId: Map<string, string>;
  byArabicName: Map<string, string>;
} {
  const byId = new Map<string, string>();
  const byArabicName = new Map<string, string>();

  const visit = (cat: Category) => {
    const en = englishCategoryName(cat, englishLanguageId);
    if (cat.id && en && !looksArabic(en)) {
      byId.set(cat.id, en);
      for (const alias of arabicAliases(cat)) {
        if (!byArabicName.has(alias)) byArabicName.set(alias, en);
      }
    } else if (cat.id && en) {
      // Still record id → name so we know we saw it; reverse map only if we later upgrade.
      byId.set(cat.id, en);
    }
    for (const child of nestedChildren(cat)) visit(child);
  };

  for (const cat of categories) visit(cat);
  return { byId, byArabicName };
}

function normalizeCategoryList(raw: unknown): Category[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as {
      data?: Category[];
      categories?: Category[];
      items?: Category[];
      results?: Category[];
    };
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.categories)) return obj.categories;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.results)) return obj.results;
  }
  return [];
}

function englishRatio(byId: Map<string, string>): number {
  if (byId.size === 0) return 0;
  let english = 0;
  for (const name of byId.values()) {
    if (name && !looksArabic(name)) english += 1;
  }
  return english / byId.size;
}

/** Sync cached English names for a store (no network). */
export function getCachedCategoryEnglishNames(
  storeId: string,
  languageId?: string,
): Map<string, string> | null {
  const cached = categoryNamesCache.get(cacheKey(storeId, languageId));
  // Treat empty / mostly-Arabic maps as a miss so a prior bad load can be retried.
  if (!cached || cached.size === 0) return null;
  if (englishRatio(cached) < 0.3) return null;
  return cached;
}

async function fetchCategoryPage(
  storeId: string,
  languageId: string | undefined,
  page: number,
): Promise<Category[]> {
  const params = {
    storeId,
    languageId,
    includeSubcategories: true,
    limit: CATEGORY_LIST_LIMIT,
    page,
  };

  try {
    const raw = await categoryService.listCategoriesAdmin(params);
    const list = normalizeCategoryList(raw);
    if (list.length) return list;
  } catch {
    // Fall through to public list.
  }

  try {
    const raw = await categoryService.listCategories(params);
    return normalizeCategoryList(raw);
  } catch {
    return [];
  }
}

/** Paginate through category lists (max a few pages). */
async function fetchAllCategories(
  storeId: string,
  languageId?: string,
): Promise<Category[]> {
  const all: Category[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= 10; page += 1) {
    const batch = await fetchCategoryPage(storeId, languageId, page);
    if (!batch.length) break;
    for (const cat of batch) {
      if (!cat?.id || seen.has(cat.id)) continue;
      seen.add(cat.id);
      all.push(cat);
    }
    if (batch.length < CATEGORY_LIST_LIMIT) break;
  }

  return all;
}

function storeMaps(
  key: string,
  byId: Map<string, string>,
  byArabicName: Map<string, string>,
): void {
  if (byId.size === 0) return;
  categoryNamesCache.set(key, byId);
  categoryArabicToEnglishCache.set(key, byArabicName);
}

/**
 * Load store categories (with subcategories) and return id → English name.
 * Results are cached per store + language for the session.
 */
export async function loadCategoryEnglishNames(
  storeId: string,
  languageId?: string,
): Promise<Map<string, string>> {
  const key = cacheKey(storeId, languageId);
  const hit = getCachedCategoryEnglishNames(storeId, languageId);
  if (hit) return hit;

  // 1) Full bilingual list (no language filter) — best for translations[].
  let list = await fetchAllCategories(storeId, undefined);
  let { byId, byArabicName } = collectEnglishNames(list, languageId);

  // 2) If too few English names, retry with explicit English languageId
  //    (localized `name` field often carries English then).
  if (englishRatio(byId) < 0.5 && languageId) {
    const enList = await fetchAllCategories(storeId, languageId);
    const second = collectEnglishNames(enList, languageId);
    for (const [id, name] of second.byId) {
      if (!looksArabic(name) || !byId.has(id) || looksArabic(byId.get(id))) {
        byId.set(id, name);
      }
    }
    for (const [ar, en] of second.byArabicName) {
      if (!byArabicName.has(ar) && !looksArabic(en)) {
        byArabicName.set(ar, en);
      }
    }
  }

  storeMaps(key, byId, byArabicName);
  return byId;
}

function withEnglishName(
  id: string,
  name: string,
  names: Map<string, string>,
  arabicToEnglish?: Map<string, string> | null,
): string {
  const byId = names.get(id);
  if (byId && !looksArabic(byId)) return byId;

  const trimmed = name ? normalizeLookupKey(name) : '';
  if (trimmed && arabicToEnglish?.has(trimmed)) {
    const mapped = arabicToEnglish.get(trimmed)!;
    if (!looksArabic(mapped)) return mapped;
  }

  if (!looksArabic(name)) return name;
  // Prefer non-Arabic byId even if we somehow stored Arabic earlier? No — keep name.
  return name;
}

function resolveArabicMap(
  names: Map<string, string>,
): Map<string, string> | null {
  for (const [key, byId] of categoryNamesCache.entries()) {
    if (byId === names) {
      return categoryArabicToEnglishCache.get(key) ?? null;
    }
  }
  return null;
}

/**
 * Prefer English labels for category / subcategory leaderboard rows.
 */
export function applyEnglishCategoryNames(
  leaderboards: DashboardLeaderboards | undefined,
  names: Map<string, string>,
): DashboardLeaderboards | undefined {
  if (!leaderboards || names.size === 0) return leaderboards;

  const arabicToEnglish = resolveArabicMap(names);

  const mapItems = <T extends { id: string; name: string }>(
    items: T[] | undefined,
  ): T[] | undefined => {
    if (!items?.length) return items;
    return items.map((item) => ({
      ...item,
      name: withEnglishName(item.id, item.name, names, arabicToEnglish),
    }));
  };

  return {
    ...leaderboards,
    categoriesByOrderCount: mapItems(leaderboards.categoriesByOrderCount),
    subcategoriesByUnits: mapItems(leaderboards.subcategoriesByUnits),
    subcategoriesByRevenue: mapItems(leaderboards.subcategoriesByRevenue),
  };
}

/** Remap category sales rows to English when categoryId is present. */
export function applyEnglishCategorySalesNames<
  T extends { categoryId?: string; name: string },
>(rows: T[], names: Map<string, string>): T[] {
  if (!rows.length || names.size === 0) return rows;
  const arabicToEnglish = resolveArabicMap(names);
  return rows.map((row) => {
    if (!row.categoryId && !looksArabic(row.name)) return row;
    return {
      ...row,
      name: withEnglishName(
        row.categoryId ?? '',
        row.name,
        names,
        arabicToEnglish,
      ),
    };
  });
}

/**
 * For any leaderboard/category-sales rows still Arabic, resolve via
 * GET /admin/categories/:id?languageId=<english>.
 * Updates the session cache so later filter changes stay fast.
 */
export async function resolveRemainingArabicCategoryNames(
  leaderboards: DashboardLeaderboards | undefined,
  categorySales: DashboardDataCategorySales | undefined,
  storeId: string,
  englishLanguageId: string,
  names: Map<string, string>,
): Promise<{
  leaderboards: DashboardLeaderboards | undefined;
  categorySales: DashboardDataCategorySales | undefined;
  names: Map<string, string>;
}> {
  const arabicToEnglish =
    resolveArabicMap(names) ??
    categoryArabicToEnglishCache.get(cacheKey(storeId, englishLanguageId)) ??
    new Map<string, string>();

  const pending = new Map<string, string>(); // id → current Arabic name

  const note = (id: string | undefined, name: string | undefined) => {
    if (!id || !name || !looksArabic(name)) return;
    const existing = names.get(id);
    if (existing && !looksArabic(existing)) return;
    pending.set(id, name);
  };

  for (const item of leaderboards?.categoriesByOrderCount ?? []) {
    note(item.id, item.name);
  }
  for (const item of leaderboards?.subcategoriesByUnits ?? []) {
    note(item.id, item.name);
  }
  for (const item of leaderboards?.subcategoriesByRevenue ?? []) {
    note(item.id, item.name);
  }
  for (const row of categorySales ?? []) {
    note(row.categoryId, row.name);
  }

  if (pending.size === 0) {
    return { leaderboards, categorySales, names };
  }

  await Promise.all(
    [...pending.entries()].map(async ([id, arabicName]) => {
      try {
        const cat = await categoryService.getCategoryByIdAdmin(
          id,
          englishLanguageId,
        );
        let en = englishCategoryName(cat, englishLanguageId);
        if (!en || looksArabic(en)) {
          // Retry without language filter — rely on translations[].
          const full = await categoryService.getCategoryByIdAdmin(id);
          en = englishCategoryName(full, englishLanguageId);
        }
        if (en && !looksArabic(en)) {
          names.set(id, en);
          arabicToEnglish.set(normalizeLookupKey(arabicName), en);
          for (const alias of arabicAliases(cat)) {
            arabicToEnglish.set(alias, en);
          }
        }
      } catch {
        // Leave Arabic if lookup fails.
      }
    }),
  );

  const key = cacheKey(storeId, englishLanguageId);
  storeMaps(key, names, arabicToEnglish);

  return {
    leaderboards: applyEnglishCategoryNames(leaderboards, names),
    categorySales: categorySales
      ? applyEnglishCategorySalesNames(categorySales, names)
      : categorySales,
    names,
  };
}

type DashboardDataCategorySales = Array<{
  categoryId?: string;
  name: string;
  revenue: number;
  units?: number;
  percentage?: number;
}>;
