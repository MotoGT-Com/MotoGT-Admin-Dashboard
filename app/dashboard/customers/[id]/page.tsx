"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Send, Loader2 } from "lucide-react";
import { LoadingState } from "@/components/loading-state";
import { toast } from "sonner";
import { userService, type User } from "@/lib/services/user.service";
import { orderService, type Order } from "@/lib/services/order.service";
import {
  AccountStatusBadge,
  ChannelBadge,
  ChannelBadgeList,
} from "@/components/in-store/badges";
import {
  displayCustomerEmail,
  isPlaceholderEmail,
} from "@/lib/customers/email";
import type { AccountStatus } from "@/lib/domain/channels";
import { formatMoney, parseAmount } from "@/lib/dashboard-utils";
import { resolveStoreId } from "@/lib/stores/resolve-store-id";

interface ProfileData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  rawEmail: string | null;
  memberSince: string;
  status: AccountStatus;
  channels: string[];
  totalOrders: number;
}

function resolveAccountStatus(user: User): AccountStatus {
  if (user.accountStatus) return user.accountStatus;
  return user.emailVerified || user.isEmailVerified ? "active" : "invited";
}

function paymentLabel(order: Order): string {
  const type = order.paymentMethod?.type;
  if (!type) return "—";
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const user = await userService.getUserById(customerId);
      setProfile({
        id: user.id,
        name:
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          displayCustomerEmail(user.email) ||
          "Customer",
        phone: user.phoneNumber || user.phone || "—",
        email: displayCustomerEmail(user.email),
        rawEmail: user.email ?? null,
        memberSince: user.createdAt,
        status: resolveAccountStatus(user),
        channels: (user.channels ?? []) as string[],
        totalOrders: user.totalOrders ?? 0,
      });
    } catch (error: any) {
      setLoadError(error.message || "Customer not found");
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const storeId = await resolveStoreId();
      const result = await orderService.getOrders({
        storeId,
        customerId,
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setOrders(result.items);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadProfile();
    loadOrders();
  }, [loadProfile, loadOrders]);

  const handleResendInvite = async () => {
    if (!profile?.rawEmail || isPlaceholderEmail(profile.rawEmail)) {
      toast.error("Add a real email before sending an invite");
      return;
    }
    setResending(true);
    try {
      await userService.resendInvite(customerId);
      toast.success("Invite sent");
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to resend invite");
    } finally {
      setResending(false);
    }
  };

  if (isLoading) {
    return <LoadingState variant="full" label="Loading customer…" />;
  }

  if (loadError || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">{loadError || "Customer not found"}</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const canInvite =
    Boolean(profile.email) && profile.status !== "active";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground min-w-0 break-words">
                {profile.name}
              </h1>
              <AccountStatusBadge status={profile.status} />
            </div>
            <p className="text-muted-foreground mt-1">
              Customer since{" "}
              {new Date(profile.memberSince).toLocaleDateString()}
              {" · "}
              {profile.totalOrders} order
              {profile.totalOrders === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {canInvite && (
          <Button
            variant="outline"
            className="gap-2"
            disabled={resending}
            onClick={handleResendInvite}
          >
            {resending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Resend invite
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <p className="text-sm text-muted-foreground mb-2">
                Purchased through
              </p>
              <ChannelBadgeList channels={profile.channels} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Garage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-4">
              Saved vehicles will appear here once garage APIs ship (P2).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {ordersLoading ? (
            <LoadingState label="Loading orders…" className="py-6" />
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-6">
              No orders yet for this customer.
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
                    <th className="text-left py-3 px-6 font-semibold">Items</th>
                    <th className="text-left py-3 px-6 font-semibold">Total</th>
                    <th className="text-left py-3 px-6 font-semibold">
                      Payment
                    </th>
                    <th className="text-left py-3 px-6 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const channel =
                      (order.channel || order.orderType || "online") as string;
                    const itemCount =
                      order.itemCount ??
                      order.lineItems?.reduce(
                        (sum, line) => sum + (line.quantity || 0),
                        0,
                      ) ??
                      0;
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-border hover:bg-primary/5 transition cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/orders/${order.id}`)
                        }
                      >
                        <td className="py-3 px-6 font-medium">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-6">
                          <ChannelBadge channel={channel} />
                        </td>
                        <td className="py-3 px-6">{itemCount}</td>
                        <td className="py-3 px-6 font-semibold">
                          {formatMoney(
                            parseAmount(order.totalAmount),
                            order.currency || "JOD",
                          )}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {paymentLabel(order)}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
