"use client";

/**
 * API-backed product picker for Offline / WhatsApp order entry.
 *
 * Data sources (all real backend endpoints, no mock data):
 * - Products:   GET /admin/products  (search, category, car fitment filters)
 * - Categories: GET /categories/public
 * - Vehicles:   GET /cars            (make/model/year filter options)
 * - Store/language context comes from settingsService (same as /dashboard/products).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Minus, Plus, X, Loader2 } from "lucide-react";
import { productService, type Product } from "@/lib/services/product.service";
import { categoryService, type Category } from "@/lib/services/category.service";
import { carService, type Car } from "@/lib/services/car.service";
import { settingsService } from "@/lib/services/settings.service";
import type { CartLine } from "@/lib/mock-data/in-store";

interface ProductPickerProps {
  cart: CartLine[];
  onAdd: (line: CartLine) => void;
}

const getProductName = (product: Product, languageCode: string): string => {
  const translation = product.translations?.find(
    (t) => t.languageCode === languageCode
  );
  return (
    translation?.name || product.name || product.translations?.[0]?.name || product.itemCode
  );
};

const getCategoryName = (category: Category, languageCode: string): string => {
  const translation = category.translations?.find(
    (t) => t.languageCode === languageCode
  );
  return translation?.name || category.name || category.id;
};

const yearRange = (from?: number | null, to?: number | null): number[] => {
  const start = from ?? to;
  if (!start) return [];
  const end = to ?? from ?? start;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

export function ProductPicker({ cart, onAdd }: ProductPickerProps) {
  // --- Store / language bootstrap (same source as the Products page) ---
  const [storeId, setStoreId] = useState<string | null>(null);
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState("en");
  const [currency, setCurrency] = useState("JOD");

  // --- Filter data ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [cars, setCars] = useState<Car[]>([]);

  // --- Filter state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [vehicleMake, setVehicleMake] = useState<string | null>(null);
  const [vehicleModel, setVehicleModel] = useState<string | null>(null);
  const [vehicleYear, setVehicleYear] = useState<string | null>(null);

  // --- Results ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const [stores, languages] = await Promise.all([
          settingsService.getStores(),
          settingsService.getLanguages(),
        ]);
        if (cancelled) return;
        const store = settingsService.getSelectedStore() ?? stores[0];
        const language = settingsService.getSelectedLanguage() ?? languages[0];
        if (!store || !language) {
          setLoadError("No store or language configured.");
          setIsLoading(false);
          return;
        }
        setStoreId(store.id);
        setLanguageId(language.id);
        setLanguageCode(language.code);
        setCurrency(store.currencyCode || "JOD");

        // Categories and cars load in the background; failures degrade the
        // filters but don't block product search.
        categoryService
          .listCategories({ storeId: store.id, languageId: language.id, isActive: true, limit: 100 })
          .then((cats) => !cancelled && setCategories(cats || []))
          .catch(() => {});
        carService
          .listCars({ limit: 500 })
          .then((carList) => !cancelled && setCars(carList || []))
          .catch(() => {});
      } catch (error: any) {
        if (!cancelled) {
          setLoadError(error.message || "Failed to load store settings.");
          setIsLoading(false);
        }
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Product fetch (debounced on search, immediate on filter change) ---
  const fetchProducts = useCallback(async () => {
    if (!storeId || !languageId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await productService.listProducts({
        storeId,
        languageId,
        search: searchQuery.trim() || undefined,
        categoryId: activeCategoryId || undefined,
        carBrand: vehicleMake || undefined,
        carModel: vehicleModel || undefined,
        carYear: vehicleYear ? Number(vehicleYear) : undefined,
        page: 1,
        limit: 25,
      });
      setProducts(response.data);
    } catch (error: any) {
      setLoadError(error.message || "Failed to fetch products.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, languageId, searchQuery, activeCategoryId, vehicleMake, vehicleModel, vehicleYear]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // --- Vehicle filter options derived from the cars API ---
  const makes = useMemo(
    () => Array.from(new Set(cars.map((c) => c.brand).filter(Boolean))).sort(),
    [cars]
  );
  const modelOptions = useMemo(
    () =>
      Array.from(
        new Set(
          cars.filter((c) => c.brand === vehicleMake).map((c) => c.model)
        )
      ).sort(),
    [cars, vehicleMake]
  );
  const yearOptions = useMemo(() => {
    const matching = cars.filter(
      (c) =>
        c.brand === vehicleMake && (!vehicleModel || c.model === vehicleModel)
    );
    const all = new Set<number>();
    for (const car of matching) {
      for (const y of yearRange(
        car.yearFrom ?? car.year_from,
        car.yearTo ?? car.year_to
      )) {
        all.add(y);
      }
    }
    return Array.from(all)
      .sort((a, b) => b - a)
      .map(String);
  }, [cars, vehicleMake, vehicleModel]);

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

  // --- Cart helpers ---
  const getQuantity = (productId: string) => quantities[productId] ?? 1;
  const setQuantity = (productId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, qty) }));
  };

  const cartQtyByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of cart) map[line.productId] = line.quantity;
    return map;
  }, [cart]);

  const handleAdd = (product: Product) => {
    onAdd({
      productId: product.id,
      name: getProductName(product, languageCode),
      unitPrice: product.price,
      quantity: getQuantity(product.id),
    });
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const top = products[0];
    if (!top) return;
    e.preventDefault();
    handleAdd(top);
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
          placeholder="Search by name, item code, or category..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeCategoryId === null ? "default" : "outline"}
            onClick={() => setActiveCategoryId(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              size="sm"
              variant={activeCategoryId === category.id ? "default" : "outline"}
              onClick={() =>
                setActiveCategoryId((prev) =>
                  prev === category.id ? null : category.id
                )
              }
            >
              {getCategoryName(category, languageCode)}
            </Button>
          ))}
        </div>
      )}

      {/* Vehicle fitment filter (options from the cars API) */}
      {makes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={vehicleMake ?? ""} onValueChange={handleMakeChange}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="Make" />
            </SelectTrigger>
            <SelectContent>
              {makes.map((make) => (
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
            disabled={!vehicleMake || yearOptions.length === 0}
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
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
              <Loader2 size={16} className="animate-spin" />
              Loading products...
            </div>
          ) : loadError ? (
            <div className="py-10 text-center text-sm space-y-2">
              <p className="text-destructive">{loadError}</p>
              <Button variant="outline" size="sm" onClick={fetchProducts}>
                Retry
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              {vehicleFilterActive
                ? "No products fit the selected vehicle."
                : "No products match your search."}
            </div>
          ) : (
            products.map((product) => {
              const inCartQty = cartQtyByProduct[product.id];
              const name = getProductName(product, languageCode);
              const outOfStock = (product.stockQuantity ?? 0) <= 0;
              return (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center gap-3 p-4 hover:bg-primary/5 transition"
                >
                  <img
                    src={product.mainImage || "/placeholder.svg"}
                    alt={name}
                    className="w-12 h-12 object-cover rounded bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-[160px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{name}</p>
                      {inCartQty && (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          In cart · {inCartQty}
                        </span>
                      )}
                      {outOfStock && (
                        <span className="text-xs text-destructive border border-destructive/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Out of stock
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {product.itemCode}
                      {product.category?.name ? ` · ${product.category.name}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold text-sm w-24 text-right">
                    {currency} {product.price.toFixed(2)}
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
                  <Button
                    size="sm"
                    disabled={outOfStock}
                    onClick={() => handleAdd(product)}
                  >
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
