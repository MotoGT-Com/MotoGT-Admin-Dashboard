"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, X, Search } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"

interface Discount {
  id: string
  title: string
  product: string
  discount: string
  discountType: 'percentage' | 'fixed'
  type: string
  status: 'Active' | 'Inactive'
  startDate: string
  endDate?: string
  applyTo: 'all' | 'products' | 'collection'
  selectedProducts?: string[]
  selectedCollection?: string
  minRequirement?: 'none' | 'amount' | 'quantity'
  minAmount?: string
  minQuantity?: string
}

const availableProducts = [
  { id: 'prod_1', name: 'High-Performance Air Filter', image: '/air-filter.png', price: 'JOD 120' },
  { id: 'prod_2', name: 'Lowering Springs Kit', image: '/car-springs.jpg', price: 'JOD 850' },
  { id: 'prod_3', name: 'Titanium Exhaust System', image: '/car-exhaust-system.png', price: 'JOD 2500' },
  { id: 'prod_4', name: 'Carbon Ceramic Brakes', image: '/car-brakes.png', price: 'JOD 3200' },
  { id: 'prod_5', name: 'LED Headlight Kit', image: '/led-headlights.png', price: 'JOD 450' },
  { id: 'prod_6', name: 'Performance Clutch Kit', image: '/car-clutch.jpg', price: 'JOD 680' },
]

