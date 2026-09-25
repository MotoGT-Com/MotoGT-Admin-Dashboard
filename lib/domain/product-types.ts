/**
 * Catalog product-type codes/slugs used across admin + storefront.
 * Spare parts share the same product schema and vehicle fitment as car accessories.
 */

export const SPARE_PARTS_CODE = "spare_parts";
export const SPARE_PARTS_SLUG = "spare-parts";

export const CAR_PARTS_CODE = "car_parts";
export const CAR_PARTS_SLUG = "car-parts";

/** Types that require vehicle fitment (make / model / year). */
export const VEHICLE_FITMENT_TYPE_CODES = new Set([
  CAR_PARTS_CODE,
  SPARE_PARTS_CODE,
]);

export function normalizeProductTypeKey(
  value?: string | null,
): string {
  return (value || "").toLowerCase().replace(/-/g, "_").trim();
}

export function productTypeRequiresFitment(codeOrSlug?: string | null): boolean {
  return VEHICLE_FITMENT_TYPE_CODES.has(normalizeProductTypeKey(codeOrSlug));
}

export function matchesProductType(
  type: { code?: string | null; slug?: string | null; id?: string },
  codeOrSlugOrId: string,
): boolean {
  const needle = codeOrSlugOrId.trim();
  if (!needle) return false;
  if (type.id && type.id === needle) return true;
  const normalizedNeedle = normalizeProductTypeKey(needle);
  return (
    normalizeProductTypeKey(type.code) === normalizedNeedle ||
    normalizeProductTypeKey(type.slug) === normalizedNeedle
  );
}
