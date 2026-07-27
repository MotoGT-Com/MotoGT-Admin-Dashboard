import { productService, type Product } from "./product.service";
import {
  productCarCompatibilityService,
  type ProductCarCompatibility,
} from "./product-car-compatibility.service";
import {
  ALL_TRIMS_FILTER,
  isYearInCompatibilityRange,
  normalizeTrim,
  resolveCarIdForMakeModel,
} from "../trims-utils";
import { carService, type Car } from "./car.service";

export type TrimAssignmentRow = {
  compatibilityId: string;
  productId: string;
  productName: string;
  itemCode: string;
  carId: string;
  carBrand: string;
  carModel: string;
  trim: string | null;
  yearFrom: number;
  yearTo: number | null;
  updatedAt: string;
};

export type TrimAssignmentSummary = {
  assignmentCount: number;
  uniqueTrimCount: number;
  allTrimsRowCount: number;
  productCount: number;
  yearSpanLabel: string;
};

export type CarPartsProductOption = {
  id: string;
  label: string;
  itemCode: string;
};

export type LoadAssignmentsResult = {
  rows: TrimAssignmentRow[];
  carPartsProducts: CarPartsProductOption[];
  productsScanned: number;
  productsTotal: number;
  truncated: boolean;
};

async function mapPool<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 6,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    results.push(...(await Promise.all(chunk.map(fn))));
  }
  return results;
}

function productDisplayName(product: Product): string {
  if (product.name) return product.name;
  const en = product.translations?.find((t) => t.languageCode === "en");
  return en?.name || product.itemCode || product.id;
}

function compatToRow(
  compat: ProductCarCompatibility,
  product: Product,
): TrimAssignmentRow {
  return {
    compatibilityId: compat.id,
    productId: product.id,
    productName: productDisplayName(product),
    itemCode: product.itemCode,
    carId: compat.carId,
    carBrand: compat.carBrand,
    carModel: compat.carModel,
    trim: normalizeTrim(compat.trim),
    yearFrom: compat.yearFrom,
    yearTo: compat.yearTo,
    updatedAt: compat.updatedAt,
  };
}

function sortRows(rows: TrimAssignmentRow[]): TrimAssignmentRow[] {
  return [...rows].sort((a, b) => {
    const byBrand = (a.carBrand || "").localeCompare(b.carBrand || "");
    if (byBrand !== 0) return byBrand;
    const byModel = (a.carModel || "").localeCompare(b.carModel || "");
    if (byModel !== 0) return byModel;
    const trimA = a.trim || "";
    const trimB = b.trim || "";
    const byTrim = trimA.localeCompare(trimB);
    if (byTrim !== 0) return byTrim;
    return a.yearFrom - b.yearFrom;
  });
}

function normalizeCars(raw: unknown): Car[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const items = (raw as { items?: Car[]; data?: Car[] }).items
      ?? (raw as { data?: Car[] }).data;
    if (Array.isArray(items)) return items;
  }
  return [];
}

function uniqueCarsById(cars: Car[]): Car[] {
  const seen = new Set<string>();
  const out: Car[] = [];
  for (const car of cars) {
    if (!car?.id || seen.has(car.id)) continue;
    seen.add(car.id);
    out.push(car);
  }
  return out;
}

function filterCarsForScope(
  cars: Car[],
  make?: string,
  model?: string,
): Car[] {
  let scoped = uniqueCarsById(cars);
  if (make && make !== "any") {
    const m = make.toLowerCase();
    scoped = scoped.filter((c) => (c.brand || "").toLowerCase() === m);
  }
  if (model && model !== "any") {
    const m = model.toLowerCase();
    scoped = scoped.filter((c) => (c.model || "").toLowerCase() === m);
  }
  // Prefer vehicles that already have linked products
  return scoped.sort(
    (a, b) =>
      Number((b as any).product_count || 0) -
      Number((a as any).product_count || 0),
  );
}

