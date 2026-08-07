"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orderService } from "@/lib/services/order.service";
import { formatMoney, formatStatusLabel } from "@/lib/dashboard-utils";
import {
  channelLabel,
  type MockListOrder,
} from "@/lib/mock-data/orders-list";

interface OrderQuickViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  orderType: "user" | "guest";
  fallbackCurrency: string;
  /** When set (mock list pass), skip the API and render this snapshot. */
  mockOrder?: MockListOrder | null;
}

function resolveCurrency(order: any, fallback: string): string {
  return order?.currency || order?.currencyCode || fallback || "JOD";
}

export function OrderQuickViewSheet({
  open,
  onOpenChange,
  orderId,
  orderType,
  fallbackCurrency,
  mockOrder,
}: OrderQuickViewSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<any>(null);

  useEffect(() => {
    if (!open || !orderId) return;
    if (mockOrder) {
      setPayload(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setPayload(null);
      try {
        const data =
          orderType === "guest"
            ? await orderService.getGuestOrderById(orderId)
            : await orderService.getOrderById(orderId);
        if (!cancelled) setPayload(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load order"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, orderId, orderType, mockOrder]);

  const detailHref =
    orderType === "guest"
      ? `/dashboard/orders/${orderId}?guest=true`
      : `/dashboard/orders/${orderId}`;

  if (mockOrder) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order {mockOrder.orderNumber}</SheetTitle>
            <SheetDescription>
              Quick view — stay in the list while triaging
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {formatStatusLabel(mockOrder.status)}
              </Badge>
              <Badge variant="secondary">
                {mockOrder.orderType === "guest" ? "Guest" : "User"}
              </Badge>
              <Badge variant="outline">{channelLabel(mockOrder.channel)}</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{mockOrder.customerName}</p>
              <p className="text-muted-foreground">{mockOrder.customerEmail}</p>
              <p className="text-muted-foreground">{mockOrder.customerPhone}</p>
              <p className="text-muted-foreground">City: {mockOrder.city}</p>
              {mockOrder.staffMember ? (
                <p className="text-muted-foreground">
                  Staff: {mockOrder.staffMember}
                </p>
              ) : null}
            </div>
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">
                  {formatMoney(mockOrder.totalAmount, mockOrder.currency)}
                </span>
              </div>
              {mockOrder.discountAmount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>
                    {mockOrder.discountCode} (−
                    {formatMoney(mockOrder.discountAmount, mockOrder.currency)})
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(mockOrder.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{mockOrder.itemCount}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Line items</p>
              <ul className="space-y-2">
                {mockOrder.lineItems.map((item) => (
                  <li
                    key={item.sku}
                    className="flex justify-between gap-2 text-sm border-b border-border/60 pb-2"
                  >
                    <span className="min-w-0 truncate">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {item.sku}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <SheetFooter className="mt-8">
            <Button asChild className="w-full" disabled={!orderId}>
              <Link href={detailHref}>Open full details</Link>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  const order = payload?.order ?? payload;
  const items = payload?.items ?? order?.items ?? [];
  const currency = resolveCurrency(order, fallbackCurrency);
  const customerName =
    orderType === "guest"
      ? "Guest"
      : `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""}`.trim() ||
        "—";
  const email =
    orderType === "guest" ? order?.guestEmail : order?.customer?.email;
  const phone =
    orderType === "guest" ? order?.guestPhone : order?.customer?.phone;
  const city =
    order?.shippingAddress?.city || order?.shipping_address?.city || null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {order?.orderNumber ? `Order ${order.orderNumber}` : "Order"}
          </SheetTitle>
          <SheetDescription>
            Quick view — stay in the list while triaging
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : order ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {formatStatusLabel(order.status)}
                </Badge>
                <Badge variant="secondary">
                  {orderType === "guest" ? "Guest" : "User"}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{customerName}</p>
                {email ? (
                  <p className="text-muted-foreground">{email}</p>
                ) : null}
                {phone ? (
                  <p className="text-muted-foreground">{phone}</p>
                ) : null}
                {city ? (
                  <p className="text-muted-foreground">City: {city}</p>
                ) : null}
              </div>
              <div className="rounded-lg border p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">
                    {formatMoney(Number(order.totalAmount || 0), currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{items.length || order.itemCount || "—"}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <SheetFooter className="mt-8">
          <Button asChild className="w-full" disabled={!orderId}>
            <Link href={detailHref}>Open full details</Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
