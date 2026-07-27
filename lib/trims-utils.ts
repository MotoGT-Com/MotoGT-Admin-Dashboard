import type { Car } from "@/lib/services/car.service";

export function normalizeTrim(trim: string | null | undefined): string | null {
  const value = (trim || "").trim();
  return value || null;
}

export function trimKey(
  trim: string | null,
  yearFrom: number,
  yearTo: number | null,
): string {
  return `${normalizeTrim(trim) ?? ""}|${yearFrom}|${yearTo ?? ""}`;
}

export function validateYearRange(
  yearFromStr: string,
  yearToStr: string,
): { yearFrom: number; yearTo: number | null } | string {
  const yearFrom = parseInt(yearFromStr, 10);
  if (!yearFromStr || Number.isNaN(yearFrom) || yearFrom < 1900) {
    return "Year From is required and must be >= 1900";
  }
  if (!yearToStr.trim()) {
    return { yearFrom, yearTo: null };
  }
  const yearTo = parseInt(yearToStr, 10);
  if (Number.isNaN(yearTo)) {
    return "Year To must be a number";
  }
  if (yearTo < yearFrom) {
    return "Year To must be >= Year From";
  }
  return { yearFrom, yearTo };
}

export function resolveCarIdForMakeModel(
  brand: string,
  model: string,
  cars: Pick<Car, "id" | "brand" | "model" | "trim">[],
): string {
  const matches = cars.filter((c) => c.brand === brand && c.model === model);
  const withoutTrim = matches.find((c) => !(c.trim || "").trim());
  return withoutTrim?.id || matches[0]?.id || "";
}

export function isYearInCompatibilityRange(
  year: number,
  yearFrom: number,
  yearTo: number | null,
): boolean {
  return year >= yearFrom && (yearTo === null || year <= yearTo);
}

export const ALL_TRIMS_FILTER = "__all_trims__";
