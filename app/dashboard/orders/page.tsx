"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ChevronDown, X } from "lucide-react";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OrdersLoading from "./loading";
import { orderService, Order } from "@/lib/services/order.service";
import { userService, User } from "@/lib/services/user.service";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const orderStatusDescriptions = {
  Pending: "Order placed, payment not yet confirmed or fully processed.",
  Processing: "Payment confirmed, order is being prepared.",
  Shipped: "Order on the way.",
  Delivered: "Order has been delivered successfully.",
  Cancelled: "Order was cancelled by customer or admin before shipment.",
  Refunded: "Refund issued successfully.",
  Confirmed: "Payment confirmed, order is being prepared.",
};

function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // TODO: Get storeId from user context or config
  const storeId = "19bf2cb6-1b50-4b95-80d6-9da6560588fc";

  const [visibleColumns, setVisibleColumns] = useState({
    orderNumber: true,
    customerEmail: true,
    items: true,
    total: true,
    paymentStatus: true,
    status: true,
    createdAt: true,
  });

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const params: any = {
          storeId,
          page,
          limit,
          sortBy: "createdAt",
          sortOrder: "desc",
        };

        if (selectedStatuses.length === 1) {
          params.status = selectedStatuses[0].toLowerCase();
        }

        const response = await orderService.getOrders(params);

        // Fetch user details for each order
        const ordersWithUsers = await Promise.all(
          response.items.map(async (order) => {
            if (order.userId) {
              try {
                const user = await userService.getUserById(order.userId);
                return { ...order, user };
              } catch (error) {
                console.error(`Failed to fetch user ${order.userId}:`, error);
                return order;
              }
            }
            return order;
          })
        );

        setOrders(ordersWithUsers);
        setTotal(response.total);
        setTotalPages(Math.ceil(response.total / limit));
      } catch (error: any) {
        toast.error(error.message || "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [page, selectedStatuses, storeId]);

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const updateOrderStatus = async (
    id: string,
    newStatus:
      | "pending"
      | "confirmed"
      | "processing"
      | "shipped"
      | "delivered"
      | "cancelled"
      | "refunded"
  ) => {
    try {
      await orderService.updateOrderStatus(id, newStatus);

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === id ? { ...order, status: newStatus } : order
        )
      );

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update order status");
    }
  };

  const statusOptions = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ];

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-primary/20 text-primary";
      case "shipped":
        return "bg-blue-900/30 text-blue-300";
      case "processing":
        return "bg-yellow-900/30 text-yellow-300";
      case "confirmed":
        return "bg-green-900/30 text-green-300";
      case "cancelled":
        return "bg-red-900/30 text-red-300";
      case "refunded":
        return "bg-orange-900/30 text-orange-300";
      default:
        return "bg-gray-900/30 text-gray-300";
    }
  };

  const getPaymentColor = (payment: string) => {
    return payment?.toLowerCase() === "paid"
      ? "bg-green-900/30 text-green-300"
      : "bg-red-900/30 text-red-300";
  };

  const filteredOrders = orders.filter(
    (order) =>
      (searchTerm === "" ||
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedStatuses.length === 0 || selectedStatuses.includes(order.status))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage orders here.
          </p>
        </div>
      </div>

      {selectedStatuses.length > 0 && (
        <div className="flex gap-2 items-center flex-wrap">
          {selectedStatuses.map((status) => (
            <div
              key={status}
              className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm"
            >
              {status}
              <button
                onClick={() => toggleStatus(status)}
                className="hover:opacity-70"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            Reset
          </Button>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Search order # or email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Status
              {selectedStatuses.length > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {selectedStatuses.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {statusOptions.map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                >
                  <Checkbox
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <span className="text-sm">{status}</span>
                </label>
              ))}
            </div>
            {selectedStatuses.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full text-muted-foreground"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              View
              <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-4">
            <div className="text-sm font-semibold mb-3 text-foreground">
              Toggle columns
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox
                  checked={visibleColumns.orderNumber}
                  onCheckedChange={() => toggleColumn("orderNumber")}
                />
                <span className="text-sm">OrderNumber</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox
                  checked={visibleColumns.customerEmail}
                  onCheckedChange={() => toggleColumn("customerEmail")}
                />
                <span className="text-sm">CustomerEmail</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox
                  checked={visibleColumns.total}
                  onCheckedChange={() => toggleColumn("total")}
                />
                <span className="text-sm">Total</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox
                  checked={visibleColumns.paymentStatus}
                  onCheckedChange={() => toggleColumn("paymentStatus")}
                />
                <span className="text-sm">PaymentStatus</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox
                  checked={visibleColumns.status}
                  onCheckedChange={() => toggleColumn("status")}
                />
                <span className="text-sm">Status</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox
                  checked={visibleColumns.createdAt}
                  onCheckedChange={() => toggleColumn("createdAt")}
                />
                <span className="text-sm">CreatedAt</span>
              </label>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">
                No orders found
              </p>
              <p className="text-muted-foreground">
                {searchTerm
                  ? `No orders match "${searchTerm}". Try a different search term.`
                  : "No orders yet. Create your first order to get started."}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {visibleColumns.orderNumber && (
                  <th className="text-left py-4 px-6 font-semibold">Order #</th>
                )}
                {visibleColumns.customerEmail && (
                  <th className="text-left py-4 px-6 font-semibold">
                    Customer
                  </th>
                )}
                {visibleColumns.total && (
                  <th className="text-left py-4 px-6 font-semibold">Total</th>
                )}
                {visibleColumns.paymentStatus && (
                  <th className="text-left py-4 px-6 font-semibold">Payment</th>
                )}
                {visibleColumns.status && (
                  <th className="text-left py-4 px-6 font-semibold">Status</th>
                )}
                {visibleColumns.createdAt && (
                  <th className="text-left py-4 px-6 font-semibold">
                    Created At
                  </th>
                )}
                <th className="text-left py-4 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border hover:bg-primary/5 transition"
                >
                  {visibleColumns.orderNumber && (
                    <td className="py-4 px-6 font-medium">
                      {order.orderNumber}
                    </td>
                  )}
                  {visibleColumns.customerEmail && (
                    <td className="py-4 px-6">
                      <div className="font-medium">
                        {order.user?.firstName} {order.user?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.user?.email}
                      </div>
                    </td>
                  )}
                  {visibleColumns.total && (
                    <td className="py-4 px-6 font-semibold">
                      ${Number(order?.totalAmount || 0).toFixed(2)}
                    </td>
                  )}
                  {visibleColumns.paymentStatus && (
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentColor(
                          order.paymentStatus || "unpaid"
                        )}`}
                      >
                        {order.paymentStatus || "Unpaid"}
                      </span>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.createdAt && (
                    <td className="py-4 px-6 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  )}
                  <td className="py-4 px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          Actions
                          <ChevronDown size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(`/dashboard/orders/${order.id}`);
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <TooltipProvider>
                          {(
                            [
                              "pending",
                              "confirmed",
                              "processing",
                              "shipped",
                              "delivered",
                              "cancelled",
                              "refunded",
                            ] as const
                          ).map((status) => (
                            <Tooltip key={status}>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateOrderStatus(order.id, status)
                                  }
                                  className={
                                    status === "refunded"
                                      ? "text-red-400"
                                      : status === "cancelled"
                                      ? "text-orange-400"
                                      : ""
                                  }
                                  disabled={order.status === status}
                                >
                                  Mark{" "}
                                  {status.charAt(0).toUpperCase() +
                                    status.slice(1)}
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                {orderStatusDescriptions[
                                  (status.charAt(0).toUpperCase() +
                                    status.slice(
                                      1
                                    )) as keyof typeof orderStatusDescriptions
                                ] || "Update order status"}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrdersContent />
    </Suspense>
  );
}
