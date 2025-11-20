"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, ChevronDown, MoreHorizontal, Eye, ShieldCheck, ShieldX } from 'lucide-react'
import { useState } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const initialUsers = [
  { id: 'b2571c4c-3766-4...', name: 'Amr Test', email: 'thehalawani109@gmail.com', country: 'Jordan, Amman', phone: '+(962) 779 453 525', orders: 12, totalSpent: 500, role: 'Customer', status: 'Active', verified: true, joined: '2025-11-16 11:56' },
  { id: 'b2571c4c-3766-4...', name: 'Amr Test', email: 'thehalawani109@gmail.com', country: 'Jordan, Amman', phone: '+(962) 779 453 525', orders: 12, totalSpent: 500, role: 'Customer', status: 'Active', verified: true, joined: '2025-11-16 11:56' },
  { id: 'b2571c4c-3766-4...', name: 'Amr Test', email: 'thehalawani109@gmail.com', country: 'Jordan, Amman', phone: '+(962) 779 453 525', orders: 12, totalSpent: 500, role: 'Customer', status: 'Active', verified: true, joined: '2025-11-16 11:56' },
  { id: 'b2571c4c-3766-4...', name: 'Amr Test', email: 'thehalawani109@gmail.com', country: 'Jordan, Amman', phone: '+(962) 779 453 525', orders: 12, totalSpent: 500, role: 'Customer', status: 'Active', verified: true, joined: '2025-11-16 11:56' },
  { id: 'b2571c4c-3766-4...', name: 'Amr Test', email: 'thehalawani109@gmail.com', country: 'Jordan, Amman', phone: '+(962) 779 453 525', orders: 12, totalSpent: 500, role: 'Customer', status: 'Active', verified: false, joined: '2025-11-16 11:56' },
  { id: 'b2571c4c-3766-4...', name: 'Amr Test', email: 'thehalawani109@gmail.com', country: 'Jordan, Amman', phone: '+(962) 779 453 525', orders: 12, totalSpent: 500, role: 'Customer', status: 'Active', verified: true, joined: '2025-11-16 11:56' },
  { id: 'b2571c4c-3766-4...', name: 'Amr Test', email: 'thehalawani109@gmail.com', country: 'Jordan, Amman', phone: '+(962) 779 453 525', orders: 12, totalSpent: 500, role: 'Customer', status: 'Active', verified: false, joined: '2025-11-16 11:56' },
  { id: 'b2571c4c-3766-4f...', name: 'Amr Test', email: 'thehalawani109@gmail.com', country: 'Jordan, Amman', phone: '+(962) 779 453 525', orders: 12, totalSpent: 500, role: 'Customer', status: 'Active', verified: true, joined: '2025-11-16 11:56' },
  { id: 'b2571c4c-3766-4...', name: 'Amr Test', email: 'thehalawani109@gmail.com', country: 'Jordan, Amman', phone: '+(962) 779 453 525', orders: 12, totalSpent: 500, role: 'Customer', status: 'Active', verified: true, joined: '2025-11-16 11:56' },
  { id: 'b2571c4c-3766-4...', name: 'Amr Test', email: 'thehalawani109@gmail.com', country: 'Jordan, Amman', phone: '+(962) 779 453 525', orders: 12, totalSpent: 500, role: 'Customer', status: 'Active', verified: true, joined: '2025-11-16 11:56' },
]

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [countryFilters, setCountryFilters] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    email: true,
    country: true,
    phone: true,
    orders: true,
    totalSpent: true,
    emailVerified: true,
    joined: true,
  })

  const toggleVerification = (userId: string, index: number) => {
    setUsers(prevUsers => {
      const newUsers = [...prevUsers]
      const actualIndex = (currentPage - 1) * rowsPerPage + index
      newUsers[actualIndex] = {
        ...newUsers[actualIndex],
        verified: !newUsers[actualIndex].verified
      }
      return newUsers
    })
  }

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
    setCurrentPage(1)
  }

  const toggleCountryFilter = (country: string) => {
    setCountryFilters(prev => 
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    )
    setCurrentPage(1)
  }

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = 
      user.email.toLowerCase().includes(query) ||
      user.name.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query) ||
      user.phone.toLowerCase().includes(query)
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(user.status)
    const matchesCountry = countryFilters.length === 0 || countryFilters.includes(user.country)
    return matchesSearch && matchesStatus && matchesCountry
  })

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)
  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User List</h1>
        <p className="text-muted-foreground mt-1">Manage your users and their roles here.</p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Input 
            placeholder="Filter by email..." 
            className="bg-background border-border" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={statusFilters.includes("Active")}
              onCheckedChange={() => toggleStatusFilter("Active")}
            >
              Active
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilters.includes("Inactive")}
              onCheckedChange={() => toggleStatusFilter("Inactive")}
            >
              Inactive
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Country
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={countryFilters.includes("Jordan, Amman")}
              onCheckedChange={() => toggleCountryFilter("Jordan, Amman")}
            >
              Jordan, Amman
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={countryFilters.includes("UAE, Dubai")}
              onCheckedChange={() => toggleCountryFilter("UAE, Dubai")}
            >
              UAE, Dubai
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              View
              <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-2 text-sm font-semibold">Toggle columns</div>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.id}
              onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, id: checked }))}
            >
              ID
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.name}
              onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, name: checked }))}
            >
              Name
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.email}
              onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, email: checked }))}
            >
              Email
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.country}
              onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, country: checked }))}
            >
              Country
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.phone}
              onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, phone: checked }))}
            >
              Phone
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.orders}
              onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, orders: checked }))}
            >
              Orders
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.totalSpent}
              onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, totalSpent: checked }))}
            >
              Total Spent
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.emailVerified}
              onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, emailVerified: checked }))}
            >
              Email Verified
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.joined}
              onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, joined: checked }))}
            >
              Joined
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {visibleColumns.id && <th className="text-left py-4 px-6 font-semibold">ID</th>}
                  {visibleColumns.name && <th className="text-left py-4 px-6 font-semibold">Name</th>}
                  {visibleColumns.email && <th className="text-left py-4 px-6 font-semibold">Email</th>}
                  {visibleColumns.country && <th className="text-left py-4 px-6 font-semibold">Country</th>}
                  {visibleColumns.phone && <th className="text-left py-4 px-6 font-semibold">Phone</th>}
                  {visibleColumns.orders && <th className="text-left py-4 px-6 font-semibold">Orders</th>}
                  {visibleColumns.totalSpent && <th className="text-left py-4 px-6 font-semibold">Total Spent</th>}
                  {visibleColumns.emailVerified && <th className="text-left py-4 px-6 font-semibold">Email Verified</th>}
                  {visibleColumns.joined && <th className="text-left py-4 px-6 font-semibold">Joined</th>}
                  <th className="text-center py-4 px-6 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user, index) => (
                  <tr key={`${user.id}-${index}`} className="border-b border-border hover:bg-accent/5 transition">
                    {visibleColumns.id && <td className="py-4 px-6 text-muted-foreground text-xs font-mono">{user.id}</td>}
                    {visibleColumns.name && <td className="py-4 px-6 font-medium text-foreground">{user.name}</td>}
                    {visibleColumns.email && <td className="py-4 px-6 text-muted-foreground">{user.email}</td>}
                    {visibleColumns.country && <td className="py-4 px-6 text-muted-foreground">{user.country}</td>}
                    {visibleColumns.phone && <td className="py-4 px-6 text-muted-foreground">{user.phone}</td>}
                    {visibleColumns.orders && <td className="py-4 px-6 text-foreground">{user.orders}</td>}
                    {visibleColumns.totalSpent && <td className="py-4 px-6 text-foreground">JOD {user.totalSpent}</td>}
                    {visibleColumns.emailVerified && (
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.verified 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {user.verified ? 'Yes' : 'No'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.joined && <td className="py-4 px-6 text-muted-foreground">{user.joined}</td>}
                    <td className="py-4 px-6 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => router.push(`/dashboard/users/${user.id}`)}
                          >
                            <Eye size={16} />
                            View Details
                          </DropdownMenuItem>
                          {user.verified ? (
                            <DropdownMenuItem 
                              className="gap-2" 
                              onClick={() => toggleVerification(user.id, index)}
                            >
                              <ShieldX size={16} />
                              Unverify Email
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="gap-2" 
                              onClick={() => toggleVerification(user.id, index)}
                            >
                              <ShieldCheck size={16} />
                              Verify Email
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="flex items-center gap-2">
              <select 
                className="bg-background border border-border rounded px-3 py-2 text-sm"
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-muted-foreground">Rows per page</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                >
                  «
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  ‹
                </Button>
                <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
                  {currentPage}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  ›
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                >
                  »
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
