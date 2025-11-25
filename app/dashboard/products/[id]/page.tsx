"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Calendar,
  Tag,
  Car,
  Palette,
  Layers,
  Upload,
  X,
  Star,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";
import { productService, Product } from "@/lib/services/product.service";
import { settingsService } from "@/lib/services/settings.service";
import { uploadService } from "@/lib/services/upload.service";
import { categoryService, Category } from "@/lib/services/category.service";
import { useToast } from "@/hooks/use-toast";
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<any | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null); // 'main', 'secondary', or 'gallery'
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    itemCode: "",
    price: "",
    stockQuantity: "",
    description: "",
    categoryId: "",
    subCategoryId: "",
    color: "",
    material: "",
    brand: "",
    size: "",
  });
  const [categoryName, setCategoryName] = useState<string>("");
  const [subcategoryName, setSubcategoryName] = useState<string>("");

  useEffect(() => {
    const initLanguage = async () => {
      const savedLanguage = settingsService.getSelectedLanguage();
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      } else {
        const languages = await settingsService.getLanguages();
        if (languages.length > 0) {
          setSelectedLanguage(languages[0]);
        }
      }
    };
    initLanguage();
  }, []);

  useEffect(() => {
    const initStoreAndCategories = async () => {
      const savedStore = settingsService.getSelectedStore();
      if (savedStore) {
        setSelectedStore(savedStore);
      } else {
        const stores = await settingsService.getStores();
        if (stores.length > 0) {
          setSelectedStore(stores[0]);
        }
      }

      if (selectedLanguage) {
        try {
          const fetchedCategories = await categoryService.listCategories({
            storeId: savedStore?.id || "",
            languageId: selectedLanguage.id,
            includeSubcategories: true,
            limit: 100,
          });

          const categoriesWithNames = fetchedCategories.map((cat) => ({
            ...cat,
            name: categoryService.getCategoryName(cat, selectedLanguage.code),
          }));

          setCategories(categoriesWithNames);
        } catch (error) {
          console.error("Failed to fetch categories:", error);
        }
      }
    };
    if (selectedLanguage) {
      initStoreAndCategories();
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (selectedLanguage) {
      fetchProduct();
    }
  }, [selectedLanguage, productId, categories]); // Re-fetch when categories are loaded

  const fetchProduct = async () => {
    if (!selectedLanguage) return;

    try {
      setLoading(true);
      const response = await productService.getProductById(
        productId,
        selectedLanguage.id
      );

      // Extract display data
      const translation = response.translations?.find(
        (t) => t.languageCode === selectedLanguage.code
      );
      const specs = response.specs?.[selectedLanguage.code];

      setProduct({
        ...response,
        name: translation?.name || response.itemCode,
        description: translation?.description || "",
        color: specs?.color?.value || "-",
        material: specs?.material?.value || "-",
      });

      // Set category and subcategory names from API response objects
      if (response.category) {
        setCategoryName(response.category.name);
      } else if (categories.length > 0 && selectedLanguage) {
        const catName = categoryService.getCategoryNameById(
          response.categoryId,
          categories,
          selectedLanguage.code
        );
        setCategoryName(catName);
      }

      if (response.subCategory) {
        setSubcategoryName(response.subCategory.name);
      } else if (
        response.subCategoryId &&
        categories.length > 0 &&
        selectedLanguage
      ) {
        const subCatName = categoryService.getSubcategoryNameById(
          response.categoryId,
          response.subCategoryId,
          categories,
          selectedLanguage.code
        );
        setSubcategoryName(subCatName);
      } else {
        setSubcategoryName("");
      }
    } catch (error: any) {
      console.error("Failed to fetch product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch product details",
        variant: "destructive",
      });
      router.push("/dashboard/products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productService.deleteProduct(productId);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      router.push("/dashboard/products");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleEditMode = () => {
    if (!product || !selectedLanguage) return;

    const specs = product.specs?.[selectedLanguage.code];

    setFormData({
      name: product.name || "",
      itemCode: product.itemCode,
      price: product.price.toString(),
      stockQuantity: product.stockQuantity.toString(),
      description: product.description || "",
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId || "",
      color: specs?.color?.value || "",
      material: specs?.material?.value || "",
      brand: specs?.brand?.value || "",
      size: specs?.size?.value || "",
    });

    // Set subcategories if category is selected
    if (product.categoryId) {
      const selectedCategory = categories.find(
        (cat) => cat.id === product.categoryId
      );
      if (selectedCategory && selectedCategory.subcategories) {
        const subsWithNames = selectedCategory.subcategories.map((sub) => ({
          ...sub,
          name: categoryService.getCategoryName(
            sub,
            selectedLanguage?.code || "en"
          ),
        }));
        setSubcategories(subsWithNames);
      }
    }

    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: "",
      itemCode: "",
      price: "",
      stockQuantity: "",
      description: "",
      categoryId: "",
      subCategoryId: "",
      color: "",
      material: "",
      brand: "",
      size: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!product || !selectedLanguage || !selectedStore) return;

    // Validation
    if (!formData.name || !formData.price || !formData.stockQuantity) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (Name, Price, Stock Quantity)",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const updatedProductData = {
        itemCode: formData.itemCode,
        categoryId: formData.categoryId,
        subCategoryId: formData.subCategoryId || undefined,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        brand: formData.brand || undefined,
        size: formData.size || undefined,
        translations: [
          {
            languageId: selectedLanguage.id,
            name: formData.name,
            description: formData.description || undefined,
          },
        ],
        specifications:
          formData.color || formData.material
            ? [
                ...(formData.color
                  ? [
                      {
                        specKey: "color",
                        specValue: formData.color,
                        specType: "text" as const,
                        isFilterable: true,
                      },
                    ]
                  : []),
                ...(formData.material
                  ? [
                      {
                        specKey: "material",
                        specValue: formData.material,
                        specType: "text" as const,
                        isFilterable: true,
                      },
                    ]
                  : []),
              ]
            : undefined,
      };

      await productService.updateProduct(productId, updatedProductData);

      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      setIsEditing(false);
      await fetchProduct(); // Refresh product data
    } catch (error: any) {
      console.error("Failed to update product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.categoryId && formData.categoryId !== "") {
      const selectedCategory = categories.find(
        (cat) => cat.id === formData.categoryId
      );
      if (selectedCategory && selectedCategory.subcategories) {
        const subsWithNames = selectedCategory.subcategories.map((sub) => ({
          ...sub,
          name: categoryService.getCategoryName(
            sub,
            selectedLanguage?.code || "en"
          ),
        }));
        setSubcategories(subsWithNames);
      } else {
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
      setFormData((prev) => ({ ...prev, subCategoryId: "" }));
    }
  }, [formData.categoryId, categories, selectedLanguage]);

  const handleImageUpload = async (
    file: File,
    imageField: "main_image" | "secondary_image" | "images"
  ) => {
    // Validate file
    const validation = uploadService.validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingImage(imageField);
      const response = await uploadService.uploadImage(
        file,
        "product",
        productId,
        imageField
      );

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      // Refresh product data
      await fetchProduct();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleDeleteImage = async (
    imageUrl: string,
    imageType: "main" | "secondary" | "gallery"
  ) => {
    if (!product) return;

    try {
      let updatedProduct: Partial<Product> = {};

      if (imageType === "main") {
        updatedProduct.mainImage = null as any;
      } else if (imageType === "secondary") {
        updatedProduct.secondaryImage = null as any;
      } else if (imageType === "gallery") {
        updatedProduct.images = product.images.filter(
          (img) => img !== imageUrl
        );
      }

      await productService.updateProduct(productId, updatedProduct as any);

      toast({
        title: "Success",
        description: "Image removed successfully",
      });

      await fetchProduct();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  const handleSetAsPrimary = async (imageUrl: string) => {
    if (!product) return;

    try {
      // Remove the selected image from gallery (don't add old main image back)
      const updatedImages = product.images.filter((img) => img !== imageUrl);

      await productService.updateProduct(productId, {
        mainImage: imageUrl,
        images: updatedImages,
      } as any);

      toast({
        title: "Success",
        description: "Image set as primary",
      });

      await fetchProduct();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set as primary",
        variant: "destructive",
      });
    }
  };

  const handleSetAsSecondary = async (imageUrl: string) => {
    if (!product) return;

    try {
      // Remove the selected image from gallery (don't add old secondary image back)
      const updatedImages = product.images.filter((img) => img !== imageUrl);

      await productService.updateProduct(productId, {
        secondaryImage: imageUrl,
        images: updatedImages,
      } as any);

      toast({
        title: "Success",
        description: "Image set as secondary",
      });

      await fetchProduct();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set as secondary",
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { label: "Out of Stock", className: "bg-red-900/30 text-red-300" };
    if (quantity < 10)
      return {
        label: "Low Stock",
        className: "bg-yellow-900/30 text-yellow-300",
      };
    return { label: "In Stock", className: "bg-green-900/30 text-green-300" };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <p>Product not found</p>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.stockQuantity);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/products")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              Item Code: {product.itemCode}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleEditMode}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Images Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
            <CardDescription>
              Manage product images (main, secondary, and gallery)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Image */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Main Image</p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploadingImage === "main_image"}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "main_image");
                    };
                    input.click();
                  }}
                >
                  {uploadingImage === "main_image" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  Upload
                </Button>
              </div>
              <div className="aspect-square relative rounded-lg overflow-hidden border group">
                <img
                  src={product.mainImage || "/placeholder.svg"}
                  alt={product.name || "Product"}
                  className="w-full h-full object-cover"
                />
                {product.mainImage && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleDeleteImage(product.mainImage, "main")
                      }
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Image */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Secondary Image</p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploadingImage === "secondary_image"}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "secondary_image");
                    };
                    input.click();
                  }}
                >
                  {uploadingImage === "secondary_image" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  Upload
                </Button>
              </div>
              <div className="aspect-square relative rounded-lg overflow-hidden border group">
                <img
                  src={product.secondaryImage || "/placeholder.svg"}
                  alt={`${product.name} secondary`}
                  className="w-full h-full object-cover"
                />
                {product.secondaryImage && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleDeleteImage(product.secondaryImage, "secondary")
                      }
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Gallery Images */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  Gallery Images (
                  {product.images?.filter(
                    (img) =>
                      img !== product.mainImage &&
                      img !== product.secondaryImage
                  ).length || 0}
                  )
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploadingImage === "images"}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, "images");
                    };
                    input.click();
                  }}
                >
                  {uploadingImage === "images" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  Add Image
                </Button>
              </div>
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {product.images
                    .filter(
                      (img) =>
                        img !== product.mainImage &&
                        img !== product.secondaryImage
                    )
                    .map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-square relative rounded overflow-hidden border group"
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSetAsPrimary(img)}
                            className="text-xs"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSetAsSecondary(img)}
                            className="text-xs"
                          >
                            2nd
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteImage(img, "gallery")}
                            className="text-xs"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8 border rounded-lg">
                  No gallery images yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter product name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="itemCode">Item Code</Label>
                      <Input
                        id="itemCode"
                        value={formData.itemCode}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (JOD) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.001"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        placeholder="0.000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stockQuantity: e.target.value,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                        placeholder="e.g., Akrapovic"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size">Size</Label>
                      <Input
                        id="size"
                        value={formData.size}
                        onChange={(e) =>
                          setFormData({ ...formData, size: e.target.value })
                        }
                        placeholder="e.g., Universal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Color/Design</Label>
                      <Input
                        id="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        placeholder="e.g., Carbon Fiber"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="material">Material</Label>
                      <Input
                        id="material"
                        value={formData.material}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            material: e.target.value,
                          })
                        }
                        placeholder="e.g., ABS Plastic"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            categoryId: value,
                            subCategoryId: "",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subCategory">Sub Category</Label>
                      <Select
                        value={formData.subCategoryId || undefined}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            subCategoryId: value === "none" ? "" : value,
                          })
                        }
                        disabled={
                          !formData.categoryId || subcategories.length === 0
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !formData.categoryId
                                ? "Select category first"
                                : "Select subcategory (optional)"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {subcategories.map((subcategory) => (
                            <SelectItem
                              key={subcategory.id}
                              value={subcategory.id}
                            >
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-2xl font-bold">
                          {product.price.toFixed(3)} JOD
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stock</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">
                            {product.stockQuantity}
                          </p>
                          <Badge className={stockStatus.className}>
                            {stockStatus.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">
                      {product.description || "No description available"}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {product.brand && (
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Brand</p>
                      <p className="font-medium">{product.brand}</p>
                    </div>
                  </div>
                )}
                {/* Show size only for non-variant products */}
                {product.size && !product.variants?.length && (
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium">{product.size}</p>
                    </div>
                  </div>
                )}
                {/* Show available sizes for variant products */}
                {product.variants && product.variants.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Available Sizes
                      </p>
                      <p className="font-medium">
                        {[
                          ...new Set(
                            product.variants.map((v) => v.size).filter(Boolean)
                          ),
                        ].join(", ") || "-"}
                      </p>
                    </div>
                  </div>
                )}
                {/* Material is always from specifications (product-level) */}
                {product.material && (
                  <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Material</p>
                      <p className="font-medium">{product.material}</p>
                    </div>
                  </div>
                )}
                {/* Show color for non-variant products */}
                {product.color && !product.variants?.length && (
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Color</p>
                      <p className="font-medium">{product.color}</p>
                    </div>
                  </div>
                )}
                {/* Show available colors for variant products */}
                {product.variants && product.variants.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Available Colors
                      </p>
                      <p className="font-medium">
                        {[
                          ...new Set(
                            product.variants.map((v) => v.color).filter(Boolean)
                          ),
                        ].join(", ") || "-"}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">
                      {categoryName || product.categoryId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Sub Category
                    </p>
                    <p className="font-medium">
                      {subcategoryName || product.subCategoryId || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>
                  This product has {product.variants.length} variant(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">SKU</th>
                        <th className="text-left p-3 font-medium">Size</th>
                        <th className="text-left p-3 font-medium">Color</th>
                        <th className="text-left p-3 font-medium">
                          Price Adjustment
                        </th>
                        <th className="text-left p-3 font-medium">Stock</th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3 font-mono text-xs">
                            {variant.sku}
                          </td>
                          <td className="p-3">{variant.size || "-"}</td>
                          <td className="p-3">{variant.color || "-"}</td>
                          <td className="p-3">
                            {variant.priceAdjustment >= 0 ? "+" : ""}
                            {variant.priceAdjustment.toFixed(3)} JOD
                          </td>
                          <td className="p-3">{variant.stockQuantity}</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                variant.isActive ? "default" : "secondary"
                              }
                            >
                              {variant.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Car Compatibility */}
          {product.carCompatibility && product.carCompatibility.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Car Compatibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.carCompatibility.map((car, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg"
                    >
                      <Car className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">
                          {car.carBrand} {car.carModel}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {car.carYearFrom} - {car.carYearTo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Last Updated
                    </p>
                    <p className="font-medium">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 text-muted-foreground">🏪</div>
                  <div>
                    <p className="text-sm text-muted-foreground">Store ID</p>
                    <p className="font-medium">{product.storeId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 text-muted-foreground">⭐</div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{product.name}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
