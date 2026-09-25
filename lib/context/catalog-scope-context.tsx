"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

export interface CatalogScope {
  /** Product type code, e.g. spare_parts */
  code: string;
  /** Storefront / URL slug, e.g. spare-parts */
  slug: string;
  /** Human label for page titles */
  label: string;
  /** Optional storefront path for "View on site" */
  storefrontPath?: string;
}

const CatalogScopeContext = createContext<CatalogScope | null>(null);

export function CatalogScopeProvider({
  value,
  children,
}: {
  value: CatalogScope;
  children: ReactNode;
}) {
  const memo = useMemo(() => value, [value.code, value.slug, value.label, value.storefrontPath]);
  return (
    <CatalogScopeContext.Provider value={memo}>
      {children}
    </CatalogScopeContext.Provider>
  );
}

export function useCatalogScope(): CatalogScope | null {
  return useContext(CatalogScopeContext);
}
