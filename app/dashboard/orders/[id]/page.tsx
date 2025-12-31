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
import { ArrowLeft, Download } from "lucide-react";
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
import { useParams, useRouter } from "next/navigation";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);

        // Fetch user details if userId exists
        if (orderData.order.customer) {
          setUser(orderData.order.customer);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus as any);
      setOrder({ order: { ...order.order, status: newStatus } });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update order status");
    }
  };

  const handlePaymentUpdate = (newPayment: string) => {
    setOrder({ order: { ...order.order, paymentStatus: newPayment } });
    toast.success(`Payment status updated to ${newPayment}`);
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
        <Button onClick={() => downloadInvoice(order)} className="gap-2">
          <Download size={18} />
          Download Invoice
        </Button>
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
                    <p className="text-sm">
                      {order.paymentMethod || "Cash on Delivery"}
                    </p>
                  </div>
                </div>

                {/* Right: Status and Totals */}
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Status</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold">
                        {order.order.status}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Update Status
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate("Pending")}
                          >
                            Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate("Confirmed")}
                          >
                            Confirmed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate("Processing")}
                          >
                            Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate("Shipped")}
                          >
                            Shipped
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate("Delivered")}
                          >
                            Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate("Cancelled")}
                          >
                            Cancelled
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate("Refunded")}
                          >
                            Refunded
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Payment Status
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={getPaymentBadgeVariant(
                          order.paymentStatus || "unpaid"
                        )}
                      >
                        {order.paymentStatus || "Unpaid"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Update Payment
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handlePaymentUpdate("Unpaid")}
                          >
                            Unpaid
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handlePaymentUpdate("Paid")}
                          >
                            Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handlePaymentUpdate("Partial")}
                          >
                            Partial
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handlePaymentUpdate("Refunded")}
                          >
                            Refunded
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          {/* TODO Fix From Backend */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Shipping Address</p>
                <p className="font-medium">{order.shippingAddress?.address || 'No shipping address provided'}</p>
              </div>
              {order.shippingAddress && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-medium">{order.shippingAddress.city || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Postal Code</p>
                    <p className="font-medium">{order.shippingAddress.postalCode || 'N/A'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card> */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
    </div>
  );
}
