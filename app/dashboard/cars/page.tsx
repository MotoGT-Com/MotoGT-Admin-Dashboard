"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Loader2,
  Car as CarIcon,
  Pencil,
  Trash2,
  Store as StoreIcon,
  Globe,
} from "lucide-react";
import { useState, useEffect } from "react";
import { carService, BrandData, Car } from "@/lib/services/car.service";
import { settingsService } from "@/lib/services/settings.service";
import { uploadService } from "@/lib/services/upload.service";
import { toast } from "sonner";

type DialogMode = "add-model" | "edit-brand" | "add-brand" | null;
type DeleteTarget =
  | { type: "brand"; brand: string }
  | { type: "model"; carId: string; brand: string; model: string }
  | null;

export default function CarsPage() {
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

  // Store and Language state
  const [stores, setStores] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<any | null>(null);
  const [storesLoading, setStoresLoading] = useState(true);

  // Dialog states
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [brandForm, setBrandForm] = useState({ oldName: "", newName: "" });
  const [modelForm, setModelForm] = useState({
    brand: "",
    model: "",
    year_from: "",
    year_to: "",
    engine_size: "",
    fuel_type: "",
    transmission: "",
    car_image: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch stores and languages on mount
  useEffect(() => {
    const initializeStoresAndLanguages = async () => {
      try {
        setStoresLoading(true);

        // Fetch stores and languages from API
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
      } catch (error: any) {
        console.error("Failed to fetch stores/languages:", error);
        toast.error("Error", { description: "Failed to load stores and languages" });
      } finally {
        setStoresLoading(false);
      }
    };

    initializeStoresAndLanguages();
  }, []);

  // Fetch all cars and group by brand
  const fetchCars = async () => {
    if (!selectedStore) return; // Wait for store to be selected

    try {
      setLoading(true);
      const cars = await carService.listCars({
        limit: 1000,
        store_id: selectedStore.id, // Filter by selected store
      });
      const groupedBrands = carService.groupCarsByBrand(cars);
      setBrands(groupedBrands);

      // Expand first brand by default
      if (groupedBrands.length > 0) {
        setExpandedBrands(new Set([groupedBrands[0].brand]));
      }
    } catch (error: any) {
      console.error("Failed to fetch cars:", error);
      toast.error("Error", { description: error.message || "Failed to fetch cars" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStore) {
      fetchCars();
    }
  }, [selectedStore]);

  const handleStoreChange = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (store) {
      setSelectedStore(store);
      settingsService.setSelectedStore(storeId);
      toast.success("Store Changed", { description: `Switched to ${store.name}`, });
      // Cars will be refetched automatically via useEffect
    }
  };

  const handleLanguageChange = (languageId: string) => {
    const language = languages.find((l) => l.id === languageId);
    if (language) {
      setSelectedLanguage(language);
      settingsService.setSelectedLanguage(languageId);
      toast.success("Language Changed", { description: `Switched to ${language.name}`, });
    }
  };

  const toggleBrand = (brand: string) => {
    setExpandedBrands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brand)) {
        newSet.delete(brand);
      } else {
        newSet.add(brand);
      }
      return newSet;
    });
  };

  const formatYearRange = (car: Car) => {
    if (car.year_from && car.year_to) {
      return `${car.year_from} - ${car.year_to}`;
    } else if (car.year_from) {
      return `${car.year_from}+`;
    } else if (car.year_to) {
      return `Up to ${car.year_to}`;
    }
    return "All Years";
  };

  // Handler: Open Add Model dialog for a specific brand
  const handleAddModelToBrand = (brand: string) => {
    setSelectedBrand(brand);
    setModelForm({
      brand,
      model: "",
      year_from: "",
      year_to: "",
      engine_size: "",
      fuel_type: "",
      transmission: "",
      car_image: "",
    });
    setDialogMode("add-model");
  };

  // Handler: Open Edit Brand dialog
  const handleEditBrand = (brand: string) => {
    setBrandForm({ oldName: brand, newName: brand });
    setDialogMode("edit-brand");
  };

  // Handler: Open Delete Brand confirmation
  const handleDeleteBrand = (brand: string) => {
    setDeleteTarget({ type: "brand", brand });
  };

  // Handler: Open Edit Model dialog
  const handleEditModel = (car: Car) => {
    setEditingCar(car);
    setModelForm({
      brand: car.brand,
      model: car.model,
      year_from: car.year_from?.toString() || "",
      year_to: car.year_to?.toString() || "",
      engine_size: car.engine_size || "",
      fuel_type: car.fuel_type || "",
      transmission: car.transmission || "",
      car_image: car.car_image || "",
    });
    setDialogMode("add-model"); // Reuse the same dialog
  };

  // Handler: Open Delete Model confirmation
  const handleDeleteModel = (car: Car) => {
    setDeleteTarget({
      type: "model",
      carId: car.id,
      brand: car.brand,
      model: car.model,
    });
  };

  // Handler: Handle image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = uploadService.validateImageFile(file);
    if (!validation.valid) {
      toast.error("Invalid File", { description: validation.error });
      return;
    }

    // Set file and create preview
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handler: Clear image selection
  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setModelForm({ ...modelForm, car_image: "" });

    // Also clear from editingCar if editing
    if (editingCar) {
      setEditingCar({ ...editingCar, car_image: "" });
    }
  };

  // Handler: Open top-level Add Brand dialog (creates first model for new brand)
  const handleAddBrand = () => {
    setSelectedBrand("");
    setModelForm({
      brand: "",
      model: "",
      year_from: "",
      year_to: "",
      engine_size: "",
      fuel_type: "",
      transmission: "",
      car_image: "",
    });
    setDialogMode("add-brand");
  };

  // Handler: Open top-level Add Model dialog with brand selection
  const handleAddModelTopLevel = () => {
    setSelectedBrand("");
    setModelForm({
      brand: brands.length > 0 ? brands[0].brand : "",
      model: "",
      year_from: "",
      year_to: "",
      engine_size: "",
      fuel_type: "",
      transmission: "",
      car_image: "",
    });
    setDialogMode("add-model");
  };

  // Submit: Add or Edit Model
  const handleSubmitModel = async () => {
    if (!selectedStore) {
      toast.error("Error", { description: "Please select a store first" });
      return;
    }

    try {
      setSubmitting(true);

      const carData = {
        brand: modelForm.brand,
        model: modelForm.model,
        year_from: modelForm.year_from
          ? parseInt(modelForm.year_from)
          : undefined,
        year_to: modelForm.year_to ? parseInt(modelForm.year_to) : undefined,
        engine_size: modelForm.engine_size || undefined,
        fuel_type: modelForm.fuel_type || undefined,
        transmission: modelForm.transmission || undefined,
        car_image: modelForm.car_image || null, // Send null to clear image
        store_id: selectedStore.id,
      };

      let savedCar: Car;

      if (editingCar) {
        // Edit existing model
        savedCar = await carService.updateCar(editingCar.id, carData);

        // Upload image if new file selected
        if (imageFile) {
          setUploadingImage(true);
          try {
            const uploadResult = await uploadService.uploadImage(
              imageFile,
              "car",
              savedCar.id,
              "car_image"
            );
            // Update car with new image URL
            await carService.updateCar(savedCar.id, {
              ...carData,
              car_image: uploadResult.url,
            });
          } catch (uploadError: any) {
            toast.error("Warning", { description: "Model updated but image upload failed: " + uploadError.message });
          } finally {
            setUploadingImage(false);
          }
        }

        toast.success("Success", { description: "Model updated successfully", });
      } else {
        // Add new model
        savedCar = await carService.createCar(carData);

        // Upload image if file selected
        if (imageFile) {
          setUploadingImage(true);
          try {
            const uploadResult = await uploadService.uploadImage(
              imageFile,
              "car",
              savedCar.id,
              "car_image"
            );
            // Update car with image URL
            await carService.updateCar(savedCar.id, {
              ...carData,
              car_image: uploadResult.url,
            });
          } catch (uploadError: any) {
            toast.error("Warning", { description: "Model created but image upload failed: " + uploadError.message });
          } finally {
            setUploadingImage(false);
          }
        }

        toast.success("Success", { description: "Model added successfully", });
      }

      setDialogMode(null);
      setEditingCar(null);
      handleClearImage();
      fetchCars();
    } catch (error: any) {
      console.error("Failed to save model:", error);
      toast.error("Error", { description: error.message || "Failed to save model" });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit: Edit Brand Name
  const handleSubmitBrandEdit = async () => {
    try {
      setSubmitting(true);

      // Find all cars with the old brand name
      const brandData = brands.find((b) => b.brand === brandForm.oldName);
      if (!brandData) {
        throw new Error("Brand not found");
      }

      // Update each car's brand name
      await Promise.all(
        brandData.models.map((car) =>
          carService.updateCar(car.id, {
            ...car,
            brand: brandForm.newName,
            store_id: selectedStore.id,
          })
        )
      );

      toast.success("Success", { description: `Brand renamed from "${brandForm.oldName}" to "${brandForm.newName}"`, });

      setDialogMode(null);
      fetchCars();
    } catch (error: any) {
      console.error("Failed to edit brand:", error);
      toast.error("Error", { description: error.message || "Failed to edit brand" });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm: Delete Brand
  const handleConfirmDeleteBrand = async () => {
    if (!deleteTarget || deleteTarget.type !== "brand") return;

    try {
      setSubmitting(true);

      // Find all cars with this brand
      const brandData = brands.find((b) => b.brand === deleteTarget.brand);
      if (!brandData) {
        throw new Error("Brand not found");
      }

      // Delete all cars in this brand
      await Promise.all(
        brandData.models.map((car) => carService.deleteCar(car.id))
      );

      toast.success("Success", { description: `Brand "${deleteTarget.brand}" and all its models deleted`, });

      setDeleteTarget(null);
      fetchCars();
    } catch (error: any) {
      console.error("Failed to delete brand:", error);
      toast.error("Error", { description: error.message || "Failed to delete brand" });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm: Delete Model
  const handleConfirmDeleteModel = async () => {
    if (!deleteTarget || deleteTarget.type !== "model") return;

    try {
      setSubmitting(true);

      await carService.deleteCar(deleteTarget.carId);

      toast.success("Success", { description: `Model "${deleteTarget.model}" deleted`, });

      setDeleteTarget(null);
      fetchCars();
    } catch (error: any) {
      console.error("Failed to delete model:", error);
      toast.error("Error", { description: error.message || "Failed to delete model" });
    } finally {
      setSubmitting(false);
    }
  };

  if (storesLoading || loading || !selectedStore) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">
            {storesLoading ? "Loading stores..." : "Loading cars..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Car Database</h1>
          <p className="text-muted-foreground mt-1">
            Manage car brands and models for product compatibility
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleAddBrand}>
            <Plus size={16} />
            Add Brand
          </Button>
          <Button className="gap-2" onClick={handleAddModelTopLevel}>
            <Plus size={16} />
            Add Model
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brands.reduce((sum, brand) => sum + brand.totalModels, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brands.length > 0
                ? brands.reduce((prev, current) =>
                    prev.totalModels > current.totalModels ? prev : current
                  ).brand
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brands List */}
      <Card>
        <CardHeader>
          <CardTitle>Car Brands & Models</CardTitle>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <div className="text-center py-12">
              <CarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No cars found in the database
              </p>
              <Button className="mt-4 gap-2" onClick={handleAddModelTopLevel}>
                <Plus size={16} />
                Add Your First Car
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {brands.map((brandData) => (
                <div
                  key={brandData.brand}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  {/* Brand Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer transition"
                    onClick={() => toggleBrand(brandData.brand)}
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-muted-foreground hover:text-foreground">
                        {expandedBrands.has(brandData.brand) ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </button>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {brandData.brand}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {brandData.totalModels}{" "}
                          {brandData.totalModels === 1 ? "model" : "models"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddModelToBrand(brandData.brand);
                        }}
                        className="gap-1"
                      >
                        <Plus size={14} />
                        Add Model
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditBrand(brandData.brand);
                        }}
                        className="gap-1"
                      >
                        <Pencil size={14} />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBrand(brandData.brand);
                        }}
                        className="text-destructive hover:text-destructive gap-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Models List */}
                  {expandedBrands.has(brandData.brand) && (
                    <div className="p-4 space-y-2 bg-background">
                      {brandData.models.map((car) => (
                        <div
                          key={car.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition"
                        >
                          <div className="flex items-center gap-4">
                            {car.car_image ? (
                              <img
                                src={car.car_image}
                                alt={car.model}
                                className="w-16 h-16 rounded object-cover bg-muted"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                                <CarIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold">{car.model}</h4>
                              <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                                <span>{formatYearRange(car)}</span>
                                {car.engineSize && (
                                  <span>• {car.engineSize}</span>
                                )}
                                {car.fuelType && <span>• {car.fuelType}</span>}
                                {car.transmission && (
                                  <span>• {car.transmission}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditModel(car)}
                              className="gap-1"
                            >
                              <Pencil size={14} />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteModel(car)}
                              className="text-destructive hover:text-destructive gap-1"
                            >
                              <Trash2 size={14} />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Model Dialog */}
      <Dialog
        open={dialogMode === "add-model"}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null);
            setEditingCar(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCar ? "Edit Model" : "Add New Model"}
            </DialogTitle>
            <DialogDescription>
              {editingCar
                ? "Update the model details below"
                : selectedBrand
                ? `Add a new model to ${selectedBrand}`
                : "Add a new car model"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              {!editingCar && brands.length > 0 && !selectedBrand ? (
                <Select
                  value={modelForm.brand}
                  onValueChange={(value) =>
                    setModelForm({ ...modelForm, brand: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select or type new brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.brand} value={b.brand}>
                        {b.brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="brand"
                  value={modelForm.brand}
                  onChange={(e) =>
                    setModelForm({ ...modelForm, brand: e.target.value })
                  }
                  placeholder="e.g., Toyota"
                  disabled={!!editingCar || !!selectedBrand}
                  required
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={modelForm.model}
                onChange={(e) =>
                  setModelForm({ ...modelForm, model: e.target.value })
                }
                placeholder="e.g., Camry"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearFrom">Year From</Label>
              <Input
                id="yearFrom"
                type="number"
                value={modelForm.year_from}
                onChange={(e) =>
                  setModelForm({ ...modelForm, year_from: e.target.value })
                }
                placeholder="e.g., 2015"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearTo">Year To</Label>
              <Input
                id="yearTo"
                type="number"
                value={modelForm.year_to}
                onChange={(e) =>
                  setModelForm({ ...modelForm, year_to: e.target.value })
                }
                placeholder="e.g., 2020"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engineSize">Engine Size</Label>
              <Input
                id="engineSize"
                value={modelForm.engine_size}
                onChange={(e) =>
                  setModelForm({ ...modelForm, engine_size: e.target.value })
                }
                placeholder="e.g., 2.5L"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Select
                value={modelForm.fuel_type}
                onValueChange={(value) =>
                  setModelForm({ ...modelForm, fuel_type: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {settingsService.getFuelTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transmission">Transmission</Label>
              <Select
                value={modelForm.transmission}
                onValueChange={(value) =>
                  setModelForm({ ...modelForm, transmission: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent>
                  {settingsService.getTransmissionTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="car_image">Car Image</Label>
              <div className="flex gap-2 items-end">
                {imagePreview || editingCar?.car_image ? (
                  <div className="flex-1 space-y-2">
                    <div className="relative w-full h-32 border rounded-md overflow-hidden bg-muted">
                      <img
                        src={imagePreview || editingCar?.car_image || ""}
                        alt="Car preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById("car-image-upload")?.click()
                        }
                        className="flex-1"
                      >
                        Change Image
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearImage}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("car-image-upload")?.click()
                    }
                    className="w-full h-24 flex flex-col gap-2"
                  >
                    <Plus size={24} />
                    <span>Upload Car Image</span>
                    <span className="text-xs text-muted-foreground">
                      JPG, PNG, GIF, WebP (Max 5MB)
                    </span>
                  </Button>
                )}
                <input
                  id="car-image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogMode(null);
                setEditingCar(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitModel} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingCar ? (
                "Update Model"
              ) : (
                "Add Model"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Brand Dialog */}
      <Dialog
        open={dialogMode === "add-brand"}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
            <DialogDescription>
              Create a new brand by adding the first model
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand-new">Brand Name *</Label>
              <Input
                id="brand-new"
                value={modelForm.brand}
                onChange={(e) =>
                  setModelForm({ ...modelForm, brand: e.target.value })
                }
                placeholder="e.g., Toyota"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-new">First Model *</Label>
              <Input
                id="model-new"
                value={modelForm.model}
                onChange={(e) =>
                  setModelForm({ ...modelForm, model: e.target.value })
                }
                placeholder="e.g., Camry"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year_from-new">Year From</Label>
              <Input
                id="year_from-new"
                type="number"
                value={modelForm.year_from}
                onChange={(e) =>
                  setModelForm({ ...modelForm, year_from: e.target.value })
                }
                placeholder="e.g., 2015"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year_to-new">Year To</Label>
              <Input
                id="year_to-new"
                type="number"
                value={modelForm.year_to}
                onChange={(e) =>
                  setModelForm({ ...modelForm, year_to: e.target.value })
                }
                placeholder="e.g., 2020"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engine_size-new">Engine Size</Label>
              <Input
                id="engine_size-new"
                value={modelForm.engine_size}
                onChange={(e) =>
                  setModelForm({ ...modelForm, engine_size: e.target.value })
                }
                placeholder="e.g., 2.5L"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuel_type-new">Fuel Type</Label>
              <Select
                value={modelForm.fuel_type}
                onValueChange={(value) =>
                  setModelForm({ ...modelForm, fuel_type: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {settingsService.getFuelTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transmission-new">Transmission</Label>
              <Select
                value={modelForm.transmission}
                onValueChange={(value) =>
                  setModelForm({ ...modelForm, transmission: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent>
                  {settingsService.getTransmissionTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="car_image-new">Car Image</Label>
              <div className="flex gap-2 items-end">
                {imagePreview ? (
                  <div className="flex-1 space-y-2">
                    <div className="relative w-full h-32 border rounded-md overflow-hidden bg-muted">
                      <img
                        src={imagePreview}
                        alt="Car preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document
                            .getElementById("brand-car-image-upload")
                            ?.click()
                        }
                        className="flex-1"
                      >
                        Change Image
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearImage}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("brand-car-image-upload")?.click()
                    }
                    className="w-full h-24 flex flex-col gap-2"
                  >
                    <Plus size={24} />
                    <span>Upload Car Image</span>
                    <span className="text-xs text-muted-foreground">
                      JPG, PNG, GIF, WebP (Max 5MB)
                    </span>
                  </Button>
                )}
                <input
                  id="brand-car-image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogMode(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitModel}
              disabled={submitting || !modelForm.brand || !modelForm.model}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Brand"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Brand Dialog */}
      <Dialog
        open={dialogMode === "edit-brand"}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand Name</DialogTitle>
            <DialogDescription>
              This will update the brand name for all models under this brand.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldBrand">Current Brand</Label>
              <Input
                id="oldBrand"
                value={brandForm.oldName}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newBrand">New Brand Name *</Label>
              <Input
                id="newBrand"
                value={brandForm.newName}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, newName: e.target.value })
                }
                placeholder="Enter new brand name"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogMode(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitBrandEdit}
              disabled={submitting || !brandForm.newName}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Brand"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Brand Confirmation */}
      <AlertDialog
        open={deleteTarget?.type === "brand"}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the brand "
              {deleteTarget?.type === "brand" && deleteTarget.brand}"? This will
              delete all{" "}
              {deleteTarget?.type === "brand" &&
                brands.find((b) => b.brand === deleteTarget.brand)
                  ?.totalModels}{" "}
              models under this brand. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteBrand}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Brand"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Model Confirmation */}
      <AlertDialog
        open={deleteTarget?.type === "model"}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {deleteTarget?.type === "model" && deleteTarget.brand}{" "}
              {deleteTarget?.type === "model" && deleteTarget.model}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteModel}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Model"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
