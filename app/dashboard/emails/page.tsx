"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'

const emailTemplates = [
  { id: '1', name: 'Order Confirmation', type: 'Transactional', status: 'Active', lastModified: '2024-01-05' },
  { id: '2', name: 'Out of Stock Alert', type: 'Notification', status: 'Active', lastModified: '2023-12-20' },
  { id: '3', name: 'Promotional Offer', type: 'Marketing', status: 'Active', lastModified: '2024-01-10' },
  { id: '4', name: 'Abandoned Cart', type: 'Marketing', status: 'Draft', lastModified: '2024-01-08' },
]

export default function EmailsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Email Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage email templates and notifications</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          New Template
        </Button>
      </div>

      {/* Email Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {emailTemplates.map((template) => (
          <Card key={template.id} className="hover:border-accent/50 transition">
            <CardHeader>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  template.status === 'Active' ? 'bg-green-900/30 text-green-300' : 'bg-yellow-900/30 text-yellow-300'
                }`}>
                  {template.status}
                </span>
                <span className="text-xs text-muted-foreground">{template.lastModified}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">Edit</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
