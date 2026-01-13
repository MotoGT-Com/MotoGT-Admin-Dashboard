"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Search,
  Filter,
  Upload,
  X,
  MoreHorizontal,
  Star,
  Download,
  Store as StoreIcon,
  Globe,
  Loader2,
  Edit,
  Trash2,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { productService, Product } from "@/lib/services/product.service";
import {
  productCarCompatibilityService,
  ProductCarCompatibility,
} from "@/lib/services/product-car-compatibility.service";
import { settingsService } from "@/lib/services/settings.service";
import { carService } from "@/lib/services/car.service";
import { uploadService } from "@/lib/services/upload.service";
import { categoryService, Category } from "@/lib/services/category.service";
import { useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";

// Local interface to avoid import issues
interface CarData {
  id: string;
  brand: string;
  model: string;
  yearFrom?: number | null;
  yearTo?: number | null;
  year_from?: number | null;
  year_to?: number | null;
}

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  isSecondary: boolean;
}

// Helper functions to extract display data
const getProductName = (
  product: Product,
  languageCode: string = "en"
): string => {
  const translation = product.translations?.find(
    (t) => t.languageCode === languageCode
  );
  return translation?.name || product.itemCode;
};

const getProductDescription = (
  product: Product,
  languageCode: string = "en"
): string => {
  const translation = product.translations?.find(
    (t) => t.languageCode === languageCode
  );
  return translation?.description || "";
};

const getProductColor = (
  product: Product,
  languageCode: string = "en"
): string => {
  return product.specs?.[languageCode]?.color?.value || "-";
};

const getProductMaterial = (
  product: Product,
  languageCode: string = "en"
): string => {
  return product.specs?.[languageCode]?.material?.value || "-";
};

