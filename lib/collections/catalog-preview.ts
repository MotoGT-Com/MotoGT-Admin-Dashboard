/**
 * Live catalog helpers for Collections membership preview.
 * Uses product / category / product-type / car APIs — not mock products.
 */

import {
  conditionsToProductListParams,
  type ClientProductFilter,
  type CollectionCondition,
  type CollectionProduct,
} from "@/lib/domain/collections";
import {
  productService,
  type Product,
  type ProductListParams,
} from "@/lib/services/product.service";
import { categoryService, type Category } from "@/lib/services/category.service";
import { productTypeService } from "@/lib/services/product-type.service";
import { carService } from "@/lib/services/car.service";

const PREVIEW_PAGE_SIZE = 100;
const PREVIEW_MAX_PAGES = 5;

export interface ConditionOption {
  value: string;
  label: string;
}

export interface CollectionConditionOptions {
  categories: ConditionOption[];
  productTypes: ConditionOption[];
  carMakes: ConditionOption[];
  /** All unique models (fallback when no make is selected). */
  carModels: ConditionOption[];
  /** Models keyed by make for cascading selects. */
  carModelsByMake: Record<string, ConditionOption[]>;
  carYears: ConditionOption[];
  activeStatuses: ConditionOption[];
}

function productDisplayName(product: Product): string {
  const tr =
    product.translations?.find((t) => t.languageCode === "en") ||
    product.translations?.[0];
  return (
    product.name?.trim() ||
    tr?.name?.trim() ||
    product.itemCode ||
    "Untitled product"
  );
}

export function productToCollectionProduct(
  product: Product,
  position?: number,
): CollectionProduct {
  const carMake =
    product.carCompatibility?.find((c) => c.carBrand)?.carBrand ?? null;
  return {
    id: product.id,
    name: productDisplayName(product),
    sku: product.itemCode,
    price: product.price ?? 0,
    currency: "JOD",
    stock: product.stockQuantity,
    image: product.mainImage,
    categoryName: product.category?.name ?? product.subCategory?.name,
    productTypeName: undefined,
    carMake,
    position,
  };
}

function looksArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function categoryLabel(
  category: Category,
  languageCode: string = "en",
): string {
  // Prefer explicit translation for the admin UI language (English).
  // Do not prefer `name` first — API often sets that to the storefront default (Arabic).
  const fromTranslations =
    category.translations?.find((t) => t.languageCode === languageCode)?.name ||
    category.translations?.find((t) => t.languageCode === "en")?.name;
  if (fromTranslations?.trim()) return fromTranslations.trim();

  const rawName = category.name?.trim() || "";
  if (rawName && !(languageCode === "en" && looksArabic(rawName))) {
    return rawName;
  }

  const anyTranslation = category.translations?.find(
    (t) => t.name?.trim() && !looksArabic(t.name),
  )?.name;
  if (anyTranslation?.trim()) return anyTranslation.trim();

  return rawName || "Category";
}

function productTypeLabel(category: Category): string {
  const pt = category.productType;
  if (!pt) return "";
  const name = pt.name?.trim();
  if (name && !looksArabic(name)) return name;
  return pt.code || pt.slug || "";
}

