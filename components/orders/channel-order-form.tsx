"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  User as UserIcon,
  Lock,
  Printer,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { CartLine } from "@/lib/orders/cart";
import type { ChannelPaymentMethod } from "@/lib/domain/channels";
import { orderService } from "@/lib/services/order.service";
import { resolveStoreId } from "@/lib/stores/resolve-store-id";
import { userService, type User } from "@/lib/services/user.service";
import {
  displayCustomerEmail,
} from "@/lib/customers/email";
import {
  NewCustomerForm,
  type NewCustomerFormValues,
} from "@/components/in-store/new-customer-form";
import { AccountStatusBadge } from "@/components/in-store/badges";
import {
  StepIndicator,
  type StepState,
} from "@/components/in-store/step-indicator";
import { ProductPicker } from "@/components/in-store/product-picker";
import { PhoneInput, phoneValueToString, isPhoneReady, type PhoneValue } from "@/components/ui/phone-input";
import {
  DEFAULT_DIAL,
  phoneSearchVariants,
} from "@/lib/phone";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type OrderEntryChannel = "in_store" | "whatsapp";
type PaymentMethod = ChannelPaymentMethod;

// Customers resolve against the real users API (GET /admin/users). "new"
// customers stay local until the backend exposes an admin create-customer
// endpoint — the payload is included in the completed-sale log.
type ResolvedCustomer =
  | { kind: "existing"; user: User }
  | { kind: "new"; name: string; phone: string; email: string };

const userDisplayName = (user: User): string =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
  displayCustomerEmail(user.email) ||
  "Customer";

const userPhone = (user: User): string =>
  user.phoneNumber || user.phone || "";

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "cliq", label: "Cliq" },
  { value: "other", label: "Other" },
];

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  cliq: "Cliq",
  other: "Other",
};

/** Rewrite API insufficient-stock errors to use cart product names. */
function formatChannelOrderError(message: string, cart: CartLine[]): string {
  const match = message.match(
    /Insufficient stock for product ([0-9a-f-]{36})\.?\s*Requested:?\s*(\d+)/i,
  );
  if (!match) return message;
  const productId = match[1];
  const requested = match[2];
  const line = cart.find((l) => l.productId === productId);
  const name = line?.name?.trim() || productId;
  if (line?.stockQuantity != null) {
    return `Not enough stock for "${name}". Requested ${requested}; only ${line.stockQuantity} available.`;
  }
  return `Not enough stock for "${name}". Requested ${requested}.`;
}

const channelCopy: Record<
  OrderEntryChannel,
  { title: string; subtitle: string; completeLabel: string; cancelLabel: string }
> = {
  in_store: {
    title: "In-Store order",
    subtitle:
      "Look up the customer, build the cart, and complete the sale at the counter.",
    completeLabel: "Complete Sale",
    cancelLabel: "Cancel sale",
  },
  whatsapp: {
    title: "WhatsApp order",
    subtitle:
      "Look up the customer by phone, build the cart, and record the WhatsApp order.",
    completeLabel: "Complete WhatsApp order",
    cancelLabel: "Cancel order",
  },
};

/** Everything the confirmation screen needs to render a receipt. */
interface CompletedSale {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  completedAt: string;
  channel: OrderEntryChannel;
}

interface ChannelOrderFormProps {
  channel: OrderEntryChannel;
  /** When false, parent page supplies the title (New Order + tabs). */
  showTitle?: boolean;
}

