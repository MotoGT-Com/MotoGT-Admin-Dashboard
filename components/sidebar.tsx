"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSidebar } from "./sidebar-context";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Tag,
  Users,
  Car,
  FileText,
  Zap,
  TicketIcon,
  Settings,
  ChevronDown,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  UserCog,
  Shield,
  ScrollText,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const navigationGroups: NavGroup[] = [
  {
    label: "General",
    items: [
      {
        icon: <LayoutDashboard size={20} />,
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        icon: <ShoppingCart size={20} />,
        label: "Orders",
        href: "/dashboard/orders",
      },
      { icon: <Users size={20} />, label: "Users", href: "/dashboard/users" },
    ],
  },
  {
    label: "Store Management",
    items: [
      // { icon: <Layers size={20} />, label: "Categories", href: "/dashboard/categories" },
      // { icon: <Tag size={20} />, label: "Products", href: "/dashboard/products" },
      // { icon: <FileText size={20} />, label: "Collections", href: "/dashboard/collections" },
      { icon: <Car size={20} />, label: "Cars", href: "/dashboard/cars" },
    ],
  },
  // {
  //   label: "Content Management",
  //   items: [
  //     { icon: <FileText size={20} />, label: "CMS", href: "/dashboard/cms" },
  //     { icon: <Shield size={20} />, label: "Legal CMS", href: "/dashboard/legal-cms" },
  //   ],
  // },
  // {
  //   label: "Marketing",
  //   items: [
  //     { icon: <TicketIcon size={20} />, label: "Coupon Codes", href: "/dashboard/coupons" },
  //     { icon: <Zap size={20} />, label: "Discounts", href: "/dashboard/discounts" },
  //   ],
  // },
  // {
  //   label: "Configuration",
  //   items: [
  //     { icon: <UserCog size={20} />, label: "Admin Management", href: "/dashboard/admins" },
  //     // { icon: <Settings size={20} />, label: "Settings", href: "/dashboard/settings" },
  //   ],
  // },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-40"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 ${
          isCollapsed ? "w-16" : "w-64"
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out transform z-30 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="p-6 border-b border-sidebar-border flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-sidebar-foreground text-sm">
                  MotoGT Admin
                </h1>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-3">
                    {group.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive(item.href) ? "default" : "ghost"}
                        className={`w-full ${
                          isCollapsed
                            ? "justify-center px-2"
                            : "justify-start gap-3"
                        } text-sm ${
                          isActive(item.href)
                            ? "bg-primary text-white"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.icon}
                        {!isCollapsed && <span className="">{item.label}</span>}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
