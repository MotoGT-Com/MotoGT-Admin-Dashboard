import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ThemeProvider } from "next-themes"
import { SidebarProvider } from "@/components/sidebar-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
            <Header />
            <main className="flex-1 overflow-auto pt-16">
              <div className="p-6">{children}</div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
