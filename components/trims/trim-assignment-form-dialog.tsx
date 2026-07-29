"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  normalizeTrim,
  resolveCarIdForMakeModel,
  trimKey,
  validateYearRange,
} from "@/lib/trims-utils";
import type {
  TrimAssignmentRow,
  CarPartsProductOption,
} from "@/lib/services/trim-assignments.service";
import { productCarCompatibilityService } from "@/lib/services/product-car-compatibility.service";
import type { Car } from "@/lib/services/car.service";
import { cn } from "@/lib/utils";

export type { CarPartsProductOption };

export type TrimAssignmentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  carPartsProducts?: CarPartsProductOption[];
  cars: Car[];
  /** Prefill from page filters when set (not "any") */
  initialBrand?: string;
  initialModel?: string;
  editingRow?: TrimAssignmentRow | null;
  siblingRows?: TrimAssignmentRow[];
  onSaved: () => void;
};

export function TrimAssignmentFormDialog({
  open,
  onOpenChange,
  mode,
  carPartsProducts = [],
  cars,
  initialBrand,
  initialModel,
  editingRow,
  siblingRows = [],
  onSaved,
}: TrimAssignmentFormDialogProps) {
  const [productId, setProductId] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [carLocked, setCarLocked] = useState(false);
  const [resolvingProductCar, setResolvingProductCar] = useState(false);
  const productMenuRef = useRef<HTMLDivElement>(null);

  const brands = useMemo(
    () =>
      Array.from(new Set(cars.map((c) => c.brand).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [cars],
  );

  const models = useMemo(
    () =>
      Array.from(
        new Set(
          cars
            .filter((c) => c.brand === brand)
            .map((c) => c.model)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [cars, brand],
  );

  const selectedProduct = useMemo(
    () => carPartsProducts.find((p) => p.id === productId) || null,
    [carPartsProducts, productId],
  );

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return carPartsProducts;
    return carPartsProducts.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.itemCode.toLowerCase().includes(q),
    );
  }, [carPartsProducts, productQuery]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editingRow) {
      setProductId(editingRow.productId);
      setBrand(editingRow.carBrand);
      setModel(editingRow.carModel);
      setTrim(editingRow.trim || "");
      setYearFrom(String(editingRow.yearFrom));
      setYearTo(editingRow.yearTo != null ? String(editingRow.yearTo) : "");
      setCarLocked(true);
    } else {
      setProductId("");
      setProductQuery("");
      setProductMenuOpen(false);
      const nextBrand =
        initialBrand && initialBrand !== "any" ? initialBrand : brands[0] || "";
      setBrand(nextBrand);
      const nextModel =
        initialModel && initialModel !== "any" ? initialModel : "";
      setModel(nextModel);
      setTrim("");
      setYearFrom("");
      setYearTo("");
      setCarLocked(false);
    }
  }, [open, mode, editingRow, initialBrand, initialModel, brands]);

  /** When a product is chosen, lock make/model to its existing vehicle if any */
  useEffect(() => {
    if (!open || mode !== "add" || !productId) return;

    let cancelled = false;

    const resolve = async () => {
      // Prefer in-memory sibling rows first (same make filter may miss other cars)
      const fromSiblings = siblingRows.find((r) => r.productId === productId);
      if (fromSiblings) {
        if (!cancelled) {
          setBrand(fromSiblings.carBrand);
          setModel(fromSiblings.carModel);
          setCarLocked(true);
        }
        return;
      }

      setResolvingProductCar(true);
      try {
        const existing =
          await productCarCompatibilityService.listCompatibilities(productId);
        if (cancelled) return;
        if (existing.length > 0) {
          setBrand(existing[0].carBrand);
          setModel(existing[0].carModel);
          setCarLocked(true);
        } else {
          setCarLocked(false);
        }
      } catch {
        if (!cancelled) setCarLocked(false);
      } finally {
        if (!cancelled) setResolvingProductCar(false);
      }
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [open, mode, productId, siblingRows]);

  useEffect(() => {
    if (!productMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (
        productMenuRef.current &&
        !productMenuRef.current.contains(event.target as Node)
      ) {
        setProductMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [productMenuOpen]);

  const checkDuplicate = (
    nextTrim: string | null,
    from: number,
    to: number | null,
  ) => {
    const key = trimKey(nextTrim, from, to);
    const pid = mode === "edit" ? editingRow?.productId : productId;
    return siblingRows.some((r) => {
      if (mode === "edit" && r.compatibilityId === editingRow?.compatibilityId) {
        return false;
      }
      if (r.productId !== pid) return false;
      if (
        (r.carBrand || "").toLowerCase() !== brand.toLowerCase() ||
        (r.carModel || "").toLowerCase() !== model.toLowerCase()
      ) {
        return false;
      }
      return trimKey(r.trim, r.yearFrom, r.yearTo) === key;
    });
  };

  const handleSubmit = async () => {
    const nextTrim = normalizeTrim(trim);
    if (!nextTrim) {
      toast.error("Validation Error", {
        description: "Trim name is required",
      });
      return;
    }

    const years = validateYearRange(yearFrom, yearTo);
    if (typeof years === "string") {
      toast.error("Validation Error", { description: years });
      return;
    }
    if (checkDuplicate(nextTrim, years.yearFrom, years.yearTo)) {
      toast.error("Validation Error", {
        description: "Duplicate trim and year range for this product",
      });
      return;
    }

    if (mode === "add" && !productId) {
      toast.error("Validation Error", { description: "Select a product" });
      return;
    }
    if (mode === "add" && (!brand || !model)) {
      toast.error("Validation Error", {
        description: "Select make and model",
      });
      return;
    }

    const carId =
      mode === "edit" && editingRow
        ? editingRow.carId
        : resolveCarIdForMakeModel(brand, model, cars);

    if (!carId) {
      toast.error("Error", {
        description: `No car found for ${brand} ${model}. Add it under Cars first.`,
      });
      return;
    }

    setSaving(true);
    try {
      if (mode === "edit" && editingRow) {
        await productCarCompatibilityService.updateCompatibility(
          editingRow.productId,
          editingRow.compatibilityId,
          {
            yearFrom: years.yearFrom,
            yearTo: years.yearTo,
            trim: nextTrim,
          },
        );
        toast.success("Success", { description: "Trim assignment updated" });
      } else {
        await productCarCompatibilityService.addCompatibility(productId, {
          carId,
          yearFrom: years.yearFrom,
          yearTo: years.yearTo,
          trim: nextTrim,
        });
        toast.success("Success", { description: "Trim assignment added" });
      }
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error", {
        description: error?.message || "Failed to save assignment",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit trim assignment" : "Add trim assignment"}
          </DialogTitle>
          <DialogDescription>
            Each product belongs to one make and model. Trim name is required.
            Year To can be empty for ongoing ranges.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {mode === "add" ? (
            <>
              <div className="space-y-2">
                <Label>Product</Label>
                <div className="relative" ref={productMenuRef}>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={productMenuOpen}
                    className="w-full justify-between font-normal"
                    onClick={() => setProductMenuOpen((openMenu) => !openMenu)}
                  >
                    <span className="truncate text-left">
                      {selectedProduct
                        ? `${selectedProduct.label} (${selectedProduct.itemCode})`
                        : "Search product…"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                  {productMenuOpen ? (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                      <div className="p-2 border-b">
                        <Input
                          autoFocus
                          placeholder="Search name or item code"
                          value={productQuery}
                          onChange={(e) => setProductQuery(e.target.value)}
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto p-1">
                        {filteredProducts.length === 0 ? (
                          <p className="px-2 py-3 text-sm text-muted-foreground">
                            No products match “{productQuery.trim()}”
                          </p>
                        ) : (
                          filteredProducts.map((p) => {
                            const selected = p.id === productId;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                                  selected && "bg-accent/60",
                                )}
                                onClick={() => {
                                  setProductId(p.id);
                                  setProductQuery("");
                                  setProductMenuOpen(false);
                                  setCarLocked(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    selected ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <span className="truncate">
                                  {p.label} ({p.itemCode})
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              {carLocked && brand && model ? (
                <div className="rounded-md border bg-muted/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="text-sm font-medium">
                    {brand} {model}
                    {resolvingProductCar ? (
                      <Loader2 className="inline ml-2 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Make</Label>
                    <Select
                      value={brand || undefined}
                      onValueChange={(v) => {
                        setBrand(v);
                        setModel("");
                      }}
                      disabled={resolvingProductCar}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Make" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={model || undefined}
                      onValueChange={setModel}
                      disabled={!brand || resolvingProductCar}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          ) : editingRow ? (
            <p className="text-sm text-muted-foreground">
              {editingRow.carBrand} {editingRow.carModel} ·{" "}
              {editingRow.productName} ({editingRow.itemCode})
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="ta-trim">
              Trim name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ta-trim"
              value={trim}
              onChange={(e) => setTrim(e.target.value)}
              placeholder="e.g. M Sport"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ta-from">Year from</Label>
              <Input
                id="ta-from"
                type="number"
                min={1900}
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ta-to">Year to</Label>
              <Input
                id="ta-to"
                type="number"
                min={1900}
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                placeholder="Present"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : mode === "edit" ? (
              "Save"
            ) : (
              "Add"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
