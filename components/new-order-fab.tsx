"use client";

import { usePathname } from "next/navigation";
import { NewOrderButton } from "@/components/orders/new-order-button";

/**
 * Global New Order FAB — sales-first entry point.
 * Hidden on the New Order page itself.
 */
export function NewOrderFab() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard/orders/new")) {
    return null;
  }

  return <NewOrderButton variant="fab" />;
}
