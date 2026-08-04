"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Minus, Plus } from "lucide-react";
import {
  mockProducts,
  mockFeaturedProductIds,
  type CartLine,
  type MockProduct,
} from "@/lib/mock-data/in-store";

const categories = Array.from(new Set(mockProducts.map((p) => p.category)));

interface ProductPickerProps {
  cart: CartLine[];
  onAdd: (productId: string, quantity: number) => void;
}

export function ProductPicker({ cart, onAdd }: ProductPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getQuantity = (productId: string) => quantities[productId] ?? 1;
  const setQuantity = (productId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, qty) }));
  };

  const cartQtyByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of cart) map[line.productId] = line.quantity;
    return map;
  }, [cart]);

  const hasQuery = searchQuery.trim().length > 0;
  const showingFeatured = !hasQuery && !activeCategory;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mockProducts.filter((p) => {
      const matchesCategory = !activeCategory || p.category === activeCategory;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  const featuredProducts = useMemo(
    () =>
      mockFeaturedProductIds
        .map((id) => mockProducts.find((p) => p.id === id))
        .filter((p): p is MockProduct => Boolean(p)),
    []
  );

  const resultsToShow = showingFeatured ? featuredProducts : filteredProducts;

  const handleAdd = (productId: string) => {
    onAdd(productId, getQuantity(productId));
    setQuantities((prev) => ({ ...prev, [productId]: 1 }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const top = resultsToShow[0];
    if (!top) return;
    e.preventDefault();
    handleAdd(top.id);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <Input
          ref={searchInputRef}
          autoFocus
          placeholder="Search by name, SKU, or category..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeCategory === null ? "default" : "outline"}
          onClick={() => setActiveCategory(null)}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            size="sm"
            variant={activeCategory === category ? "default" : "outline"}
            onClick={() =>
              setActiveCategory((prev) => (prev === category ? null : category))
            }
          >
            {category}
          </Button>
        ))}
      </div>

      {showingFeatured && (
        <p className="text-xs text-muted-foreground -mb-1">
          Frequently sold — search or pick a category to see more.
        </p>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
          {resultsToShow.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No products match your search.
            </div>
          ) : (
            resultsToShow.map((product) => {
              const inCartQty = cartQtyByProduct[product.id];
              return (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center gap-3 p-4 hover:bg-primary/5 transition"
                >
                  <img
                    src="/placeholder.svg"
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-[160px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{product.name}</p>
                      {inCartQty && (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          In cart · {inCartQty}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {product.sku} · {product.category}
                    </p>
                  </div>
                  <p className="font-semibold text-sm w-24 text-right">
                    {product.currency} {product.price.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setQuantity(product.id, getQuantity(product.id) - 1)
                      }
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="w-8 text-center text-sm">
                      {getQuantity(product.id)}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setQuantity(product.id, getQuantity(product.id) + 1)
                      }
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => handleAdd(product.id)}>
                    Add
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
