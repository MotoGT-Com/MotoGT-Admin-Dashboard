"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CatalogScopeProvider,
  type CatalogScope,
} from "@/lib/context/catalog-scope-context";
import { STOREFRONT_BASE_URL } from "@/lib/products/catalog-helpers";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export interface CatalogSectionTab {
  href: string;
  label: string;
  /** When true, only exact path matches (Products tab). */
  exact?: boolean;
}

interface CatalogSectionLayoutProps {
  scope: CatalogScope;
  description: string;
  tabs: CatalogSectionTab[];
  children: React.ReactNode;
}

export function CatalogSectionLayout({
  scope,
  description,
  tabs,
  children,
}: CatalogSectionLayoutProps) {
  const pathname = usePathname();

  return (
    <CatalogScopeProvider value={scope}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {scope.label}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          {scope.storefrontPath ? (
            <a
              href={`${STOREFRONT_BASE_URL}${scope.storefrontPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground shrink-0"
            >
              View on storefront
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>

        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </CatalogScopeProvider>
  );
}