function flattenCategories(
  categories: Category[],
  languageCode: string = "en",
): ConditionOption[] {
  const options: ConditionOption[] = [];
  const seen = new Set<string>();

  for (const cat of categories) {
    // API returns top-level parents; skip any accidental nested rows.
    if (cat.parentId) continue;

    const typePrefix = productTypeLabel(cat);
    const name = categoryLabel(cat, languageCode);
    const parentLabel = typePrefix ? `${typePrefix} · ${name}` : name;

    if (!seen.has(cat.id)) {
      seen.add(cat.id);
      options.push({ value: cat.id, label: parentLabel });
    }

    for (const sub of cat.subcategories ?? []) {
      if (seen.has(sub.id)) continue;
      seen.add(sub.id);
      const subName = categoryLabel(sub as Category, languageCode);
      options.push({
        value: sub.id,
        label: `${parentLabel} / ${subName}`,
      });
    }
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

async function loadCategoriesSafe(
  storeId: string,
  languageId: string,
): Promise<Category[]> {
  const normalize = (data: unknown): Category[] => {
    if (Array.isArray(data)) return data;
    if (
      data &&
      typeof data === "object" &&
      Array.isArray((data as { categories?: Category[] }).categories)
    ) {
      return (data as { categories: Category[] }).categories;
    }
    return [];
  };

  const fetchAllPages = async (
    withLanguage: boolean,
  ): Promise<Category[]> => {
    const all: Category[] = [];
    const limit = 100;
    for (let page = 1; page <= 30; page++) {
      const data = await categoryService.listCategoriesAdmin({
        storeId,
        ...(withLanguage ? { languageId } : {}),
        includeSubcategories: true,
        page,
        limit,
      });
      const batch = normalize(data);
      all.push(...batch);
      if (batch.length < limit) break;
    }
    return all;
  };

  try {
    return await fetchAllPages(true);
  } catch {
    // fall through
  }

  try {
    return await fetchAllPages(false);
  } catch {
    // fall through
  }

  try {
    const data = await categoryService.listCategories({
      storeId,
      languageId,
      includeSubcategories: true,
      isActive: true,
      limit: 100,
    });
    return normalize(data);
  } catch {
    return [];
  }
}

function matchesClientFilter(
  product: Product,
  filter: ClientProductFilter,
): boolean {
  switch (filter.kind) {
    case "category_not":
      return (
        product.categoryId !== filter.categoryId &&
        product.subCategoryId !== filter.categoryId
      );
    case "product_type_not": {
      const typeId =
        (product as Product & { productTypeId?: string }).productTypeId ||
        (product as Product & { productType?: { id?: string } }).productType
          ?.id;
      // If type not on product, keep row (cannot prove match)
      if (!typeId) return true;
      return typeId !== filter.productTypeId;
    }
    case "car_make_not": {
      const brands = (product.carCompatibility ?? [])
        .map((c) => c.carBrand?.toLowerCase())
        .filter(Boolean);
      if (brands.length === 0) return true;
      return !brands.includes(filter.carBrand.toLowerCase());
    }
    case "car_model_not": {
      const models = (product.carCompatibility ?? [])
        .map((c) => c.carModel?.toLowerCase())
        .filter(Boolean);
      if (models.length === 0) return true;
      return !models.includes(filter.carModel.toLowerCase());
    }
    case "car_year": {
      const year = filter.value;
      const ranges = product.carCompatibility ?? [];
      if (ranges.length === 0) return false;
      return ranges.some((c) => {
        const from = c.carYearFrom ?? Number.NEGATIVE_INFINITY;
        const to = c.carYearTo ?? Number.POSITIVE_INFINITY;
        if (filter.operator === "equals") return year >= from && year <= to;
        if (filter.operator === "greater_than") return to > year;
        if (filter.operator === "less_than") return from < year;
        return false;
      });
    }
    case "price": {
      const price = product.price ?? 0;
      if (filter.operator === "equals") return price === filter.value;
      if (filter.operator === "greater_than") return price > filter.value;
      if (filter.operator === "less_than") return price < filter.value;
      return true;
    }
    case "stock": {
      const stock = product.stockQuantity ?? 0;
      if (filter.operator === "equals") return stock === filter.value;
      if (filter.operator === "greater_than") return stock > filter.value;
      if (filter.operator === "less_than") return stock < filter.value;
      return true;
    }
    default:
      return true;
  }
}

async function fetchProductPages(
  base: ProductListParams,
): Promise<Product[]> {
  const all: Product[] = [];
  for (let page = 1; page <= PREVIEW_MAX_PAGES; page++) {
    const res = await productService.listProducts({
      ...base,
      page,
      limit: PREVIEW_PAGE_SIZE,
    });
    all.push(...res.data);
    if (!res.meta.hasNext || res.data.length === 0) break;
  }
  return all;
}

function yearRange(
  from: number | null | undefined,
  to: number | null | undefined,
): number[] {
  const start = from ?? to;
  const end = to ?? from;
  if (start == null || end == null) return [];
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  const years: number[] = [];
  for (let y = lo; y <= hi; y++) years.push(y);
  return years;
}

export async function loadConditionOptions(
  storeId: string,
  languageId: string,
): Promise<CollectionConditionOptions> {
  const empty: CollectionConditionOptions = {
    categories: [],
    productTypes: [],
    carMakes: [],
    carModels: [],
    carModelsByMake: {},
    carYears: [],
    activeStatuses: [
      { value: "true", label: "Active" },
      { value: "false", label: "Inactive" },
    ],
  };

  try {
    const [types, categories, cars] = await Promise.all([
      productTypeService.getAll(languageId).catch(() => []),
      loadCategoriesSafe(storeId, languageId),
      carService.listAllCars({ store_id: storeId }).catch(() => []),
    ]);

    const typeOptions: ConditionOption[] = (types ?? [])
      .map((t) => ({
        value: t.id,
        label:
          t.translations?.find((tr) => tr.languageCode === "en")?.name ||
          t.name ||
          t.code,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const carList = cars ?? [];
    const makes = [
      ...new Set(
        carList.map((c) => c.brand).filter((b): b is string => Boolean(b?.trim())),
      ),
    ].sort((a, b) => a.localeCompare(b));

    const carModelsByMake: Record<string, ConditionOption[]> = {};
    const allModelOptions: ConditionOption[] = [];
    const seenModels = new Set<string>();
    for (const car of carList) {
      if (!car.brand?.trim() || !car.model?.trim()) continue;
      const label = `${car.brand} / ${car.model}`;
      const list = carModelsByMake[car.brand] ?? [];
      if (!list.some((o) => o.value === car.model)) {
        list.push({ value: car.model, label });
        carModelsByMake[car.brand] = list;
      }
      // Flat list: one entry per model string (API filter is model-only).
      if (!seenModels.has(car.model)) {
        seenModels.add(car.model);
        allModelOptions.push({ value: car.model, label });
      }
    }
    for (const brand of Object.keys(carModelsByMake)) {
      carModelsByMake[brand].sort((a, b) => a.label.localeCompare(b.label));
    }
    allModelOptions.sort((a, b) => a.label.localeCompare(b.label));

    const yearSet = new Set<number>();
    for (const car of carList) {
      for (const y of yearRange(
        car.yearFrom ?? car.year_from,
        car.yearTo ?? car.year_to,
      )) {
        yearSet.add(y);
      }
    }
    const carYears = Array.from(yearSet)
      .sort((a, b) => b - a)
      .map((y) => ({ value: String(y), label: String(y) }));

    return {
      categories: flattenCategories(
        Array.isArray(categories) ? categories : [],
        "en",
      ),
      productTypes: typeOptions,
      carMakes: makes.map((m) => ({ value: m, label: m })),
      carModels: allModelOptions,
      carModelsByMake,
      carYears,
      activeStatuses: empty.activeStatuses,
    };
  } catch (err) {
    console.error("loadConditionOptions failed:", err);
    return empty;
  }
}

export async function previewAutomated(
  storeId: string,
  languageId: string,
  conditions: CollectionCondition[],
  excludedIds: string[] = [],
): Promise<CollectionProduct[]> {
  if (conditions.length === 0) return [];

  const { api, clientFilters } = conditionsToProductListParams(conditions);
  const excluded = new Set(excludedIds);

  const base: ProductListParams = {
    storeId,
    languageId,
    ...api,
    sortBy: "name",
    sortOrder: "asc",
  };

  let products = await fetchProductPages(base);
  products = products.filter((p) =>
    clientFilters.every((f) => matchesClientFilter(p, f)),
  );
  products = products.filter((p) => !excluded.has(p.id));

  return products.map((p, i) => productToCollectionProduct(p, i));
}

export async function resolveProductsByIds(
  storeId: string,
  languageId: string,
  ids: string[],
  excludedIds: string[] = [],
): Promise<CollectionProduct[]> {
  if (ids.length === 0) return [];
  const excluded = new Set(excludedIds);
  const orderedIds = ids.filter((id) => !excluded.has(id));
  if (orderedIds.length === 0) return [];

  try {
    const res = await productService.listProducts({
      storeId,
      languageId,
      productIds: orderedIds,
      limit: Math.min(100, orderedIds.length),
      page: 1,
    });
    const byId = new Map(res.data.map((p) => [p.id, p]));
    // If batch param ignored, fall back to individual fetches for missing
    const missing = orderedIds.filter((id) => !byId.has(id));
    if (missing.length > 0 && res.data.length === 0) {
      const fetched = await Promise.all(
        orderedIds.slice(0, 40).map(async (id) => {
          try {
            return await productService.getProductById(id, languageId);
          } catch {
            return null;
          }
        }),
      );
      fetched.forEach((p) => {
        if (p) byId.set(p.id, p);
      });
    } else if (missing.length > 0) {
      const fetched = await Promise.all(
        missing.slice(0, 20).map(async (id) => {
          try {
            return await productService.getProductById(id, languageId);
          } catch {
            return null;
          }
        }),
      );
      fetched.forEach((p) => {
        if (p) byId.set(p.id, p);
      });
    }

    return orderedIds
      .map((id, index) => {
        const product = byId.get(id);
        return product ? productToCollectionProduct(product, index) : null;
      })
      .filter(Boolean) as CollectionProduct[];
  } catch {
    const fetched = await Promise.all(
      orderedIds.slice(0, 40).map(async (id) => {
        try {
          return await productService.getProductById(id, languageId);
        } catch {
          return null;
        }
      }),
    );
    return fetched
      .map((p, index) => (p ? productToCollectionProduct(p, index) : null))
      .filter(Boolean) as CollectionProduct[];
  }
}

export async function searchCatalogProducts(
  storeId: string,
  languageId: string,
  opts: {
    search?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<{ products: CollectionProduct[]; total: number }> {
  const res = await productService.listProducts({
    storeId,
    languageId,
    search: opts.search?.trim() || undefined,
    categoryId: opts.categoryId,
    page: opts.page ?? 1,
    limit: opts.limit ?? 50,
    isActive: true,
    sortBy: "name",
    sortOrder: "asc",
  });
  return {
    products: res.data.map((p, i) => productToCollectionProduct(p, i)),
    total: res.meta.total,
  };
}
