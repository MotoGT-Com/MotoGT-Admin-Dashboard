"use client";

import { Suspense } from "react";
import ProductsPage from "../products/page";
import { LoadingState } from "@/components/loading-state";

/** Car Accessories → Products tab. */
export default function CarAccessoriesProductsPage() {
  return (
    <Suspense
      fallback={<LoadingState variant="full" label="Loading products…" />}
    >
      <ProductsPage />
    </Suspense>
  );
}
