"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react'
import { AddCategoryDialog } from "@/components/add-category-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CategoriesPage() {
  const [categories, setCategories] = useState([
    {
      id: "1",
      name: "Interior",
      image: null,
      subcategories: [
        { id: "1-1", name: "Trunk Mat", image: null },
        { id: "1-2", name: "Floor Mat", image: null },
        { id: "1-3", name: "Interior Trim Accessories", image: null },
        { id: "1-4", name: "General Accessories", image: null }
      ],
      expanded: true
    },
    {
      id: "2",
      name: "Exterior",
      image: null,
      subcategories: [
        { id: "2-1", name: "Spoilers", image: null },
        { id: "2-2", name: "Mirrors", image: null },
        { id: "2-3", name: "Full Bodykits", image: null },
        { id: "2-4", name: "Rims", image: null },
        { id: "2-5", name: "General Accessories", image: null },
        { id: "2-6", name: "Roof Racks", image: null },
        { id: "2-7", name: "Front Bumper Splitters", image: null },
        { id: "2-8", name: "Headlight Trim", image: null },
        { id: "2-9", name: "Vents", image: null },
        { id: "2-10", name: "Window Visors", image: null },
        { id: "2-11", name: "Taillight Trim", image: null }
      ],
      expanded: true
    },
    {
      id: "3",
      name: "Performance",
      image: null,
      subcategories: [
        { id: "3-1", name: "Engine Upgrades", image: null },
        { id: "3-2", name: "Suspension", image: null },
        { id: "3-3", name: "Brakes", image: null }
      ],
      expanded: false
    },
    {
      id: "4",
      name: "Wheels & Tires",
      image: null,
      subcategories: [
        { id: "4-1", name: "Alloy Wheels", image: null },
        { id: "4-2", name: "Tires", image: null }
      ],
      expanded: false
    }
  ])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingParentId, setEditingParentId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleAddCategory = (category) => {
    if (editingCategory && editingParentId) {
      setCategories(categories.map(parent =>
        parent.id === editingParentId
          ? {
              ...parent,
              subcategories: parent.subcategories.map(sub =>
                sub.id === editingCategory.id
                  ? { ...sub, name: category.name, image: category.image || sub.image }
                  : sub
              )
            }
          : parent
      ))
    } else if (editingCategory) {
      setCategories(categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, name: category.name, image: category.image || cat.image }
          : cat
      ))
    } else if (category.type === "parent") {
      const newParent = {
        id: Date.now().toString(),
        name: category.name,
        image: category.image,
        subcategories: category.subcategories || [],
        expanded: true
      }
      setCategories([...categories, newParent])
    } else if (category.type === "subcategory") {
      setCategories(categories.map(parent => {
        if (parent.id === category.parentId) {
          return {
            ...parent,
            subcategories: [...parent.subcategories, {
              id: Date.now().toString(),
              name: category.name,
              image: category.image || null
            }]
          }
        }
        return parent
      }))
    }
    setEditingCategory(null)
    setEditingParentId(null)
  }

  const toggleCategoryExpand = (id) => {
    setCategories(categories.map(cat =>
      cat.id === id ? { ...cat, expanded: !cat.expanded } : cat
    ))
  }

  const deleteCategory = (id) => {
    setDeleteConfirm({ type: "category", id })
  }

  const deleteSubcategory = (parentId, subcategoryId) => {
    setDeleteConfirm({ type: "subcategory", id: subcategoryId, parentId })
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const handleEditSubcategory = (parentId, subcategory) => {
    setEditingParentId(parentId)
    setEditingCategory(subcategory)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingCategory(null)
    setEditingParentId(null)
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === "category") {
      setCategories(categories.filter(cat => cat.id !== deleteConfirm.id))
    } else if (deleteConfirm.type === "subcategory") {
      setCategories(categories.map(cat =>
        cat.id === deleteConfirm.parentId
          ? { ...cat, subcategories: cat.subcategories.filter(sub => sub.id !== deleteConfirm.id) }
          : cat
      ))
    }
    setDeleteConfirm(null)
  }

  const totalCategories = categories.length
  const totalSubcategories = categories.reduce((sum, cat) => sum + cat.subcategories.length, 0)
  
  const bestSellerCategory = "Exterior" // Mock data
  const bestSellerSubcategory = "Rims" // Mock data
  const bestSellerCategorySales = 1245 // Mock data
  const bestSellerSubcategorySales = 892 // Mock data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your product categories and subcategories</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={18} />
          Add Category
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Parent Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subcategories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubcategories}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Seller Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg font-bold text-primary">{bestSellerCategory}</div>
              <div className="text-xs text-muted-foreground">{bestSellerCategorySales} sales</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Seller Subcategory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg font-bold text-primary">{bestSellerSubcategory}</div>
              <div className="text-xs text-muted-foreground">{bestSellerSubcategorySales} sales</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {categories.map((category) => (
              <div key={category.id}>
                {/* Parent Category */}
                <div className="flex items-center gap-3 p-3 hover:bg-accent rounded-md group">
                  <button
                    onClick={() => toggleCategoryExpand(category.id)}
                    className="h-6 w-6 flex items-center justify-center hover:bg-muted rounded"
                  >
                    {category.expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  {category.image && (
                    <img src={category.image || "/placeholder.svg"} alt={category.name} className="h-8 w-8 object-cover rounded" />
                  )}
                  <span className="font-semibold text-foreground flex-1">{category.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:text-destructive"
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Subcategories */}
                {category.expanded && (
                  <div className="space-y-1 ml-6">
                    {category.subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="flex items-center gap-3 p-3 hover:bg-primary/10 rounded-md group">
                        <div className="w-6" />
                        {subcategory.image && (
                          <img src={subcategory.image || "/placeholder.svg"} alt={subcategory.name} className="h-7 w-7 object-cover rounded" />
                        )}
                        <span className="text-foreground text-sm flex-1">{subcategory.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEditSubcategory(category.id, subcategory)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:text-destructive"
                            onClick={() => deleteSubcategory(category.id, subcategory.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <AddCategoryDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onAddCategory={handleAddCategory}
        parentCategories={categories}
        editingCategory={editingCategory}
        editingParentId={editingParentId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.type === "category" ? "Category" : "Subcategory"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteConfirm?.type === "category" ? "category" : "subcategory"}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
