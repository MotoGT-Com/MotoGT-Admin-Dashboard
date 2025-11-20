"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ShieldCheck, ShieldX, Mail, Key, UserCog, Ban, Lock, Eye, ShoppingCart, Bell, Activity, Flag, Trash2, Car } from 'lucide-react'
import { useState } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState<string | null>(null)
  
  // Mock user data - replace with actual data fetching
  const [user, setUser] = useState({
    id: 'b2571c4c-3766-4...',
    name: 'Amr Test',
    email: 'thehalawani109@gmail.com',
    phone: '+(962) 779 453 525',
    country: 'Jordan, Amman',
    role: 'Customer',
    status: 'Active',
    verified: true,
    created: '2025-11-16 11:56',
    updated: '2025-11-18 09:30',
    totalOrders: 12,
    totalSpent: 500,
    lastLogin: '2025-11-18 14:22',
    accountType: 'Premium',
    isLocked: false,
    isFlagged: false,
  })

  const orders = [
    { id: 'JO-2025-000039', total: 380.00, status: 'Delivered', date: '2025-11-01 08:06' },
    { id: 'JO-2025-000028', total: 120.00, status: 'Shipped', date: '2025-10-28 14:30' },
  ]

  const [cartItems, setCartItems] = useState([
    { 
      id: '1', 
      name: 'Carbon Fiber Front Splitter',
      code: '#0031332', // Added product code
      image: '/carbon-fiber-bumper.jpg',
      price: 145.00, 
      quantity: 1,
      category: 'Exterior'
    },
    { 
      id: '2', 
      name: 'LED Headlight Kit',
      code: '#0028741', // Added product code
      image: '/led-headlight.png',
      price: 89.99, 
      quantity: 2,
      category: 'Lighting'
    },
    { 
      id: '3', 
      name: 'Performance Exhaust System',
      code: '#0035289', // Added product code
      image: '/car-exhaust-system.png',
      price: 425.00, 
      quantity: 1,
      category: 'Performance'
    },
  ])

  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
  }

  const userGarage = [
    { 
      id: '1', 
      make: 'BMW', 
      model: '430i', 
      year: '2024',
      image: '/images/image.png' // Fixed image path - removed /public prefix
    },
    { 
      id: '2', 
      make: 'Audi', 
      model: 'RS6', 
      year: '2023',
      image: '/audi-rs6.jpg'
    },
    { 
      id: '3', 
      make: 'Porsche', 
      model: '911 Turbo', 
      year: '2022',
      image: '/porsche-911-turbo.jpg'
    },
  ]

  const activities = [
    { action: 'Logged in', timestamp: '2025-11-18 14:22', ip: '192.168.1.1' },
    { action: 'Updated profile', timestamp: '2025-11-18 09:30', ip: '192.168.1.1' },
    { action: 'Placed order JO-2025-000039', timestamp: '2025-11-01 08:06', ip: '192.168.1.1' },
  ]

  const handleStatusUpdate = (newStatus: string) => {
    setUser(prev => ({ ...prev, status: newStatus }))
  }

  const handleVerificationToggle = () => {
    setUser(prev => ({ ...prev, verified: !prev.verified }))
  }

  const handleLockAccount = () => {
    setUser(prev => ({ ...prev, isLocked: !prev.isLocked, status: prev.isLocked ? 'Active' : 'Locked' }))
    setShowDialog(null)
  }

  const handleFlagAccount = () => {
    setUser(prev => ({ ...prev, isFlagged: !prev.isFlagged }))
    setShowDialog(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Details</h1>
            <p className="text-muted-foreground mt-1">View and manage user information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleVerificationToggle}>
            {user.verified ? <ShieldX size={16} className="mr-2" /> : <ShieldCheck size={16} className="mr-2" />}
            {user.verified ? 'Unverify Email' : 'Verify Email'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="text-sm font-mono mt-1">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-sm font-medium mt-1">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm mt-1">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm mt-1">{user.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="text-sm mt-1">{user.country}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant="outline" className="mt-1">{user.role}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge 
                  variant={user.status === 'Active' ? 'default' : 'secondary'} 
                  className="mt-1"
                >
                  {user.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Verified</p>
                <Badge 
                  variant={user.verified ? 'default' : 'secondary'} 
                  className={`mt-1 ${user.verified ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}`}
                >
                  {user.verified ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="text-sm mt-1">{user.accountType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Login</p>
                <p className="text-sm mt-1">{user.lastLogin}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm mt-1">{user.created}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="text-sm mt-1">{user.updated}</p>
              </div>
            </CardContent>
          </Card>

          {/* Current Cart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Cart</CardTitle>
                <Badge variant="outline">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-accent/5 transition">
                      <img 
                        src={item.image || "/placeholder.svg"} 
                        alt={item.name} 
                        className="h-16 w-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.code}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">JOD {(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">JOD {item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">Cart Subtotal</p>
                      <p className="text-xl font-bold text-primary">JOD {cartSubtotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order History */}
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.map(order => (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/5 transition cursor-pointer">
                      <div>
                        <p className="font-medium text-primary hover:underline">
                          {order.id}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">JOD {order.total.toFixed(2)}</p>
                        <Badge variant="outline" className="mt-1 bg-green-500/20 text-green-400 border-green-500/30">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User's Garage */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User's Garage</CardTitle>
                <Badge variant="outline">{userGarage.length} {userGarage.length === 1 ? 'car' : 'cars'}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {userGarage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Car size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No cars in garage</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userGarage.map(car => (
                    <div key={car.id} className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-accent/5 transition">
                      <img 
                        src={car.image || "/placeholder.svg?height=80&width=120&query=car"} 
                        alt={`${car.make} ${car.model}`} 
                        className="h-16 w-24 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{car.make} {car.model}</p>
                        <p className="text-sm text-muted-foreground mt-1">Year: {car.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                    <Activity size={16} className="mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.timestamp} • IP: {activity.ip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold mt-1">{user.totalOrders}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold mt-1">JOD {user.totalSpent}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Order Value</p>
                <p className="text-2xl font-bold mt-1">JOD {(user.totalSpent / user.totalOrders).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Support Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Support Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => setShowDialog('flag')}
              >
                <Flag size={16} />
                {user.isFlagged ? 'Unflag Account' : 'Flag Account'}
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Mail size={16} />
                Send Password Reset
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <UserCog size={16} />
                Impersonate User
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => setShowDialog('lock')}
              >
                <Lock size={16} />
                {user.isLocked ? 'Unlock Account' : 'Lock Account'}
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <ShoppingCart size={16} />
                View Cart
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => setShowDialog('lock-orders')}
              >
                <Ban size={16} />
                Lock from Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={showDialog === 'flag'} onOpenChange={(open) => !open && setShowDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isFlagged ? 'Unflag Account' : 'Flag Account'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.isFlagged 
                ? 'Are you sure you want to unflag this account? This will remove the flag marker.'
                : 'Are you sure you want to flag this account? This will mark it for review.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFlagAccount}>
              {user.isFlagged ? 'Unflag' : 'Flag'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDialog === 'lock'} onOpenChange={(open) => !open && setShowDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isLocked ? 'Unlock Account' : 'Lock Account'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.isLocked 
                ? 'Are you sure you want to unlock this account? The user will be able to log in again.'
                : 'Are you sure you want to lock this account? The user will not be able to log in.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLockAccount}>
              {user.isLocked ? 'Unlock' : 'Lock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDialog === 'lock-orders'} onOpenChange={(open) => !open && setShowDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock User from Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to prevent this user from placing new orders? They will still be able to log in but cannot make purchases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowDialog(null)}>
              Lock from Orders
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
