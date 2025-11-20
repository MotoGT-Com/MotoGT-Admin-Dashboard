"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'

const pages = [
  { id: '1', title: 'Homepage', status: 'Published', modified: '2024-01-10' },
  { id: '2', title: 'About Us', status: 'Published', modified: '2024-01-05' },
  { id: '3', title: 'Blog - Top Upgrades', status: 'Draft', modified: '2024-01-14' },
  { id: '4', title: 'Contact', status: 'Published', modified: '2023-12-20' },
]

export default function CMSPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">CMS</h1>
          <p className="text-muted-foreground mt-1">Manage website content and pages</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          New Page
        </Button>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <Card key={page.id} className="hover:border-accent/50 transition">
            <CardHeader>
              <CardTitle>{page.title}</CardTitle>
              <CardDescription>Modified {page.modified}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  page.status === 'Published' 
                    ? 'bg-green-900/30 text-green-300' 
                    : 'bg-yellow-900/30 text-yellow-300'
                }`}>
                  {page.status}
                </span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
