"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Library,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CollectionTypeDialog } from "@/components/collections/collection-type-dialog";
import { collectionService } from "@/lib/services/collection.service";
import { resolveStoreId } from "@/lib/stores/resolve-store-id";
import {
  COLLECTION_STATUS_LABELS,
  COLLECTION_TYPE_LABELS,
  getCollectionTitle,
  type CollectionListItem,
  type CollectionStatus,
  type CollectionType,
} from "@/lib/domain/collections";
import { cn } from "@/lib/utils";

export default function CollectionsPage() {
  const router = useRouter();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [storesLoading, setStoresLoading] = useState(true);

  const [collections, setCollections] = useState<CollectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CollectionType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<CollectionStatus | "all">(
    "all",
  );

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CollectionListItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStoresLoading(true);
      try {
        const storeId = await resolveStoreId();
        if (!cancelled) setSelectedStoreId(storeId);
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Failed to resolve store",
          );
        }
      } finally {
        if (!cancelled) setStoresLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadCollections = useCallback(async () => {
    if (!selectedStoreId) return;
    setLoading(true);
    try {
      const res = await collectionService.listCollections({
        storeId: selectedStoreId,
        search,
        type: typeFilter,
        status: statusFilter,
      });
      setCollections(res.collections);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load collections";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, search, typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCollections();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadCollections]);

  const handleCreate = (type: CollectionType) => {
    router.push(`/dashboard/collections/new?type=${type}`);
  };

  const handleDuplicate = async (item: CollectionListItem) => {
    try {
      const copy = await collectionService.duplicateCollection(item.id);
      toast.success("Collection duplicated");
      router.push(`/dashboard/collections/${copy.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Duplicate failed");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await collectionService.deleteCollection(deleteTarget.id);
      toast.success("Collection deleted");
      setDeleteTarget(null);
      await loadCollections();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (storesLoading) {
    return <LoadingState variant="full" label="Loading stores…" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Collections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Merchandising groups for your storefront — separate from category
            taxonomy.
          </p>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto shrink-0"
          onClick={() => setTypeDialogOpen(true)}
        >
          <Plus size={18} />
          Create collection
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search collections…"
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as CollectionType | "all")}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="automated">Automated</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as CollectionStatus | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-lg overflow-hidden relative bg-card">
        {loading && collections.length > 0 ? (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/20">
            <div className="h-full w-1/3 animate-pulse bg-primary" />
          </div>
        ) : null}

        {loading && collections.length === 0 ? (
          <LoadingState label="Loading collections…" />
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Library className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No collections yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Create a manual or automated collection to feature products on
                the storefront. Categories still define your catalog taxonomy.
              </p>
            </div>
            <Button className="gap-2 mt-1" onClick={() => setTypeDialogOpen(true)}>
              <Plus size={16} />
              Create collection
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "overflow-x-auto transition-opacity",
              loading && "opacity-60 pointer-events-none",
            )}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="py-3 px-4 font-semibold">Collection</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Products</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Updated</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/60 last:border-0 hover:bg-accent/5"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/collections/${item.id}`}
                        className="flex items-center gap-3 min-w-0 group"
                      >
                        <div className="h-10 w-10 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden border border-border">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Library className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary truncate">
                            {getCollectionTitle(item)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            /{item.slug}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">
                        {COLLECTION_TYPE_LABELS[item.type]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 tabular-nums">
                      {item.productCount}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          item.status === "active" ? "default" : "outline"
                        }
                      >
                        {COLLECTION_STATUS_LABELS[item.status]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/collections/${item.id}`}>
                              <Pencil size={14} className="mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => void handleDuplicate(item)}
                          >
                            <Copy size={14} className="mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CollectionTypeDialog
        open={typeDialogOpen}
        onOpenChange={setTypeDialogOpen}
        onSelect={handleCreate}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${getCollectionTitle(deleteTarget)}” will be removed. This cannot be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
