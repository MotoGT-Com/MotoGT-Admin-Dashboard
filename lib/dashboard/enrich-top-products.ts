import {
  productService,
  type Product,
  type CarCompatibility,
} from '@/lib/services/product.service';
import { productCarCompatibilityService } from '@/lib/services/product-car-compatibility.service';
import type {
  DashboardLeaderboardItem,
  DashboardTopProduct,
} from '@/lib/services/dashboard.service';

export interface ProductCatalogMeta {
  title: string;
  itemCode: string;
  mainImage: string | null;
  car: string | null;
}

/** Session cache: productId → catalog meta (titles / cars reused across filter changes). */
const catalogCache = new Map<string, ProductCatalogMeta>();

function productTitle(product: Product): string {
  if (product.name?.trim()) return product.name.trim();
  const en = product.translations?.find((t) => t.languageCode === 'en');
  return (
    en?.name?.trim() ||
    product.translations?.[0]?.name?.trim() ||
    product.itemCode ||
    product.id
  );
}

function formatEmbeddedCar(
  compat: CarCompatibility[] | undefined,
): string | null {
  if (!compat?.length) return null;
  const car = compat[0];
  const brandModel = [car.carBrand, car.carModel].filter(Boolean).join(' ');
  if (!brandModel) return null;
  if (car.carYearFrom != null && car.carYearTo != null) {
    return `${brandModel} (${car.carYearFrom}–${car.carYearTo})`;
  }
  if (car.carYearFrom != null) return `${brandModel} (${car.carYearFrom}+)`;
  return brandModel;
}

async function resolveCarLabel(
  productId: string,
  embedded: CarCompatibility[] | undefined,
): Promise<string | null> {
  const fromProduct = formatEmbeddedCar(embedded);
  if (fromProduct) return fromProduct;

  try {
    const rows =
      await productCarCompatibilityService.listCompatibilities(productId);
    if (!rows.length) return null;
    const car = rows[0];
    const brandModel = [car.carBrand, car.carModel].filter(Boolean).join(' ');
    if (!brandModel) return null;
    if (car.yearFrom != null && car.yearTo != null) {
      return `${brandModel} (${car.yearFrom}–${car.yearTo})`;
    }
    if (car.yearFrom != null) return `${brandModel} (${car.yearFrom}+)`;
    return brandModel;
  } catch {
    return null;
  }
}

function nameLooksLikeSku(name: string | undefined, itemCode?: string): boolean {
  const n = name?.trim() ?? '';
  if (!n) return true;
  if (itemCode && n === itemCode.trim()) return true;
  return /^\d+$/.test(n);
}

/** Sync snapshot of cached meta for the given IDs (no network). */
export function getCachedProductCatalogMeta(
  productIds: string[],
): Map<string, ProductCatalogMeta> {
  const map = new Map<string, ProductCatalogMeta>();
  for (const id of productIds) {
    if (!id) continue;
    const hit = catalogCache.get(id);
    if (hit) map.set(id, hit);
  }
  return map;
}

/**
 * Fetch title / itemCode / car for unique product IDs (one request per id).
 * Cached entries are reused for the session so filter changes stay snappy.
 */
export async function loadProductCatalogMeta(
  productIds: string[],
  languageId: string,
): Promise<Map<string, ProductCatalogMeta>> {
  const unique = [...new Set(productIds.filter(Boolean))];
  if (!unique.length || !languageId) {
    return getCachedProductCatalogMeta(unique);
  }

  const missing = unique.filter((id) => !catalogCache.has(id));

  await Promise.all(
    missing.map(async (productId) => {
      try {
        const product = await productService.getProductById(
          productId,
          languageId,
        );
        const car = await resolveCarLabel(productId, product.carCompatibility);
        catalogCache.set(productId, {
          title: productTitle(product),
          itemCode: product.itemCode || '',
          mainImage: product.mainImage || null,
          car,
        });
      } catch {
        // Skip failed lookups; callers keep API fallbacks.
      }
    }),
  );

  return getCachedProductCatalogMeta(unique);
}

/**
 * Dashboard topProducts often returns itemCode as `name` and no fitment.
 * Fill title + car from the product admin API when needed.
 */
export async function enrichTopProducts(
  products: DashboardTopProduct[],
  languageId: string,
  catalog?: Map<string, ProductCatalogMeta>,
): Promise<DashboardTopProduct[]> {
  if (!products.length) return products;

  const meta =
    catalog ??
    (await loadProductCatalogMeta(
      products
        .filter((row) => nameLooksLikeSku(row.name, row.itemCode) || !row.car)
        .map((row) => row.productId),
      languageId,
    ));

  return products.map((row) => {
    const hit = meta.get(row.productId);
    if (!hit) return row;
    return {
      ...row,
      name: hit.title || row.name,
      itemCode: hit.itemCode || row.itemCode,
      mainImage: row.mainImage || hit.mainImage,
      car: row.car || hit.car,
    };
  });
}

/**
 * Best Selling Products leaderboard: show real title + item code subtitle.
 * Keeps `value` as units sold from the API.
 */
export async function enrichProductsByUnitsLeaderboard(
  items: DashboardLeaderboardItem[] | undefined,
  languageId: string,
  catalog?: Map<string, ProductCatalogMeta>,
): Promise<DashboardLeaderboardItem[] | undefined> {
  if (!items?.length) return items;

  const meta =
    catalog ??
    (await loadProductCatalogMeta(
      items.map((item) => item.id),
      languageId,
    ));

  return items.map((item) => {
    const hit = meta.get(item.id);
    if (!hit) {
      // If API already sent a code-like name, keep value; put name as subtitle too.
      if (nameLooksLikeSku(item.name)) {
        return {
          ...item,
          secondaryValue: item.name,
        };
      }
      return item;
    }
    return {
      ...item,
      name: hit.title,
      secondaryValue: hit.itemCode || item.name,
    };
  });
}
