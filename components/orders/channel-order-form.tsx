"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Phone,
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
import {
  generateChannelOrderNumber,
  recordChannelOrder,
  type PaymentMethod,
  type CartLine,
} from "@/lib/mock-data/in-store";
import { userService, type User } from "@/lib/services/user.service";
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
import { Textarea } from "@/components/ui/textarea";

export type OrderEntryChannel = "in_store" | "whatsapp";

// Customers resolve against the real users API (GET /admin/users). "new"
// customers stay local until the backend exposes an admin create-customer
// endpoint — the payload is included in the completed-sale log.
type ResolvedCustomer =
  | { kind: "existing"; user: User }
  | { kind: "new"; name: string; phone: string; email: string };

const userDisplayName = (user: User): string =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

const userPhone = (user: User): string =>
  user.phoneNumber || user.phone || "";

const normalizePhone = (phone: string): string => phone.replace(/[\s-]/g, "");

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  other: "Other",
};

const channelCopy: Record<
  OrderEntryChannel,
  { title: string; subtitle: string; completeLabel: string; cancelLabel: string }
> = {
  in_store: {
    title: "Offline order",
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
  const [phoneQuery, setPhoneQuery] = useState("");
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [resolvedCustomer, setResolvedCustomer] =
    useState<ResolvedCustomer | null>(null);

  const handleLookup = async () => {
    const query = phoneQuery.trim();
    if (!query || isLookingUp) return;
    setIsLookingUp(true);
    try {
      // Search real customers by phone via GET /admin/users?q=...
      const result = await userService.listUsers({
        q: query,
        role: "customer",
        limit: 10,
      });
      const normalized = normalizePhone(query);
      const match =
        result.items.find(
          (u) => normalizePhone(userPhone(u)) === normalized
        ) ?? result.items[0];
      setLookupAttempted(true);
      setResolvedCustomer(match ? { kind: "existing", user: match } : null);
    } catch (error: any) {
      toast.error(error.message || "Customer lookup failed");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleNewCustomerSubmit = (values: NewCustomerFormValues) => {
    setResolvedCustomer({ kind: "new", ...values });
  };

  const resetCustomer = () => {
    setResolvedCustomer(null);
    setLookupAttempted(false);
    setPhoneQuery("");
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
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === line.productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === line.productId
            ? { ...l, quantity: l.quantity + line.quantity }
            : l
        );
      }
      return [...prev, line];
    });
  };

  const updateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((line) => line.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, quantity: qty } : line
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  };

  // --- WhatsApp conversation note (UI-only until backend) ---
  const [whatsappNote, setWhatsappNote] = useState("");

  // --- Discount ---
  const [discount, setDiscount] = useState("");
  const subtotal = cart.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
  // Guardrail: the applied discount is always clamped to [0, subtotal] so the
  // total can never go negative, regardless of what's typed in the field.
  const rawDiscount = Number(discount) || 0;
  const discountAmount = Math.min(Math.max(rawDiscount, 0), subtotal);
  const discountExceedsSubtotal = cart.length > 0 && rawDiscount > subtotal;
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
    setPaymentMethod(null);
    setWhatsappNote("");
    setConfirmingCancel(false);
  };

  // --- Complete sale ---
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(
    null
  );

  const canComplete =
    Boolean(resolvedCustomer) && cart.length > 0 && Boolean(paymentMethod);

  const handleCompleteSale = () => {
    if (!canComplete || !resolvedCustomer || !paymentMethod) return;
    const orderNumber = generateChannelOrderNumber(channel);

    const phone =
      resolvedCustomer.kind === "existing"
        ? userPhone(resolvedCustomer.user)
        : resolvedCustomer.phone;

    // BACKEND GAP: there is no order-creation endpoint yet (POST
    // /admin/orders or similar). The sale is recorded session-locally so the
    // confirmation flow works; this call becomes the real API request later.
    const { order, customerId } = recordChannelOrder({
      orderNumber,
      customerId:
        resolvedCustomer.kind === "existing"
          ? resolvedCustomer.user.id
          : null,
      newCustomer:
        resolvedCustomer.kind === "new"
          ? {
              name: resolvedCustomer.name,
              phone: resolvedCustomer.phone,
              email: resolvedCustomer.email,
            }
          : undefined,
      customerSnapshot: { name: customerName || "customer", phone },
      items: cart,
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod,
      channel,
      notes:
        channel === "whatsapp" && whatsappNote.trim()
          ? whatsappNote.trim()
          : undefined,
    });

    if (channel === "whatsapp" && whatsappNote.trim()) {
      console.log("[orders] WhatsApp conversation note", {
        orderId: order.id,
        note: whatsappNote.trim(),
      });
    }

    setCompletedSale({
      orderId: order.id,
      orderNumber,
      customerId,
      customerName: customerName || "customer",
      customerPhone: phone,
      items: cart,
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod,
      completedAt: new Date().toISOString(),
      channel,
    });

    // Brief, ambient confirmation only — the confirmation screen below is
    // the primary source of truth, so don't duplicate its content here.
    toast.success(`Order #${orderNumber}`);
  };

  const startNewSale = () => {
    setCompletedSale(null);
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
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <Input
                    autoFocus
                    placeholder="Phone number, e.g. 0791234567"
                    className="pl-10"
                    value={phoneQuery}
                    onChange={(e) => setPhoneQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  />
                </div>
                <Button
                  onClick={handleLookup}
                  disabled={!phoneQuery.trim() || isLookingUp}
                  className="sm:w-auto w-full"
                >
                  {isLookingUp ? "Looking up..." : "Look up"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Searches registered customers by phone number. Unknown numbers
                can be added as new customers.
              </p>

              {lookupAttempted && !resolvedCustomer && (
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <p className="text-sm font-medium">
                    No customer found for that number — create one to
                    continue.
                  </p>
                  <NewCustomerForm
                    initialPhone={phoneQuery.trim()}
                    onSubmit={handleNewCustomerSubmit}
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
                      className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">
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
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="space-y-1">
                  <Label
                    htmlFor="discount"
                    className="text-xs text-muted-foreground"
                  >
                    Manual discount (JOD)
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    min={0}
                    max={subtotal || undefined}
                    placeholder="0.00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    disabled={cart.length === 0}
                    aria-invalid={discountExceedsSubtotal}
                  />
                  {discountExceedsSubtotal && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Discount can't exceed the subtotal — capped at JOD{" "}
                      {subtotal.toFixed(2)}.
                    </p>
                  )}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground pt-1">
                  <span>Subtotal</span>
                  <span>JOD {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Discount</span>
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
              <div className="grid grid-cols-3 gap-2">
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
            className="w-full"
            disabled={!canComplete}
            onClick={handleCompleteSale}
          >
            {copy.completeLabel}
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
    sale.channel === "whatsapp" ? "WhatsApp" : "Offline (In-Store)";

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
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
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
          Recorded locally for this session — the order-creation API isn't
          available yet, so this sale is not persisted to the backend.
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
  // Map the backend user model onto the in-store status concept: a verified
  // account reads "Active"; an unverified one reads "Invited". A locally
  // created customer is "Unclaimed" until the backend supports creating them.
  const status =
    resolved.kind === "existing"
      ? resolved.user.emailVerified
        ? "active"
        : "invited"
      : "unclaimed";

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
          {/* BACKEND GAP: channel badges + total order count need per-customer
              aggregates (channels, order count) from the API. */}
          {resolved.kind === "existing" ? (
            resolved.user.email && (
              <span className="text-xs text-muted-foreground truncate">
                {resolved.user.email}
              </span>
            )
          ) : (
            <span className="text-xs text-muted-foreground">First order</span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onChange} className="shrink-0">
        Change
      </Button>
    </div>
  );
}
