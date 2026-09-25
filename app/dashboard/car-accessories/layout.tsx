"use client";

import { CatalogSectionLayout } from "@/components/catalog/catalog-section-layout";
import {
  CAR_PARTS_CODE,
  CAR_PARTS_SLUG,
} from "@/lib/domain/product-types";

const CAR_ACCESSORIES_SCOPE = {
  code: CAR_PARTS_CODE,
  slug: CAR_PARTS_SLUG,
  label: "Car Accessories",
  storefrontPath: "/shop/car-parts",
} as const;

const TABS = [
  { href: "/dashboard/car-accessories", label: "Products", exact: true },
  {
    href: "/dashboard/car-accessories/categories",
    label: "Categories",
    exact: false,
  },
];

export default function CarAccessoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CatalogSectionLayout
      scope={CAR_ACCESSORIES_SCOPE}
      description="Manage car accessory products and categories with vehicle fitment for the storefront car-parts catalog."
      tabs={TABS}
    >
      {children}
    </CatalogSectionLayout>
  );
}
