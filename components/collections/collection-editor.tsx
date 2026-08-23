"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingState } from "@/components/loading-state";
import { CollectionDetailsForm } from "@/components/collections/collection-details-form";
import { CollectionProductsPanel } from "@/components/collections/collection-products-panel";
import { CollectionConditionsBuilder } from "@/components/collections/collection-conditions-builder";
import { CollectionExcludeList } from "@/components/collections/collection-exclude-list";
import { AddProductsSheet } from "@/components/collections/add-products-sheet";
import { collectionService } from "@/lib/services/collection.service";
import { settingsService } from "@/lib/services/settings.service";
import type { CollectionConditionOptions } from "@/lib/collections/catalog-preview";
import {
  getCollectionTitle,
  normalizeCollectionSlug,
  slugifyTitle,
  type Collection,
  type CollectionCondition,
  type CollectionProduct,
  type CollectionStatus,
  type CollectionTranslation,
  type CollectionType,
} from "@/lib/domain/collections";

export interface CollectionEditorProps {
  mode: "create" | "edit";
  collectionId?: string;
  initialType?: CollectionType;
}

type DraftState = {
  type: CollectionType;
  status: CollectionStatus;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  translations: CollectionTranslation[];
  productIds: string[];
  conditions: CollectionCondition[];
  excludedProductIds: string[];
};

function emptyDraft(type: CollectionType): DraftState {
  return {
    type,
    status: "draft",
    slug: "",
    imageUrl: null,
    sortOrder: 1,
    translations: [
      { languageCode: "en", title: "", description: "" },
      { languageCode: "ar", title: "", description: "" },
    ],
    productIds: [],
    conditions: [],
    excludedProductIds: [],
  };
}

function fromCollection(c: Collection): DraftState {
  return {
    type: c.type,
    status: c.status,
    slug: c.slug,
    imageUrl: c.imageUrl,
    sortOrder: c.sortOrder,
    translations: c.translations.length
      ? c.translations
      : emptyDraft(c.type).translations,
    productIds: [...c.productIds],
    conditions: [...c.conditions],
    excludedProductIds: [...c.excludedProductIds],
  };
}

