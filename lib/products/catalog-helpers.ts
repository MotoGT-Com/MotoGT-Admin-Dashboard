import type { Product } from "@/lib/services/product.service";
import { getEffectiveStockQuantity } from "@/lib/services/product.service";

export const COMING_SOON_STOCK = 1_000_000;
export const STOREFRONT_BASE_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://motogt.com";

export type CatalogStatus = "draft" | "active" | "archived" | "coming_soon";
export type CompletenessKey =
  | "no_image"
  | "no_fitment"
  | "missing_ar"
  | "no_category";

export type ProductSortKey =
  | "price"
  | "stockQuantity"
  | "createdAt"
  | "updatedAt"
  | null;

export const COMPLETENESS_LABELS: Record<CompletenessKey, string> = {
  no_image: "No image",
  no_fitment: "No fitment assigned",
  missing_ar: "Missing Arabic translation",
  no_category: "No category",
};

export function hasProductImage(product: Product): boolean {
  return Boolean(
    product.mainImage ||
      product.secondaryImage ||
      (product.images && product.images.length > 0)
  );
}

export function hasArabicTranslation(product: Product): boolean {
  return Boolean(
    product.translations?.some(
      (t) =>
        t.languageCode?.toLowerCase() === "ar" &&
        Boolean(t.name?.trim())
    )
  );
}

export function hasFitment(product: Product): boolean {
  return Boolean(product.carCompatibility && product.carCompatibility.length > 0);
}

export function hasCategory(product: Product): boolean {
  return Boolean(product.categoryId);
}

export function getCompletenessGaps(product: Product): CompletenessKey[] {
  const gaps: CompletenessKey[] = [];
  if (!hasProductImage(product)) gaps.push("no_image");
  if (!hasFitment(product)) gaps.push("no_fitment");
  if (!hasArabicTranslation(product)) gaps.push("missing_ar");
  if (!hasCategory(product)) gaps.push("no_category");
  return gaps;
}

export function matchesCompletenessFilter(
  product: Product,
  active: CompletenessKey[]
): boolean {
  if (active.length === 0) return true;
  const gaps = new Set(getCompletenessGaps(product));
  return active.every((key) => gaps.has(key));
}

export function getCatalogStatus(product: Product): CatalogStatus {
  const stock = getEffectiveStockQuantity(product);
  if (stock === COMING_SOON_STOCK) return "coming_soon";
  if (!product.isActive) return "archived";
  // Active but not storefront-ready → treat as draft for ops triage
  if (!product.categoryId) return "draft";
  return "active";
}

export const CATALOG_STATUS_LABELS: Record<CatalogStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
  coming_soon: "Coming Soon",
};

export const CATALOG_STATUS_CLASS: Record<CatalogStatus, string> = {
  draft: "bg-slate-900/40 text-slate-300",
  active: "bg-green-900/30 text-green-300",
  archived: "bg-zinc-900/40 text-zinc-400",
  coming_soon: "bg-sky-900/30 text-sky-300",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildStorefrontProductUrl(product: Product): string {
  const en =
    product.translations?.find((t) => t.languageCode?.toLowerCase() === "en") ||
    product.translations?.[0];
  const slugSource = en?.slug?.trim() || en?.name?.trim() || product.name || "product";
  const slug = slugify(slugSource) || "product";
  return `${STOREFRONT_BASE_URL}/product/${slug}-${product.id}`;
}

export function cycleSort(
  currentKey: ProductSortKey,
  currentOrder: "asc" | "desc",
  nextKey: Exclude<ProductSortKey, null>
): { key: ProductSortKey; order: "asc" | "desc" } {
  if (currentKey !== nextKey) return { key: nextKey, order: "asc" };
  if (currentOrder === "asc") return { key: nextKey, order: "desc" };
  return { key: null, order: "asc" };
}

export function sortProducts(
  list: Product[],
  sortKey: ProductSortKey,
  sortOrder: "asc" | "desc"
): Product[] {
  if (!sortKey) {
    return [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  const dir = sortOrder === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "price") cmp = a.price - b.price;
    else if (sortKey === "stockQuantity") {
      cmp = getEffectiveStockQuantity(a) - getEffectiveStockQuantity(b);
    } else if (sortKey === "createdAt") {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return cmp * dir;
  });
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const body = [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map((c) => escape(String(c ?? ""))).join(",")),
  ].join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportPreviewRow = {
  rowNumber: number;
  action: "create" | "update" | "skip";
  valid: boolean;
  errors: string[];
  itemCode: string;
  name: string;
  sellingPrice: number | null;
  quantity: number | null;
  category: string;
  productType: string;
  raw: Record<string, string>;
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function buildImportPreview(
  csvText: string,
  existingItemCodes: Set<string>
): ImportPreviewRow[] {
  const rows = parseCsv(csvText);
  return rows.map((raw, idx) => {
    const errors: string[] = [];
    const itemCode = raw.itemCode || "";
    const name = raw.name || "";
    const category = raw.category || "";
    const productType = raw.productType || "";
    const priceRaw = raw.sellingPrice || "";
    const qtyRaw = raw.quantity || "";

    if (!itemCode) errors.push("itemCode is required");
    if (!name) errors.push("name is required");
    if (!category) errors.push("category is required");
    if (!priceRaw) errors.push("sellingPrice is required");
    if (!qtyRaw) errors.push("quantity is required");

    const sellingPrice = priceRaw ? Number(priceRaw) : null;
    const quantity = qtyRaw ? Number(qtyRaw) : null;
    if (priceRaw && (sellingPrice === null || Number.isNaN(sellingPrice) || sellingPrice < 0)) {
      errors.push("sellingPrice must be a non-negative number");
    }
    if (qtyRaw && (quantity === null || Number.isNaN(quantity) || quantity < 0)) {
      errors.push("quantity must be a non-negative integer");
    }
    if (
      productType &&
      !["car-parts", "non-car-parts", "motorcycles", "car-care"].some((t) =>
        productType.toLowerCase().includes(t.split("-")[0])
      ) &&
      productType.length > 0
    ) {
      // soft check only — codes vary by environment
    }
    if (productType.toLowerCase().includes("car-parts")) {
      if (!raw.carMake) errors.push("carMake required for car-parts");
      if (!raw.carModel) errors.push("carModel required for car-parts");
      if (!raw.carYearFrom) errors.push("carYearFrom required for car-parts");
    }

    const exists = itemCode ? existingItemCodes.has(itemCode) : false;
    const valid = errors.length === 0;
    return {
      rowNumber: idx + 2,
      action: !valid ? "skip" : exists ? "update" : "create",
      valid,
      errors,
      itemCode,
      name,
      sellingPrice: sellingPrice !== null && !Number.isNaN(sellingPrice) ? sellingPrice : null,
      quantity: quantity !== null && !Number.isNaN(quantity) ? quantity : null,
      category,
      productType,
      raw,
    };
  });
}
