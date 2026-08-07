"use client";

/**
 * Customer profile — backed by the real Users API (GET /admin/users/:id).
 *
 * Falls back to the session-local mock store for customers created during an
 * in-store sale this session (the backend can't create customers yet).
 *
 * BACKEND GAPS surfaced here (see the in-store backend guide):
 * - Channels ("Purchased through") needs per-customer channel aggregates.
 * - "My Garage" needs a saved-vehicles API for customers.
 * - Order history needs GET /admin/orders filtered by customer id.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Mail, Phone, Send, Loader2 } from "lucide-react";
import { userService, type User } from "@/lib/services/user.service";
import {
  mockCustomers,
  getOrdersForCustomer,
  type MockOrderRecord,
} from "@/lib/mock-data/in-store";
import { AccountStatusBadge, ChannelBadge } from "@/components/in-store/badges";

interface ProfileData {
  name: string;
  phone: string;
  email: string | null;
  memberSince: string;
  status: "active" | "unclaimed" | "invited";
  /** Session-local orders (in-store sales completed this session). */
  localOrders: MockOrderRecord[];
}

export default function InStoreCustomerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);

      // Session-local customer (created during an in-store sale)?
      const mock = mockCustomers.find((c) => c.id === customerId);
      if (mock) {
        setProfile({
          name: mock.name,
          phone: mock.phone,
          email: mock.email ?? null,
          memberSince: mock.memberSince,
          status: mock.status,
          localOrders: getOrdersForCustomer(mock.id),
        });
        setIsLoading(false);
        return;
      }

      try {
        const user: User = await userService.getUserById(customerId);
        if (cancelled) return;
        setProfile({
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.email,
          phone: user.phoneNumber || user.phone || "—",
          email: user.email,
          memberSince: user.createdAt,
          // Verified accounts read "Active"; unverified read "Invited".
          status: user.emailVerified ? "active" : "invited",
          localOrders: getOrdersForCustomer(user.id),
        });
      } catch (error: any) {
        if (!cancelled) {
          setLoadError(error.message || "Customer not found");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-2 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
        Loading customer...
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">
            {loadError || "Customer not found"}
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const showResendActivation = profile.status !== "active";

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
                {profile.name}
              </h1>
              <AccountStatusBadge status={profile.status} />
            </div>
            <p className="text-muted-foreground mt-1">
              Customer since{" "}
              {new Date(profile.memberSince).toLocaleDateString()}
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
                Needs a backend endpoint for sending activation links.
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
                <p className="text-sm font-medium">{profile.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium">
                  {profile.email || "Not provided"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Purchased through
              </p>
              <p className="text-sm text-muted-foreground">
                Pending backend — needs per-customer channel data.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* My Garage */}
        <Card>
          <CardHeader>
            <CardTitle>My Garage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-4">
              Pending backend — needs a saved-vehicles API for customers.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order history */}
      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {profile.localOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-6">
              No orders to show. Full history is pending backend — the orders
              API can&apos;t filter by customer yet. In-store sales completed
              this session appear here.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground px-6 pb-3">
                Showing in-store sales from this session only — full
                cross-channel history is pending backend support.
              </p>
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
                    {profile.localOrders.map((order) => (
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
