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
import {
  Search,
  Filter,
  ChevronDown,
  X,
  Truck,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OrdersLoading from "./loading";
import { orderService, Order, GuestOrder } from "@/lib/services/order.service";
import { userService, User } from "@/lib/services/user.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail } from "lucide-react";
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
import {
  ShipOrderModal,
  DeliverOrderModal,
  CancelOrderModal,
  RefundOrderModal,
} from "@/components/order-action-modals";

const orderStatusDescriptions = {
  pending: "Order created, waiting for payment",
  confirmed: "Payment received (prepaid) or auto-confirmed (postpaid)",
  processing: "Order being prepared",
  shipped: "Order dispatched with tracking",
  delivered: "Order received by customer",
  cancelled: "Order cancelled (with stock restoration)",
  refunded: "Payment refunded to customer",
};

function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<
    string[]
  >([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Modal states
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrderTotal, setSelectedOrderTotal] = useState(0);

  // TODO: Get storeId from user context or config
  const storeId = "19bf2cb6-1b50-4b95-80d6-9da6560588fc";

  const [visibleColumns, setVisibleColumns] = useState({
    orderNumber: true,
    customerEmail: true,
    items: true,
    total: true,
    paymentMethod: true,
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

        if (selectedPaymentMethods.length === 1) {
          params.payment_method = selectedPaymentMethods[0].toLowerCase();
        }

        const response = await orderService.getOrders(params);

        // Customer data is already included in the response
        setOrders(response.items);
        setTotal(response.total);
        setTotalPages(Math.ceil(response.total / limit));
      } catch (error: any) {
        toast.error(error.message || "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [page, selectedStatuses, selectedPaymentMethods, storeId]);

  const refreshOrders = async () => {
    try {
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

      if (selectedPaymentMethods.length === 1) {
        params.payment_method = selectedPaymentMethods[0].toLowerCase();
      }

      const response = await orderService.getOrders(params);

      // Customer data is already included in the response
      setOrders(response.items);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (error: any) {
      toast.error(error.message || "Failed to refresh orders");
    }
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
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

  const paymentMethodOptions = [
    "credit_card",
    "cod",
    "cliq",
    "card_on_delivery",
  ];

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

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const togglePaymentMethod = (method: string) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
    setSelectedPaymentMethods([]);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const getPaymentColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "captured":
        return "bg-green-900/30 text-green-300";
      case "pending":
        return "bg-yellow-900/30 text-yellow-300";
      case "failed":
        return "bg-red-900/30 text-red-300";
      case "refunded":
        return "bg-orange-900/30 text-orange-300";
      default:
        return "bg-gray-900/30 text-gray-300";
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      (searchTerm === "" ||
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())) &&
      (selectedStatuses.length === 0 ||
        selectedStatuses.includes(order.status)) &&
      (selectedPaymentMethods.length === 0 ||
        (order.paymentMethod &&
          selectedPaymentMethods.includes(order.paymentMethod.type)))
  );

  const openShipModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShipModalOpen(true);
  };

  const openDeliverModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDeliverModalOpen(true);
  };

  const openCancelModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCancelModalOpen(true);
  };

  const openRefundModal = (orderId: string, total: number) => {
    setSelectedOrderId(orderId);
    setSelectedOrderTotal(total);
    setRefundModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {(selectedStatuses.length > 0 || selectedPaymentMethods.length > 0) && (
        <div className="flex gap-2 items-center flex-wrap">
          {selectedStatuses.map((status) => (
            <div
              key={status}
              className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm"
            >
              Status: {status}
              <button
                onClick={() => toggleStatus(status)}
                className="hover:opacity-70"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {selectedPaymentMethods.map((method) => (
            <div
              key={method}
              className="flex items-center gap-2 bg-blue-900/20 text-blue-300 px-3 py-1 rounded-full text-sm"
            >
              Payment: {getPaymentMethodLabel(method)}
              <button
                onClick={() => togglePaymentMethod(method)}
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
            Reset All
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
                  <span className="text-sm capitalize">{status}</span>
                </label>
              ))}
            </div>
            {selectedStatuses.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStatuses([])}
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
              <DollarSign size={18} />
              Payment
              {selectedPaymentMethods.length > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {selectedPaymentMethods.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {paymentMethodOptions.map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                >
                  <Checkbox
                    checked={selectedPaymentMethods.includes(method)}
                    onCheckedChange={() => togglePaymentMethod(method)}
                  />
                  <span className="text-sm">
                    {getPaymentMethodLabel(method)}
                  </span>
                </label>
              ))}
            </div>
            {selectedPaymentMethods.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPaymentMethods([])}
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
                  checked={visibleColumns.paymentMethod}
                  onCheckedChange={() => toggleColumn("paymentMethod")}
                />
                <span className="text-sm">Payment Method</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Checkbox
                  checked={visibleColumns.paymentStatus}
                  onCheckedChange={() => toggleColumn("paymentStatus")}
                />
                <span className="text-sm">Payment Status</span>
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
                {visibleColumns.paymentMethod && (
                  <th className="text-left py-4 px-6 font-semibold">
                    Payment Method
                  </th>
                )}
                {visibleColumns.paymentStatus && (
                  <th className="text-left py-4 px-6 font-semibold">
                    Payment Status
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="text-left py-4 px-6 font-semibold">
                    Order Status
                  </th>
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
                        {order.customer?.firstName} {order.customer?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.customer?.email}
                      </div>
                    </td>
                  )}
                  {visibleColumns.total && (
                    <td className="py-4 px-6 font-semibold">
                      {order.currency}{" "}
                      {Number(order?.totalAmount || 0).toFixed(2)}
                    </td>
                  )}
                  {visibleColumns.paymentMethod && (
                    <td className="py-4 px-6">
                      <span className="text-sm">
                        {getPaymentMethodLabel(order.paymentMethod?.type)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.paymentStatus && (
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentColor(
                          order.payment?.status || "pending"
                        )}`}
                      >
                        {order.payment?.status || "Pending"}
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

                        {/* Pending status: only cancel option */}
                        {order.status === "pending" && (
                          <DropdownMenuItem
                            onClick={() => openCancelModal(order.id)}
                            className="text-red-400"
                          >
                            <XCircle size={16} className="mr-2" />
                            Cancel Order
                          </DropdownMenuItem>
                        )}

                        {/* Confirmed or Processing: Ship or Cancel */}
                        {(order.status === "confirmed" ||
                          order.status === "processing") && (
                          <>
                            <DropdownMenuItem
                              onClick={() => openShipModal(order.id)}
                              className="text-blue-400"
                            >
                              <Truck size={16} className="mr-2" />
                              Ship Order
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openCancelModal(order.id)}
                              className="text-red-400"
                            >
                              <XCircle size={16} className="mr-2" />
                              Cancel Order
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Shipped: Mark as Delivered */}
                        {order.status === "shipped" && (
                          <DropdownMenuItem
                            onClick={() => openDeliverModal(order.id)}
                            className="text-green-400"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Mark as Delivered
                          </DropdownMenuItem>
                        )}

                        {/* Delivered: Process Refund */}
                        {order.status === "delivered" && (
                          <DropdownMenuItem
                            onClick={() =>
                              openRefundModal(
                                order.id,
                                Number(order.totalAmount)
                              )
                            }
                            className="text-orange-400"
                          >
                            <DollarSign size={16} className="mr-2" />
                            Process Refund
                          </DropdownMenuItem>
                        )}

                        {/* Cancelled/Refunded: No actions (final states) */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Action Modals */}
      <ShipOrderModal
        isOpen={shipModalOpen}
        onClose={() => setShipModalOpen(false)}
        orderId={selectedOrderId}
        onSuccess={refreshOrders}
      />
      <DeliverOrderModal
        isOpen={deliverModalOpen}
        onClose={() => setDeliverModalOpen(false)}
        orderId={selectedOrderId}
        onSuccess={refreshOrders}
      />
      <CancelOrderModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        orderId={selectedOrderId}
        onSuccess={refreshOrders}
      />
      <RefundOrderModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        orderId={selectedOrderId}
        orderTotal={selectedOrderTotal}
        onSuccess={refreshOrders}
      />
    </div>
  );
}

function GuestOrdersContent() {
  const router = useRouter();
  const [guestOrders, setGuestOrders] = useState<GuestOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emailSearch, setEmailSearch] = useState("");
  const [emailSearchInput, setEmailSearchInput] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Modal states
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrderTotal, setSelectedOrderTotal] = useState(0);

  const storeId = "19bf2cb6-1b50-4b95-80d6-9da6560588fc";

  // Debounce email search
  useEffect(() => {
    const timer = setTimeout(() => {
      setEmailSearch(emailSearchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [emailSearchInput]);

  useEffect(() => {
    const fetchGuestOrders = async () => {
      try {
        setIsLoading(true);
        const params: any = { storeId, page, limit };
        if (selectedStatuses.length === 1) params.status = selectedStatuses[0];
        if (emailSearch.trim()) params.email = emailSearch.trim();
        const response = await orderService.getGuestOrders(params);
        setGuestOrders(response.items);
        setTotal(response.total);
        setTotalPages(response.totalPages);
      } catch (error: any) {
        toast.error(error.message || "Failed to load guest orders");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGuestOrders();
  }, [page, selectedStatuses, emailSearch, storeId]);

  const refreshGuestOrders = async () => {
    try {
      const params: any = { storeId, page, limit };
      if (selectedStatuses.length === 1) params.status = selectedStatuses[0];
      if (emailSearch.trim()) params.email = emailSearch.trim();
      const response = await orderService.getGuestOrders(params);
      setGuestOrders(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      toast.error(error.message || "Failed to refresh guest orders");
    }
  };

  const statusOptions = [
    "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded",
  ];

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-yellow-900/30 text-yellow-300";
      case "confirmed": return "bg-blue-900/30 text-blue-300";
      case "processing": return "bg-purple-900/30 text-purple-300";
      case "shipped": return "bg-orange-900/30 text-orange-300";
      case "delivered": return "bg-green-900/30 text-green-300";
      case "cancelled": return "bg-red-900/30 text-red-300";
      case "refunded": return "bg-red-950/50 text-red-400";
      default: return "bg-gray-900/30 text-gray-300";
    }
  };

  const getPaymentMethodLabel = (type: string | null | undefined) => {
    if (!type) return "N/A";
    switch (type.toLowerCase()) {
      case "credit_card": return "Credit Card";
      case "cod": return "Cash On Delivery";
      case "cliq": return "Cliq";
      case "card_on_delivery": return "Card On Delivery";
      default: return type;
    }
  };

  const openShipModal = (orderId: string) => { setSelectedOrderId(orderId); setShipModalOpen(true); };
  const openDeliverModal = (orderId: string) => { setSelectedOrderId(orderId); setDeliverModalOpen(true); };
  const openCancelModal = (orderId: string) => { setSelectedOrderId(orderId); setCancelModalOpen(true); };
  const openRefundModal = (orderId: string, total: number) => { setSelectedOrderId(orderId); setSelectedOrderTotal(total); setRefundModalOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by guest email..."
            className="pl-10"
            value={emailSearchInput}
            onChange={(e) => setEmailSearchInput(e.target.value)}
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
                <label key={status} className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                  <Checkbox
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <span className="text-sm capitalize">{status}</span>
                </label>
              ))}
            </div>
            {selectedStatuses.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedStatuses([]); setPage(1); }}
                  className="w-full text-muted-foreground"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedStatuses.length > 0 && (
        <div className="flex gap-2 items-center flex-wrap">
          {selectedStatuses.map((status) => (
            <div key={status} className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
              Status: {status}
              <button onClick={() => toggleStatus(status)} className="hover:opacity-70"><X size={14} /></button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => { setSelectedStatuses([]); setPage(1); }} className="text-muted-foreground">Reset All</Button>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : guestOrders.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">No guest orders found</p>
              <p className="text-muted-foreground">
                {emailSearch ? `No guest orders match "${emailSearch}".` : "No guest orders yet."}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-4 px-6 font-semibold">Order #</th>
                <th className="text-left py-4 px-6 font-semibold">Guest Email</th>
                <th className="text-left py-4 px-6 font-semibold">Guest Phone</th>
                <th className="text-left py-4 px-6 font-semibold">Items</th>
                <th className="text-left py-4 px-6 font-semibold">Total</th>
                <th className="text-left py-4 px-6 font-semibold">Payment Method</th>
                <th className="text-left py-4 px-6 font-semibold">Status</th>
                <th className="text-left py-4 px-6 font-semibold">Created At</th>
                <th className="text-left py-4 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guestOrders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-primary/5 transition">
                  <td className="py-4 px-6 font-medium">{order.orderNumber}</td>
                  <td className="py-4 px-6">{order.guestEmail}</td>
                  <td className="py-4 px-6 text-muted-foreground">{order.guestPhone}</td>
                  <td className="py-4 px-6">{order.itemCount}</td>
                  <td className="py-4 px-6 font-semibold">{order.currencyCode} {Number(order.totalAmount).toFixed(2)}</td>
                  <td className="py-4 px-6">{getPaymentMethodLabel(order.paymentMethod)}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          Actions <ChevronDown size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/orders/${order.id}?guest=true`)}>
                          View Details
                        </DropdownMenuItem>
                        {order.status === "pending" && (
                          <DropdownMenuItem onClick={() => openCancelModal(order.id)} className="text-red-400">
                            <XCircle size={16} className="mr-2" /> Cancel Order
                          </DropdownMenuItem>
                        )}
                        {(order.status === "confirmed" || order.status === "processing") && (
                          <>
                            <DropdownMenuItem onClick={() => openShipModal(order.id)} className="text-blue-400">
                              <Truck size={16} className="mr-2" /> Ship Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openCancelModal(order.id)} className="text-red-400">
                              <XCircle size={16} className="mr-2" /> Cancel Order
                            </DropdownMenuItem>
                          </>
                        )}
                        {order.status === "shipped" && (
                          <DropdownMenuItem onClick={() => openDeliverModal(order.id)} className="text-green-400">
                            <CheckCircle size={16} className="mr-2" /> Mark as Delivered
                          </DropdownMenuItem>
                        )}
                        {order.status === "delivered" && (
                          <DropdownMenuItem onClick={() => openRefundModal(order.id, Number(order.totalAmount))} className="text-orange-400">
                            <DollarSign size={16} className="mr-2" /> Process Refund
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">Showing {guestOrders.length} of {total} guest orders</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="flex items-center text-sm px-3">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ShipOrderModal isOpen={shipModalOpen} onClose={() => setShipModalOpen(false)} orderId={selectedOrderId} onSuccess={refreshGuestOrders} />
      <DeliverOrderModal isOpen={deliverModalOpen} onClose={() => setDeliverModalOpen(false)} orderId={selectedOrderId} onSuccess={refreshGuestOrders} />
      <CancelOrderModal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} orderId={selectedOrderId} onSuccess={refreshGuestOrders} />
      <RefundOrderModal isOpen={refundModalOpen} onClose={() => setRefundModalOpen(false)} orderId={selectedOrderId} orderTotal={selectedOrderTotal} onSuccess={refreshGuestOrders} />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">Track and manage orders here.</p>
        </div>
        <Tabs defaultValue="regular">
          <TabsList>
            <TabsTrigger value="regular">Regular Orders</TabsTrigger>
            <TabsTrigger value="guest">Guest Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="regular" className="mt-6">
            <OrdersContent />
          </TabsContent>
          <TabsContent value="guest" className="mt-6">
            <GuestOrdersContent />
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  );
}
