"use client"

import { Bell, Search, Settings, User, Moon, Sun, PanelLeft, PanelRight, ShoppingCart, Package, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import Link from "next/link"

type Notification = {
  id: string
  type: 'new_order' | 'order_update'
  orderId: string
  message: string
  timestamp: string
  read: boolean
}

export function Header() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)
  const { isCollapsed, toggleCollapse } = useSidebar()

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'new_order',
      orderId: 'JO-2025-000045',
      message: 'New order from Ahmad Alkurdi',
      timestamp: '2 minutes ago',
      read: false
    },
    {
      id: '2',
      type: 'order_update',
      orderId: 'JO-2025-000039',
      message: 'Order delivered to customer',
      timestamp: '15 minutes ago',
      read: false
    },
    {
      id: '3',
      type: 'new_order',
      orderId: 'JO-2025-000044',
      message: 'New order from Jamal Amir',
      timestamp: '1 hour ago',
      read: false
    },
    {
      id: '4',
      type: 'order_update',
      orderId: 'JO-2025-000038',
      message: 'Payment confirmed for order',
      timestamp: '2 hours ago',
      read: true
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

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
      <div className="flex items-center justify-between px-6 h-full">
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
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-4 py-2">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <Link key={notification.id} href={`/dashboard/orders/${notification.orderId}`}>
                      <DropdownMenuItem 
                        className={`flex items-start gap-3 p-4 cursor-pointer ${!notification.read ? 'bg-accent/50' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className={`mt-0.5 ${notification.type === 'new_order' ? 'text-primary' : 'text-blue-500'}`}>
                          {notification.type === 'new_order' ? (
                            <ShoppingCart size={18} />
                          ) : (
                            <Package size={18} />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">Order #{notification.orderId}</p>
                          <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        )}
                      </DropdownMenuItem>
                    </Link>
                  ))
                )}
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
              <DropdownMenuItem className="cursor-pointer">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
