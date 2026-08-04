"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Minus, Plus, X } from "lucide-react";
import {
  mockProducts,
  mockFeaturedProductIds,
  type CartLine,
  type MockProduct,
} from "@/lib/mock-data/in-store";

const categories = Array.from(new Set(mockProducts.map((p) => p.category)));

const allFitments = mockProducts.flatMap((p) => p.fitment ?? []);
const fitmentMakes = Array.from(new Set(allFitments.map((f) => f.make))).sort();

/**
 * A product matches the vehicle filter when it has a fitment entry for the
 * selected make/model/year. Products without fitment data are universal
 * (fluids, batteries, wipers...) and match any vehicle.
 */
function matchesVehicle(
  product: MockProduct,
  make: string | null,
  model: string | null,
  year: string | null
): boolean {
  if (!make) return true;
  if (!product.fitment) return true; // universal fit
  return product.fitment.some(
    (f) =>
      f.make === make &&
      (!model || f.model === model) &&
      (!year || f.years.includes(year))
  );
}

interface ProductPickerProps {
  cart: CartLine[];
  onAdd: (productId: string, quantity: number) => void;
}

export function ProductPicker({ cart, onAdd }: ProductPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Vehicle filter (cascading: make → model → year).
  const [vehicleMake, setVehicleMake] = useState<string | null>(null);
  const [vehicleModel, setVehicleModel] = useState<string | null>(null);
  const [vehicleYear, setVehicleYear] = useState<string | null>(null);

  const modelOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allFitments
            .filter((f) => f.make === vehicleMake)
            .map((f) => f.model)
        )
      ).sort(),
    [vehicleMake]
  );

  const yearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allFitments
            .filter(
              (f) =>
                f.make === vehicleMake &&
                (!vehicleModel || f.model === vehicleModel)
            )
            .flatMap((f) => f.years)
        )
      ).sort((a, b) => Number(b) - Number(a)),
    [vehicleMake, vehicleModel]
  );

  const handleMakeChange = (make: string) => {
    setVehicleMake(make);
    setVehicleModel(null);
    setVehicleYear(null);
  };

  const handleModelChange = (model: string) => {
    setVehicleModel(model);
    setVehicleYear(null);
  };

  const clearVehicleFilter = () => {
    setVehicleMake(null);
    setVehicleModel(null);
    setVehicleYear(null);
  };

  const vehicleFilterActive = Boolean(vehicleMake);

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
  const showingFeatured = !hasQuery && !activeCategory && !vehicleFilterActive;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mockProducts.filter((p) => {
      const matchesCategory = !activeCategory || p.category === activeCategory;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return (
        matchesCategory &&
        matchesQuery &&
        matchesVehicle(p, vehicleMake, vehicleModel, vehicleYear)
      );
    });
  }, [searchQuery, activeCategory, vehicleMake, vehicleModel, vehicleYear]);

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

      {/* Vehicle fitment filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={vehicleMake ?? ""} onValueChange={handleMakeChange}>
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue placeholder="Make" />
          </SelectTrigger>
          <SelectContent>
            {fitmentMakes.map((make) => (
              <SelectItem key={make} value={make}>
                {make}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={vehicleModel ?? ""}
          onValueChange={handleModelChange}
          disabled={!vehicleMake}
        >
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={vehicleYear ?? ""}
          onValueChange={setVehicleYear}
          disabled={!vehicleMake}
        >
          <SelectTrigger size="sm" className="w-[100px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {vehicleFilterActive && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={clearVehicleFilter}
          >
            <X size={14} className="mr-1" />
            Clear vehicle
          </Button>
        )}
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
              {vehicleFilterActive
                ? "No products fit the selected vehicle."
                : "No products match your search."}
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
                      {vehicleFilterActive && !product.fitment && (
                        <span className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-full whitespace-nowrap">
                          Universal fit
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
