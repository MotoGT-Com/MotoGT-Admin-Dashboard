"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  toggleCollapse: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev)
  }

  useEffect(() => {
    const updateSidebarWidth = () => {
      if (window.innerWidth >= 768) {
        document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '64px' : '256px')
      } else {
        document.documentElement.style.setProperty('--sidebar-width', '0px')
      }
    }
    
    updateSidebarWidth()
    window.addEventListener('resize', updateSidebarWidth)
    
    return () => window.removeEventListener('resize', updateSidebarWidth)
  }, [isCollapsed])

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
