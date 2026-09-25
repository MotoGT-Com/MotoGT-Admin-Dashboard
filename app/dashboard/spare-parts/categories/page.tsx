"use client";

import { Suspense } from "react";
import CategoriesPage from "../../categories/page";
import { LoadingState } from "@/components/loading-state";

/**
 * Spare Parts → Categories tab.
 * Reuses categories management locked to the spare_parts product type.
 */
export default function SparePartsCategoriesPage() {
  return (
    <Suspense fallback={<LoadingState variant="full" label="Loading categories…" />}>
      <CategoriesPage />
    </Suspense>
  );
}
