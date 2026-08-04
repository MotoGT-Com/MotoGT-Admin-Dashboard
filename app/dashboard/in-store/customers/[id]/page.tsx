"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Car, Mail, Phone, Send } from "lucide-react";
import { mockCustomers, getOrdersForCustomer } from "@/lib/mock-data/in-store";
import { AccountStatusBadge, ChannelBadge } from "@/components/in-store/badges";

export default function InStoreCustomerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const customer = mockCustomers.find((c) => c.id === customerId);
  const orders = customer ? getOrdersForCustomer(customer.id) : [];

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Customer not found</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const showResendActivation =
    customer.status === "unclaimed" || customer.status === "invited";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                {customer.name}
              </h1>
              <AccountStatusBadge status={customer.status} />
            </div>
            <p className="text-muted-foreground mt-1">
              Customer since{" "}
              {new Date(customer.memberSince).toLocaleDateString()}
            </p>
          </div>
        </div>

        {showResendActivation && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="outline" disabled className="gap-2 opacity-60">
                    <Send size={16} />
                    Resend activation link
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Activation sending isn&apos;t wired up yet — visual only.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{customer.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium">
                  {customer.email || "Not provided"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Purchased through
              </p>
              <div className="flex flex-wrap gap-1">
                {customer.channels.map((channel) => (
                  <ChannelBadge key={channel} channel={channel} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Garage */}
        <Card>
          <CardHeader>
            <CardTitle>My Garage</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No saved vehicles yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customer.vehicles.map((vehicle, index) => (
                  <div
                    key={`${vehicle.make}-${vehicle.model}-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
                      <Car size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order history */}
      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-6">
              No orders yet across any channel.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-6 font-semibold">
                      Order #
                    </th>
                    <th className="text-left py-3 px-6 font-semibold">
                      Channel
                    </th>
                    <th className="text-left py-3 px-6 font-semibold">
                      Items
                    </th>
                    <th className="text-left py-3 px-6 font-semibold">
                      Total
                    </th>
                    <th className="text-left py-3 px-6 font-semibold">
                      Payment
                    </th>
                    <th className="text-left py-3 px-6 font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border hover:bg-primary/5 transition"
                    >
                      <td className="py-3 px-6 font-medium">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-6">
                        <ChannelBadge channel={order.channel} />
                      </td>
                      <td className="py-3 px-6">{order.itemCount}</td>
                      <td className="py-3 px-6 font-semibold">
                        {order.currency} {order.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-muted-foreground">
                        {order.paymentMethod}
                      </td>
                      <td className="py-3 px-6 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
