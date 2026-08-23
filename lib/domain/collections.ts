/**
 * Collection domain types (API-shaped for a future /admin/collections backend).
 * Condition values are catalog IDs / numbers aligned with product list filters.
 */

import type { ProductListParams } from "@/lib/services/product.service";

export type CollectionType = "manual" | "automated";
export type CollectionStatus = "draft" | "active";

export type CollectionConditionField =
  | "category"
  | "product_type"
  | "price"
  | "stock"
  | "car_make"
  | "car_model"
  | "car_year"
  | "is_active";

export type CollectionConditionOperator =
  | "is"
  | "is_not"
  | "equals"
  | "greater_than"
  | "less_than";

export interface CollectionCondition {
  id: string;
  field: CollectionConditionField;
  operator: CollectionConditionOperator;
  /** ID, brand string, number, or "true"/"false" depending on field. */
  value: string;
  /** Human label for selects (category name, make, etc.). */
  valueLabel?: string;
}

export interface CollectionProduct {
  id: string;
  name: string;
  sku?: string;
  price: number;
  currency?: string;
  stock?: number | null;
  image?: string | null;
  categoryName?: string;
  productTypeName?: string;
  carMake?: string | null;
  /** Manual membership sort position (0-based). */
  position?: number;
}

export interface CollectionTranslation {
  languageCode: string;
  title: string;
  description: string;
  languageId?: string;
}

export interface Collection {
  id: string;
  storeId: string;
  type: CollectionType;
  status: CollectionStatus;
  /** URL-friendly handle; no leading slash (API normalized). */
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  translations: CollectionTranslation[];
  /** Manual curated product IDs in display order. */
  productIds: string[];
  conditions: CollectionCondition[];
  /** Product IDs excluded from membership / preview. */
  excludedProductIds: string[];
  createdAt: string;
  updatedAt: string;
  /** Live membership count when returned by list/detail. */
  productCount?: number;
}

export interface CollectionListItem extends Collection {
  productCount: number;
  /** List API denormalized title (EN preference). */
  title?: string;
}

export interface CreateCollectionInput {
  storeId: string;
  type: CollectionType;
  status?: CollectionStatus;
  slug?: string;
  imageUrl?: string | null;
  sortOrder?: number;
  translations: CollectionTranslation[];
  productIds?: string[];
  conditions?: CollectionCondition[];
  excludedProductIds?: string[];
}

export interface UpdateCollectionInput {
  type?: CollectionType;
  status?: CollectionStatus;
  slug?: string;
  imageUrl?: string | null;
  sortOrder?: number;
  translations?: CollectionTranslation[];
  productIds?: string[];
  conditions?: CollectionCondition[];
  excludedProductIds?: string[];
}

export interface ListCollectionsParams {
  storeId: string;
  search?: string;
  type?: CollectionType | "all";
  status?: CollectionStatus | "all";
}

export const COLLECTION_TYPE_LABELS: Record<CollectionType, string> = {
  manual: "Manual",
  automated: "Automated",
};

export const COLLECTION_STATUS_LABELS: Record<CollectionStatus, string> = {
  draft: "Draft",
  active: "Active",
};

export const CONDITION_FIELD_LABELS: Record<CollectionConditionField, string> =
  {
    category: "Category",
    product_type: "Product type",
    price: "Price",
    stock: "Stock",
    car_make: "Car make",
    car_model: "Car model",
    car_year: "Car year",
    is_active: "Active status",
  };

export function operatorsForField(
  field: CollectionConditionField,
): CollectionConditionOperator[] {
  switch (field) {
    case "category":
    case "product_type":
    case "car_make":
    case "car_model":
      return ["is", "is_not"];
    case "car_year":
      return ["equals", "greater_than", "less_than"];
    case "is_active":
      return ["is"];
    case "price":
    case "stock":
      return ["equals", "greater_than", "less_than"];
    default:
      return ["is"];
  }
}

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Strip leading slashes — API stores handles without `/`. */
export function normalizeCollectionSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/^\/+/, "");
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): boolean {
  return Boolean(value && UUID_RE.test(value));
}

/**
 * Map UI operators ↔ API operators.
 * Backend price/stock use `gt` / `lt`; UI keeps `greater_than` / `less_than`.
 */
export function toApiConditionOperator(
  field: CollectionConditionField,
  operator: string,
): string {
  if (field === "price" || field === "stock") {
    if (operator === "greater_than") return "gt";
    if (operator === "less_than") return "lt";
  }
  return operator;
}

export function fromApiConditionOperator(
  field: CollectionConditionField,
  operator: string,
): CollectionConditionOperator {
  if (field === "price" || field === "stock") {
    if (operator === "gt") return "greater_than";
    if (operator === "lt") return "less_than";
  }
  return operator as CollectionConditionOperator;
}

export function toApiCondition(
  condition: CollectionCondition,
): {
  id?: string;
  field: CollectionConditionField;
  operator: string;
  value: string;
  valueLabel?: string | null;
} {
  return {
    ...(isUuid(condition.id) ? { id: condition.id } : {}),
    field: condition.field,
    operator: toApiConditionOperator(condition.field, condition.operator),
    value: condition.value,
    valueLabel: condition.valueLabel ?? null,
  };
}

