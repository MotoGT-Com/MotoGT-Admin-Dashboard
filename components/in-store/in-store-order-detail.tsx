"use client";

/**
 * Detail view for session-local in-store orders (ids prefixed "ins-",
 * recorded by the New Sale flow via recordInStoreOrder). The regular
 * /dashboard/orders/[id] page is backend-bound, so it delegates these
 * mock orders here instead of calling the order service.
 */

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { findMockOrderById, mockCustomers } from "@/lib/mock-data/in-store";
import { ChannelBadge } from "@/components/in-store/badges";

export function InStoreOrderDetail() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const order = findMockOrderById(orderId);
  const customer = order
    ? mockCustomers.find((c) => c.id === order.customerId)
    : undefined;

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 max-w-sm">
          <p className="font-medium">Order not found</p>
          <p className="text-sm text-muted-foreground">
            In-store orders are mock data and only live for the current
            session — a page reload clears them.
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = order.subtotal ?? order.total;
  const discount = order.discount ?? 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">
              Order #{order.orderNumber}
            </h1>
            <ChannelBadge channel="in_store" />
          </div>
          <p className="text-muted-foreground mt-1">
            {new Date(order.createdAt).toLocaleString()} · Paid by{" "}
            {order.paymentMethod}
          </p>
        </div>
      </div>

      {/* Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
                <UserIcon size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {customer?.name ?? "Unknown customer"}
                </p>
                {customer?.phone && (
                  <p className="text-sm text-muted-foreground">
                    {customer.phone}
                  </p>
                )}
              </div>
            </div>
            {customer && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/in-store/customers/${customer.id}`}>
                  View profile
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items & totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items && order.items.length > 0 ? (
            <div className="space-y-3">
              {order.items.map((line) => (
                <div
                  key={line.productId}
                  className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {line.quantity} × JOD {line.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    JOD {(line.unitPrice * line.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {order.itemCount} item{order.itemCount === 1 ? "" : "s"} — line
              items not available for this order.
            </p>
          )}

          <div className="space-y-1 pt-3 border-t border-border">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>JOD {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Discount</span>
                <span>- JOD {discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1">
              <span>Total</span>
              <span>JOD {order.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={() => toast.info("Receipt printing isn't wired up yet (mock).")}
      >
        <Printer size={16} className="mr-2" />
        Print receipt
      </Button>
    </div>
  );
}