export function CollectionEditor({
  mode,
  collectionId,
  initialType = "manual",
}: CollectionEditorProps) {
  const router = useRouter();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [storeId, setStoreId] = useState("");
  const [languageId, setLanguageId] = useState("");
  const [draft, setDraft] = useState<DraftState>(() => emptyDraft(initialType));
  const [baseline, setBaseline] = useState<string>("");
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [excludedProducts, setExcludedProducts] = useState<CollectionProduct[]>(
    [],
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productView, setProductView] = useState<"list" | "grid">("list");
  const [productSearch, setProductSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [excludeOpen, setExcludeOpen] = useState(false);
  const [typeSwitchOpen, setTypeSwitchOpen] = useState(false);
  const [pendingType, setPendingType] = useState<CollectionType | null>(null);
  const [conditionOptions, setConditionOptions] =
    useState<CollectionConditionOptions | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const dirty = useMemo(() => {
    if (!baseline) return false;
    return JSON.stringify(draft) !== baseline;
  }, [draft, baseline]);

  const refreshPreview = useCallback(
    async (state: DraftState, sid: string, lid: string) => {
      if (!sid || !lid) {
        setProducts([]);
        return;
      }
      setPreviewLoading(true);
      try {
        const rows = await collectionService.previewMembership({
          storeId: sid,
          languageId: lid,
          type: state.type,
          productIds: state.productIds,
          conditions: state.conditions.filter((c) => c.value?.trim()),
          excludedProductIds: state.excludedProductIds,
        });
        setProducts(rows);
      } catch (err: unknown) {
        setProducts([]);
        // Don't toast for empty/membership preview noise — log only.
        console.error("Collection product preview failed:", err);
      } finally {
        setPreviewLoading(false);
      }
    },
    [],
  );

  const refreshExcluded = useCallback(
    async (ids: string[], sid: string, lid: string) => {
      if (!sid || !lid || ids.length === 0) {
        setExcludedProducts([]);
        return;
      }
      try {
        const rows = await collectionService.previewMembership({
          storeId: sid,
          languageId: lid,
          type: "manual",
          productIds: ids,
          excludedProductIds: [],
        });
        setExcludedProducts(rows);
      } catch {
        setExcludedProducts([]);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBootstrapping(true);
      try {
        let resolvedStore = "";
        let resolvedLanguage = "";
        try {
          const [stores, languages] = await Promise.all([
            settingsService.getStores(),
            settingsService.getLanguages(),
          ]);
          const savedStore = settingsService.getSelectedStore();
          const savedLang = settingsService.getSelectedLanguage();
          resolvedStore =
            stores.find((s) => s.id === savedStore?.id)?.id ??
            stores[0]?.id ??
            "";
          resolvedLanguage =
            languages.find((l) => l.id === savedLang?.id)?.id ??
            languages.find((l) => l.code === "en")?.id ??
            languages[0]?.id ??
            "";
          if (resolvedStore) settingsService.setSelectedStore(resolvedStore);
        } catch {
          // keep empty — preview will fail with clear toast
        }
        if (cancelled) return;
        if (!resolvedStore || !resolvedLanguage) {
          throw new Error(
            "Select a store and language before editing collections.",
          );
        }
        setStoreId(resolvedStore);
        setLanguageId(resolvedLanguage);

        setOptionsLoading(true);
        try {
          const opts = await collectionService.getConditionOptions(
            resolvedStore,
            resolvedLanguage,
          );
          if (!cancelled) setConditionOptions(opts);
        } catch (err: unknown) {
          console.error("Failed to load collection condition options:", err);
          if (!cancelled) {
            setConditionOptions({
              categories: [],
              productTypes: [],
              carMakes: [],
              carModels: [],
              carModelsByMake: {},
              carYears: [],
              activeStatuses: [
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ],
            });
          }
        } finally {
          if (!cancelled) setOptionsLoading(false);
        }

        if (mode === "edit" && collectionId) {
          const { collection } = await collectionService.getCollection(
            collectionId,
          );
          if (cancelled) return;
          const next = fromCollection(collection);
          setDraft(next);
          setBaseline(JSON.stringify(next));
          await refreshPreview(next, resolvedStore, resolvedLanguage);
          await refreshExcluded(
            next.excludedProductIds,
            resolvedStore,
            resolvedLanguage,
          );
        } else {
          const next = emptyDraft(initialType);
          setDraft(next);
          setBaseline(JSON.stringify(next));
          await refreshPreview(next, resolvedStore, resolvedLanguage);
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load collection",
        );
        router.replace("/dashboard/collections");
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    mode,
    collectionId,
    initialType,
    refreshPreview,
    refreshExcluded,
    router,
  ]);

  useEffect(() => {
    if (bootstrapping || !storeId || !languageId) return;
    const timer = setTimeout(() => {
      void refreshPreview(draft, storeId, languageId);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- membership inputs only
  }, [
    draft.type,
    draft.productIds,
    draft.conditions,
    draft.excludedProductIds,
    bootstrapping,
    storeId,
    languageId,
    refreshPreview,
  ]);

  useEffect(() => {
    if (bootstrapping || !storeId || !languageId) return;
    void refreshExcluded(draft.excludedProductIds, storeId, languageId);
  }, [
    draft.excludedProductIds,
    bootstrapping,
    storeId,
    languageId,
    refreshExcluded,
  ]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const patchDraft = (patch: Partial<DraftState>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const requestTypeChange = (next: CollectionType) => {
    if (next === draft.type) return;
    const hasData =
      draft.productIds.length > 0 ||
      draft.conditions.length > 0 ||
      draft.excludedProductIds.length > 0;
    if (hasData) {
      setPendingType(next);
      setTypeSwitchOpen(true);
      return;
    }
    patchDraft({
      type: next,
      productIds: [],
      conditions: [],
    });
  };

  const confirmTypeSwitch = () => {
    if (!pendingType) return;
    patchDraft({
      type: pendingType,
      productIds: [],
      conditions: [],
      excludedProductIds: [],
    });
    setPendingType(null);
    setTypeSwitchOpen(false);
  };

  const moveProduct = (productId: string, direction: "up" | "down") => {
    setDraft((prev) => {
      const ids = [...prev.productIds];
      const index = ids.indexOf(productId);
      if (index < 0) return prev;
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= ids.length) return prev;
      [ids[index], ids[swapWith]] = [ids[swapWith], ids[index]];
      return { ...prev, productIds: ids };
    });
  };

  const removeProduct = (productId: string) => {
    setDraft((prev) => ({
      ...prev,
      productIds: prev.productIds.filter((id) => id !== productId),
    }));
  };

  const handleSave = async () => {
    const enTitle =
      draft.translations.find((t) => t.languageCode === "en")?.title?.trim() ||
      "";
    const enDescription =
      draft.translations.find((t) => t.languageCode === "en")?.description?.trim() ||
      "";
    const slug = normalizeCollectionSlug(draft.slug);

    if (!enTitle) {
      toast.error("Title is required");
      return;
    }
    if (!enDescription) {
      toast.error("Description is required");
      return;
    }
    if (!slug) {
      toast.error("Slug is required");
      return;
    }

    // Backend allows draft with zero members; active requires membership ≥ 1.
    const hasProducts =
      draft.type === "manual"
        ? draft.productIds.filter(
            (id) => !draft.excludedProductIds.includes(id),
          ).length > 0
        : products.length > 0;

    if (draft.status === "active" && !hasProducts) {
      toast.error(
        draft.type === "manual"
          ? "Add at least one product before publishing"
          : "Add conditions that match at least one product before publishing",
      );
      return;
    }

    if (draft.imageUrl?.startsWith("data:")) {
      toast.message(
        "Cover image skipped — upload a hosted image URL (data URLs are not stored).",
      );
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const created = await collectionService.createCollection({
          storeId,
          type: draft.type,
          status: draft.status,
          slug,
          imageUrl: draft.imageUrl,
          sortOrder: draft.sortOrder,
          translations: draft.translations,
          productIds: draft.productIds,
          conditions: draft.conditions.filter((c) => c.value?.trim()),
          excludedProductIds: draft.excludedProductIds,
        });
        toast.success("Collection created");
        router.replace(`/dashboard/collections/${created.id}`);
      } else if (collectionId) {
        const updated = await collectionService.updateCollection(collectionId, {
          type: draft.type,
          status: draft.status,
          slug,
          imageUrl: draft.imageUrl,
          sortOrder: draft.sortOrder,
          translations: draft.translations,
          productIds: draft.productIds,
          conditions: draft.conditions.filter((c) => c.value?.trim()),
          excludedProductIds: draft.excludedProductIds,
        });
        const next = fromCollection(updated);
        setDraft(next);
        setBaseline(JSON.stringify(next));
        toast.success("Collection saved");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!baseline) return;
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    const restored = JSON.parse(baseline) as DraftState;
    setDraft(restored);
  };

  const handleBack = () => {
    if (dirty && !window.confirm("Leave without saving?")) return;
    router.push("/dashboard/collections");
  };

  if (bootstrapping) {
    return (
      <LoadingState
        variant="full"
        label={mode === "create" ? "Preparing editor…" : "Loading collection…"}
      />
    );
  }

  const titleHint =
    getCollectionTitle({ translations: draft.translations }) ||
    (mode === "create" ? "New collection" : "Collection");

  return (
    <div className="space-y-4 pb-24 lg:pb-8">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/95 backdrop-blur border-b border-border flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back to collections"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              <Link
                href="/dashboard/collections"
                className="hover:text-foreground"
              >
                Collections
              </Link>
              {" / "}
              {mode === "create" ? "New" : "Edit"}
            </p>
            <h1 className="text-lg sm:text-xl font-bold truncate">
              {titleHint}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            disabled={!dirty || saving}
            onClick={handleDiscard}
          >
            Discard
          </Button>
          <Button
            type="button"
            className="flex-1 sm:flex-none gap-2"
            disabled={!dirty || saving}
            onClick={() => void handleSave()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
              <CardDescription>
                Title, description, and slug are required. Image is optional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CollectionDetailsForm
                translations={draft.translations}
                slug={draft.slug}
                imageUrl={draft.imageUrl}
                onTranslationsChange={(translations) => {
                  const enTitle =
                    translations.find((t) => t.languageCode === "en")?.title ??
                    "";
                  setDraft((prev) => ({
                    ...prev,
                    translations,
                    slug:
                      !prev.slug ||
                      prev.slug ===
                        slugifyTitle(
                          prev.translations.find((t) => t.languageCode === "en")
                            ?.title ?? "",
                        )
                        ? slugifyTitle(enTitle)
                        : prev.slug,
                  }));
                }}
                onSlugChange={(slug) => patchDraft({ slug })}
                onImageUrlChange={(imageUrl) => patchDraft({ imageUrl })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Products
                {draft.status === "active" ? (
                  <span className="text-destructive font-normal"> *</span>
                ) : null}
              </CardTitle>
              <CardDescription>
                {draft.type === "manual"
                  ? "Add products from your live catalog. Required to publish as Active."
                  : "Conditions preview matching products. Required to publish as Active (drafts may be empty)."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CollectionProductsPanel
                products={products}
                type={draft.type}
                view={productView}
                search={productSearch}
                loading={previewLoading}
                onViewChange={setProductView}
                onSearchChange={setProductSearch}
                onMove={draft.type === "manual" ? moveProduct : undefined}
                onRemove={draft.type === "manual" ? removeProduct : undefined}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                How products are included
              </CardTitle>
              <CardDescription>
                {draft.type === "manual"
                  ? "Manually select products for this collection."
                  : "Products are added when they match your conditions."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Collection type</Label>
                <Select
                  value={draft.type}
                  onValueChange={(v) =>
                    requestTypeChange(v as CollectionType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automated">Automated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {draft.type === "manual" ? (
                <Button
                  type="button"
                  className="w-full gap-2"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus size={16} />
                  Add products
                </Button>
              ) : (
                <CollectionConditionsBuilder
                  conditions={draft.conditions}
                  options={conditionOptions}
                  loadingOptions={optionsLoading}
                  onChange={(conditions) => patchDraft({ conditions })}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <CollectionExcludeList
                products={excludedProducts}
                onRemove={(id) =>
                  patchDraft({
                    excludedProductIds: draft.excludedProductIds.filter(
                      (x) => x !== id,
                    ),
                  })
                }
                onAddClick={() => setExcludeOpen(true)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) =>
                    patchDraft({ status: v as CollectionStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="col-sort">Sort order</Label>
                <Input
                  id="col-sort"
                  type="number"
                  value={draft.sortOrder}
                  onChange={(e) =>
                    patchDraft({
                      sortOrder: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background p-3 flex gap-2 lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={!dirty || saving}
          onClick={handleDiscard}
        >
          Discard
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!dirty || saving}
          onClick={() => void handleSave()}
        >
          Save
        </Button>
      </div>

      <AddProductsSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        storeId={storeId}
        languageId={languageId}
        selectedIds={draft.productIds}
        onConfirm={(ids) => patchDraft({ productIds: ids })}
      />

      <AddProductsSheet
        open={excludeOpen}
        onOpenChange={setExcludeOpen}
        storeId={storeId}
        languageId={languageId}
        title="Exclude products"
        description="Selected products will never appear in this collection."
        selectedIds={draft.excludedProductIds}
        onConfirm={(ids) => patchDraft({ excludedProductIds: ids })}
      />

      <AlertDialog open={typeSwitchOpen} onOpenChange={setTypeSwitchOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch collection type?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing between manual and automated clears products, conditions,
              and exclusions for this collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingType(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmTypeSwitch}>
              Switch type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
