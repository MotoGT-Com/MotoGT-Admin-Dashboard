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
import { toast } from "sonner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ShipOrderModal,
  DeliverOrderModal,
  CancelOrderModal,
  RefundOrderModal,
} from "@/components/order-action-modals";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
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
        return "bg-yellow-900/30 text-yellow-300";
      case "confirmed":
        return "bg-blue-900/30 text-blue-300";
      case "processing":
        return "bg-purple-900/30 text-purple-300";
      case "shipped":
        return "bg-orange-900/30 text-orange-300";
      case "delivered":
        return "bg-green-900/30 text-green-300";
      case "cancelled":
        return "bg-red-900/30 text-red-300";
      case "refunded":
        return "bg-red-950/50 text-red-400";
      default:
        return "bg-gray-900/30 text-gray-300";
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
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft size={16} />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Order {order.order.orderNumber || order.order.id}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {new Date(order.order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
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
              <Button onClick={() => setShipModalOpen(true)} className="gap-2">
                <Truck size={18} />
                Ship Order
              </Button>
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
          {order.order.status === "shipped" && (
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
                            ? "bg-green-900/30 text-green-300"
                            : order.order.payment?.status === "pending"
                            ? "bg-yellow-900/30 text-yellow-300"
                            : order.order.payment?.status === "failed"
                            ? "bg-red-900/30 text-red-300"
                            : "bg-gray-900/30 text-gray-300"
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
                        <span>JOD {calculatedSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-border pt-3 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">
                          JOD {Number(order.order.totalAmount || 0).toFixed(2)}
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
                        JOD {Number(item.totalPrice || 0).toFixed(2)}
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
                    JOD {calculatedSubtotal.toFixed(2)}
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
