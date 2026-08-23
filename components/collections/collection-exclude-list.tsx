"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CollectionProduct } from "@/lib/domain/collections";

interface CollectionExcludeListProps {
  products: CollectionProduct[];
  onRemove: (productId: string) => void;
  onAddClick: () => void;
}

export function CollectionExcludeList({
  products,
  onRemove,
  onAddClick,
}: CollectionExcludeListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Excluded products</p>
          <p className="text-xs text-muted-foreground">
            These products never appear in this collection.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddClick}>
          Exclude
        </Button>
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border px-3 py-4 text-center">
          No exclusions
        </p>
      ) : (
        <ul className="space-y-2">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2"
            >
              <span className="flex-1 min-w-0 text-sm truncate">
                {product.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemove(product.id)}
                aria-label={`Stop excluding ${product.name}`}
              >
                <X size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