/**
 * Paginate products for one carId. Prefer carId — carBrand/carModel filters are
 * a different (legacy) backend path and are less reliable for admin scanning.
 */
async function fetchProductsForCar(params: {
  storeId: string;
  languageId: string;
  carId: string;
}): Promise<Product[]> {
  const pageSize = 50;
  const products: Product[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await productService.listProducts({
      storeId: params.storeId,
      languageId: params.languageId,
      carId: params.carId,
      page,
      limit: pageSize,
    });

    const batch = Array.isArray(response.data) ? response.data : [];
    products.push(...batch);

    hasNext =
      Boolean(response.meta?.hasNext) &&
      batch.length > 0 &&
      page < 40;
    if (!hasNext) break;
    page += 1;
  }

  return products;
}

async function fetchProductsViaCars(params: {
  storeId: string;
  languageId: string;
  cars: Car[];
}): Promise<Product[]> {
  const cars = uniqueCarsById(params.cars);
  if (cars.length === 0) return [];

  const byId = new Map<string, Product>();

  await mapPool(
    cars,
    async (car) => {
      try {
        const products = await fetchProductsForCar({
          storeId: params.storeId,
          languageId: params.languageId,
          carId: car.id,
        });
        for (const p of products) {
          if (p?.id) byId.set(p.id, p);
        }
      } catch (error) {
        console.warn(`Trim scan: products failed for car ${car.id}`, error);
      }
    },
    6,
  );

  return Array.from(byId.values());
}

class TrimAssignmentsService {
  /**
   * Load trim assignments by discovering products via carId (same reliable path
   * the Products page uses for vehicle filters), then loading compatibility rows.
   *
   * Optional make/model narrows which cars are scanned (much faster when filtering).
   */
  async loadAllAssignments(params: {
    storeId: string;
    languageId: string;
    cars?: Car[];
    make?: string;
    model?: string;
  }): Promise<LoadAssignmentsResult> {
    let cars = normalizeCars(params.cars);
    if (cars.length === 0) {
      try {
        cars = normalizeCars(
          await carService.listCars({
            store_id: params.storeId,
            limit: 1000,
          }),
        );
      } catch (error) {
        console.warn("Trim scan: failed to load cars", error);
        cars = [];
      }
    }

    const scopedCars = filterCarsForScope(cars, params.make, params.model);

    const products = await fetchProductsViaCars({
      storeId: params.storeId,
      languageId: params.languageId,
      cars: scopedCars,
    });

    const compatLists = await mapPool(
      products,
      async (product) => {
        try {
          const comps =
            await productCarCompatibilityService.listCompatibilities(product.id);
          return { product, comps };
        } catch (error) {
          console.warn(
            `Trim scan: compatibility failed for product ${product.id}`,
            error,
          );
          return { product, comps: [] as ProductCarCompatibility[] };
        }
      },
      10,
    );

    const rows: TrimAssignmentRow[] = [];
    for (const { product, comps } of compatLists) {
      for (const compat of comps) {
        // When scoped to a make/model, keep only matching vehicle rows
        if (params.make && params.make !== "any") {
          if (
            (compat.carBrand || "").toLowerCase() !== params.make.toLowerCase()
          ) {
            continue;
          }
        }
        if (params.model && params.model !== "any") {
          if (
            (compat.carModel || "").toLowerCase() !== params.model.toLowerCase()
          ) {
            continue;
          }
        }
        rows.push(compatToRow(compat, product));
      }
    }

    const carPartsProducts: CarPartsProductOption[] = products.map((p) => ({
      id: p.id,
      label: productDisplayName(p),
      itemCode: p.itemCode,
    }));

    return {
      rows: sortRows(rows),
      carPartsProducts,
      productsScanned: products.length,
      productsTotal: products.length,
      truncated: false,
    };
  }

  filterByMake(rows: TrimAssignmentRow[], make: string): TrimAssignmentRow[] {
    if (!make || make === "any") return rows;
    const target = make.toLowerCase();
    return rows.filter((r) => (r.carBrand || "").toLowerCase() === target);
  }

