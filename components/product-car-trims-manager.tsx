"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  productCarCompatibilityService,
  type ProductCarCompatibility,
} from "@/lib/services/product-car-compatibility.service";
import {
  normalizeTrim,
  trimKey,
  validateYearRange,
} from "@/lib/trims-utils";

export type CarOption = {
  id: string;
  brand: string;
  model: string;
  trim?: string | null;
};

type TrimDraftStatus = "unchanged" | "new" | "edited";

type TrimDraft = {
  localId: string;
  compatibilityId?: string;
  trim: string | null;
  yearFrom: number;
  yearTo: number | null;
  status: TrimDraftStatus;
  baseline?: {
    trim: string | null;
    yearFrom: number;
    yearTo: number | null;
  };
};

type TrimFormState = {
  trim: string;
  yearFrom: string;
  yearTo: string;
};

export type ProductCarTrimsManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  availableCars: CarOption[];
  /** When set, pre-select this car and lock make/model */
  initialCarId?: string | null;
  initialBrand?: string | null;
  initialModel?: string | null;
  onSaved?: () => void;
};

function createLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDraft(row: ProductCarCompatibility): TrimDraft {
  const trim = normalizeTrim(row.trim);
  return {
    localId: row.id,
    compatibilityId: row.id,
    trim,
    yearFrom: row.yearFrom,
    yearTo: row.yearTo,
    status: "unchanged",
    baseline: {
      trim,
      yearFrom: row.yearFrom,
      yearTo: row.yearTo,
    },
  };
}

function statusBadgeVariant(
  status: TrimDraftStatus,
): "secondary" | "default" | "outline" {
  switch (status) {
    case "new":
      return "default";
    case "edited":
      return "outline";
    default:
      return "secondary";
  }
}

function statusLabel(status: TrimDraftStatus) {
  switch (status) {
    case "new":
      return "New";
    case "edited":
      return "Edited";
    default:
      return "Unchanged";
  }
}

