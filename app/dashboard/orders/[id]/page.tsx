"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Download,
  Truck,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { downloadInvoice } from "@/lib/invoice-generator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { orderService, Order } from "@/lib/services/order.service";
import { userService, User } from "@/lib/services/user.service";
import { settingsService } from "@/lib/services/settings.service";
import { formatMoney } from "@/lib/dashboard-utils";
import { channelLabel } from "@/lib/domain/channels";
import { toast } from "sonner";
import { LoadingState } from "@/components/loading-state";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ShipOrderModal,
  DeliverOrderModal,
  CancelOrderModal,
  RefundOrderModal,
} from "@/components/order-action-modals";

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  return <BackendOrderDetailsPage orderId={orderId} />;
}

function BackendOrderDetailsPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get("guest") === "true";

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [guestPhone, setGuestPhone] = useState<string | null>(null);

  // Modal states
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  const loadOrder = async () => {
    const orderData = isGuest
      ? await orderService.getGuestOrderById(orderId)
      : await orderService.getOrderById(orderId);

    setOrder(orderData);

    if (orderData.order.guestEmail) {
      setGuestEmail(orderData.order.guestEmail);
      setGuestPhone(orderData.order.guestPhone || null);
    } else if (orderData.order.customer) {
      setUser(orderData.order.customer);
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        await loadOrder();
      } catch (error: any) {
        toast.error(error.message || "Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, isGuest]);

  const refreshOrderData = async () => {
    try {
      await loadOrder();
    } catch (error: any) {
      toast.error(error.message || "Failed to refresh order");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
      case "confirmed":
        return "bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
      case "processing":
        return "bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300";
      case "shipped":
        return "bg-orange-500/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300";
      case "delivered":
        return "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
      case "cancelled":
        return "bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300";
      case "refunded":
        return "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentMethodLabel = (type: string | null | undefined) => {
    if (!type) return "N/A";
    switch (type.toLowerCase()) {
      case "credit_card":
        return "Credit Card";
      case "cod":
        return "Cash On Delivery";
      case "cliq":
        return "Cliq";
      case "card_on_delivery":
        return "Card On Delivery";
      case "cash":
        return "Cash";
      case "card":
        return "Card";
      case "other":
        return "Other";
      default:
        return type;
    }
  };

  if (isLoading) {
    return <LoadingState variant="full" label="Loading order…" />;
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
        </Button>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-2">
              Order not found
            </p>
            <p className="text-muted-foreground">
              The order you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getPaymentBadgeVariant = (payment: string) => {
    switch (payment?.toLowerCase()) {
      case "paid":
        return "default";
      case "unpaid":
        return "destructive";
      case "partial":
        return "secondary";
      case "refunded":
        return "outline";
      default:
        return "secondary";
    }
  };

  const calculatedSubtotal =
    order?.items?.reduce(
      (sum: number, item: any) => sum + Number(item.totalPrice || 0),
      0
    ) ||
    Number(order?.order?.totalAmount || 0) ||
    0;

  const storeCurrency =
    settingsService.getSelectedStore()?.currencyCode || "JOD";
  const displayCurrency = (
    order?.order?.currency ||
    order?.order?.currencyCode ||
    storeCurrency
  )
    .toString()
    .trim()
    .toUpperCase();
  // Prefer store currency when API currency disagrees (USD/JOD mix).
  const currency =
    displayCurrency && displayCurrency !== storeCurrency.toUpperCase()
      ? storeCurrency.toUpperCase()
      : displayCurrency || storeCurrency.toUpperCase();

  const orderChannel = (order.order.channel || "") as string;
  const isChannelSale =
    orderChannel === "in_store" || orderChannel === "whatsapp";
  const hideShipDeliver =
    isChannelSale &&
    (order.order.status === "delivered" || Boolean(order.order.isPaid));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft size={16} />
              <span className="hidden xs:inline sm:inline">Back</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold break-words">
              Order {order.order.orderNumber || order.order.id}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {new Date(order.order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Action buttons based on status */}
          {order.order.status === "pending" && (
            <Button
              variant="destructive"
              onClick={() => setCancelModalOpen(true)}
              className="gap-2"
            >
              <XCircle size={18} />
              Cancel Order
            </Button>
          )}
          {(order.order.status === "confirmed" ||
            order.order.status === "processing") && (
            <>
              {!hideShipDeliver && (
                <Button onClick={() => setShipModalOpen(true)} className="gap-2">
                  <Truck size={18} />
                  Ship Order
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => setCancelModalOpen(true)}
                className="gap-2"
              >
                <XCircle size={18} />
                Cancel Order
              </Button>
            </>
          )}
          {order.order.status === "shipped" && !hideShipDeliver && (
            <Button onClick={() => setDeliverModalOpen(true)} className="gap-2">
              <CheckCircle size={18} />
              Mark as Delivered
            </Button>
          )}
          {order.order.status === "delivered" && (
            <Button
              variant="destructive"
              onClick={() => setRefundModalOpen(true)}
              className="gap-2"
            >
              <DollarSign size={18} />
              Process Refund
            </Button>
          )}
          <Button
            onClick={() => downloadInvoice(order)}
            variant="outline"
            className="gap-2"
          >
            <Download size={18} />
            Download Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status and Payment */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Order Details */}
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Order Number
                    </p>
                    <p className="text-lg font-semibold">
                      {order.order.orderNumber || order.order.id}
                    </p>
                    <p className="text-sm text-muted-foreground mt-3">
                      Order Date
                    </p>
                    <p className="text-sm">
                      {new Date(order.order.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-3">
                      Payment Method
                    </p>
                    <p className="text-sm font-medium">
                      {getPaymentMethodLabel(
                        typeof order.order.paymentMethod === "string"
                          ? order.order.paymentMethod
                          : order.order.paymentMethod?.type
                      )}
                    </p>
                    {order.order.channel ? (
                      <>
                        <p className="text-sm text-muted-foreground mt-3">
                          Channel
                        </p>
                        <p className="text-sm font-medium">
                          {channelLabel(order.order.channel)}
                        </p>
                      </>
                    ) : null}
                    {order.order.staffMember ? (
                      <>
                        <p className="text-sm text-muted-foreground mt-3">
                          Staff
                        </p>
                        <p className="text-sm font-medium">
                          {order.order.staffMember}
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Right: Status and Totals */}
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Order Status
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.order.status
                        )}`}
                      >
                        {order.order.status?.charAt(0).toUpperCase() +
                          order.order.status?.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Payment Status
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.order.payment?.status === "captured"
                            ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : order.order.payment?.status === "pending"
                            ? "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                            : order.order.payment?.status === "failed"
                            ? "bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {order.order.payment?.status || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Payment
                    </p>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>
                          {formatMoney(calculatedSubtotal, currency)}
                        </span>
                      </div>
                      <div className="border-t border-border pt-3 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">
                          {formatMoney(
                            Number(order.order.totalAmount || 0),
                            currency
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3 bg-muted/50 rounded-lg"
                    >
                      {item.productSnapshot.mainImage && (
                        <img
                          src={
                            item?.productSnapshot?.mainImage ||
                            "/placeholder.svg"
                          }
                          alt={item?.productSnapshot?.translations?.en?.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {item?.productSnapshot?.translations?.en?.name}
                        </p>
                        <p className="font-medium">
                          {item?.productSnapshot?.productCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold whitespace-nowrap">
                        {formatMoney(
                          Number(item.totalPrice || 0),
                          item.currencyCode || currency
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No items found
                  </p>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold text-lg">
                    {formatMoney(calculatedSubtotal, currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          {order.order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {order.order.shippingAddress.title && (
                  <p className="font-medium">{order.order.shippingAddress.title}</p>
                )}
                <p>{order.order.shippingAddress.address_line_1}</p>
                {order.order.shippingAddress.address_line_2 && (
                  <p>{order.order.shippingAddress.address_line_2}</p>
                )}
                <p>
                  {[order.order.shippingAddress.city, order.order.shippingAddress.postal_code]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p>{order.order.shippingAddress.country}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {guestEmail ? (
                <>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                    Guest
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium text-sm break-all">{guestEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{guestPhone || "N/A"}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Customer ID
                    </p>
                    <p className="font-mono text-sm">{user?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">
                      {user
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                          "N/A"
                        : "Loading..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium text-sm break-all">
                      {user?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{user?.phone || "N/A"}</p>
                  </div>
                  <Button variant="outline" className="w-full mt-2" asChild>
                    <Link href={`/dashboard/users/${user?.id}`}>View customer</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action Modals */}
      <ShipOrderModal
        isOpen={shipModalOpen}
        onClose={() => setShipModalOpen(false)}
        orderId={orderId}
        onSuccess={refreshOrderData}
      />
      <DeliverOrderModal
        isOpen={deliverModalOpen}
        onClose={() => setDeliverModalOpen(false)}
        orderId={orderId}
        onSuccess={refreshOrderData}
      />
      <CancelOrderModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        orderId={orderId}
        onSuccess={refreshOrderData}
      />
      <RefundOrderModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        orderId={orderId}
        orderTotal={Number(order?.order?.totalAmount || 0)}
        onSuccess={refreshOrderData}
      />
    </div>
  );
}
