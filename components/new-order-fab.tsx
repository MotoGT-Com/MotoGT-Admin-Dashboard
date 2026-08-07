"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Plus, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Global New Order FAB — sales-first entry point for creating orders.
 * Opens a short channel menu so the unlabeled "+" isn't ambiguous.
 * Hidden on the New Order page itself.
 */
export function NewOrderFab() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard/orders/new")) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-md"
          aria-label="New order — choose channel"
          title="New order"
        >
          <Plus size={24} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" sideOffset={12} className="w-56">
        <DropdownMenuLabel>New order</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/orders/new?channel=in_store" className="gap-2">
            <Store className="h-4 w-4" />
            In-Store sale
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/orders/new?channel=whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp order
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/orders/new?channel=online" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Online order
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
