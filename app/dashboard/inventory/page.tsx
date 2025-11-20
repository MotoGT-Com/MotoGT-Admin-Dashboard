"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Package } from 'lucide-react'

const inventoryStats = [
  { label: 'Total Items', value: '2,456', icon: Package, color: 'text-blue-400' },
  { label: 'Low Stock', value: '12', icon: AlertCircle, color: 'text-yellow-400' },
  { label: 'Out of Stock', value: '3', icon: AlertCircle, color: 'text-red-400' },
  { label: 'Warehouse Value', value: '$482,950', icon: Package, color: 'text-green-400' },
]

const lowStockItems = [
  { product: 'Carbon Ceramic Brakes', current: 8, minimum: 20, reorder: 50 },
  { product: 'Turbocharger Upgrade', current: 0, minimum: 10, reorder: 25 },
  { product: 'Custom Suspension', current: 5, minimum: 15, reorder: 40 },
  { product: 'Performance Chip', current: 12, minimum: 20, reorder: 60 },
]

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground mt-1">Track and manage your stock levels</p>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {inventoryStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low Stock Alert */}
      <Card className="border-yellow-900/50 bg-yellow-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle size={20} className="text-yellow-400" />
            Low Stock Items
          </CardTitle>
          <CardDescription>Items that need reordering</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Product</th>
                  <th className="text-left py-3 px-4 font-semibold">Current</th>
                  <th className="text-left py-3 px-4 font-semibold">Minimum</th>
                  <th className="text-left py-3 px-4 font-semibold">Reorder Qty</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.product} className="border-b border-border">
                    <td className="py-3 px-4 font-medium">{item.product}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${item.current === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {item.current}
                      </span>
                    </td>
                    <td className="py-3 px-4">{item.minimum}</td>
                    <td className="py-3 px-4">{item.reorder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
