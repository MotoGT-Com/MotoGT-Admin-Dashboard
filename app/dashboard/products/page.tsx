"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Search, Filter, Upload, X, MoreHorizontal, Star, Download } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ProductImage {
  id: string
  url: string
  isPrimary: boolean
  isSecondary: boolean
}

interface Product {
  id: string
  itemCode: string
  name: string
  sellingPrice: number
  productType: 'car-parts' | 'non-car-parts' // Added product type field
  carMake: string
  carModel: string
  carYearFrom: string
  carYearTo: string
  description: string
  quantity: number
  material: string
  category: string
  subCategory: string
  color: string
  images: ProductImage[]
}

interface Model {
  id: string
  name: string
}

interface Make {
  id: string
  name: string
  models: Model[]
}

export default function ProductsPage() {
  const [vehicleMakes] = useState<Make[]>([
    {
      id: '1',
      name: 'BMW',
      models: [
        { id: '1-1', name: 'M3' },
        { id: '1-2', name: 'Series 3' }
      ]
    },
    {
      id: '2',
      name: 'Porsche',
      models: [
        { id: '2-1', name: '911 Turbo' }
      ]
    },
    {
      id: '3',
      name: 'Audi',
      models: [
        { id: '3-1', name: 'RS6 Avant' }
      ]
    }
  ])

  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      itemCode: '600001',
      name: '3 SERIES HEADLIGHT TRIM',
      sellingPrice: 20,
      productType: 'car-parts', // Added product type to sample data
      carMake: 'BMW',
      carModel: '3 Series',
      carYearFrom: '2019',
      carYearTo: '2022',
      description: 'Enhance the appearance of YOUR BMW with stylish Headlight trim design WITH Durable and weather resistant materials ensure long-lasting performance under various conditions.',
      quantity: 5,
      material: 'ABS PLASTIC',
      category: 'Exterior',
      subCategory: 'Headlight Trim',
      color: 'Carbon Fiber Design',
      images: [
        { id: '1', url: '/car-headlight-trim.jpg', isPrimary: true, isSecondary: false }
      ]
    }
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [filterMake, setFilterMake] = useState('any')
  const [filterModel, setFilterModel] = useState('any')
  const [filterYear, setFilterYear] = useState('any')
  const [filterCategory, setFilterCategory] = useState('any')
  const [filterSubCategory, setFilterSubCategory] = useState('any')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    sellingPrice: '',
    productType: 'car-parts', // Added product type to form data
    carMake: '',
    carModel: '',
    carYearFrom: '',
    carYearTo: '',
    description: '',
    quantity: '',
    material: '',
    category: '',
    subCategory: '',
    color: ''
  })

  const [availableModels, setAvailableModels] = useState<Model[]>([])
  const [availableFilterModels, setAvailableFilterModels] = useState<string[]>([])
  // Added state for available subcategories based on filter category
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([])

  useEffect(() => {
    if (formData.carMake) {
      const selectedMake = vehicleMakes.find(make => make.name === formData.carMake)
      setAvailableModels(selectedMake?.models || [])
    } else {
      setAvailableModels([])
    }
  }, [formData.carMake, vehicleMakes])

  useEffect(() => {
    if (filterMake && filterMake !== 'any') {
      const modelsForMake = Array.from(new Set(
        products
          .filter(p => p.carMake === filterMake)
          .map(p => p.carModel)
      )).filter(Boolean)
      setAvailableFilterModels(modelsForMake)
      
      if (filterModel !== 'any' && !modelsForMake.includes(filterModel)) {
        setFilterModel('any')
      }
    } else {
      setAvailableFilterModels([])
      setFilterModel('any')
    }
  }, [filterMake, products])

  useEffect(() => {
    if (filterCategory && filterCategory !== 'any') {
      const subCatsForCategory = Array.from(new Set(
        products
          .filter(p => p.category === filterCategory)
          .map(p => p.subCategory)
      )).filter(Boolean)
      setAvailableSubCategories(subCatsForCategory)
      
      if (filterSubCategory !== 'any' && !subCatsForCategory.includes(filterSubCategory)) {
        setFilterSubCategory('any')
      }
    } else {
      setAvailableSubCategories([])
      setFilterSubCategory('any')
    }
  }, [filterCategory, products])

  const categories = ['Exterior', 'Interior', 'Engine', 'Suspension', 'Exhaust', 'Brakes']
  const subCategories = [
    'Headlight Trim', 'Grilles', 'Spoilers', 'Body Kits', 'Mirrors', 'Door Handles',
    'Dashboard Trim', 'Seat Covers', 'Steering Wheels', 'Floor Mats', 'Console Trim',
    'Air Filters', 'Oil Filters', 'Spark Plugs', 'Belts', 'Hoses',
    'Shocks', 'Struts', 'Springs', 'Control Arms', 'Bushings',
    'Mufflers', 'Catalytic Converters', 'Headers', 'Tips', 'Pipes',
    'Brake Pads', 'Rotors', 'Calipers', 'Lines', 'Brake Fluid',
    'Bumpers', 'Fenders', 'Hoods', 'Trunks', 'Doors',
    'Wheels', 'Tires', 'Hubcaps', 'Lug Nuts', 'Center Caps'
  ]

  const productionYears = Array.from(new Set(
    products.flatMap(p => {
      const years: string[] = []
      if (p.carYearFrom) years.push(p.carYearFrom)
      if (p.carYearTo) years.push(p.carYearTo)
      return years
    })
  )).filter(Boolean).sort((a, b) => parseInt(b) - parseInt(a))

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.carMake.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.carModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.subCategory.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesMake = filterMake === 'any' || product.carMake === filterMake
    const matchesModel = filterModel === 'any' || product.carModel === filterModel
    const matchesYear = filterYear === 'any' || (
      product.carYearFrom && 
      product.carYearTo &&
      parseInt(product.carYearFrom) <= parseInt(filterYear) &&
      parseInt(product.carYearTo) >= parseInt(filterYear)
    ) || (
      product.carYearFrom && 
      !product.carYearTo &&
      parseInt(product.carYearFrom) <= parseInt(filterYear)
    )
    // Added category and subcategory filter logic
    const matchesCategory = filterCategory === 'any' || product.category === filterCategory
    const matchesSubCategory = filterSubCategory === 'any' || product.subCategory === filterSubCategory
    
    return matchesSearch && matchesMake && matchesModel && matchesYear && matchesCategory && matchesSubCategory
  })

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        itemCode: product.itemCode,
        name: product.name,
        sellingPrice: product.sellingPrice.toString(),
        productType: product.productType, // Include product type when editing
        carMake: product.carMake,
        carModel: product.carModel,
        carYearFrom: product.carYearFrom,
        carYearTo: product.carYearTo,
        description: product.description,
        quantity: product.quantity.toString(),
        material: product.material,
        category: product.category,
        subCategory: product.subCategory,
        color: product.color
      })
      setUploadedImages(product.images)
    } else {
      setEditingProduct(null)
      setFormData({
        itemCode: '',
        name: '',
        sellingPrice: '',
        productType: 'car-parts', // Default to car parts for new products
        carMake: '',
        carModel: '',
        carYearFrom: '',
        carYearTo: '',
        description: '',
        quantity: '',
        material: '',
        category: '',
        subCategory: '',
        color: ''
      })
      setUploadedImages([])
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setFormData({
      itemCode: '',
      name: '',
      sellingPrice: '',
      productType: 'car-parts', // Reset product type on close
      carMake: '',
      carModel: '',
      carYearFrom: '',
      carYearTo: '',
      description: '',
      quantity: '',
      material: '',
      category: '',
      subCategory: '',
      color: ''
    })
    setUploadedImages([])
    setAvailableModels([])
    setAvailableSubCategories([]) // Clear subcategories on close
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setUploadedImages(prev => {
            const newImage: ProductImage = {
              id: Date.now().toString() + Math.random(),
              url: reader.result as string,
              isPrimary: prev.length === 0, // Only first image is primary
              isSecondary: false
            }
            return [...prev, newImage]
          })
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.id !== imageId)
      if (updated.length > 0 && !updated.some(img => img.isPrimary)) {
        updated[0].isPrimary = true
      }
      return updated
    })
  }

  const handleSetPrimary = (imageId: string) => {
    setUploadedImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    })))
  }

  const handleToggleSecondary = (imageId: string) => {
    setUploadedImages(prev => {
      const clickedImage = prev.find(img => img.id === imageId)
      const isCurrentlySecondary = clickedImage?.isSecondary
      
      return prev.map(img => ({
        ...img,
        isSecondary: img.id === imageId ? !isCurrentlySecondary : false
      }))
    })
  }

  const handleSaveProduct = () => {
    const isCarPart = formData.productType === 'car-parts'
    
    if (!formData.itemCode || !formData.name || !formData.sellingPrice || !formData.quantity || !formData.category) {
      alert('Please fill in all required fields')
      return
    }

    if (isCarPart && (!formData.carMake || !formData.carModel || !formData.carYearFrom)) {
      alert('Please fill in all required vehicle fields for car parts')
      return
    }

    if (uploadedImages.length === 0) {
      alert('Please upload at least one product image')
      return
    }

    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? {
              ...p,
              itemCode: formData.itemCode,
              name: formData.name,
              sellingPrice: parseFloat(formData.sellingPrice),
              productType: formData.productType as 'car-parts' | 'non-car-parts', // Include product type
              carMake: formData.carMake,
              carModel: formData.carModel,
              carYearFrom: formData.carYearFrom,
              carYearTo: formData.carYearTo,
              description: formData.description,
              quantity: parseInt(formData.quantity),
              material: formData.material,
              category: formData.category,
              subCategory: formData.subCategory,
              color: formData.color,
              images: uploadedImages
            }
          : p
      ))
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        itemCode: formData.itemCode,
        name: formData.name,
        sellingPrice: parseFloat(formData.sellingPrice),
        productType: formData.productType as 'car-parts' | 'non-car-parts', // Include product type
        carMake: formData.carMake,
        carModel: formData.carModel,
        carYearFrom: formData.carYearFrom,
        carYearTo: formData.carYearTo,
        description: formData.description,
        quantity: parseInt(formData.quantity),
        material: formData.material,
        category: formData.category,
        subCategory: formData.subCategory,
        color: formData.color,
        images: uploadedImages
      }
      setProducts([newProduct, ...products])
    }

    handleCloseDialog()
  }

  const handleDeleteProduct = () => {
    if (deleteProduct) {
      setProducts(products.filter(p => p.id !== deleteProduct.id))
      setDeleteProduct(null)
    }
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportResults(null)
    }
  }

  const handleImportProducts = () => {
    if (!importFile) {
      alert('Please select a file to import')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          alert('File must contain headers and at least one product')
          return
        }

        const headers = lines[0].split(',').map(h => h.trim())
        const errors: string[] = []
        let successCount = 0
        let failedCount = 0
        
        const importedProducts: Product[] = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          
          try {
            const productType = (values[headers.indexOf('productType')] || 'car-parts') as 'car-parts' | 'non-car-parts'
            
            const newProduct: Product = {
              id: Date.now().toString() + Math.random(),
              itemCode: values[headers.indexOf('itemCode')] || '',
              name: values[headers.indexOf('name')] || '',
              sellingPrice: parseFloat(values[headers.indexOf('sellingPrice')] || '0'),
              productType: productType,
              carMake: values[headers.indexOf('carMake')] || '',
              carModel: values[headers.indexOf('carModel')] || '',
              carYearFrom: values[headers.indexOf('carYearFrom')] || '',
              carYearTo: values[headers.indexOf('carYearTo')] || '',
              description: values[headers.indexOf('description')] || '',
              quantity: parseInt(values[headers.indexOf('quantity')] || '0'),
              material: values[headers.indexOf('material')] || '',
              category: values[headers.indexOf('category')] || '',
              subCategory: values[headers.indexOf('subCategory')] || '',
              color: values[headers.indexOf('color')] || '',
              images: [{ id: '1', url: '/placeholder.svg', isPrimary: true, isSecondary: false }]
            }

            if (!newProduct.itemCode || !newProduct.name || !newProduct.category) {
              throw new Error(`Line ${i + 1}: Missing required fields (itemCode, name, category)`)
            }

            if (productType === 'car-parts' && (!newProduct.carMake || !newProduct.carModel || !newProduct.carYearFrom)) {
              throw new Error(`Line ${i + 1}: Car parts require carMake, carModel, and carYearFrom`)
            }

            importedProducts.push(newProduct)
            successCount++
          } catch (error) {
            failedCount++
            errors.push(error instanceof Error ? error.message : `Line ${i + 1}: Unknown error`)
          }
        }

        setProducts([...importedProducts, ...products])
        setImportResults({ success: successCount, failed: failedCount, errors })
      } catch (error) {
        alert('Error parsing file. Please ensure it is a valid CSV format.')
      }
    }
    reader.readAsText(importFile)
  }

  const handleDownloadTemplate = () => {
    const headers = [
      'itemCode', 'name', 'sellingPrice', 'productType', 'carMake', 'carModel', 
      'carYearFrom', 'carYearTo', 'description', 'quantity', 'material', 
      'category', 'subCategory', 'color'
    ]
    const sampleData = [
      '600001', '3 SERIES HEADLIGHT TRIM', '20.000', 'car-parts', 'BMW', 'Series 3', 
      '2019', '2022', 'Premium headlight trim', '10', 'ABS PLASTIC', 
      'Exterior', 'Headlight Trim', 'Carbon Fiber'
    ]
    
    const csvContent = headers.join(',') + '\n' + sampleData.join(',')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleCloseImportDialog = () => {
    setIsImportDialogOpen(false)
    setImportFile(null)
    setImportResults(null)
    if (importFileInputRef.current) {
      importFileInputRef.current.value = ''
    }
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', className: 'bg-red-900/30 text-red-300' }
    if (quantity <= 5) return { label: 'Low Stock', className: 'bg-yellow-900/30 text-yellow-300' }
    return { label: 'In Stock', className: 'bg-green-900/30 text-green-300' }
  }

  const getPrimaryImage = (images: ProductImage[]) => {
    return images.find(img => img.isPrimary)?.url || images[0]?.url || '/placeholder.svg'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your automotive accessories inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsImportDialogOpen(true)}>
            <Download size={18} />
            Import
          </Button>
          <Button className="gap-2" onClick={() => handleOpenDialog()}>
            <Plus size={18} />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters - Row 1: Search and Vehicle Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 min-w-[250px] relative">
          <br/>
            <Search className="absolute text-muted-foreground mx-[11px] my-1.5 mt-2 mb-2" size={18} />
            <Input 
              placeholder="Search by name or item code..." 
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Car Make</Label>
            <Select value={filterMake} onValueChange={setFilterMake}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {vehicleMakes.map(make => (
                  <SelectItem key={make.id} value={make.name}>{make.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Car Model</Label>
            <Select value={filterModel} onValueChange={setFilterModel} disabled={filterMake === 'any'}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {availableFilterModels.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Production Year</Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {productionYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="space-y-1.5">
            <Button 
              variant="outline" 
              className="gap-2 bg-background border border-border hover:bg-accent"
              onClick={() => {}} // Placeholder click handler
            >
              <Filter size={16} />
              <span className="text-sm">
                Category: {filterCategory === 'any' ? 'All' : filterCategory}
              </span>
            </Button>
            <div className="hidden"> {/* Hidden select for actual filtering */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Button 
              variant="outline" 
              className="gap-2 bg-background border border-border hover:bg-accent disabled:opacity-50"
              onClick={() => {}} // Placeholder click handler
              disabled={filterCategory === 'any'}
            >
              <Filter size={16} />
              <span className="text-sm">
                Sub Category: {filterSubCategory === 'any' ? 'All' : filterSubCategory}
              </span>
            </Button>
            <div className="hidden"> {/* Hidden select for actual filtering */}
              <Select value={filterSubCategory} onValueChange={setFilterSubCategory} disabled={filterCategory === 'any'}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {availableSubCategories.map(subCat => (
                    <SelectItem key={subCat} value={subCat}>{subCat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products ({filteredProducts.length})</CardTitle>
          <CardDescription>Manage your product catalog</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchQuery || filterMake !== 'any' || filterModel !== 'any' || filterYear !== 'any' || filterCategory !== 'any' || filterSubCategory !== 'any'
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Get started by adding your first product to the inventory.'}
              </p>
              <div className="flex gap-3">
                {(searchQuery || filterMake !== 'any' || filterModel !== 'any' || filterYear !== 'any' || filterCategory !== 'any' || filterSubCategory !== 'any') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterMake('any')
                      setFilterModel('any')
                      setFilterYear('any')
                      setFilterCategory('any')
                      setFilterSubCategory('any')
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
                  <th className="text-left py-3 px-4 font-semibold">Item Code</th>
                  <th className="text-left py-3 px-4 font-semibold">Product Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Vehicle</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">Price (JOD)</th>
                  <th className="text-left py-3 px-4 font-semibold">Stock</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product.quantity)
                  return (
                    <tr key={product.id} className="border-b border-border hover:bg-accent/5 transition">
                      <td className="py-3 px-4">
                        <div className="relative">
                          <img src={getPrimaryImage(product.images) || "/placeholder.svg"} alt={product.name} className="w-12 h-12 object-cover rounded" />
                          {product.images.length > 1 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {product.images.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{product.itemCode}</td>
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.productType === 'car-parts' 
                            ? 'bg-blue-900/30 text-blue-300' 
                            : 'bg-purple-900/30 text-purple-300'
                        }`}>
                          {product.productType === 'car-parts' ? 'Car Parts' : 'Non-Car Parts'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {product.productType === 'car-parts' ? (
                          <div className="text-xs">
                            <div className="font-medium">{product.carMake} {product.carModel}</div>
                            <div className="text-muted-foreground">
                              {product.carYearFrom}{product.carYearTo ? ` - ${product.carYearTo}` : '+'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs">
                          <div>{product.category}</div>
                          <div className="text-muted-foreground">{product.subCategory}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{product.sellingPrice.toFixed(3)}</td>
                      <td className="py-3 px-4">{product.quantity}</td>
                      <td className="py-3 mx-[16] px-4 tracking-wider">
                        <span className={`py-1 rounded-full text-xs font-medium mx-4 px-4 ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product information' : 'Enter the details for the new product'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productType">Product Type *</Label>
              <Select 
                value={formData.productType} 
                onValueChange={(value: 'car-parts' | 'non-car-parts') => {
                  setFormData({
                    ...formData, 
                    productType: value,
                    carMake: value === 'non-car-parts' ? '' : formData.carMake,
                    carModel: value === 'non-car-parts' ? '' : formData.carModel,
                    carYearFrom: value === 'non-car-parts' ? '' : formData.carYearFrom,
                    carYearTo: value === 'non-car-parts' ? '' : formData.carYearTo,
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car-parts">Car Parts (requires vehicle specs)</SelectItem>
                  <SelectItem value="non-car-parts">Non-Car Parts (cleaning, accessories, etc.)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.productType === 'car-parts' 
                  ? 'This product requires vehicle make, model, and year specifications.' 
                  : 'This product does not require vehicle specifications (e.g., cleaning products, riding jackets, helmets).'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemCode">Item Code *</Label>
                <Input
                  id="itemCode"
                  placeholder="e.g., 600001"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({...formData, itemCode: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g., 3 SERIES HEADLIGHT TRIM"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            {formData.productType === 'car-parts' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carMake">Car Make *</Label>
                    <Select 
                      value={formData.carMake} 
                      onValueChange={(value) => {
                        setFormData({...formData, carMake: value, carModel: ''})
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select make" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleMakes.map(make => (
                          <SelectItem key={make.id} value={make.name}>{make.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="carModel">Car Model *</Label>
                    <Select 
                      value={formData.carModel} 
                      onValueChange={(value) => setFormData({...formData, carModel: value})}
                      disabled={!formData.carMake}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.carMake ? "Select model" : "Select make first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map(model => (
                          <SelectItem key={model.id} value={model.name}>{model.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carYearFrom">From Year *</Label>
                    <Input
                      id="carYearFrom"
                      type="number"
                      placeholder="e.g., 2019"
                      value={formData.carYearFrom}
                      onChange={(e) => setFormData({...formData, carYearFrom: e.target.value})}
                      min="1900"
                      max="2100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carYearTo">To Year</Label>
                    <Input
                      id="carYearTo"
                      type="number"
                      placeholder="e.g., 2022 (optional)"
                      value={formData.carYearTo}
                      onChange={(e) => setFormData({...formData, carYearTo: e.target.value})}
                      min="1900"
                      max="2100"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description & Features</Label>
              <Textarea
                id="description"
                placeholder="Enter product description and features..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  placeholder="e.g., ABS PLASTIC"
                  value={formData.material}
                  onChange={(e) => setFormData({...formData, material: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color/Design</Label>
                <Input
                  id="color"
                  placeholder="e.g., Carbon Fiber"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => {
                  setFormData({...formData, category: value, subCategory: ''}) // Reset subcategory when category changes
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subCategory">Sub Category</Label>
                <Select value={formData.subCategory} onValueChange={(value) => setFormData({...formData, subCategory: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {subCategories.map(subCat => (
                      <SelectItem key={subCat} value={subCat}>{subCat}</SelectItem>
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
                    <p className="text-sm text-muted-foreground mb-2">Upload multiple product images</p>
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
                    <p className="text-sm font-medium">Uploaded Images ({uploadedImages.length})</p>
                    <div className="grid grid-cols-4 gap-3">
                      {uploadedImages.map((image) => (
                        <div key={image.id} className="relative group border-2 rounded-lg overflow-hidden"
                             style={{ borderColor: image.isPrimary ? 'hsl(var(--primary))' : 'transparent' }}>

                          <img src={image.url || "/placeholder.svg"} alt="Product" className="w-full h-32 object-cover" />
                          
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
                              variant={image.isSecondary ? "default" : "secondary"}
                              size="sm"
                              onClick={() => handleToggleSecondary(image.id)}
                              title={image.isSecondary ? "Remove Secondary" : "Set as Secondary"}
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
                      Click on an image to set it as Primary or Secondary. The primary image appears first in product listings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? 'Update Product' : 'Add Product'}
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
              Upload a CSV file to bulk import products. Download the template to see the required format.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CSV File</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    {importFile ? importFile.name : 'Select a CSV file to import'}
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
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full">
                <Download size={16} className="mr-2" />
                Download CSV Template
              </Button>
            </div>

            {importResults && (
              <div className="space-y-2">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold mb-2">Import Results</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-400">✓ Successfully imported: {importResults.success} products</p>
                    {importResults.failed > 0 && (
                      <>
                        <p className="text-red-400">✗ Failed: {importResults.failed} products</p>
                        {importResults.errors.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="font-medium">Errors:</p>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {importResults.errors.map((error, idx) => (
                                <p key={idx} className="text-xs text-muted-foreground">• {error}</p>
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
                <li>Required fields: itemCode, name, category, quantity, sellingPrice</li>
                <li>For car parts: also require carMake, carModel, carYearFrom</li>
                <li>productType must be either "car-parts" or "non-car-parts"</li>
                <li>Images will be set to placeholder (add actual images after import)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseImportDialog}>
              {importResults ? 'Close' : 'Cancel'}
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
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
