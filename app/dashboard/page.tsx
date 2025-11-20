"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, ShoppingCart, Users, Package, AlertCircle, DollarSign, TrendingUp, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, Sector, Label } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieSectorDataItem } from "recharts/types/polar/Pie"

// Sales data
const salesData = [
  { day: 'Mon', sales: 4200, label: 'JOD 4.2k' },
  { day: 'Tue', sales: 3800, label: 'JOD 3.8k' },
  { day: 'Wed', sales: 5100, label: 'JOD 5.1k' },
  { day: 'Thu', sales: 4600, label: 'JOD 4.6k' },
  { day: 'Fri', sales: 6200, label: 'JOD 6.2k' },
  { day: 'Sat', sales: 7800, label: 'JOD 7.8k' },
  { day: 'Sun', sales: 5900, label: 'JOD 5.9k' },
]

// Orders by status
const ordersByStatus = [
  { name: 'Pending', value: 45, color: 'bg-yellow-500', percentage: '8%' },
  { name: 'Processing', value: 89, color: 'bg-blue-500', percentage: '16%' },
  { name: 'Shipped', value: 156, color: 'bg-purple-500', percentage: '28%' },
  { name: 'Delivered', value: 234, color: 'bg-green-500', percentage: '43%' },
  { name: 'Cancelled', value: 23, color: 'bg-red-500', percentage: '4%' },
]

// Category sales
const categorySales = [
  { name: 'Exterior', value: 4200, units: 892, fill: '#CF172F' },
  { name: 'Interior', value: 3800, units: 673, fill: '#2563EB' },
  { name: 'Performance', value: 2900, units: 445, fill: '#059669' },
  { name: 'Maintenance', value: 1800, units: 356, fill: '#F59E0B' },
  { name: 'Lighting', value: 1600, units: 298, fill: '#8B5CF6' },
  { name: 'Audio & Electronics', value: 1400, units: 234, fill: '#EC4899' },
  { name: 'Wheels & Tires', value: 1200, units: 189, fill: '#14B8A6' },
  { name: 'Engine Parts', value: 900, units: 156, fill: '#F97316' },
  { name: 'Suspension', value: 700, units: 123, fill: '#6366F1' },
  { name: 'Body Parts', value: 500, units: 89, fill: '#A855F7' },
]

// Subcategory sales
const subcategorySales = [
  { name: 'Headlight Trim', value: 2400, units: 456, fill: '#CF172F' },
  { name: 'Floor Mats', value: 2100, units: 389, fill: '#2563EB' },
  { name: 'Dashboard Trim', value: 1800, units: 267, fill: '#059669' },
  { name: 'Grilles', value: 1600, units: 234, fill: '#F59E0B' },
  { name: 'LED Fog Lights', value: 1400, units: 198, fill: '#8B5CF6' },
  { name: 'Spoilers', value: 1200, units: 176, fill: '#EC4899' },
  { name: 'Air Filters', value: 900, units: 145, fill: '#14B8A6' },
  { name: 'Brake Pads', value: 800, units: 134, fill: '#F97316' },
  { name: 'Shock Absorbers', value: 600, units: 112, fill: '#6366F1' },
  { name: 'Door Handles', value: 400, units: 89, fill: '#A855F7' },
]

// Pending orders
const pendingOrders = [
  { id: 'ORD-2541', customer: 'John Doe', amount: 'JOD 145.500', time: '10 min ago' },
  { id: 'ORD-2540', customer: 'Jane Smith', amount: 'JOD 89.250', time: '25 min ago' },
  { id: 'ORD-2539', customer: 'Mike Johnson', amount: 'JOD 215.000', time: '1 hour ago' },
]

// Processing orders
const processingOrders = [
  { id: 'ORD-2538', customer: 'Sarah Lee', amount: 'JOD 145.000', time: '2 hours ago' },
  { id: 'ORD-2537', customer: 'Tom Wilson', amount: 'JOD 320.750', time: '3 hours ago' },
]

// Best selling products
const bestSellingProducts = [
  { name: 'Headlight Trim Kit', code: 'SKU-2031', sales: 245, revenue: 'JOD 12,250', image: '/car-headlight-trim.jpg' },
  { name: 'Carbon Fiber Spoiler', code: 'SKU-1845', sales: 189, revenue: 'JOD 18,900', image: '/carbon-fiber-spoiler.jpg' },
  { name: 'LED Fog Lights', code: 'SKU-3421', sales: 156, revenue: 'JOD 7,800', image: '/led-fog-lights.jpg' },
  { name: 'Floor Mat Set', code: 'SKU-5632', sales: 134, revenue: 'JOD 4,020', image: '/floor-mat-set.jpg' },
  { name: 'Performance Air Filter', code: 'SKU-7821', sales: 128, revenue: 'JOD 3,840', image: '/air-filter.png' },
  { name: 'Dashboard Trim Panel', code: 'SKU-4512', sales: 112, revenue: 'JOD 5,600', image: '/dashboard-trim.jpg' },
  { name: 'Sport Steering Wheel', code: 'SKU-9834', sales: 98, revenue: 'JOD 9,800', image: '/classic-car-steering-wheel.png' },
  { name: 'Brake Pad Set', code: 'SKU-2156', sales: 87, revenue: 'JOD 2,610', image: '/brake-pads-close-up.png' },
  { name: 'Chrome Grille', code: 'SKU-6789', sales: 76, revenue: 'JOD 4,560', image: '/chrome-grille.jpg' },
  { name: 'Mud Flaps Set', code: 'SKU-3245', sales: 65, revenue: 'JOD 1,950', image: '/mud-flaps.jpg' },
]

