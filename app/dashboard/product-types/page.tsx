"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit2, Trash2, Loader2, Layers } from "lucide-react";
import {
  productTypeService,
  ProductType,
} from "@/lib/services/product-type.service";
import { categoryService } from "@/lib/services/category.service";
import { settingsService } from "@/lib/services/settings.service";
import { useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { getEnglishLanguageId, getArabicLanguageId } from "@/lib/utils";

export default function ProductTypesPage() {
  const { user } = useAuth();

  // State
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<any | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [languagesLoading, setLanguagesLoading] = useState(true);

  // Category counts
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {},
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProductType, setEditingProductType] =
    useState<ProductType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    productType: ProductType;
    categoryCount: number;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    slug: "",
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    sortOrder: 1,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  // Load languages and stores
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLanguagesLoading(true);
        const [languagesData, storesData] = await Promise.all([
          settingsService.getLanguages(),
          settingsService.getStores(),
        ]);

        setLanguages(languagesData);
        setStores(storesData);

        // Set default language
        const defaultLang =
          languagesData.find((l) => l.code === "en") || languagesData[0];
        setSelectedLanguage(defaultLang);

        // Set default store
        if (storesData.length > 0) {
          setSelectedStore(storesData[0]);
        }
      } catch (error: any) {
        console.error("Failed to load settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLanguagesLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Load product types
  useEffect(() => {
    const loadProductTypes = async () => {
      try {
        setLoading(true);
        const data = await productTypeService.getAll();
        setProductTypes(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error("Failed to load product types:", error);
        toast.error("Failed to load product types");
        setProductTypes([]);
      } finally {
        setLoading(false);
      }
    };

    loadProductTypes();
  }, []);

  // Load category counts
  useEffect(() => {
    const loadCategoryCounts = async () => {
      if (!selectedStore || !selectedLanguage || productTypes.length === 0)
        return;

      try {
        const categories = await categoryService.listCategoriesAdmin({
          storeId: selectedStore.id,
          languageId: selectedLanguage.id,
        });
        const counts: Record<string, number> = {};
        productTypes.forEach((pt) => {
          counts[pt.id] = categories.filter(
            (c) => c.productTypeId === pt.id,
          ).length;
        });

        setCategoryCounts(counts);
      } catch (error: any) {
        console.error("Failed to load category counts:", error);
      }
    };

    loadCategoryCounts();
  }, [selectedStore, selectedLanguage, productTypes]);

  const handleOpenAddDialog = () => {
    setEditingProductType(null);
    setFormData({
      code: "",
      slug: "",
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      sortOrder: productTypes.length + 1,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = async (productType: ProductType) => {
    if (!selectedLanguage) return;

    try {
      // Load full details with all translations
      const fullDetails = await productTypeService.getById(
        productType.id,
        selectedLanguage.id,
      );
      setEditingProductType(fullDetails);

      // Extract English and Arabic translations
      const englishTranslation = fullDetails.translations?.find(
        (t) => t.languageCode === "en",
      );
      const arabicTranslation = fullDetails.translations?.find(
        (t) => t.languageCode === "ar",
      );

      setFormData({
        code: fullDetails.code,
        slug: fullDetails.slug,
        name: englishTranslation?.name || "",
        nameAr: arabicTranslation?.name || "",
        description: englishTranslation?.description || "",
        descriptionAr: arabicTranslation?.description || "",
        sortOrder: fullDetails.sortOrder,
        isActive: fullDetails.isActive,
      });
      setDialogOpen(true);
    } catch (error: any) {
      console.error("Failed to load product type details:", error);
      toast.error("Failed to load product type details");
    }
  };

  const handleSaveProductType = async () => {
    if (!selectedLanguage) {
      toast.error("Please select a language");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("English product type name is required");
      return;
    }

    if (!formData.nameAr.trim()) {
      toast.error("Arabic product type name is required");
      return;
    }

    if (!editingProductType && !formData.code.trim()) {
      toast.error("Product type code is required");
      return;
    }

    if (!editingProductType && !formData.slug.trim()) {
      toast.error("Product type slug is required");
      return;
    }

    try {
      setSaving(true);

      // Get language IDs
      const englishLangId = getEnglishLanguageId(languages);
      const arabicLangId = getArabicLanguageId(languages);

      if (editingProductType) {
        // Update existing
        await productTypeService.update(editingProductType.id, {
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
          translations: [
            {
              languageId: englishLangId,
              name: formData.name,
              description: formData.description || undefined,
            },
            {
              languageId: arabicLangId,
              name: formData.nameAr,
              description: formData.descriptionAr || undefined,
            },
          ],
        });
        toast.success("Product type updated successfully");
      } else {
        // Create new
        await productTypeService.create({
          code: formData.code,
          slug: formData.slug,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
          translations: [
            {
              languageId: englishLangId,
              name: formData.name,
              description: formData.description || undefined,
            },
            {
              languageId: arabicLangId,
              name: formData.nameAr,
              description: formData.descriptionAr || undefined,
            },
          ],
        });
        toast.success("Product type created successfully");
      }

      setDialogOpen(false);
      // Reload product types
      const data = await productTypeService.getAll();
      setProductTypes(data);
    } catch (error: any) {
      console.error("Save product type error:", error);
      toast.error(error.message || "Failed to save product type");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (productType: ProductType) => {
    try {
      await productTypeService.update(productType.id, {
        isActive: !productType.isActive,
      });

      toast.success(
        `Product type ${!productType.isActive ? "activated" : "deactivated"}`,
      );

      // Update local state
      setProductTypes(
        productTypes.map((pt) =>
          pt.id === productType.id ? { ...pt, isActive: !pt.isActive } : pt,
        ),
      );
    } catch (error: any) {
      console.error("Toggle active error:", error);
      toast.error("Failed to update product type");
    }
  };

  const handleOpenDeleteDialog = async (productType: ProductType) => {
    const categoryCount = categoryCounts[productType.id] || 0;
    setDeleteConfirm({ productType, categoryCount });
  };

  const handleDeleteProductType = async () => {
    if (!deleteConfirm || !selectedLanguage) return;

    try {
      await productTypeService.delete(deleteConfirm.productType.id);
      toast.success("Product type deleted successfully");
      setDeleteConfirm(null);

      // Reload product types
      const data = await productTypeService.getAll();
      setProductTypes(data);
    } catch (error: any) {
      console.error("Delete product type error:", error);

      // Try to extract category count from error message
      const errorMsg = error.message || "Failed to delete product type";
      toast.error(errorMsg);
    }
  };

  if (languagesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Product Types</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage product type classifications
          </p>
        </div>
        <Button onClick={handleOpenAddDialog} className="gap-2">
          <Plus size={18} />
          Add Product Type
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Product Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productTypes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(productTypes)
                ? productTypes.filter((pt) => pt.isActive).length
                : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(categoryCounts).reduce(
                (sum, count) => sum + count,
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Product Types</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : productTypes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No product types found. Click "Add Product Type" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Sort Order</TableHead>
                  <TableHead className="text-center">Categories</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productTypes
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((productType) => (
                    <TableRow key={productType.id}>
                      <TableCell className="font-medium">
                        {productType?.translations?.find(
                          (t) => t.languageCode === selectedLanguage?.code,
                        )?.name || productType.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {productType.code}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {productType.slug}
                      </TableCell>
                      <TableCell className="text-center">
                        {productType.sortOrder}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {categoryCounts[productType.id] || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={productType.isActive}
                          onCheckedChange={() =>
                            handleToggleActive(productType)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDialog(productType)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDeleteDialog(productType)}
                            className="hover:text-destructive"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProductType ? "Edit Product Type" : "Add Product Type"}
            </DialogTitle>
            <DialogDescription>
              {editingProductType
                ? "Update product type details"
                : "Create a new product type classification"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editingProductType && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="e.g., electric_vehicles"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier (lowercase, underscores only)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slug"
                    placeholder="e.g., electric-vehicles"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    URL-friendly version (lowercase, hyphens only)
                  </p>
                </div>
              </>
            )}

            {/* English Translation Section */}
            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">English Translation</h3>
                <Separator />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Name (English) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Electric Vehicles"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={languages.length === 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (English)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter product type description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  disabled={languages.length === 0}
                />
              </div>
            </div>

            {/* Arabic Translation Section */}
            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Arabic Translation</h3>
                <Separator />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameAr">
                  Name (Arabic) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nameAr"
                  placeholder="مثال: المركبات الكهربائية"
                  value={formData.nameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, nameAr: e.target.value })
                  }
                  disabled={languages.length === 0}
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                <Textarea
                  id="descriptionAr"
                  placeholder="أدخل وصف نوع المنتج"
                  value={formData.descriptionAr}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptionAr: e.target.value })
                  }
                  rows={3}
                  disabled={languages.length === 0}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive">Active</Label>
                <div className="flex items-center h-10">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <span className="ml-2 text-sm">
                    {formData.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProductType}
              disabled={saving || languages.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingProductType ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product Type</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm && deleteConfirm.categoryCount > 0 ? (
                <>
                  Cannot delete "{deleteConfirm.productType.name}". This product
                  type has {deleteConfirm.categoryCount} categor
                  {deleteConfirm.categoryCount === 1 ? "y" : "ies"}. Please
                  reassign or delete them first.
                </>
              ) : (
                <>
                  Are you sure you want to delete "
                  {deleteConfirm?.productType.name}"? This action cannot be
                  undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteConfirm && deleteConfirm.categoryCount === 0 && (
              <AlertDialogAction
                onClick={handleDeleteProductType}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
