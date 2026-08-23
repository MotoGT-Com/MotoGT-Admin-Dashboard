"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSidebar } from "./sidebar-context";
import { useMockRole } from "@/lib/context/mock-role-context";
import {
  ADMIN_SETTINGS_HREF,
  STORE_STAFF_HREFS,
  canAccessAdminSettings,
  canAccessComingSoonPages,
  isComingSoonHref,
} from "@/lib/domain/admin-roles";
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  FolderTree,
  Tag,
  Users,
  Car,
  ListTree,
  Menu,
  X,
  Percent,
  Contact,
  Library,
  FileText,
  Settings,
  Zap,
  Globe,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { STOREFRONT_BASE_URL } from "@/lib/products/catalog-helpers";

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

/** Sales-first IA: Operations (~60%) then Store Management (~40%) then Marketing. */
const navigationGroups: NavGroup[] = [
  {
    label: "Operations",
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
      {
        icon: <Contact size={20} />,
        label: "Customers",
        href: "/dashboard/customers",
      },
      { icon: <Users size={20} />, label: "Online users", href: "/dashboard/users" },
    ],
  },
  {
    label: "Store Management",
    items: [
      {
        icon: <Tag size={20} />,
        label: "Products",
        href: "/dashboard/products",
      },
      {
        icon: <FolderTree size={20} />,
        label: "Categories",
        href: "/dashboard/categories",
      },
      {
        icon: <Layers size={20} />,
        label: "Product Types",
        href: "/dashboard/product-types",
      },
      {
        icon: <Library size={20} />,
        label: "Collections",
        href: "/dashboard/collections",
      },
      { icon: <Car size={20} />, label: "Cars", href: "/dashboard/cars" },
      {
        icon: <ListTree size={20} />,
        label: "Trims",
        href: "/dashboard/trims",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        icon: <Percent size={20} />,
        label: "Promo Codes",
        href: "/dashboard/promo-codes",
      },
      {
        icon: <Zap size={20} />,
        label: "Product Discounts",
        href: "/dashboard/discounts",
      },
      {
        icon: <FileText size={20} />,
        label: "CMS",
        href: "/dashboard/cms",
      },
      {
        icon: <Mail size={20} />,
        label: "Newsletter",
        href: "/dashboard/newsletter",
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        icon: <Settings size={20} />,
        label: "Admin Settings",
        href: ADMIN_SETTINGS_HREF,
      },
    ],
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed } = useSidebar();
  const { role } = useMockRole();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Role-scoped nav: store_staff = counter tools; admin = all except Admin Settings;
  // super_admin = everything.
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.href === ADMIN_SETTINGS_HREF) {
          return canAccessAdminSettings(role);
        }
        if (isComingSoonHref(item.href)) {
          return canAccessComingSoonPages(role);
        }
        if (role === "store_staff") {
          return STORE_STAFF_HREFS.has(item.href);
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-3.5 left-3 z-40 h-9 w-9"
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
          <div
            className={`border-b border-sidebar-border flex ${
              isCollapsed
                ? "flex-col items-center justify-center gap-2 p-4"
                : "flex-col items-stretch px-5 py-4"
            }`}
          >
            <div
              className={`flex w-full items-center ${
                isCollapsed ? "justify-center" : "justify-between gap-2"
              }`}
            >
              {/* The wordmark's "MOTO" letters are white in the primary asset
                  (for dark backgrounds) and black in the -black variant, so
                  each theme gets the readable one. */}
              <Image
                src="/motogt-logo-black.svg"
                alt="MotoGT"
                width={646}
                height={94}
                priority
                className={`dark:hidden ${
                  isCollapsed
                    ? "h-6 w-6 object-contain object-left"
                    : "h-6 w-auto max-w-[calc(100%-2.5rem)]"
                }`}
              />
              <Image
                src="/motogt-logo.svg"
                alt="MotoGT"
                width={646}
                height={94}
                priority
                className={`hidden dark:block ${
                  isCollapsed
                    ? "h-6 w-6 object-contain object-left"
                    : "h-6 w-auto max-w-[calc(100%-2.5rem)]"
                }`}
              />
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a
                    href={STOREFRONT_BASE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open MotoGT website"
                    title="Open MotoGT website"
                  >
                    <Globe size={16} />
                  </a>
                </Button>
              )}
            </div>
            {isCollapsed ? (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                asChild
              >
                <a
                  href={STOREFRONT_BASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open MotoGT website"
                  title="Open MotoGT website"
                >
                  <Globe size={16} />
                </a>
              </Button>
            ) : (
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.2em] mt-1.5">
                Admin Panel
              </p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6">
            {visibleGroups.map((group) => (
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
          className="fixed inset-0 bg-black/50 z-[25] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
