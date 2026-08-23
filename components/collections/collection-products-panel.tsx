"use client";

import { ArrowDown, ArrowUp, LayoutGrid, List, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CollectionProduct } from "@/lib/domain/collections";
import { cn } from "@/lib/utils";

interface CollectionProductsPanelProps {
  products: CollectionProduct[];
  type: "manual" | "automated";
  view: "list" | "grid";
  search: string;
  loading?: boolean;
  onViewChange: (view: "list" | "grid") => void;
  onSearchChange: (value: string) => void;
  onMove?: (productId: string, direction: "up" | "down") => void;
  onRemove?: (productId: string) => void;
}

export function CollectionProductsPanel({
  products,
  type,
  view,
  search,
  loading,
  onViewChange,
  onSearchChange,
  onMove,
  onRemove,
}: CollectionProductsPanelProps) {
  const q = search.trim().toLowerCase();
  const visible = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q),
      )
    : products;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"}
            {type === "automated" ? " matching" : ""}
          </p>
          {type === "automated" ? (
            <Badge variant="outline" className="text-xs">
              Preview
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search in collection…"
            className="h-9 w-full sm:w-[200px]"
          />
          <div className="flex rounded-md border border-border overflow-hidden">
            <Button
              type="button"
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              className="rounded-none"
              onClick={() => onViewChange("list")}
              aria-label="List view"
            >
              <List size={14} />
            </Button>
            <Button
              type="button"
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              className="rounded-none"
              onClick={() => onViewChange("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid size={14} />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Updating products…
        </p>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">No products yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {type === "manual"
              ? "Use Add products in the side panel to curate this collection."
              : "Add conditions to automatically include matching products."}
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {visible.map((product) => (
            <div
              key={product.id}
              className="rounded-lg border border-border p-3 space-y-2 relative group"
            >
              <div className="aspect-square rounded-md bg-muted flex items-center justify-center overflow-hidden">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium line-clamp-2">{product.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {product.currency ?? "JOD"} {product.price.toFixed(2)}
              </p>
              {type === "manual" && onRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                  onClick={() => onRemove(product.id)}
                  aria-label={`Remove ${product.name}`}
                >
                  <X size={14} />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {visible.map((product, index) => {
            const globalIndex = products.findIndex((p) => p.id === product.id);
            return (
              <div
                key={product.id}
                className={cn(
                  "flex items-center gap-3 p-3 hover:bg-accent/5",
                  loading && "opacity-60",
                )}
              >
                {type === "manual" && onMove ? (
                  <div className="flex flex-col gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6"
                      disabled={globalIndex <= 0}
                      onClick={() => onMove(product.id, "up")}
                      aria-label="Move up"
                    >
                      <ArrowUp size={12} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6"
                      disabled={globalIndex >= products.length - 1}
                      onClick={() => onMove(product.id, "down")}
                      aria-label="Move down"
                    >
                      <ArrowDown size={12} />
                    </Button>
                  </div>
                ) : (
                  <span className="w-6 text-center text-xs text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                )}
                <div className="h-12 w-12 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden border border-border">
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
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[product.sku, product.categoryName]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium tabular-nums">
                    {product.currency ?? "JOD"} {product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {product.stock ?? "—"}
                  </p>
                </div>
                {type === "manual" && onRemove ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(product.id)}
                    aria-label={`Remove ${product.name}`}
                  >
                    <X size={14} />
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
