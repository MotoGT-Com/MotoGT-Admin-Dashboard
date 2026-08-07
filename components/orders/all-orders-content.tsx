"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  X,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Eye,
  CalendarRange,
  MapPin,
  Bookmark,
  AlertTriangle,
  Percent,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OrderQuickViewSheet } from "@/components/orders/order-quick-view-sheet";
import { formatMoney } from "@/lib/dashboard-utils";
import {
  MOCK_LIST_ORDERS,
  MOCK_ORDER_CITIES,
  channelLabel,
  daysOpen,
  type MockListOrder,
  type OrderChannel,
  type OrderKind,
} from "@/lib/mock-data/orders-list";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type SortKey = "createdAt" | "totalAmount";
type ChannelFilter = "all" | OrderChannel;
type OrderTypeFilter = "all" | OrderKind;
type HasDiscountFilter = "all" | "yes" | "no";

interface AllOrdersContentProps {
  /** Primary channel tab from the page (All / Online / In-Store / WhatsApp). */
  channel: ChannelFilter;
  onChannelChange?: (channel: ChannelFilter) => void;
}

const orderStatusDescriptions: Record<string, string> = {
  pending: "Order created, waiting for payment",
  confirmed: "Payment received (prepaid) or auto-confirmed (postpaid)",
  processing: "Order being prepared",
  shipped: "Order dispatched with tracking",
  delivered: "Order received by customer",
  cancelled: "Order cancelled (with stock restoration)",
  refunded: "Payment refunded to customer",
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
  { value: "credit_card", label: "Credit Card" },
  { value: "cod", label: "Cash On Delivery" },
  { value: "cliq", label: "Cliq" },
  { value: "card_on_delivery", label: "Card On Delivery" },
];

type PresetId = "today_in_store" | "pending_online" | "needs_attention";

const PRESETS: {
  id: PresetId;
  label: string;
  apply: () => Partial<{
    channel: ChannelFilter;
    selectedStatuses: string[];
    dateFrom: string;
    dateTo: string;
    needsAttentionOnly: boolean;
    orderTypeFilter: OrderTypeFilter;
  }>;
}[] = [
  {
    id: "today_in_store",
    label: "Today's In-Store orders",
    apply: () => {
      const today = new Date().toISOString().slice(0, 10);
      return {
        channel: "in_store",
        dateFrom: today,
        dateTo: today,
        needsAttentionOnly: false,
        selectedStatuses: [],
        orderTypeFilter: "all",
      };
    },
  },
  {
    id: "pending_online",
    label: "Pending Online orders",
    apply: () => ({
      channel: "online",
      selectedStatuses: ["pending"],
      needsAttentionOnly: false,
      dateFrom: "",
      dateTo: "",
      orderTypeFilter: "all",
    }),
  },
  {
    id: "needs_attention",
    label: "Needs attention",
    apply: () => ({
      needsAttentionOnly: true,
      channel: "all",
      selectedStatuses: [],
      dateFrom: "",
      dateTo: "",
      orderTypeFilter: "all",
    }),
  },
];

function OrderTypeBadge({ orderType }: { orderType: OrderKind }) {
  if (orderType === "user") {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-200">
        User order
      </span>
    );
  }
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-violet-900/30 px-3 py-1 text-xs font-medium text-violet-200">
      Guest order
    </span>
  );
}

function ChannelBadge({ channel }: { channel: OrderChannel }) {
  const styles =
    channel === "in_store"
      ? "bg-emerald-900/30 text-emerald-200"
      : channel === "whatsapp"
        ? "bg-teal-900/30 text-teal-200"
        : "bg-sky-900/30 text-sky-200";
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium",
        styles
      )}
    >
      {channelLabel(channel)}
    </span>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 font-semibold hover:text-foreground text-left"
    >
      {label}
      <Icon
        size={14}
        className={active ? "text-primary" : "text-muted-foreground"}
      />
    </button>
  );
}

function getStatusColor(status: string) {
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
}

function getPaymentColor(status: string) {
  switch (status?.toLowerCase()) {
    case "captured":
      return "bg-green-900/30 text-green-300";
    case "pending":
      return "bg-yellow-900/30 text-yellow-300";
    case "failed":
      return "bg-red-900/30 text-red-300";
    case "refunded":
      return "bg-orange-900/30 text-orange-300";
    case "awaiting":
      return "bg-amber-900/30 text-amber-200";
    default:
      return "bg-gray-900/30 text-gray-300";
  }
}

