'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { downloadInvoice } from '@/lib/invoice-generator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// Mock order details - in a real app, you'd fetch this based on the ID
const orderDetailsMap: Record<string, any> = {
  'JO-2025-000039': {
    id: 'JO-2025-000039',
    customerId: 'CUST-00239',
    customer: 'jamal amir',
    email: 'jamalamir629@gmail.com',
    phone: '+96279159562',
    subtotal: 380.00,
    tax: 0.00,
    shippingCost: 0.00,
    discount: 0.00,
    total: 380.00,
    payment: 'Unpaid',
    status: 'Delivered',
    date: '2025-11-01 08:06',
    items: [
      { id: 1, name: 'Carbon Fiber Front Bumper', quantity: 1, price: 180.00, image: '/carbon-fiber-bumper.jpg' },
      { id: 2, name: 'LED Headlight Upgrade', quantity: 2, price: 100.00, image: '/led-headlight.png' },
    ],
    shipping: {
      address: '123 Motor Street, Car City, CC 12345',
      method: 'Express Shipping',
      estimatedDelivery: '2025-11-05'
    },
    notes: 'Customer requested express shipping. Priority handling.'
  },
  'JO-2025-000038': {
    id: 'JO-2025-000038',
    customerId: 'CUST-00238',
    customer: 'Ahmad Alkurdi',
    email: 'alkurdiahad@outlook.com',
    phone: '+1 (555) 234-5678',
    subtotal: 520.50,
    tax: 0.00,
    shippingCost: 0.00,
    discount: 0.00,
    total: 520.50,
    payment: 'Paid',
    status: 'Shipped',
    date: '2025-10-31 14:22',
    items: [
      { id: 1, name: 'Performance Exhaust System', quantity: 1, price: 350.00, image: '/car-exhaust-system.png' },
      { id: 2, name: 'Wheel Spacers (Set of 4)', quantity: 1, price: 170.50, image: '/wheel-spacers.jpg' },
    ],
    shipping: {
      address: '456 Gear Avenue, Speed City, SC 67890',
      method: 'Standard Shipping',
      estimatedDelivery: '2025-11-08'
    },
    notes: 'Package is in transit. Expected delivery within 7 days.'
  }
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const orderId = params.id
  const initialOrder = orderDetailsMap[orderId]
  
  const [order, setOrder] = useState(initialOrder)

  const calculatedSubtotal = order?.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0

  const handleStatusUpdate = (newStatus: string) => {
    setOrder({ ...order, status: newStatus })
  }

  const handlePaymentUpdate = (newPayment: string) => {
    setOrder({ ...order, payment: newPayment })
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
        </Button>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-2">Order not found</p>
            <p className="text-muted-foreground">The order you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    )
  }

  const getPaymentBadgeVariant = (payment: string) => {
    switch (payment.toLowerCase()) {
      case 'paid':
        return 'default'
      case 'unpaid':
        return 'destructive'
      case 'partial':
        return 'secondary'
      case 'refunded':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft size={16} />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order {order.id}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{new Date(order.date).toLocaleString()}</p>
          </div>
        </div>
        <Button onClick={() => downloadInvoice(order)} className="gap-2">
          <Download size={18} />
          Download Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status and Payment */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Order Details */}
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Order Number</p>
                    <p className="text-lg font-semibold">{order.id}</p>
                    <p className="text-sm text-muted-foreground mt-3">Order Date</p>
                    <p className="text-sm">{new Date(order.date).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-3">Payment Method</p>
                    <p className="text-sm">Cash on Delivery</p>
                  </div>
                </div>

                {/* Right: Status and Totals */}
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Status</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold">{order.status}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">Update Status</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusUpdate('Pending')}>
                            Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate('Confirmed')}>
                            Confirmed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate('Processing')}>
                            Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate('Shipped')}>
                            Shipped
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate('Delivered')}>
                            Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate('Cancelled')}>
                            Cancelled
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate('Refunded')}>
                            Refunded
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Payment Status</p>
                    <div className="flex items-center justify-between">
                      <Badge variant={getPaymentBadgeVariant(order.payment)}>
                        {order.payment}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">Update Payment</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePaymentUpdate('Unpaid')}>
                            Unpaid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePaymentUpdate('Paid')}>
                            Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePaymentUpdate('Partial')}>
                            Partial
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePaymentUpdate('Refunded')}>
                            Refunded
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">Payment</p>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>JOD {calculatedSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>JOD {order.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>JOD {order.shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span>JOD {order.discount.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-border pt-3 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">JOD {order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                    {item.image && (
                      <img 
                        src={item.image || "/placeholder.svg"} 
                        alt={item.name} 
                        className="h-16 w-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold whitespace-nowrap">JOD {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold text-lg">JOD {calculatedSubtotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                <p className="font-medium">{order.shipping.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Shipping Method</p>
                  <p className="font-medium">{order.shipping.method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                  <p className="font-medium">{order.shipping.estimatedDelivery}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer ID</p>
                <p className="font-mono text-sm">{order.customerId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{order.customer}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium text-sm break-all">{order.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{order.phone}</p>
              </div>
              <Button variant="outline" className="w-full mt-2" asChild>
                <Link href={`/dashboard/users`}>View customer</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