// Best selling categories
const bestSellingCategories = [
  { name: 'Exterior Accessories', sales: 892, revenue: 'JOD 44,600' },
  { name: 'Interior Trim', sales: 673, revenue: 'JOD 33,650' },
  { name: 'Performance Parts', sales: 445, revenue: 'JOD 66,750' },
]

// Best selling subcategories
const bestSellingSubcategories = [
  { name: 'Headlight Trim', sales: 456 },
  { name: 'Floor Mats', sales: 389 },
  { name: 'Dashboard Trim', sales: 267 },
]

// Best selling countries
const bestSellingCountries = [
  { name: 'Jordan, Amman', orders: 892 },
  { name: 'Jordan, Irbid', orders: 456 },
  { name: 'Jordan, Zarqa', orders: 234 },
]

// Best selling car makes with colors for pie chart
const topCarMakes = [
  { name: 'BMW', units: 456, fill: '#CF172F' },
  { name: 'Mercedes-Benz', units: 389, fill: '#2563EB' },
  { name: 'Audi', units: 267, fill: '#059669' },
  { name: 'Porsche', units: 198, fill: '#F59E0B' },
  { name: 'Volkswagen', units: 145, fill: '#8B5CF6' },
]

// Best selling car models with colors for pie chart
const topCarModels = [
  { name: 'BMW Series 3', units: 234, fill: '#CF172F' },
  { name: 'Mercedes C-Class', units: 189, fill: '#2563EB' },
  { name: 'Audi A4', units: 156, fill: '#059669' },
  { name: 'Porsche 911', units: 123, fill: '#F59E0B' },
  { name: 'VW Golf GTI', units: 98, fill: '#8B5CF6' },
]

// Color palette for charts
const COLORS = ['#CF172F', '#0088FE', '#00C49F', '#FFBB28', '#FF8042']

const CATEGORY_COLORS = {
  'Exterior': '#CF172F',      // Red (primary)
  'Interior': '#2563EB',      // Blue
  'Performance': '#059669',   // Green
  'Maintenance': '#F59E0B',   // Orange
}

function StatCard({ title, value, change, positive, icon: Icon, clickable = false, href = '' }) {
  const content = (
    <Card className={`min-h-[140px] ${clickable ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${positive ? 'text-green-600' : 'text-red-600'} flex items-center gap-1 mt-1`}>
            {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </p>
        )}
        {!change && <div className="h-5 mt-1" />}
      </CardContent>
    </Card>
  )

  if (clickable && href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

// Chart configuration for the area chart
const salesChartConfig = {
  sales: {
    label: "Sales",
    color: "#CF172F",
  },
} satisfies ChartConfig

// Chart configuration for category breakdown
const categoryChartConfig = {
  views: {
    label: "Category Sales",
  },
  value: {
    label: "Revenue (JOD)",
    color: "#CF172F",
  },
  units: {
    label: "Units Sold",
    color: "#2563EB",
  },
} satisfies ChartConfig

// Chart configuration for subcategory breakdown
const subcategoryChartConfig = {
  views: {
    label: "Subcategory Sales",
  },
  value: {
    label: "Revenue (JOD)",
    color: "#CF172F",
  },
  units: {
    label: "Units Sold",
    color: "#2563EB",
  },
} satisfies ChartConfig

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3" style={{ minWidth: '150px' }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-12 bg-primary rounded-full" />
          <div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">Desktop</p>
            <p className="text-lg font-bold text-foreground mt-1">{payload[0].value.toLocaleString()}</p>
          </div>
        </div>
      </div>
    )
  }
  return null
}

const topCountries = [
  { name: 'Jordan', orders: 1582, fill: '#CF172F' },
  { name: 'Saudi Arabia', orders: 892, fill: '#2563EB' },
  { name: 'UAE', orders: 645, fill: '#059669' },
  { name: 'Kuwait', orders: 423, fill: '#F59E0B' },
  { name: 'Qatar', orders: 298, fill: '#8B5CF6' },
]

