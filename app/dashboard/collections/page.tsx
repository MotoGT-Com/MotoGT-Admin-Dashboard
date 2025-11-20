"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Search, X, Filter } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"

interface Collection {
  id: string
  name: string
  description: string
  items: number
  status: 'Active' | 'Inactive'
  discount: string
  productIds: string[]
}

interface Product {
  id: string
  name: string
  image: string
  make: string
  model: string
  year: number
}

const availableProducts: Product[] = [
  { id: 'p1', name: 'Air Filter', image: '/air-filter.png', make: 'BMW', model: 'Series 3', year: 2020 },
  { id: 'p2', name: 'Car Springs', image: '/car-springs.jpg', make: 'BMW', model: 'Series 5', year: 2019 },
  { id: 'p3', name: 'Exhaust System', image: '/car-exhaust-system.png', make: 'Audi', model: 'A4', year: 2021 },
  { id: 'p4', name: 'Brake Pads', image: '/car-brakes.png', make: 'Mercedes', model: 'C-Class', year: 2020 },
  { id: 'p5', name: 'LED Headlights', image: '/led-headlights.png', make: 'BMW', model: 'X5', year: 2022 },
  { id: 'p6', name: 'Car Clutch', image: '/car-clutch.jpg', make: 'Audi', model: 'A6', year: 2018 },
]

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([
    { id: '1', name: 'Summer Sale', description: 'Hot deals for summer', items: 156, status: 'Active', discount: '20% OFF', productIds: ['p1', 'p2'] },
    { id: '2', name: 'New Arrivals', description: 'Latest products', items: 42, status: 'Active', discount: 'Featured', productIds: ['p3'] },
    { id: '3', name: 'Best Sellers', description: 'Most popular items', items: 78, status: 'Active', discount: 'Popular', productIds: ['p4', 'p5'] },
    { id: '4', name: 'Clearance', description: 'Final sale items', items: 23, status: 'Active', discount: '50% OFF', productIds: ['p6'] },
  ])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount: '',
    status: 'Active' as 'Active' | 'Inactive',
    productIds: [] as string[]
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const [filterMake, setFilterMake] = useState<string>('all')
  const [filterModel, setFilterModel] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false)
      }
    }

    if (isProductDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProductDropdownOpen])

  const handleOpenDialog = (collection?: Collection) => {
    if (collection) {
      setEditingCollection(collection)
      setFormData({
        name: collection.name,
        description: collection.description,
        discount: collection.discount,
        status: collection.status,
        productIds: collection.productIds
      })
    } else {
      setEditingCollection(null)
      setFormData({
        name: '',
        description: '',
        discount: '',
        status: 'Active',
        productIds: []
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCollection(null)
    setProductSearchQuery('')
    setIsProductDropdownOpen(false)
    setFilterMake('all')
    setFilterModel('all')
    setFilterYear('all')
  }

  const handleSaveCollection = () => {
    if (!formData.name || !formData.description || formData.productIds.length === 0) {
      alert('Please fill in all required fields and select at least one product')
      return
    }

    if (editingCollection) {
      setCollections(collections.map(c => 
        c.id === editingCollection.id 
          ? { ...c, ...formData, items: formData.productIds.length }
          : c
      ))
    } else {
      const newCollection: Collection = {
        id: Date.now().toString(),
        ...formData,
        items: formData.productIds.length
      }
      setCollections([newCollection, ...collections])
    }

    handleCloseDialog()
  }

  const handleDeleteCollection = () => {
    if (deleteId) {
      setCollections(collections.filter(c => c.id !== deleteId))
      setDeleteId(null)
    }
  }

  const handleToggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId]
    }))
  }

  const handleRemoveProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.filter(id => id !== productId)
    }))
  }

  const uniqueMakes = ['all', ...Array.from(new Set(availableProducts.map(p => p.make)))]
  const uniqueModels = ['all', ...Array.from(new Set(
    availableProducts
      .filter(p => filterMake === 'all' || p.make === filterMake)
      .map(p => p.model)
  ))]
  const uniqueYears = ['all', ...Array.from(new Set(availableProducts.map(p => p.year.toString()))).sort((a, b) => Number(b) - Number(a))]

  const filteredProducts = availableProducts.filter(product => {
    const matchesSelection = formData.productIds.includes(product.id)
    const matchesSearch = product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      product.id.toLowerCase().includes(productSearchQuery.toLowerCase())
    const matchesMake = filterMake === 'all' || product.make === filterMake
    const matchesModel = filterModel === 'all' || product.model === filterModel
    const matchesYear = filterYear === 'all' || product.year.toString() === filterYear

    return matchesSelection && matchesSearch && matchesMake && matchesModel && matchesYear
  })

  const unselectedProducts = availableProducts.filter(product => {
    const notSelected = !formData.productIds.includes(product.id)
    const matchesSearch = product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      product.id.toLowerCase().includes(productSearchQuery.toLowerCase())
    const matchesMake = filterMake === 'all' || product.make === filterMake
    const matchesModel = filterModel === 'all' || product.model === filterModel
    const matchesYear = filterYear === 'all' || product.year.toString() === filterYear

    return notSelected && matchesSearch && matchesMake && matchesModel && matchesYear
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Collections</h1>
          <p className="text-muted-foreground mt-1">Manage product collections and promotions</p>
        </div>
        <Button className="gap-2" onClick={() => handleOpenDialog()}>
          <Plus size={18} />
          New Collection
        </Button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {collections.map((collection) => (
          <Card key={collection.id} className="hover:border-accent/50 transition">
            <CardHeader>
              <CardTitle className="text-lg">{collection.name}</CardTitle>
              <CardDescription>{collection.items} items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-400">{collection.discount}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  collection.status === 'Active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {collection.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/collections/${collection.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">View</Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleOpenDialog(collection)}
                >
                  <Pencil size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(collection.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCollection ? 'Edit Collection' : 'Create New Collection'}</DialogTitle>
            <DialogDescription>
              {editingCollection ? 'Update collection details and products' : 'Add a new product collection with selected items'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Summer Sale"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the collection"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount/Label (optional)</Label>
              <Input
                id="discount"
                placeholder="e.g., 20% OFF, Featured, Popular"
                value={formData.discount}
                onChange={(e) => setFormData({...formData, discount: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value: 'Active' | 'Inactive') => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Products *</Label>
              
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Select value={filterMake} onValueChange={setFilterMake}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Makes</SelectItem>
                    {uniqueMakes.filter(m => m !== 'all').map(make => (
                      <SelectItem key={make} value={make}>{make}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterModel} onValueChange={setFilterModel}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {uniqueModels.filter(m => m !== 'all').map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {uniqueYears.filter(y => y !== 'all').map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Search products by name or ID..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    className="pl-10"
                  />
                </div>

                {isProductDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 border border-border rounded-lg bg-card shadow-lg max-h-[200px] overflow-y-auto">
                    {unselectedProducts.length > 0 ? (
                      unselectedProducts.map(product => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer transition"
                          onClick={() => {
                            handleToggleProduct(product.id)
                            setProductSearchQuery('')
                          }}
                        >
                          <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-10 h-10 object-cover rounded" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.make} {product.model} ({product.year})</p>
                          </div>
                          <Plus size={16} className="text-muted-foreground" />
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {productSearchQuery || filterMake !== 'all' || filterModel !== 'all' || filterYear !== 'all' 
                          ? 'No products found' 
                          : 'All products selected'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {formData.productIds.length > 0 && (
                <div className="border border-border rounded-lg p-3 space-y-2 mt-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Selected Products ({formData.productIds.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.productIds.map(productId => {
                      const product = availableProducts.find(p => p.id === productId)
                      return product ? (
                        <div
                          key={productId}
                          className="flex items-center gap-2 bg-accent/50 rounded px-2 py-1"
                        >
                          <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-6 h-6 object-cover rounded" />
                          <span className="text-sm">{product.name}</span>
                          <button
                            onClick={() => handleRemoveProduct(productId)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveCollection}>
              {editingCollection ? 'Update Collection' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this collection? This action cannot be undone and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCollection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
