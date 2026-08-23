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
  Loader2,
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
import { NewOrderButton } from "@/components/orders/new-order-button";
import { formatMoney } from "@/lib/dashboard-utils";
import { orderService } from "@/lib/services/order.service";
import { settingsService } from "@/lib/services/settings.service";
import {
  mapOrderToListRow,
  mapGuestOrderToListRow,
  channelLabel,
  type ListOrderRow,
} from "@/lib/orders/list-row";
import { resolveStoreId } from "@/lib/stores/resolve-store-id";
import type { OrderChannel, OrderKind } from "@/lib/domain/channels";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/loading-state";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const SEARCH_DEBOUNCE_MS = 350;
const TERMINAL_STATUSES = new Set(["delivered", "cancelled", "refunded"]);

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
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
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

/** Days since created for pending/processing attention chips. */
function daysOpen(createdAt: string, status: string): number | null {
  if (TERMINAL_STATUSES.has(status)) return null;
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

function OrderTypeBadge({ orderType }: { orderType: OrderKind }) {
  if (orderType === "user") {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
        User order
      </span>
    );
  }
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
      Guest order
    </span>
  );
}

function ChannelBadge({ channel }: { channel: OrderChannel }) {
  const styles =
    channel === "in_store"
      ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
      : channel === "whatsapp"
        ? "bg-teal-500/15 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
        : "bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300";
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
}

