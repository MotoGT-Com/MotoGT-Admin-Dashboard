"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const initialCoupons = [
  { id: '1', code: 'SUMMER20', discount: '20%', uses: 156, limit: 500, status: 'Active', startDate: '2025-01-01', endDate: '2025-12-31' },
  { id: '2', code: 'WELCOME15', discount: '15%', uses: 892, limit: 1000, status: 'Active', startDate: '2025-01-01', endDate: '2025-12-31' },
  { id: '3', code: 'FREESHIP', discount: 'Free Shipping', uses: 324, limit: 500, status: 'Active', startDate: '2025-01-01', endDate: '2025-06-30' },
  { id: '4', code: 'CLEARANCE50', discount: '50%', uses: 45, limit: 100, status: 'Expired', startDate: '2024-12-01', endDate: '2024-12-31' },
]

export default function CouponsPage() {
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [coupons, setCoupons] = useState(initialCoupons)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [editingCoupon, setEditingCoupon] = useState<string | null>(null)
  const [deletingCoupon, setDeletingCoupon] = useState<string | null>(null)
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    limit: '',
    status: 'Active',
    startDate: getTodayDate(),
    endDate: '',
  })

  const handleEditCoupon = (coupon: typeof initialCoupons[0]) => {
    setEditingCoupon(coupon.id)
    
    let discountType = 'percentage'
    let discountValue = ''
    
    if (coupon.discount === 'Free Shipping') {
      discountType = 'freeship'
    } else if (coupon.discount.includes('%')) {
      discountType = 'percentage'
      discountValue = coupon.discount.replace('%', '')
    } else {
      discountType = 'fixed'
      discountValue = coupon.discount.replace('JOD ', '')
    }
    
    setNewCoupon({
      code: coupon.code,
      discountType,
      discountValue,
      limit: String(coupon.limit),
      status: coupon.status,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
    })
    setIsDialogOpen(true)
  }

  const handleCreateCoupon = () => {
    if (!newCoupon.code || !newCoupon.discountValue || !newCoupon.limit || !newCoupon.startDate) {
      alert('Please fill in all required fields')
      return
    }

    const discount = newCoupon.discountType === 'freeship' 
      ? 'Free Shipping' 
      : newCoupon.discountType === 'percentage'
      ? `${newCoupon.discountValue}%`
      : `JOD ${newCoupon.discountValue}`

    if (editingCoupon) {
      setCoupons(coupons.map(c => 
        c.id === editingCoupon 
          ? { 
              ...c, 
              code: newCoupon.code.toUpperCase(), 
              discount, 
              limit: parseInt(newCoupon.limit),
              status: newCoupon.status,
              startDate: newCoupon.startDate,
              endDate: newCoupon.endDate
            }
          : c
      ))
    } else {
      const coupon = {
        id: String(coupons.length + 1),
        code: newCoupon.code.toUpperCase(),
        discount,
        uses: 0,
        limit: parseInt(newCoupon.limit),
        status: newCoupon.status,
        startDate: newCoupon.startDate,
        endDate: newCoupon.endDate,
      }
      setCoupons([coupon, ...coupons])
    }

    setIsDialogOpen(false)
    setEditingCoupon(null)
    setNewCoupon({ code: '', discountType: 'percentage', discountValue: '', limit: '', status: 'Active', startDate: getTodayDate(), endDate: '' })
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCoupon(null)
    setNewCoupon({ code: '', discountType: 'percentage', discountValue: '', limit: '', status: 'Active', startDate: getTodayDate(), endDate: '' })
  }

  const handleDeleteCoupon = () => {
    if (deletingCoupon) {
      setCoupons(coupons.filter(c => c.id !== deletingCoupon))
      setDeletingCoupon(null)
      setIsDialogOpen(false)
      setEditingCoupon(null)
      setNewCoupon({ code: '', discountType: 'percentage', discountValue: '', limit: '', status: 'Active', startDate: getTodayDate(), endDate: '' })
    }
  }

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Coupon Codes</h1>
          <p className="text-muted-foreground mt-1">Generate and manage coupon codes</p>
        </div>
        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus size={18} />
          New Coupon
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
            <DialogDescription>
              {editingCoupon ? 'Update coupon code details' : 'Generate a new coupon code for your customers'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                placeholder="e.g., SUMMER20"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                className="uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountType">Discount Type</Label>
              <Select
                value={newCoupon.discountType}
                onValueChange={(value) => setNewCoupon({ ...newCoupon, discountType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="freeship">Free Shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newCoupon.discountType !== 'freeship' && (
              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Discount Value {newCoupon.discountType === 'percentage' ? '(%)' : '(JOD)'}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  placeholder={newCoupon.discountType === 'percentage' ? '20' : '50'}
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="limit">Usage Limit</Label>
              <Input
                id="limit"
                type="number"
                placeholder="e.g., 500"
                value={newCoupon.limit}
                onChange={(e) => setNewCoupon({ ...newCoupon, limit: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newCoupon.status}
                onValueChange={(value) => setNewCoupon({ ...newCoupon, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={newCoupon.startDate}
                onChange={(e) => setNewCoupon({ ...newCoupon, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={newCoupon.endDate}
                onChange={(e) => setNewCoupon({ ...newCoupon, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            {editingCoupon && (
              <Button 
                variant="destructive" 
                onClick={() => setDeletingCoupon(editingCoupon)}
              >
                Delete Coupon
              </Button>
            )}
            <div className={`flex gap-3 ${!editingCoupon ? 'ml-auto' : ''}`}>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleCreateCoupon}>
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCoupon} onOpenChange={() => setDeletingCoupon(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the coupon code and remove it from your system.
              Any customers with this code will no longer be able to use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCoupon} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Active Coupons</CardTitle>
          <CardDescription>All your promotional coupon codes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Code</th>
                  <th className="text-left py-3 px-4 font-semibold">Discount</th>
                  <th className="text-left py-3 px-4 font-semibold">Used</th>
                  <th className="text-left py-3 px-4 font-semibold">Limit</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-border hover:bg-card/50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-1 rounded font-mono text-foreground bg-primary/10">{coupon.code}</code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleCopyCode(coupon.code)}
                        >
                          {copiedCode === coupon.code ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">{coupon.discount}</td>
                    <td className="py-3 px-4">{coupon.uses}</td>
                    <td className="py-3 px-4">{coupon.limit}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-3 py-1 rounded font-medium ${
                        coupon.status === 'Active' ? 'bg-green-900/30 text-green-300' : 
                        coupon.status === 'Scheduled' ? 'bg-blue-900/30 text-blue-300' :
                        'bg-gray-900/30 text-gray-300'
                      }`}>
                        {coupon.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCoupon(coupon)}>
                        Edit
                      </Button>
                    </td>
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