const availableCollections = [
  { id: 'col_1', name: 'Performance Parts' },
  { id: 'col_2', name: 'Interior Accessories' },
  { id: 'col_3', name: 'Exterior Styling' },
  { id: 'col_4', name: 'Electronics' },
]

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([
    { id: '1', title: 'Summer Sale - Air Filters', product: 'High-Performance Air Filter', discount: '10%', discountType: 'percentage', type: 'Product', status: 'Active', startDate: '2025-01-01', applyTo: 'products', selectedProducts: ['prod_1'] },
    { id: '2', title: 'Spring Discount - Springs', product: 'Lowering Springs Kit', discount: '15%', discountType: 'percentage', type: 'Product', status: 'Active', startDate: '2025-01-01', applyTo: 'products', selectedProducts: ['prod_2'] },
    { id: '3', title: 'Exhaust Promo', product: 'Titanium Exhaust System', discount: '20%', discountType: 'percentage', type: 'Product', status: 'Active', startDate: '2025-01-01', applyTo: 'products', selectedProducts: ['prod_3'] },
    { id: '4', title: 'Black Friday - Brakes', product: 'Carbon Ceramic Brakes', discount: '25%', discountType: 'percentage', type: 'Product', status: 'Inactive', startDate: '2025-11-29', endDate: '2025-11-30', applyTo: 'products', selectedProducts: ['prod_4'] },
  ])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [discountToDelete, setDiscountToDelete] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    product: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    status: 'Active' as 'Active' | 'Inactive',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    applyTo: 'all' as 'all' | 'products' | 'collection',
    selectedProducts: [] as string[],
    selectedCollection: '',
    minRequirement: 'none' as 'none' | 'amount' | 'quantity',
    minAmount: '',
    minQuantity: ''
  })

  const [productSearch, setProductSearch] = useState('')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)

  const handleOpenDialog = () => {
    setEditingDiscount(null)
    setProductSearch('')
    setIsProductDropdownOpen(false)
    setFormData({
      title: '',
      product: '',
      discountType: 'percentage',
      discountValue: '',
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      applyTo: 'all',
      selectedProducts: [],
      selectedCollection: '',
      minRequirement: 'none',
      minAmount: '',
      minQuantity: ''
    })
    setIsDialogOpen(true)
  }

  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount)
    const discountValue = discount.discount.replace('%', '').replace('JOD ', '')
    setFormData({
      title: discount.title,
      product: discount.product,
      discountType: discount.discountType,
      discountValue: discountValue,
      status: discount.status,
      startDate: discount.startDate,
      endDate: discount.endDate || '',
      applyTo: discount.applyTo || 'all',
      selectedProducts: discount.selectedProducts || [],
      selectedCollection: discount.selectedCollection || '',
      minRequirement: discount.minRequirement || 'none',
      minAmount: discount.minAmount || '',
      minQuantity: discount.minQuantity || ''
    })
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingDiscount(null)
  }

  const toggleProductSelection = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]
    }))
  }

  const handleSaveDiscount = () => {
    if (!formData.title || !formData.discountValue || !formData.startDate) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.applyTo === 'products' && formData.selectedProducts.length === 0) {
      alert('Please select at least one product')
      return
    }

    if (formData.applyTo === 'collection' && !formData.selectedCollection) {
      alert('Please select a collection')
      return
    }

    if (formData.minRequirement === 'amount' && !formData.minAmount) {
      alert('Please enter a minimum purchase amount')
      return
    }

    if (formData.minRequirement === 'quantity' && !formData.minQuantity) {
      alert('Please enter a minimum quantity')
      return
    }

    const discountDisplay = formData.discountType === 'percentage' 
      ? `${formData.discountValue}%` 
      : `JOD ${formData.discountValue}`

    let productDisplay = 'All Products'
    if (formData.applyTo === 'products') {
      const selectedProductNames = availableProducts
        .filter(p => formData.selectedProducts.includes(p.id))
        .map(p => p.name)
      productDisplay = selectedProductNames.join(', ')
    } else if (formData.applyTo === 'collection') {
      const collection = availableCollections.find(c => c.id === formData.selectedCollection)
      productDisplay = collection ? collection.name : 'Collection'
    }

    if (editingDiscount) {
      setDiscounts(prev => prev.map(d => 
        d.id === editingDiscount.id 
          ? {
              ...d,
              title: formData.title,
              product: productDisplay,
              discount: discountDisplay,
              discountType: formData.discountType,
              status: formData.status,
              startDate: formData.startDate,
              endDate: formData.endDate || undefined,
              applyTo: formData.applyTo,
              selectedProducts: formData.selectedProducts,
              selectedCollection: formData.selectedCollection,
              minRequirement: formData.minRequirement,
              minAmount: formData.minAmount,
              minQuantity: formData.minQuantity
            }
          : d
      ))
    } else {
      const newDiscount: Discount = {
        id: Date.now().toString(),
        title: formData.title,
        product: productDisplay,
        discount: discountDisplay,
        discountType: formData.discountType,
        type: 'Product',
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        applyTo: formData.applyTo,
        selectedProducts: formData.selectedProducts,
        selectedCollection: formData.selectedCollection,
        minRequirement: formData.minRequirement,
        minAmount: formData.minAmount,
        minQuantity: formData.minQuantity
      }
      setDiscounts(prev => [newDiscount, ...prev])
    }

    handleCloseDialog()
  }

  const handleDeleteClick = (id: string) => {
    setDiscountToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (discountToDelete) {
      setDiscounts(prev => prev.filter(d => d.id !== discountToDelete))
      setDiscountToDelete(null)
      setIsDeleteDialogOpen(false)
      if (isDialogOpen) {
        handleCloseDialog()
      }
    }
  }

  const filteredProducts = availableProducts.filter(product => 
    formData.selectedProducts.includes(product.id) && (
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.id.toLowerCase().includes(productSearch.toLowerCase())
    )
  )

  const selectedProductDetails = availableProducts.filter(p => 
    formData.selectedProducts.includes(p.id)
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Product Discounts</h1>
          <p className="text-muted-foreground mt-1">Set discounts on individual products</p>
        </div>
        <Button className="gap-2" onClick={handleOpenDialog}>
          <Plus size={18} />
          New Discount
        </Button>
      </div>

      {/* Discounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Discounts</CardTitle>
          <CardDescription>Product-level discounts and markdowns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Title</th>
                  <th className="text-left py-3 px-4 font-semibold">Apply To</th>
                  <th className="text-left py-3 px-4 font-semibold">Product</th>
                  <th className="text-left py-3 px-4 font-semibold">Discount Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Value</th>
                  <th className="text-left py-3 px-4 font-semibold">Start Date</th>
                  <th className="text-left py-3 px-4 font-semibold">End Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr key={discount.id} className="border-b border-border hover:bg-card/50 transition">
                    <td className="py-3 px-4 font-medium">{discount.title}</td>
                    <td className="py-3 px-4 capitalize">{discount.applyTo === 'products' ? 'Specific Products' : discount.applyTo === 'collection' ? 'Collection' : 'All Products'}</td>
                    <td className="py-3 px-4">{discount.product}</td>
                    <td className="py-3 px-4 capitalize">{discount.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                    <td className="py-3 px-4 font-bold text-lg text-foreground">{discount.discount}</td>
                    <td className="py-3 px-4">{discount.startDate}</td>
                    <td className="py-3 px-4">{discount.endDate || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-3 py-1 rounded font-medium ${
                        discount.status === 'Active' 
                          ? 'bg-green-900/30 text-green-300' 
                          : 'bg-gray-900/30 text-gray-300'
                      }`}>
                        {discount.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" onClick={() => handleEditDiscount(discount)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDiscount ? 'Edit Discount' : 'Create New Discount'}</DialogTitle>
            <DialogDescription>
              {editingDiscount ? 'Update discount details below.' : 'Set up a new product discount.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Discount Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Summer Sale - Air Filters"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applyTo">Apply To *</Label>
              <Select value={formData.applyTo} onValueChange={(value: 'all' | 'products' | 'collection') => setFormData({...formData, applyTo: value, selectedProducts: [], selectedCollection: ''})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="products">Specific Products</SelectItem>
                  <SelectItem value="collection">Specific Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.applyTo === 'products' && (
              <div className="space-y-2">
                <Label>Select Products *</Label>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Search by product name or ID..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    className="pl-10"
                  />
                </div>

                {isProductDropdownOpen && (
                  <div className="border border-border rounded-lg bg-card shadow-lg max-h-[250px] overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <div 
                          key={product.id} 
                          className="flex items-center gap-3 p-3 hover:bg-accent/10 cursor-pointer border-b border-border last:border-b-0"
                          onClick={() => {
                            toggleProductSelection(product.id)
                            setProductSearch('')
                          }}
                        >
                          <Checkbox 
                            checked={formData.selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                          <img 
                            src={product.image || "/placeholder.svg"} 
                            alt={product.name} 
                            className="w-10 h-10 rounded object-cover border border-border"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                          </div>
                          <p className="text-sm font-medium">{product.price}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No products found
                      </div>
                    )}
                  </div>
                )}

                {selectedProductDetails.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-muted-foreground font-medium">
                      Selected Products ({selectedProductDetails.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProductDetails.map(product => (
                        <div 
                          key={product.id}
                          className="flex items-center gap-2 bg-accent/20 border border-border rounded-lg px-3 py-2"
                        >
                          <img 
                            src={product.image || "/placeholder.svg"} 
                            alt={product.name} 
                            className="w-6 h-6 rounded object-cover"
                          />
                          <span className="text-sm font-medium">{product.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-destructive/20"
                            onClick={() => toggleProductSelection(product.id)}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isProductDropdownOpen && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsProductDropdownOpen(false)}
                  >
                    Close
                  </Button>
                )}
              </div>
            )}

            {formData.applyTo === 'collection' && (
              <div className="space-y-2">
                <Label htmlFor="collection">Select Collection *</Label>
                <Select value={formData.selectedCollection} onValueChange={(value) => setFormData({...formData, selectedCollection: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCollections.map(collection => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type *</Label>
                <Select value={formData.discountType} onValueChange={(value: 'percentage' | 'fixed') => setFormData({...formData, discountType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (JOD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">Value *</Label>
                <Input
                  id="discountValue"
                  type="number"
                  placeholder={formData.discountType === 'percentage' ? '10' : '50'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                />
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <Label className="text-base font-semibold">Minimum purchase requirements</Label>
              
              <div className="space-y-3">
                {/* No minimum requirements */}
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="min-none"
                    name="minRequirement"
                    checked={formData.minRequirement === 'none'}
                    onChange={() => setFormData({...formData, minRequirement: 'none', minAmount: '', minQuantity: ''})}
                    className="w-4 h-4 accent-primary"
                  />
                  <Label htmlFor="min-none" className="font-normal cursor-pointer">
                    No minimum requirements
                  </Label>
                </div>

                {/* Minimum purchase amount */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="min-amount"
                      name="minRequirement"
                      checked={formData.minRequirement === 'amount'}
                      onChange={() => setFormData({...formData, minRequirement: 'amount', minQuantity: ''})}
                      className="w-4 h-4 accent-primary"
                    />
                    <Label htmlFor="min-amount" className="font-normal cursor-pointer">
                      Minimum purchase amount (JOD)
                    </Label>
                  </div>
                  
                  {formData.minRequirement === 'amount' && (
                    <div className="ml-7 space-y-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          JOD
                        </span>
                        <Input
                          type="number"
                          placeholder="0.000"
                          value={formData.minAmount}
                          onChange={(e) => setFormData({...formData, minAmount: e.target.value})}
                          className="pl-14"
                          step="0.001"
                        />
                      </div>
                      {formData.applyTo === 'collection' && (
                        <p className="text-xs text-muted-foreground">
                          Applies only to selected collections.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Minimum quantity of items */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="min-quantity"
                      name="minRequirement"
                      checked={formData.minRequirement === 'quantity'}
                      onChange={() => setFormData({...formData, minRequirement: 'quantity', minAmount: ''})}
                      className="w-4 h-4 accent-primary"
                    />
                    <Label htmlFor="min-quantity" className="font-normal cursor-pointer">
                      Minimum quantity of items
                    </Label>
                  </div>
                  
                  {formData.minRequirement === 'quantity' && (
                    <div className="ml-7">
                      <Input
                        type="number"
                        placeholder="e.g., 5"
                        value={formData.minQuantity}
                        onChange={(e) => setFormData({...formData, minQuantity: e.target.value})}
                        min="1"
                        step="1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            {editingDiscount && (
              <Button className="text-primary bg-card border border-primary" 
                variant="destructive" 
                onClick={() => handleDeleteClick(editingDiscount.id)}
              >
                Delete Discount
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSaveDiscount}>
                {editingDiscount ? 'Update' : 'Create'} Discount
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this discount? This action cannot be undone and the discount will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
