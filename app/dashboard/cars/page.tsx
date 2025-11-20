"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Edit2, Trash2, Upload, X, ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useRef } from "react"

interface Model {
  id: string
  name: string
  description: string
  yearFrom: string
  yearTo: string
  image: string
}

interface Make {
  id: string
  name: string
  models: Model[]
}

const initialMakes: Make[] = [
  {
    id: '1',
    name: 'BMW',
    models: [
      {
        id: '1-1',
        name: 'M3',
        description: 'High-performance sports sedan with powerful engine and precision handling',
        yearFrom: '2014',
        yearTo: '2024',
        image: '/bmw-m3.jpg'
      },
      {
        id: '1-2',
        name: 'Series 3',
        description: 'Luxury compact executive car with advanced technology',
        yearFrom: '2012',
        yearTo: '2024',
        image: '/bmw-series-3.jpg'
      }
    ]
  },
  {
    id: '2',
    name: 'Porsche',
    models: [
      {
        id: '2-1',
        name: '911 Turbo',
        description: 'Iconic sports car combining luxury and track-ready performance',
        yearFrom: '2016',
        yearTo: '2024',
        image: '/porsche-911-turbo.jpg'
      }
    ]
  },
  {
    id: '3',
    name: 'Audi',
    models: [
      {
        id: '3-1',
        name: 'RS6 Avant',
        description: 'Performance wagon with twin-turbo V8 and Quattro all-wheel drive',
        yearFrom: '2013',
        yearTo: '2024',
        image: '/audi-rs6.jpg'
      }
    ]
  },
]

type DialogMode = 'make' | 'model' | null