export function ProductCarTrimsManager({
  open,
  onOpenChange,
  productId,
  availableCars,
  initialCarId,
  initialBrand,
  initialModel,
  onSaved,
}: ProductCarTrimsManagerProps) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [carId, setCarId] = useState("");
  const [drafts, setDrafts] = useState<TrimDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [trimFormOpen, setTrimFormOpen] = useState(false);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [trimForm, setTrimForm] = useState<TrimFormState>({
    trim: "",
    yearFrom: "",
    yearTo: "",
  });

  const [deleteTarget, setDeleteTarget] = useState<TrimDraft | null>(null);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  /** Once the product has a car (or one is chosen), make/model cannot change */
  const [carLocked, setCarLocked] = useState(false);

  /** Only initialize session when dialog transitions closed → open */
  const wasOpenRef = useRef(false);
  const carIdRef = useRef("");
  carIdRef.current = carId;

  const brands = useMemo(
    () =>
      Array.from(new Set(availableCars.map((c) => c.brand).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [availableCars],
  );

  const models = useMemo(
    () =>
      Array.from(
        new Set(
          availableCars
            .filter((c) => c.brand === brand)
            .map((c) => c.model)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [availableCars, brand],
  );

  const resolveCarId = useCallback(
    (nextBrand: string, nextModel: string, cars = availableCars) => {
      const matches = cars.filter(
        (c) => c.brand === nextBrand && c.model === nextModel,
      );
      const withoutTrim = matches.find((c) => !(c.trim || "").trim());
      return withoutTrim?.id || matches[0]?.id || "";
    },
    [availableCars],
  );

  const isDirty = useMemo(
    () => drafts.some((d) => d.status !== "unchanged"),
    [drafts],
  );

  const resetSession = useCallback(() => {
    setBrand("");
    setModel("");
    setCarId("");
    setDrafts([]);
    setLoading(false);
    setSaving(false);
    setDeleting(false);
    setTrimFormOpen(false);
    setEditingLocalId(null);
    setTrimForm({ trim: "", yearFrom: "", yearTo: "" });
    setDeleteTarget(null);
    setDiscardConfirmOpen(false);
    setCarLocked(false);
  }, []);

  const loadTrims = useCallback(
    async (nextCarId: string) => {
      if (!productId || !nextCarId) {
        setDrafts([]);
        return;
      }
      setLoading(true);
      try {
        const rows = await productCarCompatibilityService.listTrimsForCar(
          productId,
          nextCarId,
        );
        // Ignore stale responses if the user switched cars
        if (carIdRef.current && carIdRef.current !== nextCarId) {
          return;
        }
        setDrafts(rows.map(toDraft));
      } catch (error: any) {
        toast.error("Error", {
          description: error?.message || "Failed to load trims",
        });
        setDrafts([]);
      } finally {
        setLoading(false);
      }
    },
    [productId],
  );

  // Initialize once per open; do not re-run on availableCars identity changes
  // (that was wiping in-progress draft adds/edits).
  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    let cancelled = false;

    const init = async () => {
      setLoading(true);
      try {
        const existing =
          await productCarCompatibilityService.listCompatibilities(productId);
        if (cancelled) return;

        // One car per product: lock to whatever car already has fitment rows
        const byCar = new Map<
          string,
          { brand: string; model: string }
        >();
        for (const row of existing) {
          if (!byCar.has(row.carId)) {
            byCar.set(row.carId, {
              brand: row.carBrand,
              model: row.carModel,
            });
          }
        }

        if (byCar.size > 0) {
          const chosenId =
            initialCarId && byCar.has(initialCarId)
              ? initialCarId
              : [...byCar.keys()][0];
          const meta = byCar.get(chosenId)!;
          setBrand(meta.brand);
          setModel(meta.model);
          setCarId(chosenId);
          setCarLocked(true);
          carIdRef.current = chosenId;
          await loadTrims(chosenId);
          return;
        }

        // First assignment — optional prefill from caller
        let nextBrand = initialBrand || "";
        let nextModel = initialModel || "";
        let nextCarId = initialCarId || "";

        if (!nextCarId && nextBrand && nextModel) {
          nextCarId = resolveCarId(nextBrand, nextModel);
        }

        if (nextCarId && (!nextBrand || !nextModel)) {
          const car = availableCars.find((c) => c.id === nextCarId);
          if (car) {
            nextBrand = car.brand;
            nextModel = car.model;
          }
        }

        setBrand(nextBrand);
        setModel(nextModel);
        setCarId(nextCarId);
        // Prefill from context locks immediately (e.g. Trims page filters)
        setCarLocked(
          Boolean(nextCarId && (initialCarId || (initialBrand && initialModel))),
        );
        if (nextCarId) {
          carIdRef.current = nextCarId;
          await loadTrims(nextCarId);
        } else {
          setDrafts([]);
        }
      } catch (error: any) {
        if (!cancelled) {
          toast.error("Error", {
            description: error?.message || "Failed to load car fitment",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
    // intentionally omit availableCars / resolveCarId from deps — snapshot at open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCarId, initialBrand, initialModel, productId, loadTrims]);

  // Warn on browser unload when dirty
  useEffect(() => {
    if (!open || !isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [open, isDirty]);

  const handleBrandChange = (value: string) => {
    setBrand(value);
    setModel("");
    setCarId("");
    setDrafts([]);
  };

  const handleModelChange = async (value: string) => {
    setModel(value);
    const nextCarId = resolveCarId(brand, value);
    if (!nextCarId) {
      setCarId("");
      setDrafts([]);
      toast.error("Error", {
        description: `No car found for ${brand} ${value}. Add it under Cars first.`,
      });
      return;
    }
    setCarId(nextCarId);
    // Assigning make/model is permanent for this product — lock selectors
    setCarLocked(true);
    await loadTrims(nextCarId);
  };

  const hasDuplicate = (
    trim: string | null,
    yearFrom: number,
    yearTo: number | null,
    excludeLocalId?: string,
  ) => {
    const key = trimKey(trim, yearFrom, yearTo);
    return drafts.some(
      (d) =>
        d.localId !== excludeLocalId &&
        trimKey(d.trim, d.yearFrom, d.yearTo) === key,
    );
  };

  const openAddTrim = () => {
    setEditingLocalId(null);
    setTrimForm({
      trim: "",
      yearFrom: "",
      yearTo: "",
    });
    setTrimFormOpen(true);
  };

  const openEditTrim = (draft: TrimDraft) => {
    setEditingLocalId(draft.localId);
    setTrimForm({
      trim: draft.trim || "",
      yearFrom: String(draft.yearFrom),
      yearTo: draft.yearTo != null ? String(draft.yearTo) : "",
    });
    setTrimFormOpen(true);
  };

  const requestDelete = (draft: TrimDraft) => {
    setDeleteTarget(draft);
  };

  const submitTrimForm = () => {
    const trim = normalizeTrim(trimForm.trim);
    if (!trim) {
      toast.error("Validation Error", {
        description: "Trim name is required",
      });
      return;
    }

    const years = validateYearRange(trimForm.yearFrom, trimForm.yearTo);
    if (typeof years === "string") {
      toast.error("Validation Error", { description: years });
      return;
    }
    if (
      hasDuplicate(trim, years.yearFrom, years.yearTo, editingLocalId || undefined)
    ) {
      toast.error("Validation Error", {
        description: "Duplicate trim and year range for this car",
      });
      return;
    }

    if (editingLocalId) {
      setDrafts((prev) =>
        prev.map((d) => {
          if (d.localId !== editingLocalId) return d;
          if (d.status === "new") {
            return {
              ...d,
              trim,
              yearFrom: years.yearFrom,
              yearTo: years.yearTo,
            };
          }
          const unchanged =
            d.baseline &&
            normalizeTrim(d.baseline.trim) === trim &&
            d.baseline.yearFrom === years.yearFrom &&
            d.baseline.yearTo === years.yearTo;
          return {
            ...d,
            trim,
            yearFrom: years.yearFrom,
            yearTo: years.yearTo,
            status: unchanged ? "unchanged" : "edited",
          };
        }),
      );
    } else {
      setDrafts((prev) => [
        ...prev,
        {
          localId: createLocalId(),
          trim,
          yearFrom: years.yearFrom,
          yearTo: years.yearTo,
          status: "new",
        },
      ]);
    }
    setTrimFormOpen(false);
    setEditingLocalId(null);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  /** Delete applies immediately (draft row or DELETE API for saved rows). */
  const confirmDelete = async (target: TrimDraft) => {
    cancelDelete();

    // Unsaved draft row — just remove locally
    if (target.status === "new" || !target.compatibilityId) {
      setDrafts((prev) => prev.filter((d) => d.localId !== target.localId));
      toast.success("Removed", {
        description: `${target.trim || "All trims"} removed from draft`,
      });
      return;
    }

    // Persisted row — delete via API now
    setDeleting(true);
    try {
      await productCarCompatibilityService.deleteCompatibility(
        productId,
        target.compatibilityId,
      );
      setDrafts((prev) => prev.filter((d) => d.localId !== target.localId));
      toast.success("Success", { description: "Trim removed" });
      onSaved?.();
    } catch (error: any) {
      toast.error("Error", {
        description: error?.message || "Failed to remove trim",
      });
    } finally {
      setDeleting(false);
    }
  };

  const flushChanges = async () => {
    if (!carId || !productId) return;
    if (!isDirty) {
      toast.info("No changes", { description: "Nothing to save" });
      return;
    }

    setSaving(true);
    const errors: string[] = [];

    try {
      // Snapshot drafts so concurrent UI updates don't affect this flush
      const snapshot = drafts;
      const toUpdate = snapshot.filter(
        (d) => d.status === "edited" && d.compatibilityId,
      );
      const toCreate = snapshot.filter((d) => d.status === "new");

      for (const row of toUpdate) {
        try {
          await productCarCompatibilityService.updateCompatibility(
            productId,
            row.compatibilityId!,
            {
              yearFrom: row.yearFrom,
              yearTo: row.yearTo,
              trim: row.trim,
            },
          );
        } catch (error: any) {
          errors.push(
            `Update ${row.trim || "All trims"}: ${error?.message || "failed"}`,
          );
        }
      }

      if (toCreate.length > 0) {
        for (const row of toCreate) {
          try {
            await productCarCompatibilityService.addCompatibility(productId, {
              carId,
              yearFrom: row.yearFrom,
              yearTo: row.yearTo,
              trim: row.trim,
            });
          } catch (error: any) {
            errors.push(
              `Add ${row.trim || "All trims"}: ${error?.message || "failed"}`,
            );
          }
        }
      }

      if (errors.length > 0) {
        toast.error("Partial save", {
          description: errors.slice(0, 3).join("; "),
        });
      } else {
        toast.success("Success", { description: "Trim changes saved" });
      }

      await loadTrims(carId);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => {
    if (isDirty) {
      setDiscardConfirmOpen(true);
      return;
    }
    resetSession();
    onOpenChange(false);
  };

  const confirmDiscard = () => {
    setDiscardConfirmOpen(false);
    resetSession();
    onOpenChange(false);
  };

  const busy = saving || deleting || loading;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            requestClose();
            return;
          }
          onOpenChange(true);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Car Trims</DialogTitle>
            <DialogDescription>
              Each product belongs to one make and model. Add trims and year
              ranges for that vehicle only.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {carLocked && brand && model ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="text-sm font-medium">
                  {brand} {model}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Select
                    value={brand || undefined}
                    onValueChange={handleBrandChange}
                    disabled={busy}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
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
                    onValueChange={handleModelChange}
                    disabled={!brand || busy}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          brand ? "Select model" : "Select make first"
                        }
                      />
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

            {carId ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    {brand} {model}
                    {isDirty ? (
                      <span className="ml-2 text-amber-600 dark:text-amber-400">
                        · Unsaved changes
                      </span>
                    ) : null}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={openAddTrim}
                    disabled={busy || Boolean(deleteTarget)}
                  >
                    <Plus size={14} className="mr-1" />
                    Add Trim
                  </Button>
                </div>

                {deleteTarget ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 space-y-3"
                  >
                    <p className="text-sm">
                      {deleteTarget.status === "new" ||
                      !deleteTarget.compatibilityId
                        ? `Remove ${deleteTarget.trim || "All trims"} (${productCarCompatibilityService.formatYearRange(deleteTarget.yearFrom, deleteTarget.yearTo)}) from the draft?`
                        : `Permanently remove ${deleteTarget.trim || "All trims"} (${productCarCompatibilityService.formatYearRange(deleteTarget.yearFrom, deleteTarget.yearTo)})? This cannot be undone.`}
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={deleting}
                        onClick={cancelDelete}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleting}
                        onClick={() => void confirmDelete(deleteTarget)}
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

                {loading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading trims…
                  </div>
                ) : drafts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
                    No trims yet. Click Add Trim to begin.
                  </p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Trim</TableHead>
                          <TableHead>Years</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px] text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drafts.map((draft) => (
                          <TableRow
                            key={draft.localId}
                            className={
                              deleteTarget?.localId === draft.localId
                                ? "bg-destructive/10"
                                : undefined
                            }
                          >
                            <TableCell>
                              {draft.trim || (
                                <span className="text-muted-foreground">
                                  All trims
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {productCarCompatibilityService.formatYearRange(
                                draft.yearFrom,
                                draft.yearTo,
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusBadgeVariant(draft.status)}>
                                {statusLabel(draft.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => openEditTrim(draft)}
                                >
                                  <Edit2 size={14} />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={busy || Boolean(deleteTarget)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestDelete(draft);
                                  }}
                                >
                                  <Trash2
                                    size={14}
                                    className="text-destructive"
                                  />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Select a make and model to manage trims.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={requestClose}
              disabled={busy}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={flushChanges}
              disabled={!carId || !isDirty || busy}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit trim modal */}
      <Dialog open={trimFormOpen} onOpenChange={setTrimFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLocalId ? "Edit Trim" : "Add Trim"}
            </DialogTitle>
            <DialogDescription>
              Trim name is required. Year To can be empty for ongoing ranges.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="trim-name">
                Trim name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="trim-name"
                value={trimForm.trim}
                onChange={(e) =>
                  setTrimForm((f) => ({ ...f, trim: e.target.value }))
                }
                placeholder="e.g. LE, Base, M Sport"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="trim-year-from">Year From</Label>
                <Input
                  id="trim-year-from"
                  type="number"
                  min={1900}
                  value={trimForm.yearFrom}
                  onChange={(e) =>
                    setTrimForm((f) => ({ ...f, yearFrom: e.target.value }))
                  }
                  placeholder="2019"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trim-year-to">Year To</Label>
                <Input
                  id="trim-year-to"
                  type="number"
                  min={1900}
                  value={trimForm.yearTo}
                  onChange={(e) =>
                    setTrimForm((f) => ({ ...f, yearTo: e.target.value }))
                  }
                  placeholder="Present"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTrimFormOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submitTrimForm}>
              {editingLocalId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard unsaved */}
      <AlertDialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved trim changes. Closing will discard them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={confirmDiscard}>
              Discard
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