function getPaymentColor(status: string) {
  switch (status?.toLowerCase()) {
    case "captured":
      return "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
    case "pending":
      return "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    case "failed":
      return "bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300";
    case "refunded":
      return "bg-orange-500/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300";
    case "awaiting":
      return "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function paymentStatusDisplay(row: ListOrderRow): {
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

function exportOrdersCsv(rows: ListOrderRow[], filename: string) {
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
  const [rows, setRows] = useState<ListOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [quickViewType, setQuickViewType] = useState<OrderKind>("user");
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

  const fallbackCurrency =
    settingsService.getSelectedStore()?.currencyCode || "JOD";

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
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
    sortKey,
    sortOrder,
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const storeId = await resolveStoreId();
        const min =
          amountMin === "" || Number.isNaN(Number(amountMin))
            ? undefined
            : Number(amountMin);
        const max =
          amountMax === "" || Number.isNaN(Number(amountMax))
            ? undefined
            : Number(amountMax);

        // API accepts a single payment_method; when multiple are selected we
        // pass the first and filter the page client-side below.
        const paymentParam =
          selectedPaymentMethods.length === 1
            ? selectedPaymentMethods[0]
            : selectedPaymentMethods.length > 1
              ? selectedPaymentMethods[0]
              : undefined;

        // Production GET /admin/orders rejects orderType=user|guest ("Invalid input
        // data"). Guest checkouts live on GET /admin/orders/guest instead.
        if (orderTypeFilter === "guest") {
          // Guests are online-only.
          if (channel === "in_store" || channel === "whatsapp") {
            if (!cancelled) {
              setRows([]);
              setTotal(0);
            }
            return;
          }

          const guestStatus =
            selectedStatuses.length === 1
              ? (selectedStatuses[0] as
                  | "pending"
                  | "confirmed"
                  | "processing"
                  | "shipped"
                  | "delivered"
                  | "cancelled"
                  | "refunded")
              : undefined;
          const emailSearch =
            debouncedSearch.includes("@")
              ? debouncedSearch.trim()
              : undefined;

          const response = await orderService.getGuestOrders({
            storeId,
            page,
            limit: rowsPerPage,
            ...(guestStatus ? { status: guestStatus } : {}),
            ...(emailSearch ? { email: emailSearch } : {}),
          });

          if (cancelled) return;

          let mapped = (response.items || []).map(mapGuestOrderToListRow);

          if (debouncedSearch && !emailSearch) {
            const q = debouncedSearch.toLowerCase();
            mapped = mapped.filter(
              (row) =>
                row.orderNumber.toLowerCase().includes(q) ||
                row.customerEmail.toLowerCase().includes(q) ||
                row.customerPhone.toLowerCase().includes(q) ||
                row.lineItems.some(
                  (li) =>
                    li.sku.toLowerCase().includes(q) ||
                    li.name.toLowerCase().includes(q),
                ),
            );
          }

          if (selectedStatuses.length > 1) {
            mapped = mapped.filter((row) =>
              selectedStatuses.includes(row.status.toLowerCase()),
            );
          }

          if (selectedPaymentMethods.length > 0) {
            mapped = mapped.filter((row) => {
              const pm = row.paymentMethodType?.toLowerCase() ?? null;
              return pm != null && selectedPaymentMethods.includes(pm);
            });
          }

          if (min != null) {
            mapped = mapped.filter((row) => row.totalAmount >= min);
          }
          if (max != null) {
            mapped = mapped.filter((row) => row.totalAmount <= max);
          }

          setRows(mapped);
          setTotal(
            emailSearch ||
              selectedStatuses.length > 1 ||
              selectedPaymentMethods.length > 0 ||
              min != null ||
              max != null ||
              (debouncedSearch && !emailSearch)
              ? mapped.length
              : (response.total ?? mapped.length),
          );
          return;
        }

        const response = await orderService.getOrders({
          storeId,
          ...(channel !== "all" ? { channel } : {}),
          // Do NOT send orderType=user|guest — rejected by live API validation.
          ...(debouncedSearch ? { q: debouncedSearch } : {}),
          ...(selectedStatuses.length > 0
            ? { status: selectedStatuses.join(",") }
            : {}),
          ...(paymentParam ? { payment_method: paymentParam } : {}),
          ...(cityFilter !== "all" ? { city: cityFilter } : {}),
          ...(dateFrom ? { from: dateFrom } : {}),
          ...(dateTo ? { to: dateTo } : {}),
          ...(min != null ? { amountMin: min } : {}),
          ...(max != null ? { amountMax: max } : {}),
          ...(hasDiscount === "yes"
            ? { hasDiscount: true }
            : hasDiscount === "no"
              ? { hasDiscount: false }
              : {}),
          ...(needsAttentionOnly ? { needsAttention: true } : {}),
          sortBy: sortKey ?? "createdAt",
          sortOrder: sortKey ? sortOrder : "desc",
          page,
          limit: rowsPerPage,
        });

        if (cancelled) return;

        let mapped = (response.items || []).map(mapOrderToListRow);

        if (orderTypeFilter === "user") {
          mapped = mapped.filter((row) => !row.isGuest);
        }

        if (selectedPaymentMethods.length > 1) {
          mapped = mapped.filter((row) => {
            const pm = row.paymentMethodType?.toLowerCase() ?? null;
            return pm != null && selectedPaymentMethods.includes(pm);
          });
        }

        setRows(mapped);
        setTotal(
          orderTypeFilter === "user" || selectedPaymentMethods.length > 1
            ? mapped.length
            : (response.total ?? mapped.length),
        );
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setTotal(0);
          setError(
            err instanceof Error ? err.message : "Failed to load orders"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    page,
    rowsPerPage,
    debouncedSearch,
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
    sortKey,
    sortOrder,
  ]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      if (row.city && row.city !== "—") set.add(row.city);
    }
    if (cityFilter !== "all") set.add(cityFilter);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows, cityFilter]);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage = Math.min(page, totalPages);

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

  const openQuickView = (row: ListOrderRow) => {
    setQuickViewId(row.id);
    setQuickViewType(row.orderType);
    setQuickViewOpen(true);
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
      {/* Search + actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative w-full min-w-0 sm:flex-1 sm:min-w-[240px]">
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
              rows,
              `orders-export-${new Date().toISOString().slice(0, 10)}.csv`
            )
          }
          disabled={rows.length === 0}
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

        <NewOrderButton variant="toolbar" className="hidden sm:inline-flex" />
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
          <SelectTrigger className="w-full sm:w-[160px]">
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
          <SelectTrigger className="w-full sm:w-[150px]">
            <MapPin size={14} className="mr-1 text-muted-foreground" />
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cityOptions.map((city) => (
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
          <SelectTrigger className="w-full sm:w-[150px]">
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
              className="w-full sm:w-[150px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-[150px]"
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

      <div className="border border-border rounded-lg overflow-hidden relative">
        {loading && rows.length > 0 ? (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/20">
            <div className="h-full w-1/3 animate-pulse bg-primary" />
          </div>
        ) : null}
        {loading && rows.length === 0 ? (
          <LoadingState label="Loading orders…" />
        ) : error ? (
          <div className="py-12 text-center text-destructive">{error}</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No orders match the current filters.
          </div>
        ) : (
          <div
            className={cn(
              "overflow-x-auto transition-opacity",
              loading && "opacity-60 pointer-events-none",
            )}
          >
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
                {rows.map((row) => {
                  const pay = paymentStatusDisplay(row);
                  const openDays = daysOpen(row.createdAt, row.status);
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
                            onClick={() => openQuickView(row)}
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
                              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 capitalize dark:bg-amber-500/20 dark:text-amber-300">
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
                          <div className="flex flex-col gap-1 items-start">
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
                            {openDays != null &&
                              (row.status === "pending" ||
                                row.status === "processing") &&
                              openDays >= 1 ? (
                              <span className="text-[10px] text-amber-600 dark:text-amber-300">
                                Open {openDays}d
                              </span>
                            ) : null}
                          </div>
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
                              onClick={() => openQuickView(row)}
                            >
                              <Eye size={16} className="mr-2" />
                              Quick view
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a
                                href={
                                  row.orderType === "guest"
                                    ? `/dashboard/orders/${row.id}?guest=true`
                                    : `/dashboard/orders/${row.id}`
                                }
                              >
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-2">
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
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
            <span className="hidden sm:inline">
              {" "}
              ({total} total orders)
            </span>
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={safePage === 1 || loading}
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1 || loading}
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
              disabled={safePage === totalPages || loading}
            >
              ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages || loading}
            >
              »
            </Button>
          </div>
        </div>
      </div>

      <OrderQuickViewSheet
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        orderId={quickViewId}
        orderType={quickViewType}
        fallbackCurrency={fallbackCurrency}
      />
    </div>
  );
}
