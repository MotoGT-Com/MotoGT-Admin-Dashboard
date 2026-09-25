"use client";

import { Suspense } from "react";
import ProductsPage from "../products/page";
import { LoadingState } from "@/components/loading-state";

/**
 * Spare Parts → Products tab.
 * Reuses the full products catalog with CatalogScope locked to spare_parts.
 */
export default function SparePartsProductsPage() {
  return (
    <Suspense fallback={<LoadingState variant="full" label="Loading products…" />}>
      <ProductsPage />
    </Suspense>
  );
}
