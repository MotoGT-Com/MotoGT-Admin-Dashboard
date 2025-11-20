"use client"

import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Package } from 'lucide-react'
import Link from "next/link"

export default function CollectionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params.id as string

  // Mock data - in real app, fetch based on collectionId
  const collection = {
    id: collectionId,
    name: 'Summer Sale',
    description: 'Hot deals for summer',
    items: 156,
    status: 'Active',
    discount: '20% OFF',
    products: [
      { id: 'p1', name: 'Air Filter', price: 25.99, image: '/air-filter.png', stock: 45 },
      { id: 'p2', name: 'Car Springs', price: 89.99, image: '/car-springs.jpg', stock: 23 },
    ]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{collection.name}</h1>
          <p className="text-muted-foreground mt-1">{collection.description}</p>
        </div>
        <Link href="/dashboard/collections">
          <Button variant="outline">
            <Pencil size={16} className="mr-2" />
            Edit Collection
          </Button>
        </Link>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collection.items}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Discount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{collection.discount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${collection.status === 'Active' ? 'text-green-400' : 'text-muted-foreground'}`}>
              {collection.status}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products in Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Products in this Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {collection.products.map(product => (
              <div key={product.id} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent/5 transition">
                <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">Stock: {product.stock} units</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">JOD {product.price.toFixed(2)}</p>
                </div>
                <Link href={`/dashboard/products/${product.id}`}>
                  <Button variant="outline" size="sm">
                    <Package size={16} className="mr-2" />
                    View Product
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
