"use client";

import { useEffect, useState } from "react";
import { Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LoadingState } from "@/components/loading-state";
import { collectionService } from "@/lib/services/collection.service";
import type { CollectionProduct } from "@/lib/domain/collections";
import { cn } from "@/lib/utils";

interface AddProductsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  languageId: string;
  title?: string;
  description?: string;
  selectedIds: string[];
  onConfirm: (productIds: string[]) => void;
}

export function AddProductsSheet({
  open,
  onOpenChange,
  storeId,
  languageId,
  title = "Add products",
  description = "Select products from your live catalog.",
  selectedIds,
  onConfirm,
}: AddProductsSheetProps) {
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState<CollectionProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setDraft(new Set(selectedIds));
    setSearch("");
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open || !storeId || !languageId) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await collectionService.searchProducts(
            storeId,
            languageId,
            { search, limit: 50, page: 1 },
          );
          if (!cancelled) setCatalog(res.products);
        } catch (err: unknown) {
          if (!cancelled) {
            setCatalog([]);
            setError(
              err instanceof Error ? err.message : "Failed to load products",
            );
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, storeId, languageId, search]);

  const toggle = (id: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-3 border-b border-border space-y-1">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="px-6 py-3 border-b border-border">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog…"
              className="pl-8 h-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {loading ? (
            <LoadingState label="Loading products…" className="py-10" />
          ) : error ? (
            <p className="text-sm text-destructive text-center py-10 px-6">
              {error}
            </p>
          ) : catalog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10 px-6">
              No products match your search.
            </p>
          ) : (
            catalog.map((product) => {
              const checked = draft.has(product.id);
              return (
                <label
                  key={product.id}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-accent/5",
                    checked && "bg-primary/5",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(product.id)}
                  />
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0 border border-border overflow-hidden">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[product.sku, product.categoryName]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                    {(product.currency ?? "JOD")} {product.price.toFixed(2)}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex-row gap-2 sm:justify-between">
          <p className="text-sm text-muted-foreground self-center">
            {draft.size} selected
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onConfirm(Array.from(draft));
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
