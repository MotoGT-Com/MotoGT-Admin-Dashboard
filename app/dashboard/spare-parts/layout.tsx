"use client";

import { CatalogSectionLayout } from "@/components/catalog/catalog-section-layout";
import {
  SPARE_PARTS_CODE,
  SPARE_PARTS_SLUG,
} from "@/lib/domain/product-types";

const SPARE_PARTS_SCOPE = {
  code: SPARE_PARTS_CODE,
  slug: SPARE_PARTS_SLUG,
  label: "Spare Parts",
  storefrontPath: "/spare-parts",
} as const;

const TABS = [
  { href: "/dashboard/spare-parts", label: "Products", exact: true },
  {
    href: "/dashboard/spare-parts/categories",
    label: "Categories",
    exact: false,
  },
];

export default function SparePartsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CatalogSectionLayout
      scope={SPARE_PARTS_SCOPE}
      description="Manage spare parts products and categories with vehicle fitment — merchandised separately on the storefront."
      tabs={TABS}
    >
      {children}
    </CatalogSectionLayout>
  );
}