const topCities = [
  { name: 'Amman', orders: 892, fill: '#CF172F' },
  { name: 'Riyadh', orders: 567, fill: '#2563EB' },
  { name: 'Dubai', orders: 445, fill: '#059669' },
  { name: 'Jeddah', orders: 325, fill: '#F59E0B' },
  { name: 'Irbid', orders: 234, fill: '#8B5CF6' },
]

const geoChartConfig = {
  orders: {
    label: "Orders",
  },
} satisfies ChartConfig

export default function DashboardHome() {
  // Date filter state
  const [dateFilter, setDateFilter] = useState('7d')
  
  const [activeCategoryChart, setActiveCategoryChart] = useState<'value' | 'units'>('value')
  const [activeSubcategoryChart, setActiveSubcategoryChart] = useState<'value' | 'units'>('value')

  const categoryTotals = useMemo(
    () => ({
      value: categorySales.reduce((acc, curr) => acc + curr.value, 0),
      units: categorySales.reduce((acc, curr) => acc + curr.units, 0),
    }),
    []
  )

  const subcategoryTotals = useMemo(
    () => ({
      value: subcategorySales.reduce((acc, curr) => acc + curr.value, 0),
      units: subcategorySales.reduce((acc, curr) => acc + curr.units, 0),
    }),
    []
  )

  const maxSales = Math.max(...salesData.map(d => d.sales))
  const maxOrders = Math.max(...ordersByStatus.map(d => d.value))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to MotoGT Admin</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
          <StatCard 
            title="Top Sales Today" 
            value="JOD 12,350" 
            change="+12.5%" 
            positive={true} 
            icon={DollarSign}
          />
          <StatCard 
            title="Total Orders" 
            value="327" 
            change="+8.2%" 
            positive={true} 
            icon={ShoppingCart}
            clickable={true}
            href="/dashboard/orders"
          />
          <StatCard 
            title="New Customers" 
            value="48" 
            change="+15%" 
            positive={true} 
            icon={Users}
          />
          <StatCard 
            title="Pending Orders" 
            value="19" 
            icon={AlertCircle}
            clickable={true}
            href="/dashboard/orders"
          />
          <StatCard 
            title="Processing Orders" 
            value="89" 
            change="+5%" 
            positive={true} 
            icon={Package}
            clickable={true}
            href="/dashboard/orders"
          />
        </div>
      </section>

      <Separator />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Performance</h2>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
              <CardDescription>Daily revenue trend for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={salesChartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={salesData}
                  margin={{
                    left: 0,
                    right: 0,
                    top: 12,
                  }}
                  height={280}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `JOD ${(value / 1000).toFixed(1)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    dataKey="sales"
                    type="natural"
                    fill="var(--color-sales)"
                    fillOpacity={0.4}
                    stroke="var(--color-sales)"
                    strokeWidth={2}
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
            <CardFooter>
              <div className="flex w-full items-start gap-2 text-sm">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 font-medium leading-none">
                    Trending up by 12.5% this week <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 leading-none text-muted-foreground">
                    Total Weekly Sales: JOD 37,600
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
              <CardDescription>Current order distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ordersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value} orders`, 'Count']}
                  />
                  <Bar dataKey="value" fill="#CF172F" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-4">
                <span>Total Orders</span>
                <span className="font-semibold text-foreground">547</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Orders Feed */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Orders Feed</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
              <CardDescription>3 most recent orders awaiting confirmation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/5 transition cursor-pointer">
                      <div>
                        <p className="font-medium text-primary">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{order.amount}</p>
                        <p className="text-xs text-muted-foreground">{order.time}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Orders</CardTitle>
              <CardDescription>3 most recent orders being prepared</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processingOrders.map((order) => (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/5 transition cursor-pointer">
                      <div>
                        <p className="font-medium text-primary">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{order.amount}</p>
                        <p className="text-xs text-muted-foreground">{order.time}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Sales Insights */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Sales Insights</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 mb-6 gap-2">
          <Card className="py-0">
            <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-6">
                <CardTitle>Category Sales Breakdown</CardTitle>
                <CardDescription>
                  Top 10 categories 
                </CardDescription>
              </div>
              <div className="flex">
                {(['value', 'units'] as const).map((key) => {
                  return (
                    <button
                      key={key}
                      data-active={activeCategoryChart === key}
                      className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                      onClick={() => setActiveCategoryChart(key)}
                    >
                      <span className="text-muted-foreground text-xs">
                        {categoryChartConfig[key].label}
                      </span>
                      <span className="text-lg leading-none font-bold sm:text-xl">
                        {key === 'value' 
                          ? `JOD ${categoryTotals[key].toLocaleString()}`
                          : categoryTotals[key].toLocaleString()
                        }
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
              <ChartContainer
                config={categoryChartConfig}
                className="aspect-auto h-[280px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={categorySales}
                  margin={{
                    left: 12,
                    right: 12,
                    top: 12,
                    bottom: 12,
                  }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[180px]"
                        labelFormatter={(value) => value}
                        formatter={(value, name, item) => {
                          const categoryName = item.payload.name
                          const displayValue = activeCategoryChart === 'value'
                            ? `JOD ${value.toLocaleString()}`
                            : `${value} units`
                          return [displayValue, categoryName]
                        }}
                      />
                    }
                  />
                  <Bar 
                    dataKey={activeCategoryChart} 
                    fill={`var(--color-${activeCategoryChart})`}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-6">
                <CardTitle>Subcategory Sales Breakdown</CardTitle>
                <CardDescription>
                  Top 10 subcategories
                </CardDescription>
              </div>
              <div className="flex">
                {(['value', 'units'] as const).map((key) => {
                  return (
                    <button
                      key={key}
                      data-active={activeSubcategoryChart === key}
                      className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                      onClick={() => setActiveSubcategoryChart(key)}
                    >
                      <span className="text-muted-foreground text-xs">
                        {subcategoryChartConfig[key].label}
                      </span>
                      <span className="leading-none font-bold text-xl">
                        {key === 'value' 
                          ? `JOD ${subcategoryTotals[key].toLocaleString()}`
                          : subcategoryTotals[key].toLocaleString()
                        }
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
              <ChartContainer
                config={subcategoryChartConfig}
                className="aspect-auto h-[280px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={subcategorySales}
                  margin={{
                    left: 12,
                    right: 12,
                    top: 12,
                    bottom: 12,
                  }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[180px]"
                        labelFormatter={(value) => value}
                        formatter={(value, name, item) => {
                          const subcategoryName = item.payload.name
                          const displayValue = activeSubcategoryChart === 'value'
                            ? `JOD ${value.toLocaleString()}`
                            : `${value} units`
                          return [displayValue, subcategoryName]
                        }}
                      />
                    }
                  />
                  <Bar 
                    dataKey={activeSubcategoryChart} 
                    fill={`var(--color-${activeSubcategoryChart})`}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Best Selling Lists */}
        <Card>
          <CardHeader>
            <CardTitle>Best Selling Products</CardTitle>
            <CardDescription>Top 10 products by sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bestSellingProducts.map((product, index) => (
                <div key={product.code} className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-accent/5 transition">
                  <Badge className="w-8 h-8 flex items-center justify-center shrink-0 text-sm">{index + 1}</Badge>
                  
                  <img 
                    src={product.image || "/placeholder.svg"} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded border border-border shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{product.code}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-muted-foreground">{product.sales} units</p>
                      <p className="text-sm font-semibold text-primary">{product.revenue}</p>
                    </div>
                  </div>
                  
                  <Link href={`/dashboard/products?search=${product.code}`}>
                    
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Geo Analytics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Geo Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
              <CardDescription>Top 5 countries by order volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={geoChartConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={topCountries}
                    dataKey="orders"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              
                              
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              
              <div className="mt-6 space-y-2">
                {topCountries.map((country, index) => (
                  <div key={country.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: country.fill }}
                      />
                      <span className="text-sm font-medium">{country.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {country.orders} orders ({((country.orders / topCountries.reduce((acc, c) => acc + c.orders, 0)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Cities</CardTitle>
              <CardDescription>Top 5 cities by order volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={geoChartConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={topCities}
                    dataKey="orders"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              
                              
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              
              <div className="mt-6 space-y-2">
                {topCities.map((city, index) => (
                  <div key={city.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: city.fill }}
                      />
                      <span className="text-sm font-medium">{city.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {city.orders} orders ({((city.orders / topCities.reduce((acc, c) => acc + c.orders, 0)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Vehicle Insights */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Vehicle Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <Card>
            <CardHeader>
              <CardTitle>Best Selling Car Makes</CardTitle>
              <CardDescription>Top 5 vehicle brands by units sold</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={geoChartConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={topCarMakes}
                    dataKey="units"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              
                              
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              
              <div className="mt-6 space-y-2">
                {topCarMakes.map((make, index) => (
                  <div key={make.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: make.fill }}
                      />
                      <span className="text-sm font-medium">{make.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {make.units} units ({((make.units / topCarMakes.reduce((acc, c) => acc + c.units, 0)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best Selling Car Models</CardTitle>
              <CardDescription>Top 5 vehicle models by units sold</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={geoChartConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={topCarModels}
                    dataKey="units"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              
                              
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              
              <div className="mt-6 space-y-2">
                {topCarModels.map((model, index) => (
                  <div key={model.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: model.fill }}
                      />
                      <span className="text-sm font-medium">{model.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {model.units} units ({((model.units / topCarModels.reduce((acc, c) => acc + c.units, 0)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
