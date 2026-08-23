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
import {
  Search,
  Minus,
  Plus,
  X,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { productService, type Product } from "@/lib/services/product.service";
import { categoryService, type Category } from "@/lib/services/category.service";
import { carService, type Car } from "@/lib/services/car.service";
import { settingsService } from "@/lib/services/settings.service";
import type { CartLine } from "@/lib/orders/cart";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LoadingState } from "@/components/loading-state";

interface ProductPickerProps {
  cart: CartLine[];
  onAdd: (line: CartLine) => void;
}

const getProductName = (product: Product, languageCode: string): string => {
  const translation = product.translations?.find(
    (t) => t.languageCode === languageCode
  );
  return (
    translation?.name ||
    product.name ||
    product.translations?.[0]?.name ||
    product.itemCode
  );
};

/** Prefer English labels in the POS picker for consistent ops UI. */
const getCategoryName = (category: Category, languageCode: string): string => {
  const en = category.translations?.find((t) => t.languageCode === "en");
  if (en?.name?.trim()) return en.name.trim();
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

function nestedChildren(category: Category): Category[] {
  const cat = category as Category & {
    children?: Category[];
    subCategories?: Category[];
  };
  return cat.subcategories ?? cat.children ?? cat.subCategories ?? [];
}

export function ProductPicker({ cart, onAdd }: ProductPickerProps) {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState("en");
  const [currency, setCurrency] = useState("JOD");

  const [categories, setCategories] = useState<Category[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoaded, setCarsLoaded] = useState(false);
  const [carsLoading, setCarsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string | null>(
    null,
  );
  const [vehicleMake, setVehicleMake] = useState<string | null>(null);
  const [vehicleModel, setVehicleModel] = useState<string | null>(null);
  const [vehicleYear, setVehicleYear] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

        categoryService
          .listCategories({
            storeId: store.id,
            languageId: language.id,
            isActive: true,
            includeSubcategories: true,
            limit: 100,
          })
          .then((cats) => !cancelled && setCategories(cats || []))
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

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isFullscreen]);

  const ensureCarsLoaded = useCallback(async () => {
    if (carsLoaded || carsLoading) return;
    setCarsLoading(true);
    try {
      const carList = await carService.listCars({ limit: 100 });
      setCars(carList || []);
      setCarsLoaded(true);
    } catch {
      setCars([]);
      setCarsLoaded(true);
    } finally {
      setCarsLoading(false);
    }
  }, [carsLoaded, carsLoading]);

  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  const activeCategory = useMemo(
    () => rootCategories.find((c) => c.id === activeCategoryId) ?? null,
    [rootCategories, activeCategoryId],
  );

  const subcategories = useMemo(
    () => (activeCategory ? nestedChildren(activeCategory) : []),
    [activeCategory],
  );

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
        subCategoryId: activeSubcategoryId || undefined,
        carBrand: vehicleMake || undefined,
        carModel: vehicleModel || undefined,
        carYear: vehicleYear ? Number(vehicleYear) : undefined,
        page: 1,
        limit: 10,
      });
      setProducts(response.data);
    } catch (error: any) {
      setLoadError(error.message || "Failed to fetch products.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    storeId,
    languageId,
    searchQuery,
    activeCategoryId,
    activeSubcategoryId,
    vehicleMake,
    vehicleModel,
    vehicleYear,
  ]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const makes = useMemo(
    () => Array.from(new Set(cars.map((c) => c.brand).filter(Boolean))).sort(),
    [cars],
  );
  const modelOptions = useMemo(
    () =>
      Array.from(
        new Set(
          cars.filter((c) => c.brand === vehicleMake).map((c) => c.model),
        ),
      ).sort(),
    [cars, vehicleMake],
  );
  const yearOptions = useMemo(() => {
    const matching = cars.filter(
      (c) =>
        c.brand === vehicleMake && (!vehicleModel || c.model === vehicleModel),
    );
    const all = new Set<number>();
    for (const car of matching) {
      for (const y of yearRange(
        car.yearFrom ?? car.year_from,
        car.yearTo ?? car.year_to,
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

  const selectCategory = (categoryId: string | null) => {
    setActiveCategoryId(categoryId);
    setActiveSubcategoryId(null);
  };

  const cartQtyByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of cart) map[line.productId] = line.quantity;
    return map;
  }, [cart]);

  const remainingStock = (product: Product) => {
    const stock = product.stockQuantity;
    if (stock == null) return null;
    return Math.max(0, stock - (cartQtyByProduct[product.id] ?? 0));
  };

  const getQuantity = (productId: string, max?: number | null) => {
    const qty = quantities[productId] ?? 1;
    if (max == null) return qty;
    return Math.min(qty, Math.max(1, max));
  };

  const setQuantity = (
    productId: string,
    qty: number,
    max?: number | null,
  ) => {
    const capped =
      max == null ? Math.max(1, qty) : Math.min(Math.max(1, qty), Math.max(1, max));
    setQuantities((prev) => ({ ...prev, [productId]: capped }));
  };

  const handleAdd = (product: Product) => {
    const remaining = remainingStock(product);
    if (remaining != null && remaining <= 0) {
      toast.error(
        `No more stock available for "${getProductName(product, languageCode)}".`,
      );
      return;
    }

    const selectedQty = getQuantity(product.id, remaining);
    const qtyToAdd =
      remaining == null ? selectedQty : Math.min(selectedQty, remaining);

    if (qtyToAdd <= 0) {
      toast.error(
        `No more stock available for "${getProductName(product, languageCode)}".`,
      );
      return;
    }

    onAdd({
      productId: product.id,
      name: getProductName(product, languageCode),
      unitPrice: product.price,
      quantity: qtyToAdd,
      imageUrl: product.mainImage || null,
      stockQuantity: product.stockQuantity,
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

  const content = (
    <div className={cn("space-y-4", isFullscreen && "flex h-full flex-col")}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
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
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
          title={isFullscreen ? "Exit full screen" : "Full screen"}
          onClick={() => setIsFullscreen((v) => !v)}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Button>
      </div>

      {rootCategories.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeCategoryId === null ? "default" : "outline"}
              onClick={() => selectCategory(null)}
            >
              All
            </Button>
            {rootCategories.map((category) => (
              <Button
                key={category.id}
                size="sm"
                variant={
                  activeCategoryId === category.id ? "default" : "outline"
                }
                onClick={() =>
                  selectCategory(
                    activeCategoryId === category.id ? null : category.id,
                  )
                }
              >
                {getCategoryName(category, languageCode)}
              </Button>
            ))}
          </div>

          {subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-0.5 border-l-2 border-border ml-1">
              <Button
                size="sm"
                variant={activeSubcategoryId === null ? "secondary" : "ghost"}
                className="h-8 text-xs"
                onClick={() => setActiveSubcategoryId(null)}
              >
                All in category
              </Button>
              {subcategories.map((sub) => (
                <Button
                  key={sub.id}
                  size="sm"
                  variant={
                    activeSubcategoryId === sub.id ? "default" : "outline"
                  }
                  className="h-8 text-xs"
                  onClick={() =>
                    setActiveSubcategoryId((prev) =>
                      prev === sub.id ? null : sub.id,
                    )
                  }
                >
                  {getCategoryName(sub, languageCode)}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className="flex flex-wrap items-center gap-2"
        onFocusCapture={() => {
          void ensureCarsLoaded();
        }}
        onPointerDownCapture={() => {
          void ensureCarsLoaded();
        }}
      >
        <Select
          value={vehicleMake ?? ""}
          onValueChange={handleMakeChange}
          disabled={carsLoading && !carsLoaded}
        >
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue placeholder={carsLoading ? "Loading…" : "Make"} />
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

      <div
        className={cn(
          "border border-border rounded-lg overflow-hidden",
          isFullscreen && "flex-1 min-h-0",
        )}
      >
        <div
          className={cn(
            "overflow-y-auto divide-y divide-border",
            isFullscreen ? "h-full max-h-none" : "max-h-[420px]",
          )}
        >
          {isLoading ? (
            <LoadingState label="Loading products…" className="py-10" />
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
              const stock = product.stockQuantity;
              // Unknown/null stock must not block — only known stock ≤ 0 is OOS.
              const outOfStock = stock != null && stock <= 0;
              const remaining = remainingStock(product);
              const atStockLimit = remaining != null && remaining <= 0;
              const selectedQty = getQuantity(product.id, remaining);
              const plusDisabled =
                remaining != null && selectedQty >= remaining;
              const addDisabled = outOfStock || atStockLimit;
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
                      {inCartQty ? (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          In cart · {inCartQty}
                        </span>
                      ) : null}
                      {outOfStock ? (
                        <span className="text-xs text-destructive border border-destructive/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Out of stock
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {product.itemCode}
                      {product.category?.name
                        ? ` · ${product.category.name}`
                        : ""}
                      {!outOfStock && remaining != null
                        ? ` · ${remaining} available`
                        : ""}
                    </p>
                  </div>
                  <p className="font-semibold text-sm w-24 text-right">
                    {currency} {product.price.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={selectedQty <= 1}
                      onClick={() =>
                        setQuantity(product.id, selectedQty - 1, remaining)
                      }
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="w-8 text-center text-sm">
                      {selectedQty}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={plusDisabled || outOfStock}
                      onClick={() =>
                        setQuantity(product.id, selectedQty + 1, remaining)
                      }
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    disabled={addDisabled}
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

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 shrink-0">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Add products
            </h2>
            <p className="text-xs text-muted-foreground">
              Full screen · Esc to exit
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsFullscreen(false)}
          >
            <Minimize2 size={14} />
            Exit full screen
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden p-4">{content}</div>
      </div>
    );
  }

  return content;
}