export function fromApiCondition(raw: {
  id: string;
  field: string;
  operator: string;
  value: string;
  valueLabel?: string | null;
}): CollectionCondition {
  const field = raw.field as CollectionConditionField;
  return {
    id: raw.id,
    field,
    operator: fromApiConditionOperator(field, raw.operator),
    value: raw.value,
    valueLabel: raw.valueLabel ?? undefined,
  };
}

export function getCollectionTitle(
  collection: Pick<Collection, "translations"> & { title?: string },
  languageCode = "en",
): string {
  if (collection.title?.trim()) return collection.title.trim();
  const match =
    collection.translations?.find((t) => t.languageCode === languageCode) ||
    collection.translations?.find((t) => t.languageCode === "en") ||
    collection.translations?.[0];
  return match?.title?.trim() || "Untitled collection";
}

export function getCollectionDescription(
  collection: Pick<Collection, "translations">,
  languageCode = "en",
): string {
  const match =
    collection.translations.find((t) => t.languageCode === languageCode) ||
    collection.translations.find((t) => t.languageCode === "en") ||
    collection.translations[0];
  return match?.description?.trim() || "";
}

/** Client-side filters that cannot be fully expressed in list query params. */
export type ClientProductFilter =
  | {
      kind: "category_not";
      categoryId: string;
    }
  | {
      kind: "product_type_not";
      productTypeId: string;
    }
  | {
      kind: "car_make_not";
      carBrand: string;
    }
  | {
      kind: "car_model_not";
      carModel: string;
    }
  | {
      kind: "car_year";
      operator: "equals" | "greater_than" | "less_than";
      value: number;
    }
  | {
      kind: "price";
      operator: "equals" | "greater_than" | "less_than";
      value: number;
    }
  | {
      kind: "stock";
      operator: "equals" | "greater_than" | "less_than";
      value: number;
    };

export interface ConditionsQueryPlan {
  /** Partial product list params derived from pushable conditions. */
  api: Partial<
    Pick<
      ProductListParams,
      | "categoryId"
      | "productTypeId"
      | "carBrand"
      | "carModel"
      | "carYear"
      | "isActive"
      | "minPrice"
      | "maxPrice"
      | "inStock"
    >
  >;
  clientFilters: ClientProductFilter[];
}

/**
 * Map AND conditions into API list params + leftover client filters.
 * Prefer server filters when operator is positive (`is` / range).
 */
export function conditionsToProductListParams(
  conditions: CollectionCondition[],
): ConditionsQueryPlan {
  const api: ConditionsQueryPlan["api"] = {};
  const clientFilters: ClientProductFilter[] = [];

  for (const condition of conditions) {
    if (!condition.value?.trim() && condition.field !== "is_active") continue;

    switch (condition.field) {
      case "category": {
        if (condition.operator === "is") {
          api.categoryId = condition.value;
        } else if (condition.operator === "is_not") {
          clientFilters.push({
            kind: "category_not",
            categoryId: condition.value,
          });
        }
        break;
      }
      case "product_type": {
        if (condition.operator === "is") {
          api.productTypeId = condition.value;
        } else if (condition.operator === "is_not") {
          clientFilters.push({
            kind: "product_type_not",
            productTypeId: condition.value,
          });
        }
        break;
      }
      case "car_make": {
        if (condition.operator === "is") {
          api.carBrand = condition.value;
        } else if (condition.operator === "is_not") {
          clientFilters.push({
            kind: "car_make_not",
            carBrand: condition.value,
          });
        }
        break;
      }
      case "car_model": {
        if (condition.operator === "is") {
          api.carModel = condition.value;
        } else if (condition.operator === "is_not") {
          clientFilters.push({
            kind: "car_model_not",
            carModel: condition.value,
          });
        }
        break;
      }
      case "car_year": {
        const n = Number(condition.value);
        if (!Number.isFinite(n)) break;
        if (condition.operator === "equals") {
          api.carYear = n;
        } else {
          clientFilters.push({
            kind: "car_year",
            operator: condition.operator as
              | "equals"
              | "greater_than"
              | "less_than",
            value: n,
          });
        }
        break;
      }
      case "is_active": {
        api.isActive = condition.value === "true";
        break;
      }
      case "price": {
        const n = Number(condition.value);
        if (!Number.isFinite(n)) break;
        if (condition.operator === "greater_than") {
          api.minPrice = n;
        } else if (condition.operator === "less_than") {
          api.maxPrice = n;
        } else if (condition.operator === "equals") {
          api.minPrice = n;
          api.maxPrice = n;
        } else {
          clientFilters.push({
            kind: "price",
            operator: condition.operator as
              | "equals"
              | "greater_than"
              | "less_than",
            value: n,
          });
        }
        break;
      }
      case "stock": {
        const n = Number(condition.value);
        if (!Number.isFinite(n)) break;
        if (condition.operator === "greater_than" && n === 0) {
          api.inStock = true;
        } else {
          clientFilters.push({
            kind: "stock",
            operator: condition.operator as
              | "equals"
              | "greater_than"
              | "less_than",
            value: n,
          });
        }
        break;
      }
    }
  }

  return { api, clientFilters };
}
