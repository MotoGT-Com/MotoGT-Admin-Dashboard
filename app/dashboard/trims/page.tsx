"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/loading-state";
import { Loader2, Plus, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";
import { settingsService } from "@/lib/services/settings.service";
import { carService, type Car } from "@/lib/services/car.service";
import {
  trimAssignmentsService,
  type TrimAssignmentRow,
  type CarPartsProductOption,
} from "@/lib/services/trim-assignments.service";
import { productCarCompatibilityService } from "@/lib/services/product-car-compatibility.service";
import { TrimsFilterBar } from "@/components/trims/trims-filter-bar";
import { TrimsSummaryCards } from "@/components/trims/trims-summary-cards";
import { TrimsAssignmentsTable } from "@/components/trims/trims-assignments-table";
import { TrimAssignmentFormDialog } from "@/components/trims/trim-assignment-form-dialog";
import { TrimsCatalogPanel } from "@/components/trims/trims-catalog-panel";
import {
  ProductCarTrimsManager,
  type CarOption,
} from "@/components/product-car-trims-manager";

export default function TrimsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stores, setStores] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<any | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [make, setMake] = useState("any");
  const [model, setModel] = useState("any");
  const [year, setYear] = useState("any");
  const [trimFilter, setTrimFilter] = useState("any");
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");

  const [allRows, setAllRows] = useState<TrimAssignmentRow[]>([]);
  const [carPartsProducts, setCarPartsProducts] = useState<
    CarPartsProductOption[]
  >([]);
  const [loadMeta, setLoadMeta] = useState({
    productsScanned: 0,
    productsTotal: 0,
    truncated: false,
  });
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const loadRequestId = useRef(0);
  const carsRef = useRef<Car[]>([]);
  const assignmentsCacheRef = useRef(
    new Map<
      string,
      {
        rows: TrimAssignmentRow[];
        carPartsProducts: CarPartsProductOption[];
        productsScanned: number;
        productsTotal: number;
        truncated: boolean;
      }
    >(),
  );

  carsRef.current = cars;

  const assignmentCacheKey = useCallback(
    (makeValue: string, modelValue: string) => {
      if (!selectedStore || !selectedLanguage) return "";
      return [
        selectedStore.id,
        selectedLanguage.id,
        makeValue.toLowerCase(),
        modelValue.toLowerCase(),
      ].join("|");
    },
    [selectedStore, selectedLanguage],
  );

  const applyAssignmentResult = useCallback(
    (result: {
      rows: TrimAssignmentRow[];
      carPartsProducts: CarPartsProductOption[];
      productsScanned: number;
      productsTotal: number;
      truncated: boolean;
    }) => {
      setAllRows(result.rows);
      setCarPartsProducts(result.carPartsProducts);
      setLoadMeta({
        productsScanned: result.productsScanned,
        productsTotal: result.productsTotal,
        truncated: result.truncated,
      });
      const namedCount = result.rows.filter((r) => r.trim !== null).length;
      if (result.productsScanned === 0) {
        setLoadError(
          "No products with car fitment were found for this vehicle. Confirm fitment on a product, then click Refresh.",
        );
      } else if (namedCount === 0) {
        setLoadError(
          `Scanned ${result.productsScanned} product(s) but found no named trim assignments (only “All trims” rows).`,
        );
      } else {
        setLoadError(null);
      }
    },
    [],
  );

  const [catalogTrims, setCatalogTrims] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingRow, setEditingRow] = useState<TrimAssignmentRow | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TrimAssignmentRow | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const [managerOpen, setManagerOpen] = useState(false);
  const [managerProductId, setManagerProductId] = useState("");
  const [managerCar, setManagerCar] = useState<{
    carId?: string;
    brand?: string;
    model?: string;
  }>({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProductSearch(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  useEffect(() => {
    const init = async () => {
      try {
        setSettingsLoading(true);
        const [fetchedStores, fetchedLanguages] = await Promise.all([
          settingsService.getStores(),
          settingsService.getLanguages(),
        ]);
        setStores(fetchedStores);
        setLanguages(fetchedLanguages);

        const savedStore = settingsService.getSelectedStore();
        if (savedStore && fetchedStores.some((s) => s.id === savedStore.id)) {
          setSelectedStore(savedStore);
        } else if (fetchedStores.length > 0) {
          setSelectedStore(fetchedStores[0]);
        }

        const savedLanguage = settingsService.getSelectedLanguage();
        if (
          savedLanguage &&
          fetchedLanguages.some((l) => l.id === savedLanguage.id)
        ) {
          setSelectedLanguage(savedLanguage);
        } else if (fetchedLanguages.length > 0) {
          setSelectedLanguage(fetchedLanguages[0]);
        }

        const brandParam = searchParams.get("brand");
        const modelParam = searchParams.get("model");
        if (brandParam) setMake(brandParam);
        if (modelParam) setModel(modelParam);

      } catch {
        toast.error("Error", { description: "Failed to load settings" });
      } finally {
        setSettingsLoading(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCars = useCallback(async () => {
    if (!selectedStore) return;
    setCarsLoading(true);
    try {
      const list = await carService.listCars({
        store_id: selectedStore.id,
        limit: 1000,
      });
      setCars(list || []);
    } catch (error: any) {
      toast.error("Error", {
        description: error?.message || "Failed to load cars",
      });
      setCars([]);
    } finally {
      setCarsLoading(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    if (selectedStore) void loadCars();
  }, [selectedStore, loadCars]);

  const loadAssignments = useCallback(
    async (options?: { force?: boolean }) => {
      if (!selectedStore || !selectedLanguage) {
        setAllRows([]);
        setCarPartsProducts([]);
        return;
      }

      if (make === "any") {
        loadRequestId.current += 1;
        setAssignmentsLoading(false);
        setLoadError(null);
        setAllRows([]);
        setCarPartsProducts([]);
        setLoadMeta({ productsScanned: 0, productsTotal: 0, truncated: false });
        return;
      }

      const scopeKey = assignmentCacheKey(make, model);
      const makeWideKey = assignmentCacheKey(make, "any");
      const force = Boolean(options?.force);

      if (!force) {
        const cached =
          assignmentsCacheRef.current.get(scopeKey) ||
          (model !== "any"
            ? assignmentsCacheRef.current.get(makeWideKey)
            : undefined);
        if (cached) {
          loadRequestId.current += 1;
          setAssignmentsLoading(false);
          applyAssignmentResult(cached);
          return;
        }
      }

      const requestId = ++loadRequestId.current;
      setAssignmentsLoading(true);
      setLoadError(null);
      try {
        const result = await trimAssignmentsService.loadAllAssignments({
          storeId: selectedStore.id,
          languageId: selectedLanguage.id,
          cars: carsRef.current.length > 0 ? carsRef.current : undefined,
          make,
          // Scope API scan to model when set — much faster. Model "any" scans the brand.
          model,
        });
        if (requestId !== loadRequestId.current) return;

        const payload = {
          rows: result.rows,
          carPartsProducts: result.carPartsProducts,
          productsScanned: result.productsScanned,
          productsTotal: result.productsTotal,
          truncated: result.truncated,
        };
        assignmentsCacheRef.current.set(scopeKey, payload);
        if (model === "any") {
          assignmentsCacheRef.current.set(makeWideKey, payload);
        }
        applyAssignmentResult(payload);
      } catch (error: any) {
        if (requestId !== loadRequestId.current) return;
        const message = error?.message || "Failed to load trim assignments";
        setLoadError(message);
        toast.error("Error", { description: message });
        setAllRows([]);
        setLoadMeta({ productsScanned: 0, productsTotal: 0, truncated: false });
      } finally {
        if (requestId === loadRequestId.current) {
          setAssignmentsLoading(false);
        }
      }
    },
    [
      selectedStore,
      selectedLanguage,
      make,
      model,
      assignmentCacheKey,
      applyAssignmentResult,
    ],
  );

  // Fetch only when make/model (or store/language) change — year/trim/search stay local.
  useEffect(() => {
    if (!selectedStore || !selectedLanguage || carsLoading) return;
    void loadAssignments();
  }, [selectedStore, selectedLanguage, carsLoading, make, model, loadAssignments]);

  // Drop cache when store/language changes
  useEffect(() => {
    assignmentsCacheRef.current.clear();
  }, [selectedStore?.id, selectedLanguage?.id]);

  useEffect(() => {
    if (!selectedStore || make === "any" || model === "any") {
      setCatalogTrims([]);
      return;
    }
    const yearNum =
      year !== "any" ? parseInt(year, 10) : new Date().getFullYear();
    let cancelled = false;
    setCatalogLoading(true);
    void carService
      .getTrims(selectedStore.id, make, model, yearNum)
      .then((trims) => {
        if (!cancelled) setCatalogTrims(trims);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStore, make, model, year]);

  // Brands/models from cars catalog (stable), plus any from loaded assignments
  const brands = useMemo(() => {
    const set = new Set<string>(
      cars.map((c) => c.brand).filter(Boolean) as string[],
    );
    for (const b of trimAssignmentsService.uniqueBrands(allRows)) set.add(b);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allRows, cars]);

  const models = useMemo(() => {
    if (make === "any") return [];
    const set = new Set<string>();
    for (const c of cars) {
      if ((c.brand || "").toLowerCase() === make.toLowerCase() && c.model) {
        set.add(c.model);
      }
    }
    for (const m of trimAssignmentsService.uniqueModels(allRows, make)) {
      set.add(m);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allRows, cars, make]);

  const filteredRows = useMemo(() => {
    // Named trims only — hide null/"All trims" fitment rows from this page.
    let rows = allRows.filter((r) => r.trim !== null);
    rows = trimAssignmentsService.filterByMake(rows, make);
    rows = trimAssignmentsService.filterByModel(rows, model);
    if (year !== "any") {
      const y = parseInt(year, 10);
      if (!Number.isNaN(y)) {
        rows = trimAssignmentsService.filterByYear(rows, y);
      }
    }
    rows = trimAssignmentsService.filterByTrim(rows, trimFilter);
    rows = trimAssignmentsService.filterByProductSearch(
      rows,
      debouncedProductSearch,
    );
    return rows;
  }, [allRows, make, model, year, trimFilter, debouncedProductSearch]);

  const trimOptions = useMemo(
    () => trimAssignmentsService.uniqueTrimOptions(allRows),
    [allRows],
  );

  const summary = useMemo(
    () => trimAssignmentsService.computeSummaryStats(filteredRows),
    [filteredRows],
  );

  const assignmentTrimNames = useMemo(() => {
    const set = new Set<string>();
    const source =
      make !== "any" && model !== "any"
        ? allRows.filter(
            (r) =>
              (r.carBrand || "").toLowerCase() === make.toLowerCase() &&
              (r.carModel || "").toLowerCase() === model.toLowerCase(),
          )
        : allRows;
    for (const r of source) {
      if (r.trim) set.add(r.trim);
    }
    return set;
  }, [allRows, make, model]);

  const availableCars: CarOption[] = useMemo(
    () =>
      cars.map((c) => ({
        id: c.id,
        brand: c.brand,
        model: c.model,
        trim: c.trim,
      })),
    [cars],
  );

  const invalidateAssignmentsCache = useCallback(() => {
    assignmentsCacheRef.current.clear();
  }, []);

  const handleStoreChange = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (store) {
      invalidateAssignmentsCache();
      setSelectedStore(store);
      settingsService.setSelectedStore(storeId);
      setMake("any");
      setModel("any");
      router.replace("/dashboard/trims");
    }
  };

  const handleLanguageChange = (languageId: string) => {
    const language = languages.find((l) => l.id === languageId);
    if (language) {
      invalidateAssignmentsCache();
      setSelectedLanguage(language);
      settingsService.setSelectedLanguage(languageId);
    }
  };

  const syncUrl = (nextMake: string, nextModel: string) => {
    const params = new URLSearchParams();
    if (nextMake && nextMake !== "any") params.set("brand", nextMake);
    if (nextModel && nextModel !== "any") params.set("model", nextModel);
    const q = params.toString();
    router.replace(q ? `/dashboard/trims?${q}` : "/dashboard/trims");
  };

  const handleMakeChange = (value: string) => {
    setMake(value);
    setModel("any");
    setTrimFilter("any");
    syncUrl(value, "any");
  };

  const handleModelChange = (value: string) => {
    setModel(value);
    setTrimFilter("any");
    syncUrl(make, value);
  };

  const clearFilters = () => {
    setMake("any");
    setModel("any");
    setYear("any");
    setTrimFilter("any");
    setProductSearch("");
    router.replace("/dashboard/trims");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeleting(true);
    try {
      await productCarCompatibilityService.deleteCompatibility(
        target.productId,
        target.compatibilityId,
      );
      toast.success("Success", { description: "Trim assignment removed" });
      invalidateAssignmentsCache();
      await loadAssignments({ force: true });
    } catch (error: any) {
      toast.error("Error", {
        description: error?.message || "Failed to remove assignment",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openManagerForRow = (row: TrimAssignmentRow) => {
    setManagerProductId(row.productId);
    setManagerCar({
      carId: row.carId,
      brand: row.carBrand,
      model: row.carModel,
    });
    setManagerOpen(true);
  };

  // Keep filters interactive while data loads — only block destructive/write actions.
  const filtersDisabled = settingsLoading;
  const writeBusy = assignmentsLoading || deleting;

  if (settingsLoading || !selectedStore || !selectedLanguage) {
    return (
      <LoadingState
        variant="full"
        label={settingsLoading ? "Loading stores…" : "Initializing…"}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trims</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View and edit product fitment trims and year ranges in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 min-w-[140px]">
            <Label className="text-xs flex items-center gap-1">
              <StoreIcon size={12} /> Store
            </Label>
            <Select value={selectedStore.id} onValueChange={handleStoreChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 min-w-[140px]">
            <Label className="text-xs">Language</Label>
            <Select
              value={selectedLanguage.id}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <TrimsFilterBar
        brands={brands}
        models={models}
        trimOptions={trimOptions}
        make={make}
        model={model}
        year={year}
        trimFilter={trimFilter}
        productSearch={productSearch}
        disabled={filtersDisabled}
        onMakeChange={handleMakeChange}
        onModelChange={handleModelChange}
        onYearChange={setYear}
        onTrimFilterChange={setTrimFilter}
        onProductSearchChange={setProductSearch}
        onClearFilters={clearFilters}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-sm text-muted-foreground">
          {make === "any"
            ? "Select a make to load named trim assignments."
            : assignmentsLoading
              ? model === "any"
                ? `Loading ${make} trim assignments…`
                : `Loading ${make} ${model} trim assignments…`
              : loadMeta.truncated
                ? `Showing assignments from ${loadMeta.productsScanned} of ${loadMeta.productsTotal} products (limit reached).`
                : `${filteredRows.length} assignment(s) · scanned ${loadMeta.productsScanned} product(s)`}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filtersDisabled || assignmentsLoading || make === "any"}
            onClick={() => {
              invalidateAssignmentsCache();
              void loadAssignments({ force: true });
            }}
          >
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={filtersDisabled || writeBusy}
            onClick={() => {
              setFormMode("add");
              setEditingRow(null);
              setFormOpen(true);
            }}
          >
            <Plus size={14} className="mr-1" />
            Add trim assignment
          </Button>
        </div>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 mb-4 text-sm"
        >
          {loadError}
        </div>
      ) : null}

      {make === "any" ? (
        <p className="text-sm text-muted-foreground text-center py-10 border rounded-lg">
          Choose a make above (for example BMW), then optionally a model, to
          view named trim assignments. “All trims” fitment rows are hidden.
        </p>
      ) : assignmentsLoading && allRows.length === 0 ? (
        <LoadingState
          label={
            model && model !== "any"
              ? `Loading ${make} ${model} trim assignments…`
              : `Loading ${make} trim assignments…`
          }
        />
      ) : (
        <>
          {assignmentsLoading ? (
            <LoadingState
              variant="compact"
              label="Updating results…"
              className="mb-2"
            />
          ) : null}
          <TrimsSummaryCards summary={summary} />

          {deleteTarget ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 mb-4 space-y-3"
            >
              <p className="text-sm">
                Permanently remove{" "}
                <strong>{deleteTarget.trim || "All trims"}</strong> (
                {trimAssignmentsService.formatYearRange(
                  deleteTarget.yearFrom,
                  deleteTarget.yearTo,
                )}
                ) for {deleteTarget.carBrand} {deleteTarget.carModel} ·{" "}
                {deleteTarget.productName}? This cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  onClick={() => void confirmDelete()}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Removing…
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          <TrimsAssignmentsTable
            rows={filteredRows}
            formatYearRange={trimAssignmentsService.formatYearRange}
            deleteTargetId={deleteTarget?.compatibilityId ?? null}
            busy={writeBusy}
            onEdit={(row) => {
              setFormMode("edit");
              setEditingRow(row);
              setFormOpen(true);
            }}
            onRequestDelete={setDeleteTarget}
            onManageProductTrims={openManagerForRow}
          />

          {make !== "any" && model !== "any" ? (
            <TrimsCatalogPanel
              catalogTrims={catalogTrims}
              assignmentTrimNames={assignmentTrimNames}
              loading={catalogLoading}
            />
          ) : null}
        </>
      )}

      <TrimAssignmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        carPartsProducts={carPartsProducts}
        cars={cars}
        initialBrand={make}
        initialModel={model}
        editingRow={editingRow}
        siblingRows={allRows}
        onSaved={() => {
          invalidateAssignmentsCache();
          void loadAssignments({ force: true });
        }}
      />

      {managerProductId ? (
        <ProductCarTrimsManager
          open={managerOpen}
          onOpenChange={setManagerOpen}
          productId={managerProductId}
          availableCars={availableCars}
          initialCarId={managerCar.carId}
          initialBrand={managerCar.brand}
          initialModel={managerCar.model}
          onSaved={() => {
            invalidateAssignmentsCache();
            void loadAssignments({ force: true });
          }}
        />
      ) : null}
    </div>
  );
}
