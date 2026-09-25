"use client";

import { Suspense } from "react";
import CategoriesPage from "../../categories/page";
import { LoadingState } from "@/components/loading-state";

/** Car Accessories → Categories tab. */
export default function CarAccessoriesCategoriesPage() {
  return (
    <Suspense
      fallback={<LoadingState variant="full" label="Loading categories…" />}
    >
      <CategoriesPage />
    </Suspense>
  );
}