  filterByModel(rows: TrimAssignmentRow[], model: string): TrimAssignmentRow[] {
    if (!model || model === "any") return rows;
    const target = model.toLowerCase();
    return rows.filter((r) => (r.carModel || "").toLowerCase() === target);
  }

  filterByYear(rows: TrimAssignmentRow[], year: number | null): TrimAssignmentRow[] {
    if (year == null || Number.isNaN(year)) return rows;
    return rows.filter((r) =>
      isYearInCompatibilityRange(year, r.yearFrom, r.yearTo),
    );
  }

  filterByTrim(rows: TrimAssignmentRow[], trimFilter: string): TrimAssignmentRow[] {
    if (!trimFilter || trimFilter === "any") return rows;
    if (trimFilter === ALL_TRIMS_FILTER) {
      return rows.filter((r) => r.trim === null);
    }
    const target = trimFilter.toLowerCase();
    return rows.filter((r) => (r.trim || "").toLowerCase() === target);
  }

  filterByProductSearch(
    rows: TrimAssignmentRow[],
    query: string,
  ): TrimAssignmentRow[] {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.itemCode.toLowerCase().includes(q),
    );
  }

  uniqueBrands(rows: TrimAssignmentRow[]): string[] {
    return Array.from(
      new Set(rows.map((r) => r.carBrand).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }

  uniqueModels(rows: TrimAssignmentRow[], make: string): string[] {
    const filtered =
      !make || make === "any"
        ? rows
        : rows.filter(
            (r) => (r.carBrand || "").toLowerCase() === make.toLowerCase(),
          );
    return Array.from(
      new Set(filtered.map((r) => r.carModel).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }

  uniqueTrimOptions(rows: TrimAssignmentRow[]): string[] {
    const names = new Set<string>();
    for (const r of rows) {
      if (r.trim) names.add(r.trim);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }

  computeSummaryStats(rows: TrimAssignmentRow[]): TrimAssignmentSummary {
    if (rows.length === 0) {
      return {
        assignmentCount: 0,
        uniqueTrimCount: 0,
        allTrimsRowCount: 0,
        productCount: 0,
        yearSpanLabel: "—",
      };
    }

    const trimNames = new Set<string>();
    let allTrimsRowCount = 0;
    const productIds = new Set<string>();
    let minFrom = rows[0].yearFrom;
    let maxTo: number | null = rows[0].yearTo;
    let hasOpenEnd = rows.some((r) => r.yearTo === null);

    for (const r of rows) {
      productIds.add(r.productId);
      if (r.trim === null) allTrimsRowCount += 1;
      else trimNames.add(r.trim);
      minFrom = Math.min(minFrom, r.yearFrom);
      if (r.yearTo === null) {
        hasOpenEnd = true;
      } else if (maxTo === null) {
        maxTo = r.yearTo;
      } else {
        maxTo = Math.max(maxTo, r.yearTo);
      }
    }

    let yearSpanLabel: string;
    if (hasOpenEnd) {
      yearSpanLabel = `${minFrom}–Present`;
    } else if (maxTo != null && minFrom === maxTo) {
      yearSpanLabel = `${minFrom}`;
    } else if (maxTo != null) {
      yearSpanLabel = `${minFrom}–${maxTo}`;
    } else {
      yearSpanLabel = `${minFrom}–Present`;
    }

    return {
      assignmentCount: rows.length,
      uniqueTrimCount: trimNames.size,
      allTrimsRowCount,
      productCount: productIds.size,
      yearSpanLabel,
    };
  }

  resolveCarId(brand: string, model: string, cars: Car[]): string {
    return resolveCarIdForMakeModel(brand, model, cars);
  }

  formatYearRange(yearFrom: number, yearTo: number | null): string {
    return productCarCompatibilityService.formatYearRange(yearFrom, yearTo);
  }
}

export const trimAssignmentsService = new TrimAssignmentsService();
