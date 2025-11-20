'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, ChevronDown, X } from 'lucide-react'
import { Suspense, useState } from 'react'
import OrdersLoading from './loading'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const orderStatusDescriptions = {
  'Pending': 'Order placed, payment not yet confirmed or fully processed.',
  'Processing': 'Payment confirmed, order is being prepared.',
  'Shipped': 'Order on the way.',
  'Delivered': 'Order has been delivered successfully.',
  'Cancelled': 'Order was cancelled by customer or admin before shipment.',
  'Refunded': 'Refund issued successfully.',
  'Confirmed': 'Payment confirmed, order is being prepared.'
}

function OrdersContent() {
  const [orders, setOrders] = useState([
    { 
      id: 'JO-2025-000039', 
      customer: 'jamal amir', 
      email: 'jamalamir629@gmail.com', 
      items: 4,
      total: '$380.00', 
      payment: 'Unpaid',
      status: 'Delivered', 
      date: '2025-11-01 08:06' 
    },
    { 
      id: 'JO-2025-000038', 
      customer: 'Ahmad Alkurdi', 
      email: 'alkurdiahad@outlook.com', 
      items: 3,
      total: '$520.50', 
      payment: 'Paid',
      status: 'Shipped', 
      date: '2025-10-31 14:22' 
    },
    { 
      id: 'JO-2025-000037', 
      customer: 'Amr Halawani', 
      email: 'amrhalawanii@gmail.com', 
      items: 2,
      total: '$275.00', 
      payment: 'Unpaid',
      status: 'Processing', 
      date: '2025-10-30 10:15' 
    },
    { 
      id: 'JO-2025-000036', 
      customer: 'Hamza Alarabi', 
      email: 'alarabi.h93@gmail.com', 
      items: 5,
      total: '$890.00', 
      payment: 'Paid',
      status: 'Delivered', 
      date: '2025-10-29 16:45' 
    },
    { 
      id: 'JO-2025-000035', 
      customer: 'Ahmad Alshawakri', 
      email: 'ashawakri@gmail.com', 
      items: 3,
      total: '$445.75', 
      payment: 'Paid',
      status: 'Confirmed', 
      date: '2025-10-28 09:30' 
    },
  ])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [visibleColumns, setVisibleColumns] = useState({
    orderNumber: true,
    customerEmail: true,
    items: true,
    total: true,
    paymentStatus: true,
    status: true,
    createdAt: true
  })

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    )
  }

  const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded', 'Confirmed']

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const clearFilters = () => {
    setSelectedStatuses([])
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Delivered':
        return 'bg-primary/20 text-primary'
      case 'Shipped':
        return 'bg-blue-900/30 text-blue-300'
      case 'Processing':
        return 'bg-yellow-900/30 text-yellow-300'
      case 'Confirmed':
        return 'bg-green-900/30 text-green-300'
      default:
        return 'bg-gray-900/30 text-gray-300'
    }
  }

  const getPaymentColor = (payment: string) => {
    return payment === 'Paid' 
      ? 'bg-green-900/30 text-green-300' 
      : 'bg-red-900/30 text-red-300'
  }

  const filteredOrders = orders.filter(order => 
    (searchTerm === '' || 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedStatuses.length === 0 || selectedStatuses.includes(order.status))
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">Track and manage orders here.</p>
        </div>
      </div>

      {selectedStatuses.length > 0 && (
        <div className="flex gap-2 items-center flex-wrap">
          {selectedStatuses.map(status => (
            <div key={status} className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
              {status}
              <button onClick={() => toggleStatus(status)} className="hover:opacity-70">
                <X size={14} />
              </button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            Reset
          </Button>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search order # or email..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Status
              {selectedStatuses.length > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {selectedStatuses.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {statusOptions.map(status => (
                <label key={status} className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                  <Checkbox 
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <span className="text-sm">{status}</span>
                </label>
              ))}
            </div>
            {selectedStatuses.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="w-full text-muted-foreground"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              View
              <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-4">
            <div className="text-sm font-semibold mb-3 text-foreground">Toggle columns</div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox 
                  checked={visibleColumns.orderNumber}
                  onCheckedChange={() => toggleColumn('orderNumber')}
                />
                <span className="text-sm">OrderNumber</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox 
                  checked={visibleColumns.customerEmail}
                  onCheckedChange={() => toggleColumn('customerEmail')}
                />
                <span className="text-sm">CustomerEmail</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox 
                  checked={visibleColumns.items}
                  onCheckedChange={() => toggleColumn('items')}
                />
                <span className="text-sm">Items</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox 
                  checked={visibleColumns.total}
                  onCheckedChange={() => toggleColumn('total')}
                />
                <span className="text-sm">Total</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox 
                  checked={visibleColumns.paymentStatus}
                  onCheckedChange={() => toggleColumn('paymentStatus')}
                />
                <span className="text-sm">PaymentStatus</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox 
                  checked={visibleColumns.status}
                  onCheckedChange={() => toggleColumn('status')}
                />
                <span className="text-sm">Status</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox 
                  checked={visibleColumns.createdAt}
                  onCheckedChange={() => toggleColumn('createdAt')}
                />
                <span className="text-sm">CreatedAt</span>
              </label>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">No orders found</p>
              <p className="text-muted-foreground">
                {searchTerm ? `No orders match "${searchTerm}". Try a different search term.` : 'No orders yet. Create your first order to get started.'}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {visibleColumns.orderNumber && <th className="text-left py-4 px-6 font-semibold">Order #</th>}
                {visibleColumns.customerEmail && <th className="text-left py-4 px-6 font-semibold">Customer</th>}
                {visibleColumns.items && <th className="text-left py-4 px-6 font-semibold">Items</th>}
                {visibleColumns.total && <th className="text-left py-4 px-6 font-semibold">Total</th>}
                {visibleColumns.paymentStatus && <th className="text-left py-4 px-6 font-semibold">Payment</th>}
                {visibleColumns.status && <th className="text-left py-4 px-6 font-semibold">Status</th>}
                {visibleColumns.createdAt && <th className="text-left py-4 px-6 font-semibold">Created At</th>}
                <th className="text-left py-4 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-primary/5 transition">
                  {visibleColumns.orderNumber && <td className="py-4 px-6 font-medium">{order.id}</td>}
                  {visibleColumns.customerEmail && (
                    <td className="py-4 px-6">
                      <div className="font-medium">{order.customer}</div>
                      <div className="text-xs text-muted-foreground">{order.email}</div>
                    </td>
                  )}
                  {visibleColumns.items && <td className="py-4 px-6 text-muted-foreground">{order.items} items</td>}
                  {visibleColumns.total && <td className="py-4 px-6 font-semibold">{order.total}</td>}
                  {visibleColumns.paymentStatus && (
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentColor(order.payment)}`}>
                        {order.payment}
                      </span>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  )}
                  {visibleColumns.createdAt && <td className="py-4 px-6 text-muted-foreground">{order.date}</td>}
                  <td className="py-4 px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          Actions
                          <ChevronDown size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => {
                          window.location.href = `/dashboard/orders/${order.id}`
                        }}>
                          View Details
                        </DropdownMenuItem>
                        <TooltipProvider>
                          {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].map(status => (
                            <Tooltip key={status}>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem 
                                  onClick={() => updateOrderStatus(order.id, status)}
                                  className={status === 'Refunded' ? 'text-red-400' : status === 'Cancelled' ? 'text-orange-400' : ''}
                                >
                                  Mark {status}
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                {orderStatusDescriptions[status as keyof typeof orderStatusDescriptions]}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrdersContent />
    </Suspense>
  )
}
