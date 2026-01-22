"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { categoryService, Category } from "@/lib/services/category.service";
import {
  productTypeService,
  ProductType,
} from "@/lib/services/product-type.service";
import { settingsService } from "@/lib/services/settings.service";
import { uploadService } from "@/lib/services/upload.service";
import { useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";

interface CategoryWithExpanded extends Category {
  expanded?: boolean;
}

export default function CategoriesPage() {
  const { user } = useAuth();

  // Store and Language state
  const [stores, setStores] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<any | null>(null);
  const [storesLoading, setStoresLoading] = useState(true);

  // Categories state
  const [categories, setCategories] = useState<CategoryWithExpanded[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [productTypesLoading, setProductTypesLoading] = useState(false);

  // Filter state
  const [filterProductTypeId, setFilterProductTypeId] = useState<string>("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    category: Category;
  } | null>(null);
  const [productTypeWarning, setProductTypeWarning] = useState<{
    category: any;
    onConfirm: () => void;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    productTypeId: "",
    parentId: "",
    image: "",
    sortOrder: 1,
    isActive: true,
  });
  const [subcategories, setSubcategories] = useState<
    Array<{ name: string; sortOrder: number }>
  >([{ name: "", sortOrder: 1 }]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load stores and languages
  useEffect(() => {
    const loadStoresAndLanguages = async () => {
      try {
        setStoresLoading(true);
        const [storesData, languagesData] = await Promise.all([
          settingsService.getStores(),
          settingsService.getLanguages(),
        ]);

        setStores(storesData);
        setLanguages(languagesData);

        // Set default store and language
        if (storesData.length > 0) {
          setSelectedStore(storesData[0]);
        }
        if (languagesData.length > 0) {
          const defaultLang =
            languagesData.find((l) => l.code === "en") || languagesData[0];
          setSelectedLanguage(defaultLang);
        }
      } catch (error: any) {
        console.error("Failed to load stores/languages:", error);
        toast.error("Failed to load settings");
      } finally {
        setStoresLoading(false);
      }
    };

    loadStoresAndLanguages();
  }, []);

  // Load product types
  useEffect(() => {
    const loadProductTypes = async () => {
      if (!selectedLanguage) return;

      try {
        setProductTypesLoading(true);
        const data = await productTypeService.getAll(selectedLanguage.id);
        console.log("Product Types", data);
        setProductTypes(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error("Failed to load product types:", error);
        toast.error("Failed to load product types");
        setProductTypes([]);
      } finally {
        setProductTypesLoading(false);
      }
    };

    loadProductTypes();
  }, [selectedLanguage]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      if (!selectedStore || !selectedLanguage) return;

      try {
        setCategoriesLoading(true);
        const data = await categoryService.listCategoriesAdmin({
          storeId: selectedStore.id,
          languageId: selectedLanguage.id,
          productTypeId:
            filterProductTypeId === "all" ? undefined : filterProductTypeId,
          includeSubcategories: true,
        });

        // Add expanded state
        const categoriesWithExpanded = data.map((cat) => ({
          ...cat,
          expanded: false,
        }));

        setCategories(categoriesWithExpanded);
      } catch (error: any) {
        console.error("Failed to load categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [selectedStore, selectedLanguage, filterProductTypeId]);

  const toggleCategoryExpand = (id: string) => {
    setCategories(
      categories.map((cat) =>
        cat.id === id ? { ...cat, expanded: !cat.expanded } : cat,
      ),
    );
  };

  const handleOpenAddDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      productTypeId: "",
      parentId: "none",
      image: "",
      sortOrder: 1,
      isActive: true,
    });
    setSubcategories([{ name: "", sortOrder: 1 }]);
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (category: Category) => {
    setEditingCategory(category);

    const translation = category.translations?.[0];
    setFormData({
      name: translation?.name || "",
      description: translation?.description || "",
      productTypeId: category.productTypeId || "",
      parentId: category.parentId || "none",
      image: category.categoryImage || "",
      sortOrder: category.sortOrder || 1,
      isActive: category.isActive,
    });
    setImagePreview(category.categoryImage || "");
    setImageFile(null);
    setSubcategories([{ name: "", sortOrder: 1 }]);
    setDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, image: "" });
  };

  const handleAddSubcategory = () => {
    setSubcategories([
      ...subcategories,
      { name: "", sortOrder: subcategories.length + 1 },
    ]);
  };

  const handleRemoveSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleSubcategoryNameChange = (index: number, name: string) => {
    const updated = [...subcategories];
    updated[index].name = name;
    setSubcategories(updated);
  };

  const handleSaveCategory = async () => {
    if (!selectedStore || !selectedLanguage) {
      toast.error("Please select a store and language");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (!formData.productTypeId) {
      toast.error("Product type is required");
      return;
    }

    // Check if parent category has different product type
    if (formData.parentId && formData.parentId !== "none") {
      const parentCategory = categories.find((c) => c.id === formData.parentId);
      if (
        parentCategory &&
        parentCategory.productTypeId !== formData.productTypeId
      ) {
        setProductTypeWarning({
          category: formData,
          onConfirm: async () => {
            setProductTypeWarning(null);
            await performSaveCategory();
          },
        });
        return;
      }
    }

    await performSaveCategory();
  };

  const performSaveCategory = async () => {
    if (!selectedStore || !selectedLanguage) return;

    try {
      setSaving(true);

      // Upload image if needed
      let imageUrl = formData.image;
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadService.uploadImage(imageFile);
        setUploading(false);
      }

      const categoryData = {
        storeId: selectedStore.id,
        productTypeId: formData.productTypeId,
        parentId:
          formData.parentId === "none" ? null : formData.parentId || null,
        image: imageUrl,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
        translations: [
          {
            languageId: selectedLanguage.id,
            name: formData.name,
            description: formData.description || undefined,
            slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
          },
        ],
      };

      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, categoryData);
        toast.success("Category updated successfully");
      } else {
        const createdCategory =
          await categoryService.createCategory(categoryData);

        // Create subcategories if any (only when parentId is "none" and not editing)
        if (formData.parentId === "none") {
          const validSubcategories = subcategories.filter((sub) =>
            sub.name.trim(),
          );
          for (const subcategory of validSubcategories) {
            await categoryService.createCategory({
              storeId: selectedStore.id,
              productTypeId: formData.productTypeId,
              parentId: createdCategory.id,
              image: "",
              sortOrder: subcategory.sortOrder,
              isActive: true,
              translations: [
                {
                  languageId: selectedLanguage.id,
                  name: subcategory.name,
                  description: undefined,
                  slug: subcategory.name.toLowerCase().replace(/\s+/g, "-"),
                },
              ],
            });
          }
        }

        toast.success("Category created successfully");
      }

      setDialogOpen(false);
      // Reload categories
      const data = await categoryService.listCategoriesAdmin({
        storeId: selectedStore.id,
        languageId: selectedLanguage.id,
        productTypeId:
          filterProductTypeId === "all" ? undefined : filterProductTypeId,
        includeSubcategories: true,
      });
      setCategories(data.map((cat) => ({ ...cat, expanded: false })));
    } catch (error: any) {
      console.error("Save category error:", error);
      toast.error(error.message || "Failed to save category");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm || !selectedStore || !selectedLanguage) return;

    try {
      await categoryService.deleteCategory(deleteConfirm.category.id);
      toast.success("Category deleted successfully");
      setDeleteConfirm(null);

      // Reload categories
      const data = await categoryService.listCategoriesAdmin({
        storeId: selectedStore.id,
        languageId: selectedLanguage.id,
        productTypeId:
          filterProductTypeId === "all" ? undefined : filterProductTypeId,
        includeSubcategories: true,
      });
      setCategories(data.map((cat) => ({ ...cat, expanded: false })));
    } catch (error: any) {
      console.error("Delete category error:", error);
      toast.error(error.message || "Failed to delete category");
    }
  };

  const getCategoryName = (category: Category): string => {
    if (category.name) return category.name;
    const translation = category.translations?.[0];
    return translation?.name || "Unnamed Category";
  };

  console.log("Categories", categories);

  const parentCategories = categories.filter((c) => !c.parentId);
  const totalSubcategories = parentCategories.reduce(
    (sum, cat) => sum + (cat.subcategories?.length || 0),
    0,
  );

  if (storesLoading) {
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
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your product categories and subcategories
          </p>
        </div>
        <Button onClick={handleOpenAddDialog} className="gap-2">
          <Plus size={18} />
          Add Category
        </Button>
      </div>

      {/* Store & Language Selection */}
      <div className="flex gap-4">
        <div className="w-64">
          <Label>Store</Label>
          <Select
            value={selectedStore?.id || ""}
            onValueChange={(value) => {
              const store = stores.find((s) => s.id === value);
              setSelectedStore(store || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-64">
          <Label>Language</Label>
          <Select
            value={selectedLanguage?.id || ""}
            onValueChange={(value) => {
              const lang = languages.find((l) => l.id === value);
              setSelectedLanguage(lang || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.id} value={lang.id}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-64">
          <Label>Filter by Product Type</Label>
          <Select
            value={filterProductTypeId}
            onValueChange={setFilterProductTypeId}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Product Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Product Types</SelectItem>
              {Array.isArray(productTypes) &&
                productTypes
                  .filter((pt) => pt.isActive)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((pt) => (
                    <SelectItem key={pt.id} value={pt.id}>
                      {pt.translations?.find(
                        (t) => t.languageCode === selectedLanguage?.code,
                      )?.name || pt.name}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Parent Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parentCategories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subcategories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubcategories}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No categories found. Click "Add Category" to create one.
            </div>
          ) : (
            <div className="space-y-1">
              {parentCategories.map((category) => {
                const subcats = category.subcategories || [];
                return (
                  <div key={category.id}>
                    {/* Parent Category */}
                    <div className="flex items-center gap-3 p-3 hover:bg-accent rounded-md group">
                      <button
                        onClick={() => toggleCategoryExpand(category.id)}
                        className="h-6 w-6 flex items-center justify-center hover:bg-muted rounded"
                      >
                        {category.expanded ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </button>
                      <span className="font-semibold text-foreground flex-1">
                        {getCategoryName(category)}
                      </span>
                      {category.productType && (
                        <Badge variant="secondary">
                          {category.productType.name}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {subcats.length} subcategories
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleOpenEditDialog(category)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:text-destructive"
                          onClick={() => setDeleteConfirm({ category })}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    {/* Subcategories */}
                    {category.expanded && subcats.length > 0 && (
                      <div className="space-y-1 ml-6">
                        {subcats.map((subcategory) => (
                          <div
                            key={subcategory.id}
                            className="flex items-center gap-3 p-3 hover:bg-primary/10 rounded-md group"
                          >
                            <div className="w-6" />
                            <span className="text-foreground text-sm flex-1">
                              {subcategory.name}
                            </span>
                            {subcategory.productCount !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {subcategory.productCount} products
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update category details"
                : "Create a new category or subcategory"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Interior, Exterior"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Category description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productType">
                  Product Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.productTypeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, productTypeId: value })
                  }
                >
                  <SelectTrigger id="productType">
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypesLoading ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Loading...
                      </div>
                    ) : (
                      Array.isArray(productTypes) &&
                      productTypes
                        .filter((pt) => pt.isActive)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((pt) => (
                          <SelectItem key={pt.id} value={pt.id}>
                            {pt.translations?.find(
                              (t) => t.languageCode === selectedLanguage?.code,
                            )?.name || pt.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent">Parent Category (Optional)</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parentId: value })
                  }
                >
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {parentCategories
                      .filter((c) => c.id !== editingCategory?.id)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {getCategoryName(cat)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Category Image</Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </div>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="h-10 w-10 border rounded-md flex items-center justify-center hover:bg-destructive/10 text-destructive"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded border"
                  />
                </div>
              )}
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
                <Label htmlFor="isActive">Status</Label>
                <Select
                  value={formData.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isActive: value === "active" })
                  }
                >
                  <SelectTrigger id="isActive">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subcategories Section - Only show when creating a parent category */}
            {!editingCategory && formData.parentId === "none" && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Subcategories (Optional)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add subcategories to organize products under this category
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSubcategory}
                    className="gap-1"
                  >
                    <Plus size={14} />
                    Add
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {subcategories.map((subcat, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder={`Subcategory ${index + 1} name`}
                        value={subcat.name}
                        onChange={(e) =>
                          handleSubcategoryNameChange(index, e.target.value)
                        }
                      />
                      {subcategories.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSubcategory(index)}
                          className="h-10 w-10 p-0 hover:text-destructive"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving || uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingCategory ? (
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {deleteConfirm && getCategoryName(deleteConfirm.category)}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Type Warning Dialog */}
      <AlertDialog
        open={!!productTypeWarning}
        onOpenChange={() => setProductTypeWarning(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Different Product Type Warning</AlertDialogTitle>
            <AlertDialogDescription>
              The selected parent category belongs to a different product type.
              This may cause organizational issues. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductTypeWarning(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={productTypeWarning?.onConfirm}>
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
