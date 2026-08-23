import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ThemeProvider } from "next-themes"
import { SidebarProvider } from "@/components/sidebar-context"
import { ProtectedRoute } from "@/components/protected-route"
import { MockRoleProvider } from "@/lib/context/mock-role-context"
import { NewOrderFab } from "@/components/new-order-fab"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <MockRoleProvider>
          <SidebarProvider>
            <div className="flex h-screen bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
                <Header />
                <main className="flex-1 overflow-auto pt-16 pb-24 sm:pb-6 safe-area-pb">
                  <div className="p-4 md:p-6">{children}</div>
                </main>
              </div>
              <NewOrderFab />
            </div>
          </SidebarProvider>
        </MockRoleProvider>
      </ThemeProvider>
    </ProtectedRoute>
  )
}
