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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { productService, Product } from "@/lib/services/product.service";
import { settingsService } from "@/lib/services/settings.service";
import { carService, Car } from "@/lib/services/car.service";
import { uploadService } from "@/lib/services/upload.service";
import { categoryService, Category } from "@/lib/services/category.service";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [selectedCarIds, setSelectedCarIds] = useState<string[]>([]);

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
        toast({
          title: "Error",
          description: "Failed to load stores and languages",
          variant: "destructive",
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
          toast({
            title: "Error",
            description: "Failed to load product for editing",
            variant: "destructive",
          });
        }
      };
      fetchProductToEdit();
    }
  }, [searchParams, selectedStore, selectedLanguage]);

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

      console.log(
        "Fetched products:",
        productsWithDisplayData.length,
        "Total:",
        response.meta.total
      );
      setProducts(productsWithDisplayData);
      setTotalProducts(response.meta.total); // Use meta.total from server
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch products",
        variant: "destructive",
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
      toast({
        title: "Store Changed",
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
      toast({
        title: "Language Changed",
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

      // Set selected car IDs if available
      if (product.carCompatibility && product.carCompatibility.length > 0) {
        setSelectedCarIds(product.carCompatibility.map((cc) => cc.carId));
      } else {
        setSelectedCarIds([]);
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
      });
      setUploadedImages([]);
      setSelectedCarIds([]);

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
    setSelectedCarIds([]);
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
    });
    setUploadedImages([]);
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

  const handleSaveProduct = async () => {
    if (!selectedStore || !selectedLanguage) {
      toast({
        title: "Error",
        description: "Please select a store and language",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (
      !formData.itemCode ||
      !formData.name ||
      !formData.sellingPrice ||
      !formData.quantity
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (Item Code, Name, Price, Quantity)",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Please enter a category ID",
        variant: "destructive",
      });
      return;
    }

    // Validate car compatibility for car-parts (only for new products)
    if (
      !editingProduct &&
      formData.productType === "car-parts" &&
      selectedCarIds.length === 0
    ) {
      toast({
        title: "Validation Error",
        description: "Please select at least one compatible car for car parts",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare product data
      const productData = {
        itemCode: formData.itemCode,
        storeId: selectedStore.id,
        categoryId: formData.category,
        subCategoryId: formData.subCategory || undefined,
        price: parseFloat(formData.sellingPrice),
        stockQuantity: parseInt(formData.quantity),
        isActive: true,
        translations: [
          {
            languageId: selectedLanguage.id,
            name: formData.name,
            description: formData.description || undefined,
          },
        ],
        specs:
          formData.color || formData.material
            ? {
                [selectedLanguage.code]: {
                  ...(formData.color && {
                    color: {
                      type: "string",
                      value: formData.color,
                      isFilterable: true,
                      sortOrder: 1,
                      unit: null,
                    },
                  }),
                  ...(formData.material && {
                    material: {
                      type: "string",
                      value: formData.material,
                      isFilterable: true,
                      sortOrder: 2,
                      unit: null,
                    },
                  }),
                },
              }
            : undefined,
        // Add car compatibility for car-parts
        carCompatibility:
          formData.productType === "car-parts" && selectedCarIds.length > 0
            ? selectedCarIds.map((carId) => ({
                carId,
                isCompatible: true,
              }))
            : undefined,
      };

      let savedProduct;

      if (editingProduct) {
        // Update existing product
        savedProduct = await productService.updateProduct(
          editingProduct.id,
          productData
        );
      } else {
        // Create new product
        savedProduct = await productService.createProduct(productData);
      }

      // Upload images if any
      if (uploadedImages.length > 0) {
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
        for (const img of galleryImages) {
          const blob = await fetch(img.url).then((r) => r.blob());
          const file = new File([blob], `gallery-${img.id}.jpg`, {
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

      console.log(
        editingProduct
          ? "Product updated successfully:"
          : "Product created successfully:",
        savedProduct
      );

      toast({
        title: "Success",
        description: editingProduct
          ? "Product updated successfully"
          : "Product created successfully",
      });

      handleCloseDialog();
      console.log("Setting current page to 1, current filters:", {
        filterCategory,
        filterSubCategory,
        filterCarBrand,
        filterCarModel,
      });

      // If already on page 1, manually trigger fetchProducts, otherwise setCurrentPage will trigger it
      if (currentPage === 1) {
        fetchProducts();
      } else {
        setCurrentPage(1);
      }
    } catch (error: any) {
      console.error("Failed to create product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
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

      toast({
        title: "Success",
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
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
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
    toast({
      title: "Coming Soon",
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

        {/* Row 2: Car Brand and Model Filters */}
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
              onValueChange={setFilterCarModel}
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

          {(filterCarBrand !== "any" || filterCarModel !== "any") && (
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterCarBrand("any");
                  setFilterCarModel("any");
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
                onValueChange={(value: "car-parts" | "non-car-parts") => {
                  setFormData({
                    ...formData,
                    productType: value,
                    carMake: value === "non-car-parts" ? "" : formData.carMake,
                    carModel:
                      value === "non-car-parts" ? "" : formData.carModel,
                    carYearFrom:
                      value === "non-car-parts" ? "" : formData.carYearFrom,
                    carYearTo:
                      value === "non-car-parts" ? "" : formData.carYearTo,
                  });
                  // Clear selected cars when changing to non-car-parts
                  if (value === "non-car-parts") {
                    setSelectedCarIds([]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car-parts">
                    Car Parts (requires vehicle specs)
                  </SelectItem>
                  <SelectItem value="non-car-parts">
                    Non-Car Parts (cleaning, accessories, etc.)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.productType === "car-parts"
                  ? "This product requires vehicle make, model, and year specifications."
                  : "This product does not require vehicle specifications (e.g., cleaning products, riding jackets, helmets)."}
              </p>
            </div>

            {/* Car Compatibility Selection - Only for car-parts */}
            {formData.productType === "car-parts" && !editingProduct && (
              <div className="space-y-2 border rounded-lg p-4 bg-accent/5">
                <Label>Compatible Cars *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select all car models that this part is compatible with
                </p>
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {availableCars.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No cars available. Please add cars to your store first.
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {availableCars.map((car) => (
                        <label
                          key={car.id}
                          className="flex items-center gap-2 p-2 hover:bg-accent/10 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCarIds.includes(car.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCarIds([...selectedCarIds, car.id]);
                              } else {
                                setSelectedCarIds(
                                  selectedCarIds.filter((id) => id !== car.id)
                                );
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">
                            {car.brand} {car.model}
                            {(car.yearFrom || car.year_from) &&
                              (car.yearTo || car.year_to) && (
                                <span className="text-muted-foreground ml-1">
                                  ({car.yearFrom || car.year_from} -{" "}
                                  {car.yearTo || car.year_to})
                                </span>
                              )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {selectedCarIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedCarIds.length} car(s) selected
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
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                />
              </div>

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
                />
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
