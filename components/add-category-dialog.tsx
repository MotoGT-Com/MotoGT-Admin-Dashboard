"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, X } from 'lucide-react'

export function AddCategoryDialog({ 
  open, 
  onOpenChange, 
  onAddCategory, 
  parentCategories = [],
  editingCategory = null,
  editingParentId = null
}) {
  const [activeTab, setActiveTab] = useState("parent")
  const [parentName, setParentName] = useState("")
  const [parentImage, setParentImage] = useState(null)
  const [parentImagePreview, setParentImagePreview] = useState("")
  const [subcategories, setSubcategories] = useState([])
  const [newSubcategoryInput, setNewSubcategoryInput] = useState("")
  const [newSubcategoryImage, setNewSubcategoryImage] = useState(null)
  const [newSubcategoryImagePreview, setNewSubcategoryImagePreview] = useState("")
  const [selectedParentId, setSelectedParentId] = useState("")

  const isEditing = editingCategory && editingParentId
  const isEditingParent = editingCategory && !editingParentId

  useEffect(() => {
    if (open && editingCategory) {
      if (isEditing) {
        // Editing a subcategory
        setActiveTab("subcategory")
        setSelectedParentId(editingParentId)
        setNewSubcategoryInput(editingCategory.name)
        if (editingCategory.image) {
          setNewSubcategoryImagePreview(editingCategory.image)
        }
      } else if (isEditingParent) {
        // Editing a parent category
        setActiveTab("parent")
        setParentName(editingCategory.name)
        if (editingCategory.image) {
          setParentImagePreview(editingCategory.image)
        }
      }
    }
  }, [open, editingCategory, editingParentId, isEditing, isEditingParent])

  const handleParentImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setParentImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setParentImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubcategoryImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewSubcategoryImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewSubcategoryImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddSubcategory = () => {
    if (newSubcategoryInput.trim()) {
      setSubcategories([...subcategories, { 
        id: Date.now(), 
        name: newSubcategoryInput,
        image: newSubcategoryImagePreview || null
      }])
      setNewSubcategoryInput("")
      setNewSubcategoryImage(null)
      setNewSubcategoryImagePreview("")
    }
  }

  const handleRemoveSubcategory = (id) => {
    setSubcategories(subcategories.filter(sub => sub.id !== id))
  }

  const handleCreateParentCategory = () => {
    if (parentName.trim()) {
      onAddCategory({
        type: "parent",
        name: parentName,
        image: parentImagePreview || null,
        subcategories: subcategories.map(sub => ({ 
          name: sub.name,
          image: sub.image || null
        }))
      })
      resetForm()
      onOpenChange(false)
    }
  }

  const handleAddSubcategoryToExisting = () => {
    if (selectedParentId && newSubcategoryInput.trim()) {
      onAddCategory({
        type: "subcategory",
        parentId: selectedParentId,
        name: newSubcategoryInput,
        image: newSubcategoryImagePreview || null
      })
      resetForm()
      onOpenChange(false)
    }
  }

  const resetForm = () => {
    setParentName("")
    setParentImage(null)
    setParentImagePreview("")
    setSubcategories([])
    setNewSubcategoryInput("")
    setNewSubcategoryImage(null)
    setNewSubcategoryImagePreview("")
    setSelectedParentId("")
    setActiveTab("parent")
  }

  const dialogTitle = isEditing ? "Edit Subcategory" : isEditingParent ? "Edit Category" : "Add Category"
  const dialogDescription = isEditing 
    ? "Update the subcategory details" 
    : isEditingParent
    ? "Update the parent category"
    : "Create a new parent category or add a subcategory to an existing parent"

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        resetForm()
      }
      onOpenChange(newOpen)
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parent">Create Parent</TabsTrigger>
            <TabsTrigger value="subcategory">Add Subcategory</TabsTrigger>
          </TabsList>

          {/* Create Parent Category Tab */}
          <TabsContent value="parent" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="parent-name">Parent Category Name</Label>
              <Input
                id="parent-name"
                placeholder="e.g., Interior, Exterior, Performance"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-image">Category Image (Optional)</Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    id="parent-image"
                    type="file"
                    accept="image/*"
                    onChange={handleParentImageSelect}
                  />
                </div>
                {parentImagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setParentImage(null)
                      setParentImagePreview("")
                    }}
                    className="h-10 w-10 border rounded-md flex items-center justify-center hover:bg-destructive/10 text-destructive"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              {parentImagePreview && (
                <div className="mt-2">
                  <img src={parentImagePreview || "/placeholder.svg"} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
                </div>
              )}
            </div>

            {/* Subcategories List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subcategories (Optional)</CardTitle>
                <CardDescription>Add subcategories to organize this parent category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Add Subcategory Input */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter subcategory name"
                      value={newSubcategoryInput}
                      onChange={(e) => setNewSubcategoryInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddSubcategory()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSubcategory}
                      className="gap-1"
                    >
                      <Plus size={16} />
                      Add
                    </Button>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleSubcategoryImageSelect}
                        placeholder="Select image (optional)"
                      />
                    </div>
                    {newSubcategoryImagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewSubcategoryImage(null)
                          setNewSubcategoryImagePreview("")
                        }}
                        className="h-10 w-10 border rounded-md flex items-center justify-center hover:bg-destructive/10 text-destructive"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {newSubcategoryImagePreview && (
                    <img src={newSubcategoryImagePreview || "/placeholder.svg"} alt="Preview" className="h-16 w-16 object-cover rounded-md border" />
                  )}
                </div>

                {/* Display Added Subcategories */}
                {subcategories.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    {subcategories.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between bg-accent/50 p-2 rounded-md gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          {sub.image && (
                            <img src={sub.image || "/placeholder.svg"} alt={sub.name} className="h-8 w-8 object-cover rounded" />
                          )}
                          <span className="text-sm">{sub.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:text-destructive"
                          onClick={() => handleRemoveSubcategory(sub.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add to Existing Parent Tab */}
          <TabsContent value="subcategory" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Parent Category</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {parentCategories.length > 0 ? (
                  parentCategories.map((parent) => (
                    <div
                      key={parent.id}
                      onClick={() => setSelectedParentId(parent.id)}
                      className={`p-2 rounded-md cursor-pointer transition flex items-center gap-2 ${
                        selectedParentId === parent.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent/50 hover:bg-accent"
                      }`}
                    >
                      {parent.image && (
                        <img src={parent.image || "/placeholder.svg"} alt={parent.name} className="h-6 w-6 object-cover rounded" />
                      )}
                      <span className="text-sm font-medium">{parent.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No parent categories available. Create a parent category first.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory-name">Subcategory Name</Label>
              <Input
                id="subcategory-name"
                placeholder="e.g., Spoilers, Mirrors, Engine Upgrades"
                value={newSubcategoryInput}
                onChange={(e) => setNewSubcategoryInput(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory-image">Image (Optional)</Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    id="subcategory-image"
                    type="file"
                    accept="image/*"
                    onChange={handleSubcategoryImageSelect}
                  />
                </div>
                {newSubcategoryImagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewSubcategoryImage(null)
                      setNewSubcategoryImagePreview("")
                    }}
                    className="h-10 w-10 border rounded-md flex items-center justify-center hover:bg-destructive/10 text-destructive"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              {newSubcategoryImagePreview && (
                <img src={newSubcategoryImagePreview || "/placeholder.svg"} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={activeTab === "parent" ? handleCreateParentCategory : handleAddSubcategoryToExisting}
            disabled={activeTab === "parent" ? !parentName.trim() : !selectedParentId || !newSubcategoryInput.trim()}
          >
            {isEditing || isEditingParent ? "Update" : (activeTab === "parent" ? "Create Category" : "Add Subcategory")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