function paymentStatusDisplay(row: MockListOrder): {
  label: string;
  tone: string;
} {
  const method = (row.paymentMethodType || "").toLowerCase();
  const isCod = method === "cod" || method === "card_on_delivery";
  if (isCod && row.paymentStatus === "pending") {
    return { label: "Awaiting payment · COD", tone: "awaiting" };
  }
  if (!row.paymentStatus || row.paymentStatus === "—") {
    return {
      label: isCod ? "N/A · COD" : "N/A",
      tone: "awaiting",
    };
  }
  return {
    label:
      row.paymentStatus.charAt(0).toUpperCase() + row.paymentStatus.slice(1),
    tone: row.paymentStatus,
  };
}

function orderDayKey(iso: string): string {
  return iso.slice(0, 10);
}

function exportOrdersCsv(rows: MockListOrder[], filename: string) {
  const headers = [
    "Order Number",
    "Channel",
    "Order Type",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "City",
    "Items",
    "Total",
    "Currency",
    "Discount Code",
    "Discount Amount",
    "Staff",
    "Payment Method",
    "Payment Status",
    "Order Status",
    "Created At",
    "SKUs",
  ];
  const escape = (value: string | number) => {
    const s = String(value ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.orderNumber,
        channelLabel(row.channel),
        row.orderType,
        row.customerName,
        row.customerEmail,
        row.customerPhone,
        row.city,
        row.itemCount,
        row.totalAmount.toFixed(2),
        row.currency,
        row.discountCode || "",
        row.discountAmount.toFixed(2),
        row.staffMember || "",
        row.paymentMethodLabel,
        paymentStatusDisplay(row).label,
        row.status,
        row.createdAt,
        row.lineItems.map((i) => i.sku).join("|"),
      ]
        .map(escape)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-medium">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="hover:opacity-70"
        aria-label={`Clear ${label}`}
      >
        <X size={12} />
      </button>
    </span>
  );
}

