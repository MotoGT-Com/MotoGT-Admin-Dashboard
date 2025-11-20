"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface GarageCar {
  id: string
  make: string
  model: string
  year: string
  image: string
}

const availableMakes = [
  {
    id: '1',
    name: 'BMW',
    models: ['M3', 'Series 3', 'X5', '430i']
  },
  {
    id: '2',
    name: 'Porsche',
    models: ['911 Turbo', 'Cayenne', 'Panamera']
  },
  {
    id: '3',
    name: 'Audi',
    models: ['RS6 Avant', 'Q7', 'A4']
  },
  {
    id: '4',
    name: 'Mercedes-Benz',
    models: ['C-Class', 'E-Class', 'GLE']
  }
]

const initialGarageCars: GarageCar[] = [
  {
    id: '1',
    make: 'BMW',
    model: '430i',
    year: '2024',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-bBhoFuiBRacgJQvIqGuClnVIRRJFQE.png'
  },
  {
    id: '2',
    make: 'Porsche',
    model: '911 Turbo',
    year: '2023',
    image: '/porsche-911-turbo.jpg'
  },
  {
    id: '3',
    make: 'Audi',
    model: 'RS6 Avant',
    year: '2022',
    image: '/audi-rs6.jpg'
  }
]

export default function GaragePage() {
  const [garageCars, setGarageCars] = useState<GarageCar[]>(initialGarageCars)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [selectedMake, setSelectedMake] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  const currentCar = garageCars[currentIndex]

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? garageCars.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === garageCars.length - 1 ? 0 : prev + 1))
  }

  const handleAddCar = () => {
    if (!selectedMake || !selectedModel || !selectedYear) {
      alert('Please fill in all fields')
      return
    }

    const newCar: GarageCar = {
      id: Date.now().toString(),
      make: selectedMake,
      model: selectedModel,
      year: selectedYear,
      image: '/classic-red-convertible.png'
    }

    setGarageCars([...garageCars, newCar])
    setIsAddDialogOpen(false)
    setSelectedMake('')
    setSelectedModel('')
    setSelectedYear('')
  }

  const handleRemoveCar = () => {
    const newCars = garageCars.filter((_, index) => index !== currentIndex)
    setGarageCars(newCars)
    setCurrentIndex(0)
    setIsRemoveDialogOpen(false)
  }

  const handleChooseCar = () => {
    // This would navigate to the main shop with this car pre-selected
    alert(`Shopping for ${currentCar.make} ${currentCar.model} ${currentCar.year}`)
  }

  const years = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString())

  const availableModels = availableMakes.find(make => make.name === selectedMake)?.models || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">My Garage</h1>
        <Button 
          className="bg-primary text-white hover:bg-primary/90 px-8 py-6 text-lg"
          onClick={() => setIsAddDialogOpen(true)}
        >
          ADD NEW CAR
        </Button>
      </div>

      {garageCars.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold mb-4">Your garage is empty</h2>
          <p className="text-muted-foreground mb-6">Add your first car to get started</p>
          <Button 
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus size={20} className="mr-2" />
            Add Your First Car
          </Button>
        </div>
      ) : (
        <>
          {/* Car Display Section */}
          <div className="relative bg-card rounded-lg overflow-hidden border border-border">
            {/* Car Title */}
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold">
                {currentCar.make} {currentCar.model} - {currentCar.year}
              </h2>
            </div>

            {/* Main Car Image with Brand Background */}
            <div className="relative h-[500px] flex items-center justify-center bg-gradient-to-b from-card to-accent/10">
              {/* Large Brand Text Background */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-10">
                <h1 className="text-[300px] font-black leading-none select-none">
                  {currentCar.make}
                </h1>
              </div>

              {/* Car Image */}
              <img 
                src={currentCar.image || "/placeholder.svg"} 
                alt={`${currentCar.make} ${currentCar.model}`}
                className="relative z-10 max-h-[400px] w-auto object-contain drop-shadow-2xl"
              />

              {/* Navigation Arrows */}
              {garageCars.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-background border-2 border-border rounded-full flex items-center justify-center hover:bg-accent transition z-20"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-background border-2 border-border rounded-full flex items-center justify-center hover:bg-accent transition z-20"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Pagination Dots */}
            {garageCars.length > 1 && (
              <div className="flex items-center justify-center gap-2 py-6">
                {garageCars.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex 
                        ? 'w-12 bg-primary' 
                        : 'w-2 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 p-8">
              <Button 
                className="bg-primary text-white hover:bg-primary/90 px-12 py-6 text-lg font-semibold"
                onClick={handleChooseCar}
              >
                CHOOSE CAR
              </Button>
              <Button 
                variant="outline"
                className="px-12 py-6 text-lg font-semibold border-2"
                onClick={() => setIsRemoveDialogOpen(true)}
              >
                REMOVE FROM GARAGE
              </Button>
            </div>
          </div>

          {/* Side View Thumbnails (Optional) */}
          {garageCars.length > 1 && (
            <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
              {garageCars.map((car, index) => (
                <button
                  key={car.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden border-4 transition ${
                    index === currentIndex 
                      ? 'border-primary' 
                      : 'border-border opacity-50 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={car.image || "/placeholder.svg"} 
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Car Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Car to Garage</DialogTitle>
            <DialogDescription>
              Select your vehicle details to add it to your garage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Car Make *</Label>
              <Select value={selectedMake} onValueChange={(value) => {
                setSelectedMake(value)
                setSelectedModel('')
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select make..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMakes.map((make) => (
                    <SelectItem key={make.id} value={make.name}>
                      {make.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Car Model *</Label>
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
                disabled={!selectedMake}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year *</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year..." />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCar} className="bg-primary text-white">
              Add to Garage
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Car Confirmation */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Car from Garage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {currentCar?.make} {currentCar?.model} {currentCar?.year} from your garage?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
