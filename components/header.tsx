"use client"

import { Bell, Moon, Sun, PanelLeft, PanelRight, User, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { useSidebar } from "./sidebar-context"
import { useAuth } from "@/lib/context/auth-context"
import { useMockRole } from "@/lib/context/mock-role-context"
import {
  ADMIN_ROLES,
  ADMIN_ROLE_LABELS,
  canAccessAdminSettings,
  normalizeAdminRole,
  type AdminRole,
} from "@/lib/domain/admin-roles"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function Header() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)
  const { isCollapsed, toggleCollapse } = useSidebar()
  const { user, logout } = useAuth()
  const { role, setRole } = useMockRole()
  const authRole = normalizeAdminRole(user?.role)
  const canPreviewRoles = authRole
    ? canAccessAdminSettings(authRole)
    : false

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setThemeState(newTheme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const initialTheme = savedTheme || 'light'
    setThemeState(initialTheme)
    document.documentElement.classList.add(initialTheme)
  }, [])

  if (!mounted) return null

  return (
    <header className="fixed top-0 right-0 left-0 border-b border-border bg-card h-16 z-20" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
      <div className="flex items-center justify-between px-4 sm:px-6 h-full pl-14 md:pl-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="hidden md:flex"
        >
          {isCollapsed ? <PanelLeft size={20} /> : <PanelRight size={20} />}
        </Button>

        {/* Right side controls */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Super Admin only — preview nav as other roles */}
          {canPreviewRoles ? (
            <div className="hidden sm:flex items-center gap-2 rounded-md border border-dashed border-border px-2 py-1">
              <span className="text-xs text-muted-foreground">Preview as</span>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as AdminRole)}
              >
                <SelectTrigger className="h-7 w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ADMIN_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Notifications — not wired yet */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Coming soon</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Live order alerts aren&apos;t set up yet. Check back later.
                </p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </Button>

          {/* Profile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User size={18} className="text-primary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || user?.email || "Admin"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.role
                      ? ADMIN_ROLE_LABELS[user.role] ?? user.role
                      : "Administrator"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