export function AllOrdersContent({
  channel,
  onChannelChange,
}: AllOrdersContentProps) {
  const [rows] = useState<MockListOrder[]>(() =>
    [...MOCK_LIST_ORDERS].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<
    string[]
  >([]);
  const [orderTypeFilter, setOrderTypeFilter] =
    useState<OrderTypeFilter>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [hasDiscount, setHasDiscount] = useState<HasDiscountFilter>("all");
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false);
  /** null = default (newest first by createdAt); set when user explicitly sorts. */
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewOrder, setQuickViewOrder] = useState<MockListOrder | null>(
    null
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState({
    orderNumber: true,
    orderType: true,
    channel: true,
    customer: true,
    city: true,
    items: true,
    total: true,
    discount: true,
    paymentMethod: true,
    paymentStatus: true,
    status: true,
    createdAt: true,
  });

  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    selectedStatuses,
    selectedPaymentMethods,
    orderTypeFilter,
    channel,
    cityFilter,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    hasDiscount,
    needsAttentionOnly,
    rowsPerPage,
  ]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const phoneQ = q.replace(/[\s\-()]/g, "");
    const min = amountMin === "" ? null : Number(amountMin);
    const max = amountMax === "" ? null : Number(amountMax);

    let next = rows.filter((row) => {
      const name = row.customerName.toLowerCase();
      const email = row.customerEmail.toLowerCase();
      const phone = row.customerPhone.replace(/[\s\-()]/g, "").toLowerCase();
      const skuHit = row.lineItems.some(
        (item) =>
          item.sku.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q)
      );
      const matchesSearch =
        q === "" ||
        row.orderNumber.toLowerCase().includes(q) ||
        email.includes(q) ||
        name.includes(q) ||
        (phoneQ.length > 0 && phone.includes(phoneQ)) ||
        skuHit;

      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(row.status);
      const pm = row.paymentMethodType?.toLowerCase() ?? null;
      const matchesPayment =
        selectedPaymentMethods.length === 0 ||
        (pm != null && selectedPaymentMethods.includes(pm));
      const matchesChannel = channel === "all" || row.channel === channel;
      const matchesOrderType =
        orderTypeFilter === "all" || row.orderType === orderTypeFilter;
      const matchesCity =
        cityFilter === "all" ||
        row.city.toLowerCase() === cityFilter.toLowerCase();

      const day = orderDayKey(row.createdAt);
      const matchesFrom = !dateFrom || day >= dateFrom;
      const matchesTo = !dateTo || day <= dateTo;

      const matchesMin = min == null || Number.isNaN(min) || row.totalAmount >= min;
      const matchesMax = max == null || Number.isNaN(max) || row.totalAmount <= max;

      const matchesDiscount =
        hasDiscount === "all" ||
        (hasDiscount === "yes"
          ? row.discountAmount > 0 || Boolean(row.discountCode)
          : row.discountAmount <= 0 && !row.discountCode);

      const open = daysOpen(row.createdAt, row.status);
      const matchesAttention =
        !needsAttentionOnly ||
        (open != null &&
          (row.status === "pending" || row.status === "processing"));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesChannel &&
        matchesOrderType &&
        matchesCity &&
        matchesFrom &&
        matchesTo &&
        matchesMin &&
        matchesMax &&
        matchesDiscount &&
        matchesAttention
      );
    });

    const effectiveKey: SortKey = sortKey ?? "createdAt";
    const effectiveOrder: "asc" | "desc" = sortKey ? sortOrder : "desc";

    next = [...next].sort((a, b) => {
      const cmp =
        effectiveKey === "totalAmount"
          ? a.totalAmount - b.totalAmount
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return effectiveOrder === "asc" ? cmp : -cmp;
    });

    return next;
  }, [
    rows,
    searchTerm,
    selectedStatuses,
    selectedPaymentMethods,
    channel,
    orderTypeFilter,
    cityFilter,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    hasDiscount,
    needsAttentionOnly,
    sortKey,
    sortOrder,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filteredRows.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

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
    setOrderTypeFilter("all");
    setCityFilter("all");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setHasDiscount("all");
    setNeedsAttentionOnly(false);
    setSearchTerm("");
  };

  const applyPreset = (id: PresetId) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const patch = preset.apply();
    if (patch.channel != null) onChannelChange?.(patch.channel);
    if (patch.selectedStatuses != null) setSelectedStatuses(patch.selectedStatuses);
    if (patch.dateFrom != null) setDateFrom(patch.dateFrom);
    if (patch.dateTo != null) setDateTo(patch.dateTo);
    if (patch.needsAttentionOnly != null) {
      setNeedsAttentionOnly(patch.needsAttentionOnly);
    }
    if (patch.orderTypeFilter != null) {
      setOrderTypeFilter(patch.orderTypeFilter);
    }
  };

  /** Cycle: unsorted → ascending → descending → reset (default newest-first). */
  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortOrder("asc");
      return;
    }
    if (sortOrder === "asc") {
      setSortOrder("desc");
      return;
    }
    setSortKey(null);
    setSortOrder("asc");
  };

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const chips: { key: string; label: string; onClear: () => void }[] = [];
  if (orderTypeFilter !== "all") {
    chips.push({
      key: "orderType",
      label:
        orderTypeFilter === "user" ? "Order type: User" : "Order type: Guest",
      onClear: () => setOrderTypeFilter("all"),
    });
  }
  selectedStatuses.forEach((status) => {
    chips.push({
      key: `status-${status}`,
      label: `Status: ${status}`,
      onClear: () => toggleStatus(status),
    });
  });
  selectedPaymentMethods.forEach((method) => {
    const label =
      paymentMethodOptions.find((p) => p.value === method)?.label || method;
    chips.push({
      key: `pay-${method}`,
      label: `Payment: ${label}`,
      onClear: () => togglePaymentMethod(method),
    });
  });
  if (cityFilter !== "all") {
    chips.push({
      key: "city",
      label: `City: ${cityFilter}`,
      onClear: () => setCityFilter("all"),
    });
  }
  if (dateFrom || dateTo) {
    chips.push({
      key: "date",
      label: `Date: ${dateFrom || "…"} → ${dateTo || "…"}`,
      onClear: () => {
        setDateFrom("");
        setDateTo("");
      },
    });
  }
  if (amountMin || amountMax) {
    chips.push({
      key: "amount",
      label: `Amount: ${amountMin || "0"} – ${amountMax || "∞"}`,
      onClear: () => {
        setAmountMin("");
        setAmountMax("");
      },
    });
  }
  if (hasDiscount !== "all") {
    chips.push({
      key: "discount",
      label: hasDiscount === "yes" ? "Has discount" : "No discount",
      onClear: () => setHasDiscount("all"),
    });
  }
  if (needsAttentionOnly) {
    chips.push({
      key: "attention",
      label: "Needs attention",
      onClear: () => setNeedsAttentionOnly(false),
    });
  }
  if (searchTerm.trim()) {
    chips.push({
      key: "search",
      label: `Search: ${searchTerm.trim()}`,
      onClear: () => setSearchTerm(""),
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-200">
        Preview data — sliced by channel (primary tabs). Guest checkout only
        appears on Online; In-Store / WhatsApp walk-ins are Users (Unclaimed /
        Invited) per the data model. City, discount, and SKU search are mock
        until the API returns them.
      </p>

      {/* Search + actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Search order #, name, email, phone, or SKU..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button
          variant={needsAttentionOnly ? "default" : "outline"}
          className="gap-2"
          onClick={() => setNeedsAttentionOnly((v) => !v)}
        >
          <AlertTriangle size={16} />
          Needs attention
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Bookmark size={16} />
              Presets
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden sm:block h-8 w-px bg-border mx-1" aria-hidden />

        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            exportOrdersCsv(
              filteredRows,
              `orders-export-${new Date().toISOString().slice(0, 10)}.csv`
            )
          }
          disabled={filteredRows.length === 0}
        >
          <Download size={18} />
          Export
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              View
              <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-3">
            <div className="text-sm font-semibold mb-2 px-1">Columns</div>
            {(
              [
                ["orderNumber", "Order #"],
                ["orderType", "Order type"],
                ["channel", "Channel"],
                ["customer", "Customer"],
                ["city", "City"],
                ["items", "Items"],
                ["total", "Total"],
                ["discount", "Discount"],
                ["paymentMethod", "Payment Method"],
                ["paymentStatus", "Payment Status"],
                ["status", "Status"],
                ["createdAt", "Created At"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 px-1 py-1.5 cursor-pointer hover:opacity-80"
              >
                <Checkbox
                  checked={visibleColumns[key]}
                  onCheckedChange={() => toggleColumn(key)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onClear={chip.onClear}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Filter controls — Guest/User is a filter here; Channel is the primary tab */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={orderTypeFilter}
          onValueChange={(v) => setOrderTypeFilter(v as OrderTypeFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Order type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All order types</SelectItem>
            <SelectItem value="user">User orders</SelectItem>
            <SelectItem value="guest">Guest orders</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={16} />
              Status
              {selectedStatuses.length > 0 && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {selectedStatuses.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-3">
            {statusOptions.map((status) => (
              <label
                key={status}
                className="flex items-center gap-2 py-1.5 cursor-pointer"
              >
                <Checkbox
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={() => toggleStatus(status)}
                />
                <span className="text-sm capitalize">{status}</span>
              </label>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Payment
              {selectedPaymentMethods.length > 0 && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {selectedPaymentMethods.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-3">
            {paymentMethodOptions.map((method) => (
              <label
                key={method.value}
                className="flex items-center gap-2 py-1.5 cursor-pointer"
              >
                <Checkbox
                  checked={selectedPaymentMethods.includes(method.value)}
                  onCheckedChange={() => togglePaymentMethod(method.value)}
                />
                <span className="text-sm">{method.label}</span>
              </label>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[150px]">
            <MapPin size={14} className="mr-1 text-muted-foreground" />
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {MOCK_ORDER_CITIES.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={hasDiscount}
          onValueChange={(v) => setHasDiscount(v as HasDiscountFilter)}
        >
          <SelectTrigger className="w-[150px]">
            <Percent size={14} className="mr-1 text-muted-foreground" />
            <SelectValue placeholder="Discount" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any discount</SelectItem>
            <SelectItem value="yes">Has discount</SelectItem>
            <SelectItem value="no">No discount</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          <SlidersHorizontal size={14} />
          {filtersOpen ? "Hide" : "More"} filters
        </Button>
      </div>

      {filtersOpen && (
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border p-3 bg-muted/20">
          <CalendarRange size={16} className="text-muted-foreground mb-2" />
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Min amount</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              className="w-[120px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max amount</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="∞"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              className="w-[120px]"
            />
          </div>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        {pageSlice.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No orders match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {visibleColumns.orderNumber && (
                    <th className="text-left py-3 px-4 font-semibold">
                      Order #
                    </th>
                  )}
                  {visibleColumns.orderType && (
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                  )}
                  {visibleColumns.channel && (
                    <th className="text-left py-3 px-4 font-semibold">
                      Channel
                    </th>
                  )}
                  {visibleColumns.customer && (
                    <th className="text-left py-3 px-4 font-semibold">
                      Customer
                    </th>
                  )}
                  {visibleColumns.city && (
                    <th className="text-left py-3 px-4 font-semibold">City</th>
                  )}
                  {visibleColumns.items && (
                    <th className="text-left py-3 px-4 font-semibold">Items</th>
                  )}
                  {visibleColumns.total && (
                    <th className="text-left py-3 px-4">
                      <SortableHeader
                        label="Total"
                        active={sortKey === "totalAmount"}
                        direction={sortOrder}
                        onClick={() => toggleSort("totalAmount")}
                      />
                    </th>
                  )}
                  {visibleColumns.discount && (
                    <th className="text-left py-3 px-4 font-semibold">
                      Discount
                    </th>
                  )}
                  {visibleColumns.paymentMethod && (
                    <th className="text-left py-3 px-4 font-semibold">
                      Payment
                    </th>
                  )}
                  {visibleColumns.paymentStatus && (
                    <th className="text-left py-3 px-4 font-semibold">
                      Pay status
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th className="text-left py-3 px-4 font-semibold">
                      Status
                    </th>
                  )}
                  {visibleColumns.createdAt && (
                    <th className="text-left py-3 px-4">
                      <SortableHeader
                        label="Created At"
                        active={sortKey === "createdAt"}
                        direction={sortOrder}
                        onClick={() => toggleSort("createdAt")}
                      />
                    </th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((row) => {
                  const pay = paymentStatusDisplay(row);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border hover:bg-primary/5 transition"
                    >
                      {visibleColumns.orderNumber && (
                        <td className="py-3 px-4 font-medium">
                          <button
                            type="button"
                            className="hover:underline hover:text-primary"
                            onClick={() => {
                              setQuickViewOrder(row);
                              setQuickViewOpen(true);
                            }}
                          >
                            {row.orderNumber}
                          </button>
                        </td>
                      )}
                      {visibleColumns.orderType && (
                        <td className="py-3 px-4">
                          <OrderTypeBadge orderType={row.orderType} />
                        </td>
                      )}
                      {visibleColumns.channel && (
                        <td className="py-3 px-4">
                          <ChannelBadge channel={row.channel} />
                        </td>
                      )}
                      {visibleColumns.customer && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {row.customerName}
                            </span>
                            {row.accountStatus === "unclaimed" ||
                            row.accountStatus === "invited" ? (
                              <span className="rounded-full bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-200 capitalize">
                                {row.accountStatus}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.customerEmail}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.customerPhone}
                          </div>
                        </td>
                      )}
                      {visibleColumns.city && (
                        <td className="py-3 px-4">{row.city}</td>
                      )}
                      {visibleColumns.items && (
                        <td className="py-3 px-4 text-muted-foreground">
                          {row.itemCount} item{row.itemCount === 1 ? "" : "s"}
                        </td>
                      )}
                      {visibleColumns.total && (
                        <td className="py-3 px-4 font-semibold tabular-nums">
                          {formatMoney(row.totalAmount, row.currency)}
                        </td>
                      )}
                      {visibleColumns.discount && (
                        <td className="py-3 px-4">
                          {row.discountCode ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs font-medium">
                              <Percent size={12} />
                              {row.discountCode}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.paymentMethod && (
                        <td className="py-3 px-4 text-sm">
                          {row.paymentMethodLabel}
                        </td>
                      )}
                      {visibleColumns.paymentStatus && (
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentColor(
                              pay.tone
                            )}`}
                          >
                            {pay.label}
                          </span>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="py-3 px-4">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    row.status
                                  )}`}
                                >
                                  {row.status.charAt(0).toUpperCase() +
                                    row.status.slice(1)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {orderStatusDescriptions[row.status]}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      )}
                      {visibleColumns.createdAt && (
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                            >
                              Actions
                              <ChevronDown size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setQuickViewOrder(row);
                                setQuickViewOpen(true);
                              }}
                            >
                              <Eye size={16} className="mr-2" />
                              Quick view
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a href={`/dashboard/orders/${row.id}`}>
                                Open full details
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-2">
          <select
            className="bg-background border border-border rounded px-3 py-2 text-sm"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">Rows per page</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages} ({filteredRows.length} total orders
            across {totalPages} pages)
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              ‹
            </Button>
            <Button variant="default" size="sm">
              {safePage}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
            >
              »
            </Button>
          </div>
        </div>
      </div>

      <OrderQuickViewSheet
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        orderId={quickViewOrder?.id ?? null}
        orderType={quickViewOrder?.orderType ?? "user"}
        fallbackCurrency="JOD"
        mockOrder={quickViewOrder}
      />
    </div>
  );
}
