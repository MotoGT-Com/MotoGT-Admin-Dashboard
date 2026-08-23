"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

type NewOrderButtonVariant = "toolbar" | "fab";

interface NewOrderButtonProps {
  variant?: NewOrderButtonVariant;
  className?: string;
}

/**
 * New order control.
 * - Desktop hover: In-Store / WhatsApp options
 * - Mobile FAB: tap opens channel menu
 * - Toolbar click (desktop): New Order page (In-Store by default)
 */
export function NewOrderButton({
  variant = "toolbar",
  className,
}: NewOrderButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarsePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 150);
  };

  const isFab = variant === "fab";

  const goToNewOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    // On touch / FAB: open channel picker instead of navigating immediately.
    if (coarsePointer || isFab) {
      setOpen(true);
      return;
    }
    setOpen(false);
    router.push("/dashboard/orders/new?channel=in_store");
  };

  return (
    <div
      className={cn(
        isFab &&
          "fixed bottom-6 right-6 z-40 max-sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))]",
        className,
      )}
      onMouseEnter={!coarsePointer ? openMenu : undefined}
      onMouseLeave={!coarsePointer ? scheduleClose : undefined}
    >
      <DropdownMenu open={open} onOpenChange={setOpen} modal={coarsePointer || isFab}>
        <DropdownMenuTrigger asChild>
          <Button
            size="default"
            className={cn(
              isFab
                ? "h-12 gap-2 rounded-full px-5 shadow-lg border border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 max-sm:h-14 max-sm:w-14 max-sm:px-0 max-sm:gap-0"
                : "gap-2",
            )}
            aria-label="New order — choose channel"
            title="New order"
            onClick={goToNewOrder}
            onPointerDown={(e) => {
              // Stop Radix from toggling open on click/press (desktop hover path).
              if (!coarsePointer && !isFab) {
                e.preventDefault();
              }
            }}
          >
            <Plus size={isFab ? 18 : 16} className="shrink-0" />
            <span
              className={cn(
                isFab && "text-sm font-semibold tracking-tight max-sm:sr-only",
              )}
            >
              New order
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={12}
          className="w-56"
          onCloseAutoFocus={(e) => e.preventDefault()}
          onMouseEnter={!coarsePointer ? openMenu : undefined}
          onMouseLeave={!coarsePointer ? scheduleClose : undefined}
        >
          <DropdownMenuLabel>New order</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/orders/new?channel=in_store"
              className="gap-2"
              onClick={() => setOpen(false)}
            >
              <Store className="h-4 w-4" />
              In-Store sale
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard/orders/new?channel=whatsapp"
              className="gap-2"
              onClick={() => setOpen(false)}
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp order
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