export default function CarsPage() {
  const [makes, setMakes] = useState<Make[]>(initialMakes)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedMakes, setExpandedMakes] = useState<Set<string>>(new Set(['1']))
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [editingMake, setEditingMake] = useState<Make | null>(null)
  const [editingModel, setEditingModel] = useState<{ makeId: string; model: Model } | null>(null)
  const [selectedMakeForModel, setSelectedMakeForModel] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'make' | 'model'; makeId: string; modelId?: string } | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [makeFormData, setMakeFormData] = useState({ name: '' })
  const [modelFormData, setModelFormData] = useState({
    name: '',
    description: '',
    yearFrom: '',
    yearTo: '',
    image: ''
  })

  const toggleMake = (makeId: string) => {
    const newExpanded = new Set(expandedMakes)
    if (newExpanded.has(makeId)) {
      newExpanded.delete(makeId)
    } else {
      newExpanded.add(makeId)
    }
    setExpandedMakes(newExpanded)
  }

  const handleOpenMakeDialog = () => {
    setDialogMode('make')
    setEditingMake(null)
    setMakeFormData({ name: '' })
  }

  const handleOpenModelDialog = (makeId?: string) => {
    setDialogMode('model')
    setEditingModel(null)
    setSelectedMakeForModel(makeId || '')
    setModelFormData({ name: '', description: '', yearFrom: '', yearTo: '', image: '' })
    setImagePreview('')
  }

  const handleCloseDialog = () => {
    setDialogMode(null)
    setEditingMake(null)
    setEditingModel(null)
    setMakeFormData({ name: '' })
    setModelFormData({ name: '', description: '', yearFrom: '', yearTo: '', image: '' })
    setImagePreview('')
  }

  const handleEditMake = (make: Make) => {
    setDialogMode('make')
    setEditingMake(make)
    setMakeFormData({ name: make.name })
  }

  const handleEditModel = (makeId: string, model: Model) => {
    setDialogMode('model')
    setEditingModel({ makeId, model })
    setSelectedMakeForModel(makeId)
    setModelFormData({
      name: model.name,
      description: model.description,
      yearFrom: model.yearFrom,
      yearTo: model.yearTo,
      image: model.image
    })
    setImagePreview(model.image)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreview(result)
        setModelFormData({ ...modelFormData, image: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview('')
    setModelFormData({ ...modelFormData, image: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmitMake = () => {
    if (!makeFormData.name) {
      alert('Please enter a make name')
      return
    }

    if (editingMake) {
      setMakes(makes.map(make => 
        make.id === editingMake.id 
          ? { ...make, name: makeFormData.name }
          : make
      ))
    } else {
      const newMake: Make = {
        id: Date.now().toString(),
        name: makeFormData.name,
        models: []
      }
      setMakes([...makes, newMake])
    }

    handleCloseDialog()
  }

  const handleSubmitModel = () => {
    if (!modelFormData.name || !modelFormData.description || !modelFormData.yearFrom || !modelFormData.yearTo || !modelFormData.image || !selectedMakeForModel) {
      alert('Please fill in all required fields including an image')
      return
    }

    if (editingModel) {
      setMakes(makes.map(make => 
        make.id === editingModel.makeId
          ? {
              ...make,
              models: make.models.map(model =>
                model.id === editingModel.model.id
                  ? { ...model, ...modelFormData }
                  : model
              )
            }
          : make
      ))
    } else {
      setMakes(makes.map(make =>
        make.id === selectedMakeForModel
          ? {
              ...make,
              models: [
                ...make.models,
                {
                  id: `${make.id}-${Date.now()}`,
                  ...modelFormData
                }
              ]
            }
          : make
      ))
    }

    handleCloseDialog()
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    if (deleteTarget.type === 'make') {
      setMakes(makes.filter(make => make.id !== deleteTarget.makeId))
    } else if (deleteTarget.modelId) {
      setMakes(makes.map(make =>
        make.id === deleteTarget.makeId
          ? {
              ...make,
              models: make.models.filter(model => model.id !== deleteTarget.modelId)
            }
          : make
      ))
    }

    setDeleteTarget(null)
  }

  const filteredMakes = makes.map(make => ({
    ...make,
    models: make.models.filter(model =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      make.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(make => 
    make.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    make.models.length > 0
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Database</h1>
          <p className="text-muted-foreground mt-1">Manage vehicle makes and models</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleOpenMakeDialog}>
            <Plus size={18} />
            Add Make
          </Button>
          <Button className="gap-2" onClick={() => handleOpenModelDialog()}>
            <Plus size={18} />
            Add Model
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search by make or model..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Makes & Models</CardTitle>
          <CardDescription>Organized hierarchy of supported vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredMakes.map((make) => (
              <div key={make.id} className="border border-border rounded-lg overflow-hidden">
                {/* Make Header */}
                <div className="flex items-center justify-between p-4 bg-accent/5 hover:bg-accent/10 transition cursor-pointer">
                  <div className="flex items-center gap-3 flex-1" onClick={() => toggleMake(make.id)}>
                    {expandedMakes.has(make.id) ? (
                      <ChevronDown size={20} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={20} className="text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{make.name}</h3>
                      <p className="text-sm text-muted-foreground">{make.models.length} model{make.models.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenModelDialog(make.id)
                      }}
                    >
                      <Plus size={14} className="mr-1" />
                      Add Model
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditMake(make)
                      }}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget({ type: 'make', makeId: make.id })
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Models List */}
                {expandedMakes.has(make.id) && make.models.length > 0 && (
                  <div className="border-t border-border">
                    {make.models.map((model) => (
                      <div key={model.id} className="flex items-center gap-4 p-4 border-b border-border last:border-b-0 hover:bg-accent/5 transition">
                        <img 
                          src={model.image || "/placeholder.svg"} 
                          alt={model.name} 
                          className="w-24 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{model.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">{model.description}</p>
                          <p className="text-sm font-semibold mt-1">{model.yearFrom} - {model.yearTo}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditModel(make.id, model)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget({ type: 'model', makeId: make.id, modelId: model.id })}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {expandedMakes.has(make.id) && make.models.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground border-t border-border">
                    No models added yet. Click "Add Model" to add one.
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredMakes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No vehicles found matching your search.' : 'No makes added yet.'}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogMode === 'make'} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMake ? 'Edit Make' : 'Add New Make'}</DialogTitle>
            <DialogDescription>
              {editingMake ? 'Update the vehicle make name' : 'Add a new vehicle manufacturer'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="makeName">Make Name *</Label>
              <Input
                id="makeName"
                placeholder="e.g., BMW, Toyota, Ford"
                value={makeFormData.name}
                onChange={(e) => setMakeFormData({ name: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmitMake}>
              {editingMake ? 'Update Make' : 'Add Make'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === 'model'} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingModel ? 'Edit Model' : 'Add New Model'}</DialogTitle>
            <DialogDescription>
              {editingModel ? 'Update model information' : 'Add a new vehicle model'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingModel && (
              <div className="space-y-2">
                <Label htmlFor="makeSelect">Select Make *</Label>
                <Select value={selectedMakeForModel} onValueChange={setSelectedMakeForModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a make..." />
                  </SelectTrigger>
                  <SelectContent>
                    {makes.map((make) => (
                      <SelectItem key={make.id} value={make.id}>
                        {make.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="modelName">Model Name *</Label>
              <Input
                id="modelName"
                placeholder="e.g., Series 3, Camry, F-150"
                value={modelFormData.name}
                onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the vehicle and its key features..."
                rows={3}
                value={modelFormData.description}
                onChange={(e) => setModelFormData({ ...modelFormData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearFrom">From Year *</Label>
                <Input
                  id="yearFrom"
                  type="number"
                  placeholder="e.g., 2014"
                  value={modelFormData.yearFrom}
                  onChange={(e) => setModelFormData({ ...modelFormData, yearFrom: e.target.value })}
                  min="1900"
                  max="2100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearTo">To Year *</Label>
                <Input
                  id="yearTo"
                  type="number"
                  placeholder="e.g., 2024"
                  value={modelFormData.yearTo}
                  onChange={(e) => setModelFormData({ ...modelFormData, yearTo: e.target.value })}
                  min="1900"
                  max="2100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Image *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-40 object-cover rounded" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                      onClick={handleRemoveImage}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload Image
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmitModel}>
              {editingModel ? 'Update Model' : 'Add Model'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === 'make' ? 'Make' : 'Model'}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'make' 
                ? 'Are you sure you want to delete this make and all its models? This action cannot be undone.'
                : 'Are you sure you want to delete this model? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
