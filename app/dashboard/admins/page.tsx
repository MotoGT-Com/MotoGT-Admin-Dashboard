"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface Admin {
  id: string
  name: string
  email: string
  role: 'Super Administrator' | 'Administrator' | 'Customer Support'
  lastLogin: string
  createdAt: string
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: '1',
      name: 'Amr Halawani',
      email: 'amr@bgcrypto.io',
      role: 'Administrator',
      lastLogin: '5 May 2022',
      createdAt: '2022-01-15'
    },
    {
      id: '2',
      name: 'Ziad Mahfouz',
      email: 'ziad@bgcrypto.io',
      role: 'Super Administrator',
      lastLogin: '5 May 2022',
      createdAt: '2022-01-10'
    },
    {
      id: '3',
      name: 'Ahmad Alkurdi',
      email: 'ahmad@motogt.com',
      role: 'Customer Support',
      lastLogin: '5 May 2022',
      createdAt: '2022-02-20'
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [deleteAdminId, setDeleteAdminId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Administrator' as Admin['role'],
    password: ''
  })

  const handleOpenDialog = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin)
      setFormData({
        name: admin.name,
        email: admin.email,
        role: admin.role,
        password: ''
      })
    } else {
      setEditingAdmin(null)
      setFormData({
        name: '',
        email: '',
        role: 'Administrator',
        password: ''
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingAdmin(null)
    setFormData({
      name: '',
      email: '',
      role: 'Administrator',
      password: ''
    })
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      alert('Please fill in all required fields')
      return
    }

    if (editingAdmin) {
      setAdmins(admins.map(admin => 
        admin.id === editingAdmin.id
          ? { ...admin, name: formData.name, email: formData.email, role: formData.role }
          : admin
      ))
    } else {
      const newAdmin: Admin = {
        id: `admin-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        lastLogin: 'Never',
        createdAt: new Date().toISOString().split('T')[0]
      }
      setAdmins([...admins, newAdmin])
    }

    handleCloseDialog()
  }

  const handleDelete = () => {
    if (deleteAdminId) {
      setAdmins(admins.filter(admin => admin.id !== deleteAdminId))
      setDeleteAdminId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-muted-foreground mt-1">Manage admin users and their permissions</p>
        </div>
        <Button className="gap-2" onClick={() => handleOpenDialog()}>
          <Plus size={18} />
          New Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Administrators</CardTitle>
          <CardDescription>View and manage admin users with different permission levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold text-muted-foreground uppercase text-xs">Name</th>
                  <th className="text-left py-4 px-4 font-semibold text-muted-foreground uppercase text-xs">Email</th>
                  <th className="text-left py-4 px-4 font-semibold text-muted-foreground uppercase text-xs">Role</th>
                  <th className="text-left py-4 px-4 font-semibold text-muted-foreground uppercase text-xs">Last Login</th>
                  <th className="text-left py-4 px-4 font-semibold text-muted-foreground uppercase text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-border hover:bg-accent/5">
                    <td className="py-4 px-4 font-medium">{admin.name}</td>
                    <td className="py-4 px-4 text-muted-foreground">{admin.email}</td>
                    <td className="py-4 px-4 text-muted-foreground">{admin.role}</td>
                    <td className="py-4 px-4 text-muted-foreground">{admin.lastLogin}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(admin)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteAdminId(admin.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Admin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAdmin ? 'Edit Admin' : 'Add New Admin'}</DialogTitle>
            <DialogDescription>
              {editingAdmin ? 'Update admin information and permissions' : 'Create a new admin user with specific permissions'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@motogt.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value: Admin['role']) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Super Administrator">Super Administrator</SelectItem>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Customer Support">Customer Support</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.role === 'Super Administrator' && 'Full access to all features and settings'}
                {formData.role === 'Administrator' && 'Manage products, orders, and users'}
                {formData.role === 'Customer Support' && 'Handle customer inquiries, orders and users'}
              </p>
            </div>

            {!editingAdmin && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">Admin will receive an email to set up their account</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingAdmin ? 'Update Admin' : 'Create Admin'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAdminId} onOpenChange={() => setDeleteAdminId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive" size={20} />
              Delete Admin User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this admin user? This action cannot be undone and the user will lose all access to the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