export function ChannelOrderForm({
  channel,
  showTitle = true,
}: ChannelOrderFormProps) {
  const copy = channelCopy[channel];
  // --- Step 1: Customer ---
  const [phoneValue, setPhoneValue] = useState<PhoneValue>({
    dial: DEFAULT_DIAL,
    national: "",
  });
  const [emailQuery, setEmailQuery] = useState("");
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [resolvedCustomer, setResolvedCustomer] =
    useState<ResolvedCustomer | null>(null);

  const fullPhoneQuery = phoneValueToString(phoneValue);
  const canLookupPhone = isPhoneReady(phoneValue.dial, phoneValue.national);
  const canLookupEmail =
    emailQuery.trim().includes("@") && emailQuery.trim().length >= 5;
  const canLookup = canLookupPhone || canLookupEmail;

  const handleLookup = async () => {
    if (!canLookup || isLookingUp) return;
    setIsLookingUp(true);
    try {
      let match: User | null = null;

      if (canLookupEmail) {
        match = await userService.findCustomerByEmail(emailQuery.trim());
      }

      if (!match && canLookupPhone) {
        match = await userService.findCustomerByPhone(fullPhoneQuery, {
          national: phoneValue.national,
          qVariants: phoneSearchVariants(
            phoneValue.dial,
            phoneValue.national,
          ),
        });
      }

      setLookupAttempted(true);
      setResolvedCustomer(match ? { kind: "existing", user: match } : null);
      if (match) {
        toast.success(`Found ${userDisplayName(match)}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Customer lookup failed");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleNewCustomerSubmit = (values: NewCustomerFormValues) => {
    setResolvedCustomer({ kind: "new", ...values });
  };

  const handleUseExistingCustomer = (user: User) => {
    setResolvedCustomer({ kind: "existing", user });
    setLookupAttempted(false);
    toast.success(`Using existing customer ${userDisplayName(user)}`);
  };

  const resetCustomer = () => {
    setResolvedCustomer(null);
    setLookupAttempted(false);
    setPhoneValue({ dial: DEFAULT_DIAL, national: "" });
    setEmailQuery("");
  };

  const customerName =
    resolvedCustomer?.kind === "existing"
      ? userDisplayName(resolvedCustomer.user)
      : resolvedCustomer?.kind === "new"
        ? resolvedCustomer.name
        : null;

  // --- Step 2: Cart (lines come from the API-backed product picker) ---
  const [cart, setCart] = useState<CartLine[]>([]);

  const addToCart = (line: CartLine) => {
    let toastMessage: string | null = null;
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === line.productId);
      const stockCap =
        line.stockQuantity ?? existing?.stockQuantity ?? null;

      if (existing) {
        const desired = existing.quantity + line.quantity;
        if (stockCap != null && desired > stockCap) {
          toastMessage =
            existing.quantity >= stockCap
              ? `No more stock available for "${existing.name}".`
              : `Only ${stockCap} in stock for "${existing.name}".`;
          if (existing.quantity >= stockCap) return prev;
          return prev.map((l) =>
            l.productId === line.productId
              ? {
                  ...l,
                  quantity: stockCap,
                  imageUrl: l.imageUrl || line.imageUrl,
                  stockQuantity: stockCap,
                }
              : l,
          );
        }
        return prev.map((l) =>
          l.productId === line.productId
            ? {
                ...l,
                quantity: desired,
                imageUrl: l.imageUrl || line.imageUrl,
                stockQuantity: stockCap ?? l.stockQuantity,
              }
            : l,
        );
      }

      let qty = line.quantity;
      if (stockCap != null) {
        if (stockCap <= 0) {
          toastMessage = `No more stock available for "${line.name}".`;
          return prev;
        }
        if (qty > stockCap) {
          toastMessage = `Only ${stockCap} in stock for "${line.name}".`;
          qty = stockCap;
        }
      }
      return [
        ...prev,
        { ...line, quantity: qty, stockQuantity: stockCap },
      ];
    });
    if (toastMessage) toast.error(toastMessage);
  };

  const updateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((line) => line.productId !== productId));
      return;
    }
    let toastMessage: string | null = null;
    setCart((prev) =>
      prev.map((line) => {
        if (line.productId !== productId) return line;
        const stockCap = line.stockQuantity;
        if (stockCap != null && qty > stockCap) {
          toastMessage = `Only ${stockCap} in stock for "${line.name}".`;
          return { ...line, quantity: stockCap };
        }
        return { ...line, quantity: qty };
      }),
    );
    if (toastMessage) toast.error(toastMessage);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  };

  // --- WhatsApp conversation note (UI-only until backend) ---
  const [whatsappNote, setWhatsappNote] = useState("");

  // --- Discount (absolute JOD or % of subtotal) ---
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">(
    "amount",
  );
  const [discount, setDiscount] = useState("");
  const subtotal = cart.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
  const rawDiscountInput = Number(discount) || 0;
  const rawDiscountAmount =
    discountMode === "percent"
      ? (subtotal * Math.min(Math.max(rawDiscountInput, 0), 100)) / 100
      : rawDiscountInput;
  // Guardrail: applied discount is always clamped to [0, subtotal].
  const discountAmount = Math.min(Math.max(rawDiscountAmount, 0), subtotal);
  const discountExceedsSubtotal =
    cart.length > 0 &&
    discountMode === "amount" &&
    rawDiscountInput > subtotal;
  const discountPercentInvalid =
    cart.length > 0 &&
    discountMode === "percent" &&
    rawDiscountInput > 100;
  const total = subtotal - discountAmount;

  // --- Step 3: Payment ---
  // Deliberately no pre-selected default: mis-recorded payment method is a
  // reconciliation problem, so staff must make an explicit choice before
  // Complete Sale enables.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );

  // --- Cancel sale ---
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const saleInProgress = Boolean(resolvedCustomer) || cart.length > 0;

  const resetFlow = () => {
    resetCustomer();
    setCart([]);
    setDiscount("");
    setDiscountMode("amount");
    setPaymentMethod(null);
    setWhatsappNote("");
    setConfirmingCancel(false);
  };

  // --- Complete sale ---
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  const canComplete =
    Boolean(resolvedCustomer) && cart.length > 0 && Boolean(paymentMethod);

  const handleCompleteSale = async () => {
    if (!canComplete || !resolvedCustomer || !paymentMethod || submitting) return;

    const overstock = cart.find(
      (line) =>
        line.stockQuantity != null && line.quantity > line.stockQuantity,
    );
    if (overstock) {
      toast.error(
        `Not enough stock for "${overstock.name}". Requested ${overstock.quantity}; only ${overstock.stockQuantity} available.`,
      );
      return;
    }

    const phone =
      resolvedCustomer.kind === "existing"
        ? userPhone(resolvedCustomer.user)
        : resolvedCustomer.phone;

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    setSubmitting(true);
    try {
      const storeId = await resolveStoreId();
      // cash/card: mark paid explicitly. cliq: backend marks delivered+paid from
      // paymentMethod alone (do not send markPaid). other: pending unless markPaid.
      const markPaid =
        paymentMethod === "cash" || paymentMethod === "card"
          ? true
          : paymentMethod === "other"
            ? false
            : undefined;

      const order = await orderService.createChannelOrder(
        {
          storeId,
          channel,
          ...(resolvedCustomer.kind === "existing"
            ? { customerId: resolvedCustomer.user.id }
            : {
                newCustomer: {
                  name: resolvedCustomer.name,
                  phone: resolvedCustomer.phone,
                  email: resolvedCustomer.email || undefined,
                },
              }),
          items: cart.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
          paymentMethod,
          ...(markPaid !== undefined ? { markPaid } : {}),
          discountAmount: discountAmount > 0 ? discountAmount : 0,
          discountCode: null,
          notes:
            channel === "whatsapp" && whatsappNote.trim()
              ? whatsappNote.trim()
              : undefined,
        },
        idempotencyKeyRef.current,
      );

      const customerId =
        order.customer?.id ||
        order.userId ||
        (resolvedCustomer.kind === "existing"
          ? resolvedCustomer.user.id
          : "");

      setCompletedSale({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: customerId || "",
        customerName: customerName || "customer",
        customerPhone: phone,
        items: cart,
        subtotal,
        discount: discountAmount,
        total: parseFloat(String(order.totalAmount)) || total,
        paymentMethod,
        completedAt: order.createdAt || new Date().toISOString(),
        channel,
      });

      idempotencyKeyRef.current = null;
      toast.success(`Order #${order.orderNumber}`);
    } catch (error: any) {
      const raw = error.message || "Failed to create order";
      toast.error(formatChannelOrderError(raw, cart));
    } finally {
      setSubmitting(false);
    }
  };

  const startNewSale = () => {
    setCompletedSale(null);
    idempotencyKeyRef.current = null;
    resetFlow();
  };

  if (completedSale) {
    return (
      <SaleConfirmation sale={completedSale} onStartNewSale={startNewSale} />
    );
  }

  // Step semantics (see StepIndicator for the state definitions):
  // 1. Customer: "complete" once a customer is resolved; editable via
  //    "Change", which resets it back to "active".
  // 2. Products: "met" once the cart has ≥1 item — requirement satisfied, but
  //    staff can keep adding items, so it never reads as fully "complete".
  // 3. Payment: "active" once steps 1–2 are satisfied; "complete" only when a
  //    payment method is explicitly chosen (i.e. Complete Sale is enabled).
  const stepStates: StepState[] = [
    resolvedCustomer ? "complete" : "active",
    !resolvedCustomer ? "upcoming" : cart.length === 0 ? "active" : "met",
    !resolvedCustomer || cart.length === 0
      ? "upcoming"
      : paymentMethod
        ? "complete"
        : "active",
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {showTitle ? (
          <div>
            <h1 className="text-3xl font-bold">{copy.title}</h1>
            <p className="text-muted-foreground mt-1">{copy.subtitle}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground max-w-xl">{copy.subtitle}</p>
        )}

        {/* Cancel: secondary by design; lightweight inline confirm so
            walking away mid-transaction is fast to handle. */}
        {saleInProgress &&
          (confirmingCancel ? (
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <span className="text-sm">Cancel this order?</span>
              <Button size="sm" variant="destructive" onClick={resetFlow}>
                Yes, cancel
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmingCancel(false)}
              >
                Keep
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setConfirmingCancel(true)}
            >
              <XCircle size={15} className="mr-1.5" />
              {copy.cancelLabel}
            </Button>
          ))}
      </div>

      <StepIndicator
        steps={["Customer", "Products", "Payment"]}
        stepStates={stepStates}
      />

      {/* Step 1: Customer — always active first */}
      <Card>
        <CardContent className="pt-6">
          {resolvedCustomer ? (
            <ResolvedCustomerSummary
              resolved={resolvedCustomer}
              onChange={resetCustomer}
            />
          ) : (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold tracking-tight">
                  Find customer
                </h3>
                <p className="text-xs text-muted-foreground">
                  Search by phone or email, then continue with products.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="customer-phone-lookup"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Phone
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <PhoneInput
                    id="customer-phone-lookup"
                    autoFocus
                    value={phoneValue}
                    onChange={setPhoneValue}
                    onEnter={handleLookup}
                    placeholder="7XXXXXXXX"
                    className="min-w-0 flex-1"
                  />
                  <Button
                    onClick={handleLookup}
                    disabled={!canLookup || isLookingUp}
                    className="w-full sm:w-auto shrink-0 h-9 min-w-[7.5rem]"
                  >
                    {isLookingUp ? "Looking up…" : "Look up"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  Looks up as{" "}
                  <span className="font-medium text-foreground/80">
                    {canLookupPhone
                      ? fullPhoneQuery
                      : `${phoneValue.dial}…`}
                  </span>
                </p>
              </div>

              <div className="relative flex items-center gap-3 py-0.5">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="customer-email-lookup"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Email
                </Label>
                <Input
                  id="customer-email-lookup"
                  type="email"
                  className="h-9"
                  placeholder="name@example.com"
                  value={emailQuery}
                  onChange={(e) => setEmailQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                />
                <p className="text-[11px] text-muted-foreground">
                  Optional — use if phone isn&apos;t on file. Press Enter to look
                  up.
                </p>
              </div>

              {lookupAttempted && !resolvedCustomer && (
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <p className="text-sm font-medium">
                    No customer found — create one to continue.
                  </p>
                  <NewCustomerForm
                    initialPhone={
                      canLookupPhone ? fullPhoneQuery : undefined
                    }
                    onSubmit={handleNewCustomerSubmit}
                    onExistingCustomer={handleUseExistingCustomer}
                    submitLabel="Use this customer"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 2: Products — locked until a customer is resolved */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add products</CardTitle>
            </CardHeader>
            <CardContent>
              {resolvedCustomer ? (
                <ProductPicker cart={cart} onAdd={addToCart} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                  <Lock size={22} />
                  <p className="text-sm">
                    Look up or add a customer to start adding products.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step 3: Cart & payment — persistent sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No items yet — add products from the list.
                </p>
              ) : (
                <div className="space-y-3">
                  {cart.map((line) => (
                    <div
                      key={line.productId}
                      className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={line.imageUrl || "/placeholder.svg"}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug line-clamp-2">
                            {line.name}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeFromCart(line.productId)}
                            className="text-muted-foreground hover:text-destructive shrink-0 -mt-1 -mr-1"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() =>
                                updateCartQuantity(
                                  line.productId,
                                  line.quantity - 1
                                )
                              }
                            >
                              <Minus size={14} />
                            </Button>
                            <span className="w-6 text-center text-sm">
                              {line.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              disabled={
                                line.stockQuantity != null &&
                                line.quantity >= line.stockQuantity
                              }
                              onClick={() =>
                                updateCartQuantity(
                                  line.productId,
                                  line.quantity + 1
                                )
                              }
                            >
                              <Plus size={14} />
                            </Button>
                          </div>
                          <p className="text-sm font-semibold">
                            JOD {(line.unitPrice * line.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor="discount"
                      className="text-xs text-muted-foreground"
                    >
                      Discount
                    </Label>
                    <div className="inline-flex h-7 items-center rounded-md border border-border bg-muted/40 p-0.5">
                      <button
                        type="button"
                        className={cn(
                          "rounded px-2 h-6 text-[11px] font-medium transition-colors",
                          discountMode === "amount"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => {
                          setDiscountMode("amount");
                          setDiscount("");
                        }}
                        disabled={cart.length === 0}
                      >
                        JOD
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "rounded px-2 h-6 text-[11px] font-medium transition-colors",
                          discountMode === "percent"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => {
                          setDiscountMode("percent");
                          setDiscount("");
                        }}
                        disabled={cart.length === 0}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="discount"
                      type="number"
                      min={0}
                      max={
                        discountMode === "percent"
                          ? 100
                          : subtotal || undefined
                      }
                      step={discountMode === "percent" ? "1" : "0.01"}
                      placeholder={
                        discountMode === "percent" ? "0" : "0.00"
                      }
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      disabled={cart.length === 0}
                      className="pr-10"
                      aria-invalid={
                        discountExceedsSubtotal || discountPercentInvalid
                      }
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {discountMode === "percent" ? "%" : "JOD"}
                    </span>
                  </div>
                  {discountExceedsSubtotal && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Discount can&apos;t exceed the subtotal — capped at JOD{" "}
                      {subtotal.toFixed(2)}.
                    </p>
                  )}
                  {discountPercentInvalid && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Percent discount can&apos;t exceed 100%.
                    </p>
                  )}
                  {discountMode === "percent" && discountAmount > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {Math.min(rawDiscountInput, 100)}% = JOD{" "}
                      {discountAmount.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground pt-1">
                  <span>Subtotal</span>
                  <span>JOD {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Discount
                      {discountMode === "percent"
                        ? ` (${Math.min(rawDiscountInput, 100)}%)`
                        : ""}
                    </span>
                    <span>- JOD {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-1">
                  <span>Total</span>
                  <span>JOD {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {channel === "whatsapp" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">WhatsApp note</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Optional context from the WhatsApp conversation…"
                  value={whatsappNote}
                  onChange={(e) => setWhatsappNote(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Saved locally with this session order — not synced to WhatsApp
                  yet.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className={cart.length === 0 ? "opacity-60" : undefined}>
            <CardHeader>
              <CardTitle className="text-base">Payment method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {paymentOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      paymentMethod === option.value ? "default" : "outline"
                    }
                    disabled={cart.length === 0}
                    onClick={() => setPaymentMethod(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              {cart.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Add products to choose a payment method.
                </p>
              )}
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full sticky bottom-3 z-10 shadow-lg lg:static lg:shadow-none"
            disabled={!canComplete || submitting}
            onClick={handleCompleteSale}
          >
            {submitting ? "Submitting…" : copy.completeLabel}
          </Button>
          {!canComplete && (
            <p className="text-xs text-muted-foreground text-center">
              {!resolvedCustomer
                ? "Resolve a customer to continue."
                : cart.length === 0
                  ? "Add at least one product to continue."
                  : "Select a payment method to continue."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Post-sale confirmation: a lightweight receipt staff can glance at to
 * confirm what was actually charged, plus the three follow-up actions.
 */
function SaleConfirmation({
  sale,
  onStartNewSale,
}: {
  sale: CompletedSale;
  onStartNewSale: () => void;
}) {
  const channelLabel =
    sale.channel === "whatsapp" ? "WhatsApp" : "In-Store";

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-600 dark:text-green-400" />
        <h1 className="text-3xl font-bold">Order complete</h1>
        <p className="text-muted-foreground">
          {channelLabel} · {new Date(sale.completedAt).toLocaleString()}
        </p>
      </div>

      {/* Receipt */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">
              Order #{sale.orderNumber}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              Paid by {paymentLabels[sale.paymentMethod]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
              <UserIcon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {sale.customerName}
              </p>
              <p className="text-xs text-muted-foreground">
                {sale.customerPhone}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {sale.items.map((line) => (
              <div
                key={line.productId}
                className="flex items-start gap-3 text-sm"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={line.imageUrl || "/placeholder.svg"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.quantity} × JOD {line.unitPrice.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold shrink-0">
                  JOD {(line.unitPrice * line.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-1 pt-3 border-t border-border">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>JOD {sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Discount</span>
                <span>- JOD {sale.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1">
              <span>Total charged</span>
              <span>JOD {sale.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" className="flex-1" onClick={onStartNewSale}>
          Start new order
        </Button>
        <Button size="lg" variant="outline" className="flex-1" asChild>
          <Link href={`/dashboard/orders/${sale.orderId}`}>View order</Link>
        </Button>
        <Button size="lg" variant="outline" className="flex-1" asChild>
          <Link href={`/dashboard/customers/${sale.customerId}`}>
            View customer
          </Link>
        </Button>
      </div>

      <div className="text-center space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() =>
            toast.info("Receipt printing isn't wired up yet (mock).")
          }
        >
          <Printer size={15} className="mr-1.5" />
          Print receipt
        </Button>
        <p className="text-xs text-muted-foreground">
          Sale recorded on the server. Open the order for full details.
        </p>
      </div>
    </div>
  );
}

function ResolvedCustomerSummary({
  resolved,
  onChange,
}: {
  resolved: ResolvedCustomer;
  onChange: () => void;
}) {
  const name =
    resolved.kind === "existing"
      ? userDisplayName(resolved.user)
      : resolved.name;
  const phone =
    resolved.kind === "existing" ? userPhone(resolved.user) : resolved.phone;
  const status =
    resolved.kind === "existing"
      ? resolved.user.accountStatus ||
        (resolved.user.emailVerified || resolved.user.isEmailVerified
          ? "active"
          : "invited")
      : "unclaimed";
  const email =
    resolved.kind === "existing"
      ? displayCustomerEmail(resolved.user.email)
      : resolved.email || null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
          <UserIcon size={16} />
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-medium text-sm truncate">{name}</span>
          <span className="text-muted-foreground text-sm">{phone}</span>
          <AccountStatusBadge status={status} />
          {resolved.kind === "existing" && resolved.user.totalOrders != null && (
            <span className="text-xs text-muted-foreground">
              {resolved.user.totalOrders} orders
            </span>
          )}
          {email ? (
            <span className="text-xs text-muted-foreground truncate">{email}</span>
          ) : resolved.kind === "new" ? (
            <span className="text-xs text-muted-foreground">First order</span>
          ) : null}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onChange} className="shrink-0">
        Change
      </Button>
    </div>
  );
}
