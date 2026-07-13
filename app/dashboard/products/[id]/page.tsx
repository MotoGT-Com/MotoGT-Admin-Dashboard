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
import { Checkbox } from "@/components/ui/checkbox";
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
  Plus,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  productService,
  Product,
  buildProductImageRemovalPayload,
  wasProductImageRemoved,
  buildSetPrimaryImagePayload,
  buildSetSecondaryImagePayload,
  sumVariantStock,
  getEffectiveStockQuantity,
} from "@/lib/services/product.service";
import {
  productCarCompatibilityService,
  ProductCarCompatibility,
} from "@/lib/services/product-car-compatibility.service";
import { carService } from "@/lib/services/car.service";
import { settingsService } from "@/lib/services/settings.service";
import { uploadService } from "@/lib/services/upload.service";
import { categoryService, Category } from "@/lib/services/category.service";
import { toast } from "sonner";
import { getEnglishLanguageId, getArabicLanguageId } from "@/lib/utils";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COMING_SOON_STOCK_QUANTITY = 1000000;

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<any | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null); // 'main', 'secondary', or 'gallery'
  const [isEditing, setIsEditing] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    itemCode: "",
    price: "",
    stockQuantity: "",
    description: "",
    descriptionAr: "",
    categoryId: "",
    subCategoryId: "",
    color: "",
    material: "",
    brand: "",
    size: "",
  });
  const [categoryName, setCategoryName] = useState<string>("");
  const [subcategoryName, setSubcategoryName] = useState<string>("");

  // Car compatibility management
  const [compatibilities, setCompatibilities] = useState<
    ProductCarCompatibility[]
  >([]);
  const [showCompatibilityDialog, setShowCompatibilityDialog] = useState(false);
  const [editingCompatibility, setEditingCompatibility] =
    useState<ProductCarCompatibility | null>(null);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [availableTrims, setAvailableTrims] = useState<string[]>([]);
  const [loadingTrims, setLoadingTrims] = useState(false);
  const [showAddTrimField, setShowAddTrimField] = useState(false);
  const [newTrimInput, setNewTrimInput] = useState("");
  const [compatibilityForm, setCompatibilityForm] = useState({
    carId: "",
    brand: "",
    model: "",
    yearFrom: "",
    yearTo: "",
    trim: "",
  });

  const ALL_TRIMS_VALUE = "__all__";

  const resetCompatibilityForm = () => {
    setCompatibilityForm({
      carId: "",
      brand: "",
      model: "",
      yearFrom: "",
      yearTo: "",
      trim: "",
    });
    setAvailableTrims([]);
    setShowAddTrimField(false);
    setNewTrimInput("");
  };

  const compatibilityBrands = Array.from(
    new Set(availableCars.map((car) => car.brand).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const compatibilityModels = Array.from(
    new Set(
      availableCars
        .filter((car) => car.brand === compatibilityForm.brand)
        .map((car) => car.model)
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const trimOptions = Array.from(
    new Set(
      [...availableTrims, compatibilityForm.trim].filter(
        (trim): trim is string => Boolean(trim),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const resolveCarId = (
    brand: string,
    model: string,
    trim?: string,
    cars = availableCars,
  ) => {
    const normalizedTrim = (trim || "").trim();
    const matches = cars.filter(
      (car) => car.brand === brand && car.model === model,
    );

    if (normalizedTrim) {
      const exact = matches.find(
        (car) => (car.trim || "").trim() === normalizedTrim,
      );
      return exact?.id || "";
    }

    const withoutTrim = matches.find((car) => !(car.trim || "").trim());
    return withoutTrim?.id || matches[0]?.id || "";
  };

  const ensureCarIdForCompatibility = async (
    brand: string,
    model: string,
    trim: string,
    carsOverride?: any[],
  ) => {
    if (!selectedStore) {
      throw new Error("Please select a store first");
    }

    let cars = carsOverride || availableCars;
    if (cars.length === 0) {
      cars = await loadAvailableCars();
    }

    const normalizedTrim = trim.trim();
    // Prefer exact make/model/trim; otherwise reuse the make/model car (never auto-create —
    // create fails when brand+model is already unique).
    let carId = resolveCarId(brand, model, normalizedTrim, cars);
    if (!carId && normalizedTrim) {
      carId = resolveCarId(brand, model, "", cars);
    }
    if (!carId) {
      throw new Error(
        `No car found for ${brand} ${model}. Add it under Cars first.`,
      );
    }
    return carId;
  };

  const handleAddNewTrimOption = () => {
    const value = newTrimInput.trim();
    if (!value) {
      toast.error("Error", { description: "Enter a trim name first" });
      return;
    }

    setAvailableTrims((prev) =>
      prev.includes(value)
        ? prev
        : [...prev, value].sort((a, b) => a.localeCompare(b)),
    );
    const carId = resolveCarId(
      compatibilityForm.brand,
      compatibilityForm.model,
      value,
    );
    setCompatibilityForm({
      ...compatibilityForm,
      trim: value,
      carId:
        carId ||
        resolveCarId(
          compatibilityForm.brand,
          compatibilityForm.model,
          "",
        ),
    });
    setNewTrimInput("");
    setShowAddTrimField(false);
    toast.success("Trim added", {
      description: `"${value}" selected for this compatibility`,
    });
  };

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
        selectedLanguage.id,
      );

      // Extract display data
      const translation = response.translations?.find(
        (t) => t.languageCode === selectedLanguage.code,
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
        setCategoryName(
          response?.category?.translations?.find(
            (t) => t.languageCode === selectedLanguage.code,
          )?.name || response.category.id,
        );
      }

      if (response.subCategory) {
        setSubcategoryName(
          response?.subCategory?.translations?.find(
            (t) => t.languageCode === selectedLanguage.code,
          )?.name || response.subCategory.id,
        );
      }

      // Load car compatibilities and available cars
      await loadCompatibilities();
      await loadAvailableCars();
    } catch (error: any) {
      console.error("Failed to fetch product:", error);
      toast.error("Error", {
        description: error.message || "Failed to fetch product details",
      });
      router.push("/dashboard/products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productService.deleteProduct(productId);
      toast.error("Success", { description: "Product deleted successfully" });
      router.push("/dashboard/products");
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to delete product",
      });
    }
  };

  const handleEditMode = () => {
    if (!product || !selectedLanguage) return;

    const specs = product.specs?.[selectedLanguage.code];

    // Extract English and Arabic translations
    const englishTranslation = product.translations?.find(
      (t) => t.languageCode === "en",
    );
    const arabicTranslation = product.translations?.find(
      (t) => t.languageCode === "ar",
    );

    setFormData({
      name: englishTranslation?.name || "",
      nameAr: arabicTranslation?.name || "",
      itemCode: product.itemCode,
      price: product.price.toString(),
      stockQuantity: getEffectiveStockQuantity(product).toString(),
      description: englishTranslation?.description || "",
      descriptionAr: arabicTranslation?.description || "",
      categoryId: product.categoryId || "",
      subCategoryId: product.subCategoryId || "",
      color: specs?.color?.value || "",
      material: specs?.material?.value || "",
      brand: specs?.brand?.value || "",
      size: specs?.size?.value || "",
    });
    setIsComingSoon(
      product.stockQuantity === COMING_SOON_STOCK_QUANTITY &&
        (!product.variants || product.variants.length === 0),
    );

    // Set subcategories if category is selected
    if (product.categoryId) {
      const selectedCategory = categories.find(
        (cat) => cat.id === product.categoryId,
      );
      if (selectedCategory && selectedCategory.subcategories) {
        const subsWithNames = selectedCategory.subcategories.map((sub) => ({
          ...sub,
          name: categoryService.getCategoryName(
            sub,
            selectedLanguage?.code || "en",
          ),
        }));
        setSubcategories(subsWithNames);
      }
    }

    setIsEditing(true);
  };

  // Load car compatibilities
  const loadCompatibilities = async () => {
    if (!productId) return;

    try {
      const data =
        await productCarCompatibilityService.listCompatibilities(productId);
      setCompatibilities(data);
    } catch (error: any) {
      toast.error("Error", {
        description: "Failed to load car compatibilities",
      });
    }
  };

  // Load available cars
  const loadAvailableCars = async () => {
    if (!selectedStore) return [];

    try {
      const cars = await carService.listCars({
        store_id: selectedStore.id,
        limit: 1000,
      });
      setAvailableCars(cars || []);
      return cars || [];
    } catch (error) {
      console.error("Error fetching cars:", error);
      setAvailableCars([]);
      return [];
    }
  };

  const loadTrimsForCompatibility = async (
    carId: string,
    yearFrom?: string,
    carsOverride?: any[],
  ) => {
    if (!selectedStore || !carId) {
      setAvailableTrims([]);
      return;
    }

    const cars = carsOverride || availableCars;
    let car = cars.find((c) => c.id === carId);

    if (!car) {
      try {
        car = await carService.getCarById(carId);
      } catch (error) {
        console.error("Error fetching car for trims:", error);
        setAvailableTrims([]);
        return;
      }
    }

    if (!car?.brand || !car?.model) {
      setAvailableTrims([]);
      return;
    }

    const year =
      (yearFrom && parseInt(yearFrom, 10)) ||
      car.year_from ||
      car.yearFrom ||
      new Date().getFullYear();

    // Prefer trims already present on loaded cars (API /trims may 404).
    const localTrims = Array.from(
      new Set(
        cars
          .filter(
            (c) =>
              c.brand === car.brand &&
              c.model === car.model &&
              (c.trim || "").trim(),
          )
          .map((c) => (c.trim || "").trim()),
      ),
    ).sort((a, b) => a.localeCompare(b));

    try {
      setLoadingTrims(true);
      let apiTrims: string[] = [];
      try {
        apiTrims = await carService.getTrims(
          selectedStore.id,
          car.brand,
          car.model,
          Number(year),
        );
      } catch {
        apiTrims = [];
      }
      setAvailableTrims(
        Array.from(new Set([...(apiTrims || []), ...localTrims])).sort((a, b) =>
          a.localeCompare(b),
        ),
      );
    } finally {
      setLoadingTrims(false);
    }
  };

  // Add car compatibility
  const handleAddCompatibility = async () => {
    if (!productId) return;

    try {
      const brand = compatibilityForm.brand;
      const model = compatibilityForm.model;
      const nextTrim = compatibilityForm.trim.trim() || null;
      const carId = await ensureCarIdForCompatibility(
        brand,
        model,
        nextTrim || "",
      );

      // Trim belongs on product_car_compatibility only — never update the shared cars row.
      const saved = await productCarCompatibilityService.addCompatibility(productId, {
        carId,
        yearFrom: parseInt(compatibilityForm.yearFrom),
        yearTo: compatibilityForm.yearTo
          ? parseInt(compatibilityForm.yearTo)
          : null,
        trim: nextTrim,
      });

      if ((saved as any).__trimSkipped && nextTrim) {
        toast.success("Compatibility added", {
          description:
            "Year range saved, but trim was skipped — run DB migration 053 on the API database.",
        });
      } else {
        toast.success("Success", { description: "Car compatibility added" });
      }

      await loadCompatibilities();
      await fetchProduct(); // Refresh product data
      setShowCompatibilityDialog(false);
      resetCompatibilityForm();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to add compatibility",
      });
    }
  };

  // Update car compatibility
  const handleUpdateCompatibility = async () => {
    if (!productId || !editingCompatibility) return;

    try {
      const brand =
        compatibilityForm.brand || editingCompatibility.carBrand;
      const model =
        compatibilityForm.model || editingCompatibility.carModel;
      const nextTrim = compatibilityForm.trim.trim() || null;
      const yearFrom = parseInt(compatibilityForm.yearFrom);
      const yearTo = compatibilityForm.yearTo
        ? parseInt(compatibilityForm.yearTo)
        : null;

      // Trim is per product compatibility row — never mutate the shared cars.trim.
      const saved = await productCarCompatibilityService.updateCompatibility(
        productId,
        editingCompatibility.id,
        { yearFrom, yearTo, trim: nextTrim },
      );

      if ((saved as any).__trimSkipped && nextTrim) {
        toast.success("Compatibility updated", {
          description:
            "Year range saved, but trim was skipped — run DB migration 053 on the API database.",
        });
      } else if (nextTrim) {
        toast.success("Compatibility updated", {
          description: `${brand} ${model} · ${nextTrim}`,
        });
      } else {
        toast.success("Success", { description: "Compatibility updated" });
      }

      await loadCompatibilities();
      await fetchProduct(); // Refresh product data
      setShowCompatibilityDialog(false);
      setEditingCompatibility(null);
      resetCompatibilityForm();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to update compatibility",
      });
    }
  };

  // Delete car compatibility
  const handleDeleteCompatibility = async (compatibilityId: string) => {
    if (!productId) return;

    try {
      await productCarCompatibilityService.deleteCompatibility(
        productId,
        compatibilityId,
      );

      toast.success("Success", { description: "Compatibility removed" });

      await loadCompatibilities();
      await fetchProduct(); // Refresh product data
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to remove compatibility",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsComingSoon(false);
    setFormData({
      name: "",
      nameAr: "",
      itemCode: "",
      price: "",
      stockQuantity: "",
      description: "",
      descriptionAr: "",
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

    const hasVariants = Boolean(product.variants && product.variants.length > 0);

    // Validation for English fields
    if (
      !formData.name ||
      !formData.price ||
      (!hasVariants && !formData.stockQuantity)
    ) {
      toast.error("Validation Error", {
        description:
          "Please fill in all required English fields (Name, Price" +
          (!hasVariants ? ", Stock Quantity" : "") +
          ")",
      });
      return;
    }

    // Validation for Arabic fields
    if (!formData.nameAr) {
      toast.error("Validation Error", {
        description: "Arabic name is required",
      });
      return;
    }

    try {
      setSaving(true);

      // Get language IDs
      const languages = await settingsService.getLanguages();
      const englishLangId = getEnglishLanguageId(languages);
      const arabicLangId = getArabicLanguageId(languages);

      const updatedProductData = {
        itemCode: formData.itemCode,
        categoryId: formData.categoryId,
        subCategoryId: formData.subCategoryId || undefined,
        price: parseFloat(formData.price),
        stockQuantity: hasVariants
          ? sumVariantStock(product.variants!)
          : parseInt(formData.stockQuantity),
        brand: formData.brand || undefined,
        size: formData.size || undefined,
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

      toast.success("Success", { description: "Product updated successfully" });

      setIsEditing(false);
      await fetchProduct(); // Refresh product data
    } catch (error: any) {
      console.error("Failed to update product:", error);
      toast.error("Error", {
        description: error.message || "Failed to update product",
      });
    } finally {
      setSaving(false);
    }
  };

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.categoryId && formData.categoryId !== "") {
      const selectedCategory = categories.find(
        (cat) => cat.id === formData.categoryId,
      );
      if (selectedCategory && selectedCategory.subcategories) {
        const subsWithNames = selectedCategory.subcategories.map((sub) => ({
          ...sub,
          name: categoryService.getCategoryName(
            sub,
            selectedLanguage?.code || "en",
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
    imageField: "main_image" | "secondary_image" | "images",
  ) => {
    // Validate file
    const validation = uploadService.validateImageFile(file);
    if (!validation.valid) {
      toast.error("Invalid File", { description: validation.error });
      return;
    }

    try {
      setUploadingImage(imageField);
      const response = await uploadService.uploadImage(
        file,
        "product",
        productId,
        imageField,
      );

      toast.success("Success", { description: "Image uploaded successfully" });

      // Refresh product data
      await fetchProduct();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to upload image",
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const buildMinimalUpdatePayload = (updates: Record<string, unknown>) => {
    if (!product) return updates;

    return {
      itemCode: product.itemCode,
      storeId: product.storeId,
      categoryId: product.categoryId || "",
      subCategoryId: product.subCategoryId || undefined,
      price: product.price,
      stockQuantity: product.stockQuantity,
      ...updates,
    };
  };

  const handleDeleteImage = async (
    imageUrl: string,
    imageType: "main" | "secondary" | "gallery",
  ) => {
    if (!product) return;

    try {
      const imageUpdates = buildProductImageRemovalPayload(
        product,
        imageType,
        imageUrl,
      );
      const updatedProduct = await productService.updateProduct(
        productId,
        imageUpdates,
      );

      if (!wasProductImageRemoved(updatedProduct, imageType, imageUrl)) {
        throw new Error(
          "The server did not remove the image. Please try again.",
        );
      }

      toast.success("Success", { description: "Image removed successfully" });
      await fetchProduct();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to remove image",
      });
    }
  };

  const handleSetAsPrimary = async (imageUrl: string) => {
    if (!product) return;

    try {
      const imageUpdates = buildSetPrimaryImagePayload(product, imageUrl);
      const updatePayload = buildMinimalUpdatePayload(imageUpdates);
      await productService.updateProduct(productId, updatePayload);

      toast.success("Success", { description: "Image set as primary" });

      await fetchProduct();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to set as primary",
      });
    }
  };

  const handleSetAsSecondary = async (imageUrl: string) => {
    if (!product) return;

    try {
      const imageUpdates = buildSetSecondaryImagePayload(product, imageUrl);
      const updatePayload = buildMinimalUpdatePayload(imageUpdates);
      await productService.updateProduct(productId, updatePayload);

      toast.success("Success", { description: "Image set as secondary" });

      await fetchProduct();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to set as secondary",
      });
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === COMING_SOON_STOCK_QUANTITY) {
      return {
        label: "Coming Soon",
        className: "bg-blue-900/30 text-blue-300",
      };
    }
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

  const effectiveStock = getEffectiveStockQuantity(product);
  const stockStatus = getStockStatus(effectiveStock);
  const hasVariants = Boolean(product.variants && product.variants.length > 0);

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
                        handleDeleteImage(product.mainImage!, "main")
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
                        handleDeleteImage(product.secondaryImage!, "secondary")
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
                  Gallery Images ({product.images.length || 0})
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
                  {product.images.map((img, idx) => (
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
                  {/* English Translation Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">
                        English Translation
                      </h3>
                      <Separator />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Product Name (English) *</Label>
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
                          disabled={
                            isComingSoon ||
                            Boolean(product.variants && product.variants.length > 0)
                          }
                        />
                        {(!product.variants || product.variants.length === 0) && (
                          <div className="flex items-center space-x-2 pt-1">
                            <Checkbox
                              id="coming-soon"
                              checked={isComingSoon}
                              onCheckedChange={(checked) => {
                                const isChecked = checked === true;
                                setIsComingSoon(isChecked);
                                setFormData((prev) => ({
                                  ...prev,
                                  stockQuantity: isChecked
                                    ? String(COMING_SOON_STOCK_QUANTITY)
                                    : "",
                                }));
                              }}
                            />
                            <Label
                              htmlFor="coming-soon"
                              className="text-sm font-normal cursor-pointer"
                            >
                              Coming Soon
                            </Label>
                          </div>
                        )}
                        {product.variants && product.variants.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Stock managed per variant — total:{" "}
                            {getEffectiveStockQuantity(product)}
                          </p>
                        )}
                        {isComingSoon &&
                          (!product.variants || product.variants.length === 0) && (
                            <p className="text-xs text-muted-foreground">
                              Quantity set automatically for coming soon products
                            </p>
                          )}
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
                      <Label htmlFor="description">Description (English)</Label>
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

                  {/* Arabic Translation Section */}
                  <div className="space-y-4 pt-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">
                        Arabic Translation
                      </h3>
                      <Separator />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nameAr">Product Name (Arabic) *</Label>
                      <Input
                        id="nameAr"
                        value={formData.nameAr}
                        onChange={(e) =>
                          setFormData({ ...formData, nameAr: e.target.value })
                        }
                        placeholder="أدخل اسم المنتج"
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descriptionAr">
                        Description (Arabic)
                      </Label>
                      <Textarea
                        id="descriptionAr"
                        value={formData.descriptionAr}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            descriptionAr: e.target.value,
                          })
                        }
                        placeholder="أدخل وصف المنتج"
                        rows={3}
                        dir="rtl"
                      />
                    </div>
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
                            {product.stockQuantity === COMING_SOON_STOCK_QUANTITY
                              ? "Coming Soon"
                              : effectiveStock}
                          </p>
                          <Badge className={stockStatus.className}>
                            {stockStatus.label}
                          </Badge>
                        </div>
                        {hasVariants && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Total across {product.variants!.length} variant(s)
                          </p>
                        )}
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
                            product.variants.map((v) => v.size).filter(Boolean),
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
                            product.variants
                              .map((v) => v.color)
                              .filter(Boolean),
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

          {/* Car Compatibility */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Car Compatibility</CardTitle>
                  <CardDescription>
                    Compatible vehicles with year ranges
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    // Ensure availableCars is loaded
                    if (availableCars.length === 0) {
                      await loadAvailableCars();
                    }
                    setEditingCompatibility(null);
                    resetCompatibilityForm();
                    setShowCompatibilityDialog(true);
                  }}
                >
                  <Plus size={16} className="mr-2" />
                  Add Compatibility
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {compatibilities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No car compatibilities added yet. Click &quot;Add
                  Compatibility&quot; to begin.
                </p>
              ) : (
                <div className="space-y-3">
                  {compatibilities.map((compat) => (
                    <div
                      key={compat.id}
                      className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg"
                    >
                      <Car className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {compat.carBrand} {compat.carModel}
                          {compat.trim ? (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              · {compat.trim}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {productCarCompatibilityService.formatYearRange(
                            compat.yearFrom,
                            compat.yearTo,
                          )}
                          {!compat.trim ? " · All trims" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            let cars = availableCars;
                            if (cars.length === 0) {
                              cars = await loadAvailableCars();
                            }
                            setEditingCompatibility(compat);
                            setCompatibilityForm({
                              carId: compat.carId,
                              brand: compat.carBrand,
                              model: compat.carModel,
                              yearFrom: compat.yearFrom.toString(),
                              yearTo: compat.yearTo?.toString() || "",
                              trim: compat.trim || "",
                            });
                            setShowCompatibilityDialog(true);
                            await loadTrimsForCompatibility(
                              compat.carId,
                              compat.yearFrom.toString(),
                              cars,
                            );
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCompatibility(compat.id)}
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
      {/* Car Compatibility Dialog */}
      <Dialog
        open={showCompatibilityDialog}
        onOpenChange={setShowCompatibilityDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCompatibility ? "Edit" : "Add"} Car Compatibility
            </DialogTitle>
            <DialogDescription>
              Specify which car and year range this product is compatible with
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Car Make *</Label>
                <Select
                  value={compatibilityForm.brand}
                  onValueChange={(brand) => {
                    setCompatibilityForm({
                      ...compatibilityForm,
                      brand,
                      model: "",
                      carId: "",
                      trim: "",
                    });
                    setAvailableTrims([]);
                    setShowAddTrimField(false);
                    setNewTrimInput("");
                  }}
                  disabled={!!editingCompatibility}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        availableCars.length === 0
                          ? "No cars available"
                          : "Select make..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {compatibilityBrands.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No cars available. Please add cars to your store first.
                      </div>
                    ) : (
                      compatibilityBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Car Model *</Label>
                <Select
                  value={compatibilityForm.model}
                  onValueChange={(model) => {
                    const carId = resolveCarId(
                      compatibilityForm.brand,
                      model,
                      compatibilityForm.trim,
                    );
                    setCompatibilityForm({
                      ...compatibilityForm,
                      model,
                      carId,
                      trim: "",
                    });
                    setShowAddTrimField(false);
                    setNewTrimInput("");
                    void loadTrimsForCompatibility(
                      carId ||
                        resolveCarId(compatibilityForm.brand, model, ""),
                      compatibilityForm.yearFrom,
                    );
                  }}
                  disabled={
                    !!editingCompatibility || !compatibilityForm.brand
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !compatibilityForm.brand
                          ? "Select make first"
                          : compatibilityModels.length === 0
                            ? "No models available"
                            : "Select model..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {compatibilityModels.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No models for this make.
                      </div>
                    ) : (
                      compatibilityModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editingCompatibility && (
              <p className="text-xs text-muted-foreground">
                Make and model cannot be changed. Delete and create new
                compatibility if needed.
              </p>
            )}

            <div className="space-y-2">
              <Label>Trim (optional)</Label>
              <Select
                value={compatibilityForm.trim || ALL_TRIMS_VALUE}
                onValueChange={(value) => {
                  const trim = value === ALL_TRIMS_VALUE ? "" : value;
                  const carId = resolveCarId(
                    compatibilityForm.brand,
                    compatibilityForm.model,
                    trim,
                  );
                  setCompatibilityForm({
                    ...compatibilityForm,
                    trim,
                    carId:
                      carId ||
                      resolveCarId(
                        compatibilityForm.brand,
                        compatibilityForm.model,
                        "",
                      ),
                  });
                }}
                disabled={
                  !compatibilityForm.model || loadingTrims || showAddTrimField
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !compatibilityForm.model
                        ? "Select make and model first"
                        : loadingTrims
                          ? "Loading trims..."
                          : "All trims"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_TRIMS_VALUE}>All trims</SelectItem>
                  {trimOptions.map((trim) => (
                    <SelectItem key={trim} value={trim}>
                      {trim}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!showAddTrimField ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  disabled={!compatibilityForm.model || loadingTrims}
                  onClick={() => setShowAddTrimField(true)}
                >
                  <Plus size={14} className="mr-1.5" />
                  Add new trim option
                </Button>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="compatibility-new-trim" className="text-xs">
                      New trim name
                    </Label>
                    <Input
                      id="compatibility-new-trim"
                      autoFocus
                      value={newTrimInput}
                      onChange={(e) => setNewTrimInput(e.target.value)}
                      placeholder="e.g., M Sport, LE, Limited"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNewTrimOption();
                        }
                        if (e.key === "Escape") {
                          setShowAddTrimField(false);
                          setNewTrimInput("");
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddNewTrimOption}
                      disabled={!newTrimInput.trim()}
                    >
                      Add & select
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAddTrimField(false);
                        setNewTrimInput("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Choose an existing trim, or add a new one. Leave as &quot;All
                trims&quot; if this part fits every trim.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year From *</Label>
                <Input
                  type="number"
                  min="1900"
                  max="2030"
                  placeholder="e.g., 2015"
                  value={compatibilityForm.yearFrom}
                  onChange={(e) => {
                    const yearFrom = e.target.value;
                    setCompatibilityForm({
                      ...compatibilityForm,
                      yearFrom,
                    });
                    if (compatibilityForm.carId && yearFrom) {
                      void loadTrimsForCompatibility(
                        compatibilityForm.carId,
                        yearFrom,
                      );
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Year To (optional)</Label>
                <Input
                  type="number"
                  min="1900"
                  max="2030"
                  placeholder="Leave empty for current"
                  value={compatibilityForm.yearTo}
                  onChange={(e) =>
                    setCompatibilityForm({
                      ...compatibilityForm,
                      yearTo: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty if compatible with current production
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCompatibilityDialog(false);
                setEditingCompatibility(null);
                resetCompatibilityForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={
                editingCompatibility
                  ? handleUpdateCompatibility
                  : handleAddCompatibility
              }
              disabled={
                !compatibilityForm.brand ||
                !compatibilityForm.model ||
                !compatibilityForm.yearFrom
              }
            >
              {editingCompatibility ? "Update" : "Add"} Compatibility
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
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