const getCarInfo = (product: Product): string => {
  if (!product.carCompatibility || product.carCompatibility.length === 0)
    return "-";
  const car = product.carCompatibility[0];
  return `${car.carBrand} ${car.carModel} (${car.carYearFrom}-${car.carYearTo})`;
};

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Store and Language state
  const [stores, setStores] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<any | null>(null);
  const [storesLoading, setStoresLoading] = useState(true);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalProducts, setTotalProducts] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filterCarBrand, setFilterCarBrand] = useState("any");
  const [filterCarModel, setFilterCarModel] = useState("any");
  const [filterCarYear, setFilterCarYear] = useState("any");
  const [filterMake, setFilterMake] = useState("any");
  const [filterModel, setFilterModel] = useState("any");
  const [filterYear, setFilterYear] = useState("any");
  const [filterCategory, setFilterCategory] = useState("any");
  const [filterSubCategory, setFilterSubCategory] = useState("any");

  // Car brands and models
  const [carBrands, setCarBrands] = useState<string[]>([]);
  const [carModels, setCarModels] = useState<string[]>([]);

  // Categories and subcategories
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  // Available cars and selected car IDs for product compatibility
  const [availableCars, setAvailableCars] = useState<CarData[]>([]);
  const [selectedCarCompatibility, setSelectedCarCompatibility] = useState<
    Array<{ carId: string; yearFrom?: number; yearTo?: number | null }>
  >([]);

  // Car compatibility management
  const [compatibilities, setCompatibilities] = useState<
    ProductCarCompatibility[]
  >([]);
  const [showCompatibilityDialog, setShowCompatibilityDialog] = useState(false);
  const [editingCompatibility, setEditingCompatibility] =
    useState<ProductCarCompatibility | null>(null);
  const [compatibilityForm, setCompatibilityForm] = useState({
    carId: "",
    yearFrom: "",
    yearTo: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Variants state
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<
    Array<{
      id: string;
      sku?: string;
      size?: string;
      color?: string;
      priceAdjustment: number;
      stockQuantity: number;
      mainImage?: string;
      images?: string[];
      isActive: boolean;
    }>
  >([]);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any | null>(null);
  const [variantFormData, setVariantFormData] = useState({
    size: "",
    color: "",
    priceAdjustment: "0",
    stockQuantity: "0",
    isActive: true,
  });

  // Fetch stores and languages on mount
  useEffect(() => {
    const initializeStoresAndLanguages = async () => {
      try {
        setStoresLoading(true);

        const [fetchedStores, fetchedLanguages] = await Promise.all([
          settingsService.getStores(),
          settingsService.getLanguages(),
        ]);

        setStores(fetchedStores);
        setLanguages(fetchedLanguages);

        // Set selected store from localStorage or first store
        const savedStore = settingsService.getSelectedStore();
        if (savedStore && fetchedStores.some((s) => s.id === savedStore.id)) {
          setSelectedStore(savedStore);
        } else if (fetchedStores.length > 0) {
          setSelectedStore(fetchedStores[0]);
          settingsService.setSelectedStore(fetchedStores[0].id);
        }

        // Set selected language from localStorage or first language
        const savedLanguage = settingsService.getSelectedLanguage();
        if (
          savedLanguage &&
          fetchedLanguages.some((l) => l.id === savedLanguage.id)
        ) {
          setSelectedLanguage(savedLanguage);
        } else if (fetchedLanguages.length > 0) {
          setSelectedLanguage(fetchedLanguages[0]);
          settingsService.setSelectedLanguage(fetchedLanguages[0].id);
        }

        // Fetch car brands for filters
        if (fetchedStores.length > 0 && fetchedLanguages.length > 0) {
          const cars = await carService.listCars({
            store_id: fetchedStores[0].id,
            limit: 1000,
          });
          const brands = [...new Set(cars.map((car) => car.brand))].sort();
          setCarBrands(brands);

          // Fetch categories
          const fetchedCategories = await categoryService.listCategories({
            storeId: fetchedStores[0].id,
            languageId: fetchedLanguages[0].id,
            isActive: true,
            includeSubcategories: true,
            limit: 100,
          });

          // Add name field to categories and subcategories for easy display
          const categoriesWithNames = fetchedCategories.map((cat) => ({
            ...cat,
            name: categoryService.getCategoryName(
              cat,
              fetchedLanguages[0].code
            ),
            // Also add names to subcategories
            subcategories: cat.subcategories?.map((sub) => ({
              ...sub,
              name: categoryService.getCategoryName(
                sub,
                fetchedLanguages[0].code
              ),
            })),
          }));

          setCategories(categoriesWithNames);
        }
      } catch (error: any) {
        console.error("Failed to fetch stores/languages:", error);
        toast.error("Error", {
          description: "Failed to load stores and languages",
        });
      } finally {
        setStoresLoading(false);
      }
    };

    initializeStoresAndLanguages();
  }, []);

  // Handle edit query parameter
  useEffect(() => {
    const editProductId = searchParams.get("edit");
    if (editProductId && selectedStore && selectedLanguage) {
      // Fetch the product to edit
      const fetchProductToEdit = async () => {
        try {
          const productToEdit = await productService.getProductById(
            editProductId,
            selectedLanguage.id
          );
          handleOpenDialog(productToEdit);
          // Clear the query parameter
          router.replace("/dashboard/products", { scroll: false });
        } catch (error: any) {
          console.error("Failed to fetch product for editing:", error);
          toast.error("Error", {
            description: "Failed to load product for editing",
          });
        }
      };
      fetchProductToEdit();
    }
  }, [searchParams, selectedStore, selectedLanguage]);

  // Helper function to get car ID from brand/model
  const getCarIdFromBrandModel = (
    brand: string,
    model: string
  ): string | undefined => {
    const car = availableCars.find(
      (c) => c.brand === brand && c.model === model
    );
    return car?.id;
  };

  // Fetch products when store or language changes
  const fetchProducts = async () => {
    if (!selectedStore || !selectedLanguage) return;

    try {
      setLoading(true);
      const response = await productService.listProducts({
        storeId: selectedStore.id,
        languageId: selectedLanguage.id,
        page: currentPage,
        limit: rowsPerPage,
        search: debouncedSearchQuery || undefined,
        categoryId: filterCategory !== "any" ? filterCategory : undefined,
        subCategoryId:
          filterSubCategory !== "any" ? filterSubCategory : undefined,
        carBrand: filterCarBrand !== "any" ? filterCarBrand : undefined,
        carModel: filterCarModel !== "any" ? filterCarModel : undefined,
        // New year-range based filtering
        carId:
          filterCarBrand !== "any" && filterCarModel !== "any"
            ? getCarIdFromBrandModel(filterCarBrand, filterCarModel)
            : undefined,
        carYear: filterCarYear !== "any" ? parseInt(filterCarYear) : undefined,
      });

      // Extract display data from each product
      const productsWithDisplayData = response.data.map((product: Product) => ({
        ...product,
        name: getProductName(product, selectedLanguage.code),
        description: getProductDescription(product, selectedLanguage.code),
        color: getProductColor(product, selectedLanguage.code),
        material: getProductMaterial(product, selectedLanguage.code),
        carInfo: getCarInfo(product),
      }));

      setProducts(productsWithDisplayData);
      setTotalProducts(response.meta.total); // Use meta.total from server
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      toast.error("Error", {
        description: error.message || "Failed to fetch products",
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products when page, filters, or store/language changes
  useEffect(() => {
    if (selectedStore && selectedLanguage) {
      fetchProducts();
    }
  }, [
    selectedStore,
    selectedLanguage,
    debouncedSearchQuery,
    filterCategory,
    filterSubCategory,
    filterCarBrand,
    filterCarModel,
    filterCarYear,
    currentPage,
    rowsPerPage,
  ]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    filterCategory,
    filterSubCategory,
    filterCarBrand,
    filterCarModel,
    filterCarYear,
  ]);

  // Fetch car models when brand changes
  useEffect(() => {
    const fetchModels = async () => {
      if (filterCarBrand && filterCarBrand !== "any" && selectedStore) {
        try {
          const cars = await carService.listCars({
            store_id: selectedStore.id,
            brand: filterCarBrand,
            limit: 1000,
          });
          const models = [...new Set(cars.map((car) => car.model))].sort();
          setCarModels(models);
        } catch (error) {
          console.error("Failed to fetch car models:", error);
          setCarModels([]);
        }
      } else {
        setCarModels([]);
        setFilterCarModel("any");
        setFilterCarYear("any");
      }
    };
    fetchModels();
  }, [filterCarBrand, selectedStore]);

  const handleStoreChange = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (store) {
      setSelectedStore(store);
      settingsService.setSelectedStore(storeId);
      setCurrentPage(1); // Reset to first page
      toast.success("Store Changed", {
        description: `Switched to ${store.name}`,
      });
    }
  };

  const handleLanguageChange = (languageId: string) => {
    const language = languages.find((l) => l.id === languageId);
    if (language) {
      setSelectedLanguage(language);
      settingsService.setSelectedLanguage(languageId);
      setCurrentPage(1); // Reset to first page
      toast.success("Language Changed", {
        description: `Switched to ${language.name}`,
      });
    }
  };

  const [formData, setFormData] = useState({
    itemCode: "",
    name: "",
    sellingPrice: "",
    productType: "car-parts", // Added product type to form data
    carMake: "",
    carModel: "",
    carYearFrom: "",
    carYearTo: "",
    description: "",
    quantity: "",
    material: "",
    category: "",
    subCategory: "",
    color: "",
    brand: "",
    size: "",
  });

  // Remove old vehicle makes filtering logic - will be handled by API
  // Categories and subcategories will come from API in future

  // Fetch subcategories when category in form changes
  useEffect(() => {
    if (formData.category && formData.category !== "") {
      const selectedCategory = categories.find(
        (cat) => cat.id === formData.category
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
      setFormData((prev) => ({ ...prev, subCategory: "" }));
    }
  }, [formData.category, categories, selectedLanguage]);

  // For now, products page will display data from API
  // Editing functionality will be added in next steps

  const handleOpenDialog = async (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        itemCode: product.itemCode,
        name: product.name || "",
        sellingPrice: product.price.toString(),
        productType: "car-parts",
        carMake: "",
        carModel: "",
        carYearFrom: "",
        carYearTo: "",
        description: product.description || "",
        quantity: product.stockQuantity.toString(),
        material: product.material || "",
        category: product.categoryId,
        subCategory: product.subCategoryId || "",
        color: product.color || "",
        brand: "",
        size: "",
      });

      // Populate existing images for preview
      const existingImages: ProductImage[] = [];
      let imageIdCounter = 1;

      if (product.mainImage) {
        existingImages.push({
          id: `existing-main-${imageIdCounter++}`,
          url: product.mainImage,
          isPrimary: true,
          isSecondary: false,
        });
      }

      if (product.secondaryImage) {
        existingImages.push({
          id: `existing-secondary-${imageIdCounter++}`,
          url: product.secondaryImage,
          isPrimary: false,
          isSecondary: true,
        });
      }

      if (product.images && product.images.length > 0) {
        product.images.forEach((imgUrl) => {
          existingImages.push({
            id: `existing-gallery-${imageIdCounter++}`,
            url: imgUrl,
            isPrimary: false,
            isSecondary: false,
          });
        });
      }

      setUploadedImages(existingImages);

      // Set selected car compatibility if available
      if (product.carCompatibility && product.carCompatibility.length > 0) {
        setSelectedCarCompatibility(
          product.carCompatibility.map((cc) => ({
            carId: cc.carId,
            yearFrom: cc.carYearFrom || undefined,
            yearTo: cc.carYearTo || undefined,
          }))
        );
      } else {
        setSelectedCarCompatibility([]);
      }

      // Load car compatibilities for existing product
      if (product.id) {
        await loadCompatibilities(product.id);
      }

      // Fetch available cars for the selected store
      if (selectedStore) {
        try {
          const cars = await carService.listCars({
            store_id: selectedStore.id,
            limit: 1000,
          });
          setAvailableCars(cars || []);
        } catch (error) {
          console.error("Error fetching cars:", error);
          setAvailableCars([]);
        }
      }
    } else {
      setEditingProduct(null);
      setFormData({
        itemCode: "",
        name: "",
        sellingPrice: "",
        productType: "car-parts",
        carMake: "",
        carModel: "",
        carYearFrom: "",
        carYearTo: "",
        description: "",
        quantity: "",
        material: "",
        category: "",
        subCategory: "",
        color: "",
        brand: "",
        size: "",
      });
      setUploadedImages([]);
      setSelectedCarCompatibility([]);

      // Fetch available cars for the selected store
      if (selectedStore) {
        try {
          const cars = await carService.listCars({
            store_id: selectedStore.id,
            limit: 1000, // Get all cars for the store
          });
          setAvailableCars(cars || []);
        } catch (error) {
          console.error("Error fetching cars:", error);
          setAvailableCars([]);
        }
      }
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setSelectedCarCompatibility([]);
    setHasVariants(false);
    setVariants([]);
    setCompatibilities([]);
    setShowCompatibilityDialog(false);
    setEditingCompatibility(null);
    setCompatibilityForm({ carId: "", yearFrom: "", yearTo: "" });
    setFormData({
      itemCode: "",
      name: "",
      sellingPrice: "",
      productType: "car-parts",
      carMake: "",
      carModel: "",
      carYearFrom: "",
      carYearTo: "",
      description: "",
      quantity: "",
      material: "",
      category: "",
      subCategory: "",
      color: "",
      brand: "",
      size: "",
    });
    setUploadedImages([]);
  };

  // Load car compatibilities for a product
  const loadCompatibilities = async (productId: string) => {
    try {
      const data = await productCarCompatibilityService.listCompatibilities(
        productId
      );
      setCompatibilities(data);
    } catch (error: any) {
      toast.error("Error", {
        description: "Failed to load car compatibilities",
      });
    }
  };

  // Add car compatibility
  const handleAddCompatibility = async () => {
    if (!editingProduct) return;

    try {
      await productCarCompatibilityService.addCompatibility(editingProduct.id, {
        car_id: compatibilityForm.carId,
        year_from: parseInt(compatibilityForm.yearFrom),
        year_to: compatibilityForm.yearTo
          ? parseInt(compatibilityForm.yearTo)
          : null,
      });

      toast.success("Success", {
        description: "Car compatibility added",
      });

      await loadCompatibilities(editingProduct.id);
      setShowCompatibilityDialog(false);
      setCompatibilityForm({ carId: "", yearFrom: "", yearTo: "" });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to add compatibility",
      });
    }
  };

  // Update car compatibility
  const handleUpdateCompatibility = async () => {
    if (!editingProduct || !editingCompatibility) return;

    try {
      await productCarCompatibilityService.updateCompatibility(
        editingProduct.id,
        editingCompatibility.id,
        {
          year_from: parseInt(compatibilityForm.yearFrom),
          year_to: compatibilityForm.yearTo
            ? parseInt(compatibilityForm.yearTo)
            : null,
        }
      );

      toast.success("Success", {
        description: "Compatibility updated",
      });

      await loadCompatibilities(editingProduct.id);
      setShowCompatibilityDialog(false);
      setEditingCompatibility(null);
      setCompatibilityForm({ carId: "", yearFrom: "", yearTo: "" });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to update compatibility",
      });
    }
  };

  // Delete car compatibility
  const handleDeleteCompatibility = async (compatibilityId: string) => {
    if (!editingProduct) return;

    try {
      await productCarCompatibilityService.deleteCompatibility(
        editingProduct.id,
        compatibilityId
      );

      toast.success("Success", {
        description: "Compatibility removed",
      });

      await loadCompatibilities(editingProduct.id);
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to remove compatibility",
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImages((prev) => {
            const newImage: ProductImage = {
              id: Date.now().toString() + Math.random(),
              url: reader.result as string,
              isPrimary: prev.length === 0, // Only first image is primary
              isSecondary: false,
            };
            return [...prev, newImage];
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages((prev) => {
      const updated = prev.filter((img) => img.id !== imageId);
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const handleSetPrimary = (imageId: string) => {
    setUploadedImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    );
  };

  const handleToggleSecondary = (imageId: string) => {
    setUploadedImages((prev) => {
      const clickedImage = prev.find((img) => img.id === imageId);
      const isCurrentlySecondary = clickedImage?.isSecondary;

      return prev.map((img) => ({
        ...img,
        isSecondary: img.id === imageId ? !isCurrentlySecondary : false,
      }));
    });
  };

  // Variant management functions
  const handleOpenVariantDialog = (variant?: any) => {
    if (variant) {
      setEditingVariant(variant);
      setVariantFormData({
        size: variant.size || "",
        color: variant.color || "",
        priceAdjustment: variant.priceAdjustment.toString(),
        stockQuantity: variant.stockQuantity.toString(),
        isActive: variant.isActive,
      });
    } else {
      setEditingVariant(null);
      setVariantFormData({
        size: "",
        color: "",
        priceAdjustment: "0",
        stockQuantity: "0",
        isActive: true,
      });
    }
    setIsVariantDialogOpen(true);
  };

  const handleCloseVariantDialog = () => {
    setIsVariantDialogOpen(false);
    setEditingVariant(null);
    setVariantFormData({
      size: "",
      color: "",
      priceAdjustment: "0",
      stockQuantity: "0",
      isActive: true,
    });
  };

  const handleSaveVariant = () => {
    const variantData = {
      id: editingVariant?.id || Date.now().toString(),
      sku: editingVariant?.sku || "", // Keep existing SKU or empty for new variants (backend will generate)
      size: variantFormData.size || undefined,
      color: variantFormData.color || undefined,
      priceAdjustment: parseFloat(variantFormData.priceAdjustment),
      stockQuantity: parseInt(variantFormData.stockQuantity),
      isActive: variantFormData.isActive,
    };

    if (editingVariant) {
      setVariants((prev) =>
        prev.map((v) => (v.id === editingVariant.id ? variantData : v))
      );
    } else {
      setVariants((prev) => [...prev, variantData]);
    }

    handleCloseVariantDialog();
  };

  const handleDeleteVariant = (variantId: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== variantId));
  };

  const handleSaveProduct = async () => {
    if (!selectedStore || !selectedLanguage) {
      toast.error("Error", {
        description: "Please select a store and language",
      });
      return;
    }

    // Validation
    if (
      !formData.itemCode ||
      !formData.name ||
      !formData.sellingPrice ||
      (!hasVariants && !formData.quantity)
    ) {
      toast.error("Validation Error", {
        description:
          "Please fill in all required fields (Item Code, Name, Price" +
          (!hasVariants ? ", Quantity" : "") +
          ")",
      });
      return;
    }

    if (!formData.category) {
      toast.error("Validation Error", {
        description: "Please enter a category ID",
      });
      return;
    }

    // Validate variants if enabled
    if (hasVariants && variants.length === 0) {
      toast.error("Validation Error", {
        description: "Please add at least one variant",
      });
      return;
    }

    // Validate car compatibility for car-parts (only for new products)
    if (
      !editingProduct &&
      formData.productType === "car-parts" &&
      selectedCarCompatibility.length === 0
    ) {
      toast.error("Validation Error", {
        description: "Please select at least one compatible car for car parts",
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare product data according to new API structure (without images initially)
      const productData: any = {
        itemCode: formData.itemCode,
        storeId: selectedStore.id,
        categoryId: formData.category,
        subCategoryId: formData.subCategory || undefined,
        price: parseFloat(formData.sellingPrice),
        stockQuantity: hasVariants ? 0 : parseInt(formData.quantity), // 0 if has variants
        brand: formData.brand || undefined, // Always include brand if provided
        size: !hasVariants ? formData.size || undefined : undefined, // Only for non-variant products
        productType:
          formData.productType === "car-parts"
            ? "car_parts"
            : formData.productType === "riding-gear"
            ? "riding_gear"
            : formData.productType === "cleaning-and-accessories"
            ? "cleaning_and_accessories"
            : undefined, // Map frontend product type to backend values
        isActive: true,
        adminUserId: user?.userId,
        translations: [
          {
            languageId: selectedLanguage.id,
            name: formData.name,
            description: formData.description || undefined,
          },
        ],
        specifications:
          formData.material || (!hasVariants && formData.color)
            ? [
                // Material is always a specification (product-level, same for all variants)
                ...(formData.material
                  ? [
                      {
                        languageId: selectedLanguage.id,
                        specKey: "material",
                        specValue: formData.material,
                        specType: "text" as const,
                        isFilterable: true,
                      },
                    ]
                  : []),
                // Color is only a specification for non-variant products
                // For variant products, color is per variant
                ...(!hasVariants && formData.color
                  ? [
                      {
                        languageId: selectedLanguage.id,
                        specKey: "color",
                        specValue: formData.color,
                        specType: "text" as const,
                        isFilterable: true,
                      },
                    ]
                  : []),
              ]
            : undefined,
        // Add car compatibility for car-parts with year ranges
        carCompatibility:
          formData.productType === "car-parts" &&
          selectedCarCompatibility.length > 0
            ? selectedCarCompatibility.map((compat) => ({
                carId: compat.carId,
                yearFrom: compat.yearFrom,
                yearTo: compat.yearTo,
              }))
            : undefined,
      };

      // Add variants if enabled
      if (hasVariants && variants.length > 0) {
        productData.variants = variants.map((v) => ({
          ...(v.sku && { sku: v.sku }), // Only include SKU if it exists (for updates)
          size: v.size || undefined,
          color: v.color || undefined,
          priceAdjustment: v.priceAdjustment,
          stockQuantity: v.stockQuantity,
          mainImage: v.mainImage || undefined,
          images: v.images && v.images.length > 0 ? v.images : undefined,
          isActive: v.isActive,
        }));
      }

      let savedProduct;

      if (editingProduct) {
        // Update existing product
        savedProduct = await productService.updateProduct(
          editingProduct.id,
          productData
        );
      } else {
        // Create new product first
        savedProduct = await productService.createProduct(productData);
      }

      // Upload images after product is created/updated
      if (uploadedImages.length > 0 && savedProduct) {
        const primaryImage = uploadedImages.find((img) => img.isPrimary);
        const secondaryImage = uploadedImages.find((img) => img.isSecondary);
        const galleryImages = uploadedImages.filter(
          (img) => !img.isPrimary && !img.isSecondary
        );

        // Upload primary image
        if (primaryImage) {
          const blob = await fetch(primaryImage.url).then((r) => r.blob());
          const file = new File([blob], "main.jpg", { type: "image/jpeg" });
          await uploadService.uploadImage(
            file,
            "product",
            savedProduct.id,
            "main_image"
          );
        }

        // Upload secondary image
        if (secondaryImage) {
          const blob = await fetch(secondaryImage.url).then((r) => r.blob());
          const file = new File([blob], "secondary.jpg", {
            type: "image/jpeg",
          });
          await uploadService.uploadImage(
            file,
            "product",
            savedProduct.id,
            "secondary_image"
          );
        }

        // Upload gallery images
        for (const [index, galleryImage] of galleryImages.entries()) {
          const blob = await fetch(galleryImage.url).then((r) => r.blob());
          const file = new File([blob], `gallery-${index}.jpg`, {
            type: "image/jpeg",
          });
          await uploadService.uploadImage(
            file,
            "product",
            savedProduct.id,
            "images"
          );
        }
      }

      toast.success("Success", {
        description: editingProduct
          ? "Product updated successfully"
          : "Product created successfully",
      });

      handleCloseDialog();

      // If already on page 1, manually trigger fetchProducts, otherwise setCurrentPage will trigger it
      if (currentPage === 1) {
        fetchProducts();
      } else {
        setCurrentPage(1);
      }
    } catch (error: any) {
      console.error("Failed to create product:", error);
      toast.error("Error", {
        description: error.message || "Failed to create product",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;

    try {
      setLoading(true);
      await productService.deleteProduct(deleteProduct.id);

      toast.success("Success", {
        description: `Product "${deleteProduct.name}" deleted successfully`,
      });

      setDeleteProduct(null);

      // Refresh the product list
      if (currentPage === 1) {
        fetchProducts();
      } else {
        setCurrentPage(1);
      }
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      toast.error("Error", {
        description: error.message || "Failed to delete product",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResults(null);
    }
  };

  const handleImportProducts = () => {
    // TODO: Implement API integration for bulk import
    toast.info("Coming Soon", {
      description: "Bulk import functionality will be integrated with API",
    });
    setIsImportDialogOpen(false);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "itemCode",
      "name",
      "sellingPrice",
      "productType",
      "carMake",
      "carModel",
      "carYearFrom",
      "carYearTo",
      "description",
      "quantity",
      "material",
      "category",
      "subCategory",
      "color",
    ];
    const sampleData = [
      "600001",
      "3 SERIES HEADLIGHT TRIM",
      "20.000",
      "car-parts",
      "BMW",
      "Series 3",
      "2019",
      "2022",
      "Premium headlight trim",
      "10",
      "ABS PLASTIC",
      "Exterior",
      "Headlight Trim",
      "Carbon Fiber",
    ];

    const csvContent = headers.join(",") + "\n" + sampleData.join(",");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCloseImportDialog = () => {
    setIsImportDialogOpen(false);
    setImportFile(null);
    setImportResults(null);
    if (importFileInputRef.current) {
      importFileInputRef.current.value = "";
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { label: "Out of Stock", className: "bg-red-900/30 text-red-300" };
    if (quantity <= 5)
      return {
        label: "Low Stock",
        className: "bg-yellow-900/30 text-yellow-300",
      };
    return { label: "In Stock", className: "bg-green-900/30 text-green-300" };
  };

  const getPrimaryImage = (images: ProductImage[]) => {
    return (
      images.find((img) => img.isPrimary)?.url ||
      images[0]?.url ||
      "/placeholder.svg"
    );
  };

  if (storesLoading || !selectedStore || !selectedLanguage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">
            {storesLoading ? "Loading stores..." : "Initializing..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your automotive accessories inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Download size={18} />
            Import
          </Button>
          <Button className="gap-2" onClick={() => handleOpenDialog()}>
            <Plus size={18} />
            Add Product
          </Button>
        </div>
      </div>

      {/* Store and Language Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label className="flex items-center gap-2">
                <StoreIcon size={16} />
                Store
              </Label>
              <Select
                value={selectedStore?.id || ""}
                onValueChange={handleStoreChange}
                disabled={stores.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      stores.length === 0
                        ? "No stores available"
                        : "Select store"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name} ({store.currencyCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label className="flex items-center gap-2">
                <Globe size={16} />
                Language
              </Label>
              <Select
                value={selectedLanguage?.id || ""}
                onValueChange={handleLanguageChange}
                disabled={languages.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      languages.length === 0
                        ? "No languages available"
                        : "Select language"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.id} value={language.id}>
                      {language.name} ({language.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters - Row 1: Search and Vehicle Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 min-w-[250px] relative">
            <br />
            <Search
              className="absolute text-muted-foreground mx-[11px] my-1.5 mt-2 mb-2"
              size={18}
            />
            <Input
              placeholder="Search by name or item code..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Row 2: Car Brand, Model, and Year Filters */}
        <div className="flex gap-4">
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label className="flex items-center gap-2">
              <Filter size={16} />
              Car Brand
            </Label>
            <Select
              value={filterCarBrand}
              onValueChange={(value) => {
                setFilterCarBrand(value);
                if (value === "any") {
                  setFilterCarModel("any");
                  setFilterCarYear("any");
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All Brands</SelectItem>
                {carBrands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px] space-y-2">
            <Label className="flex items-center gap-2">
              <Filter size={16} />
              Car Model
            </Label>
            <Select
              value={filterCarModel}
              onValueChange={(value) => {
                setFilterCarModel(value);
                if (value === "any") {
                  setFilterCarYear("any");
                }
              }}
              disabled={filterCarBrand === "any" || carModels.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    filterCarBrand === "any"
                      ? "Select brand first"
                      : "All Models"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All Models</SelectItem>
                {carModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px] space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar size={16} />
              Car Year
            </Label>
            <Select
              value={filterCarYear}
              onValueChange={setFilterCarYear}
              disabled={filterCarBrand === "any" || filterCarModel === "any"}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    filterCarModel === "any"
                      ? "Select model first"
                      : "All Years"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="any">All Years</SelectItem>
                {Array.from(
                  { length: 35 },
                  (_, i) => new Date().getFullYear() - 25 + i
                ).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(filterCarBrand !== "any" ||
            filterCarModel !== "any" ||
            filterCarYear !== "any") && (
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterCarBrand("any");
                  setFilterCarModel("any");
                  setFilterCarYear("any");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products ({totalProducts})</CardTitle>
          <CardDescription>Manage your product catalog</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchQuery ||
                filterCategory !== "any" ||
                filterSubCategory !== "any"
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Get started by adding your first product to the inventory."}
              </p>
              <div className="flex gap-3">
                {(searchQuery ||
                  filterCategory !== "any" ||
                  filterSubCategory !== "any") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterMake("any");
                      setFilterModel("any");
                      setFilterYear("any");
                      setFilterCategory("any");
                      setFilterSubCategory("any");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button onClick={() => handleOpenDialog()}>
                  <Plus size={18} className="mr-2" />
                  Add Your First Product
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Image</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Item Code
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Product Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Price (JOD)
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Stock</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const status = getStockStatus(product.stockQuantity);
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-border hover:bg-accent/5 transition"
                      >
                        <td className="py-3 px-4">
                          <div className="relative">
                            <img
                              src={
                                product.mainImage ||
                                product.secondaryImage ||
                                "/placeholder.svg"
                              }
                              alt={product.name || product.itemCode}
                              className="w-12 h-12 object-cover rounded"
                            />
                            {product.images.length > 0 && (
                              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {product.images.length}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {product.itemCode}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <div className="max-w-xs truncate">
                            {product.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {product.price.toFixed(3)}
                        </td>
                        <td className="py-3 px-4">{product.stockQuantity}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`py-1 px-3 rounded-full text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/dashboard/products/${product.id}`)
                              }
                            >
                              View Details
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/products/${product.id}`
                                    )
                                  }
                                >
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenDialog(product)}
                                >
                                  Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteProduct(product)}
                                  className="text-destructive"
                                >
                                  Delete Product
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-1 border rounded bg-background text-sm"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to page 1 when changing rows per page
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-muted-foreground">
                Rows per page
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of{" "}
                {Math.ceil(totalProducts / rowsPerPage) || 1} ({totalProducts}{" "}
                total products)
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || loading}
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  ‹
                </Button>
                {Array.from(
                  {
                    length: Math.min(5, Math.ceil(totalProducts / rowsPerPage)),
                  },
                  (_, i) => {
                    const totalPages = Math.ceil(totalProducts / rowsPerPage);
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        Math.ceil(totalProducts / rowsPerPage),
                        currentPage + 1
                      )
                    )
                  }
                  disabled={
                    currentPage === Math.ceil(totalProducts / rowsPerPage) ||
                    loading
                  }
                >
                  ›
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.ceil(totalProducts / rowsPerPage))
                  }
                  disabled={
                    currentPage === Math.ceil(totalProducts / rowsPerPage) ||
                    loading
                  }
                >
                  »
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update product information"
                : "Enter the details for the new product"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productType">Product Type *</Label>
              <Select
                value={formData.productType}
                onValueChange={(
                  value:
                    | "car-parts"
                    | "riding-gear"
                    | "cleaning-and-accessories"
                ) => {
                  setFormData({
                    ...formData,
                    productType: value,
                    carMake: value !== "car-parts" ? "" : formData.carMake,
                    carModel: value !== "car-parts" ? "" : formData.carModel,
                    carYearFrom:
                      value !== "car-parts" ? "" : formData.carYearFrom,
                    carYearTo: value !== "car-parts" ? "" : formData.carYearTo,
                  });
                  // Clear selected cars when changing to non-car-parts types
                  if (value !== "car-parts") {
                    setSelectedCarCompatibility([]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car-parts">Car Parts</SelectItem>
                  <SelectItem value="riding-gear">Motorcycles</SelectItem>
                  <SelectItem value="cleaning-and-accessories">
                    Car Care & Accessories
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.productType === "car-parts"
                  ? "This product requires vehicle make, model, and year specifications."
                  : "This product does not require vehicle specifications."}
              </p>
            </div>

            {/* Car Compatibility Selection - Only for car-parts */}
            {formData.productType === "car-parts" && !editingProduct && (
              <div className="space-y-3 border rounded-lg p-4 bg-accent/5">
                <div>
                  <Label>Compatible Cars *</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add car models and specify the compatible year ranges for
                    this product
                  </p>
                </div>

                {/* Selected Car Compatibilities */}
                {selectedCarCompatibility.length > 0 && (
                  <div className="space-y-2">
                    {selectedCarCompatibility.map((compat, index) => {
                      const car = availableCars.find(
                        (c) => c.id === compat.carId
                      );
                      return (
                        <div
                          key={compat.carId}
                          className="flex items-center gap-2 p-3 bg-background border rounded-md"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {car?.brand} {car?.model}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="From"
                              className="w-24 h-8 text-sm"
                              value={compat.yearFrom || ""}
                              onChange={(e) => {
                                const newCompat = [...selectedCarCompatibility];
                                newCompat[index] = {
                                  ...newCompat[index],
                                  yearFrom: e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined,
                                };
                                setSelectedCarCompatibility(newCompat);
                              }}
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                              type="number"
                              placeholder="To"
                              className="w-24 h-8 text-sm"
                              value={
                                compat.yearTo === null
                                  ? ""
                                  : compat.yearTo || ""
                              }
                              onChange={(e) => {
                                const newCompat = [...selectedCarCompatibility];
                                newCompat[index] = {
                                  ...newCompat[index],
                                  yearTo: e.target.value
                                    ? parseInt(e.target.value)
                                    : null,
                                };
                                setSelectedCarCompatibility(newCompat);
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCarCompatibility(
                                selectedCarCompatibility.filter(
                                  (_, i) => i !== index
                                )
                              );
                            }}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Car Button and Dropdown */}
                <div className="relative">
                  <Select
                    value=""
                    onValueChange={(carId) => {
                      if (
                        !selectedCarCompatibility.some((c) => c.carId === carId)
                      ) {
                        setSelectedCarCompatibility([
                          ...selectedCarCompatibility,
                          { carId, yearFrom: undefined, yearTo: undefined },
                        ]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="+ Add compatible car" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCars.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground text-sm">
                          No cars available
                        </div>
                      ) : (
                        availableCars
                          .filter(
                            (car) =>
                              !selectedCarCompatibility.some(
                                (c) => c.carId === car.id
                              )
                          )
                          .map((car) => (
                            <SelectItem key={car.id} value={car.id}>
                              {car.brand} {car.model}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCarCompatibility.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No cars selected. Please add at least one compatible car.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemCode">Item Code *</Label>
                <Input
                  id="itemCode"
                  placeholder="e.g., 600001"
                  value={formData.itemCode}
                  onChange={(e) =>
                    setFormData({ ...formData, itemCode: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (JOD) *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, sellingPrice: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g., 3 SERIES HEADLIGHT TRIM"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description & Features</Label>
              <Textarea
                id="description"
                placeholder="Enter product description and features..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity {!hasVariants && "*"}</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  disabled={hasVariants}
                />
                {hasVariants && (
                  <p className="text-xs text-muted-foreground">
                    Stock managed per variant
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., BMW"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  placeholder="e.g., M, L, XL"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  disabled={hasVariants}
                />
                {hasVariants && (
                  <p className="text-xs text-muted-foreground">
                    Size managed per variant
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  placeholder="e.g., ABS PLASTIC"
                  value={formData.material}
                  onChange={(e) =>
                    setFormData({ ...formData, material: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Applies to all variants
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color/Design</Label>
                <Input
                  id="color"
                  placeholder="e.g., Carbon Fiber"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  disabled={hasVariants}
                />
                {hasVariants ? (
                  <p className="text-xs text-muted-foreground">
                    Color managed per variant
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Single color for product
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value,
                      subCategory: "",
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
                  value={formData.subCategory || undefined}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      subCategory: value === "none" ? "" : value,
                    })
                  }
                  disabled={!formData.category || subcategories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !formData.category
                          ? "Select category first"
                          : "Select subcategory (optional)"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Variants Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Product Variants</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable variants for products with multiple sizes/colors
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={hasVariants}
                    onCheckedChange={(checked) => {
                      setHasVariants(checked);
                      if (!checked) {
                        setVariants([]);
                      }
                    }}
                  />
                  <Label>Has Variants</Label>
                </div>
              </div>

              {hasVariants && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {variants.length} variant(s) configured
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenVariantDialog()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Variant
                    </Button>
                  </div>

                  {variants.length > 0 && (
                    <div className="border rounded-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2 font-medium">SKU</th>
                              <th className="text-left p-2 font-medium">
                                Size
                              </th>
                              <th className="text-left p-2 font-medium">
                                Color
                              </th>
                              <th className="text-left p-2 font-medium">
                                Price Adjustment
                              </th>
                              <th className="text-left p-2 font-medium">
                                Stock
                              </th>
                              <th className="text-left p-2 font-medium">
                                Status
                              </th>
                              <th className="text-left p-2 font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {variants.map((variant) => (
                              <tr key={variant.id} className="border-t">
                                <td className="p-2 font-mono text-xs">
                                  {variant.sku || "Auto-generated"}
                                </td>
                                <td className="p-2">{variant.size || "-"}</td>
                                <td className="p-2">{variant.color || "-"}</td>
                                <td className="p-2">
                                  {variant.priceAdjustment >= 0 ? "+" : ""}
                                  {variant.priceAdjustment.toFixed(3)} JOD
                                </td>
                                <td className="p-2">{variant.stockQuantity}</td>
                                <td className="p-2">
                                  <Badge
                                    variant={
                                      variant.isActive ? "default" : "secondary"
                                    }
                                  >
                                    {variant.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </td>
                                <td className="p-2">
                                  <div className="flex gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleOpenVariantDialog(variant)
                                      }
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteVariant(variant.id)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!hasVariants && (
                <p className="text-sm text-muted-foreground">
                  Single size/color product. Use brand, size, color, and
                  material fields above.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Product Images *</Label>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload multiple product images
                    </p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Uploaded Images ({uploadedImages.length})
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {uploadedImages.map((image) => (
                        <div
                          key={image.id}
                          className="relative group border-2 rounded-lg overflow-hidden"
                          style={{
                            borderColor: image.isPrimary
                              ? "hsl(var(--primary))"
                              : "transparent",
                          }}
                        >
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt="Product"
                            className="w-full h-32 object-cover"
                          />

                          <div className="absolute top-1 left-1 flex gap-1">
                            {image.isPrimary && (
                              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                            {image.isSecondary && (
                              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                                Secondary
                              </span>
                            )}
                          </div>

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            {!image.isPrimary && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleSetPrimary(image.id)}
                                title="Set as Primary"
                              >
                                <Star size={14} />
                              </Button>
                            )}
                            <Button
                              variant={
                                image.isSecondary ? "default" : "secondary"
                              }
                              size="sm"
                              onClick={() => handleToggleSecondary(image.id)}
                              title={
                                image.isSecondary
                                  ? "Remove Secondary"
                                  : "Set as Secondary"
                              }
                            >
                              2nd
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveImage(image.id)}
                              title="Remove Image"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click on an image to set it as Primary or Secondary. The
                      primary image appears first in product listings.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Car Compatibility Section - Only for existing car-parts products */}
            {editingProduct && formData.productType === "car-parts" && (
              <div className="space-y-4 border-t border-primary/20 pt-4 mt-6 bg-primary/5 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      Car Compatibility Management
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manage year ranges for compatible vehicles (new system)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      // Ensure availableCars is loaded
                      if (availableCars.length === 0 && selectedStore) {
                        try {
                          const cars = await carService.listCars({
                            store_id: selectedStore.id,
                            limit: 1000,
                          });
                          setAvailableCars(cars || []);
                        } catch (error) {
                          console.error("Error fetching cars:", error);
                          toast.error("Error", {
                            description: "Failed to load available cars",
                          });
                          return;
                        }
                      }
                      setEditingCompatibility(null);
                      setCompatibilityForm({
                        carId: "",
                        yearFrom: "",
                        yearTo: "",
                      });
                      setShowCompatibilityDialog(true);
                    }}
                  >
                    <Plus size={16} className="mr-2" />
                    Add Compatibility
                  </Button>
                </div>

                {compatibilities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No car compatibilities added yet. Click &quot;Add
                    Compatibility&quot; to begin.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {compatibilities.map((compat) => (
                      <div
                        key={compat.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-accent/5"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {compat.carBrand} {compat.carModel}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {productCarCompatibilityService.formatYearRange(
                              compat.yearFrom,
                              compat.yearTo
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCompatibility(compat);
                              setCompatibilityForm({
                                carId: compat.carId,
                                yearFrom: compat.yearFrom.toString(),
                                yearTo: compat.yearTo?.toString() || "",
                              });
                              setShowCompatibilityDialog(true);
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            type="button"
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
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Car Compatibility Dialog */}
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
            <div className="space-y-2">
              <Label>Car *</Label>
              <Select
                value={compatibilityForm.carId}
                onValueChange={(value) =>
                  setCompatibilityForm({ ...compatibilityForm, carId: value })
                }
                disabled={!!editingCompatibility}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      availableCars.length === 0
                        ? "No cars available"
                        : "Select car..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableCars.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No cars available. Please add cars to your store first.
                    </div>
                  ) : (
                    availableCars.map((car) => (
                      <SelectItem key={car.id} value={car.id}>
                        {car.brand} {car.model}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {editingCompatibility && (
                <p className="text-xs text-muted-foreground">
                  Car cannot be changed. Delete and create new compatibility if
                  needed.
                </p>
              )}
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
                  onChange={(e) =>
                    setCompatibilityForm({
                      ...compatibilityForm,
                      yearFrom: e.target.value,
                    })
                  }
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
                setCompatibilityForm({ carId: "", yearFrom: "", yearTo: "" });
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
              disabled={!compatibilityForm.carId || !compatibilityForm.yearFrom}
            >
              {editingCompatibility ? "Update" : "Add"} Compatibility
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variant Dialog */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? "Edit Variant" : "Add Variant"}
            </DialogTitle>
            <DialogDescription>
              Configure a product variant with specific size, color, and stock
              details. SKU will be auto-generated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant-size">Size</Label>
                <Input
                  id="variant-size"
                  placeholder="e.g., S, M, L, XL"
                  value={variantFormData.size}
                  onChange={(e) =>
                    setVariantFormData({
                      ...variantFormData,
                      size: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant-color">Color</Label>
                <Input
                  id="variant-color"
                  placeholder="e.g., Red, Blue"
                  value={variantFormData.color}
                  onChange={(e) =>
                    setVariantFormData({
                      ...variantFormData,
                      color: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant-price-adjustment">
                  Price Adjustment (JOD)
                </Label>
                <Input
                  id="variant-price-adjustment"
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={variantFormData.priceAdjustment}
                  onChange={(e) =>
                    setVariantFormData({
                      ...variantFormData,
                      priceAdjustment: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Amount to add/subtract from base price
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant-stock">Stock Quantity *</Label>
                <Input
                  id="variant-stock"
                  type="number"
                  placeholder="0"
                  value={variantFormData.stockQuantity}
                  onChange={(e) =>
                    setVariantFormData({
                      ...variantFormData,
                      stockQuantity: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="variant-active"
                checked={variantFormData.isActive}
                onCheckedChange={(checked) =>
                  setVariantFormData({
                    ...variantFormData,
                    isActive: checked,
                  })
                }
              />
              <Label htmlFor="variant-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseVariantDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveVariant}>
              {editingVariant ? "Update Variant" : "Add Variant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={handleCloseImportDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import products. Download the template
              to see the required format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CSV File</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    {importFile
                      ? importFile.name
                      : "Select a CSV file to import"}
                  </p>
                  <Input
                    ref={importFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportFile}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="w-full"
              >
                <Download size={16} className="mr-2" />
                Download CSV Template
              </Button>
            </div>

            {importResults && (
              <div className="space-y-2">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold mb-2">Import Results</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-400">
                      ✓ Successfully imported: {importResults.success} products
                    </p>
                    {importResults.failed > 0 && (
                      <>
                        <p className="text-red-400">
                          ✗ Failed: {importResults.failed} products
                        </p>
                        {importResults.errors.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="font-medium">Errors:</p>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {importResults.errors.map((error, idx) => (
                                <p
                                  key={idx}
                                  className="text-xs text-muted-foreground"
                                >
                                  • {error}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Required fields: itemCode, name, category, quantity,
                  sellingPrice
                </li>
                <li>
                  For car parts: also require carMake, carModel, carYearFrom
                </li>
                <li>
                  productType must be either "car-parts" or "non-car-parts"
                </li>
                <li>
                  Images will be set to placeholder (add actual images after
                  import)
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseImportDialog}>
              {importResults ? "Close" : "Cancel"}
            </Button>
            {!importResults && (
              <Button onClick={handleImportProducts} disabled={!importFile}>
                Import Products
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteProduct}
        onOpenChange={() => setDeleteProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
