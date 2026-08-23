"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PhoneInput,
  phoneValueFromString,
  phoneValueToString,
  isPhoneReady,
  type PhoneValue,
} from "@/components/ui/phone-input";
import { DEFAULT_DIAL } from "@/lib/phone";
import { userService, type User } from "@/lib/services/user.service";
import { displayCustomerEmail } from "@/lib/customers/email";
import { Loader2 } from "lucide-react";

export interface NewCustomerFormValues {
  name: string;
  phone: string;
  email: string;
}

interface NewCustomerFormProps {
  initialPhone?: string;
  onSubmit: (values: NewCustomerFormValues) => void;
  /** When an email already belongs to a customer, offer to use that account. */
  onExistingCustomer?: (user: User) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

const userDisplayName = (user: User): string =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
  displayCustomerEmail(user.email) ||
  "Customer";

export function NewCustomerForm({
  initialPhone = "",
  onSubmit,
  onExistingCustomer,
  onCancel,
  submitLabel = "Save customer",
}: NewCustomerFormProps) {
  const [name, setName] = useState("");
  const [phoneValue, setPhoneValue] = useState<PhoneValue>(() =>
    initialPhone
      ? phoneValueFromString(initialPhone)
      : { dial: DEFAULT_DIAL, national: "" },
  );
  const [email, setEmail] = useState("");
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [existingByEmail, setExistingByEmail] = useState<User | null>(null);

  useEffect(() => {
    if (!initialPhone) return;
    setPhoneValue(phoneValueFromString(initialPhone));
  }, [initialPhone]);

  // Debounced email lookup — surface existing accounts instead of failing later.
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || trimmed.length < 5) {
      setExistingByEmail(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setEmailCheckLoading(true);
      try {
        const result = await userService.listUsers({
          q: trimmed,
          role: "customer",
          limit: 20,
        });
        if (cancelled) return;
        const match =
          result.items.find(
            (u) => (u.email || "").trim().toLowerCase() === trimmed,
          ) ?? null;
        setExistingByEmail(match);
      } catch {
        if (!cancelled) setExistingByEmail(null);
      } finally {
        if (!cancelled) setEmailCheckLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email]);

  const isValid =
    name.trim().length > 0 &&
    isPhoneReady(phoneValue.dial, phoneValue.national);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-customer-name">Full name *</Label>
          <Input
            id="new-customer-name"
            placeholder="e.g. Sara Odeh"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-customer-phone">Phone *</Label>
          <PhoneInput
            id="new-customer-phone"
            value={phoneValue}
            onChange={setPhoneValue}
            placeholder="7XXXXXXXX"
          />
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Saves as {phoneValueToString(phoneValue) || `${phoneValue.dial}…`}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-customer-email">Email (optional)</Label>
        <Input
          id="new-customer-email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {emailCheckLoading && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" />
            Checking email…
          </p>
        )}
        {existingByEmail && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 space-y-2">
            <p className="text-sm font-medium">
              An account already exists for this email
            </p>
            <p className="text-xs text-muted-foreground">
              {userDisplayName(existingByEmail)}
              {displayCustomerEmail(existingByEmail.email)
                ? ` · ${displayCustomerEmail(existingByEmail.email)}`
                : ""}
              {existingByEmail.phoneNumber || existingByEmail.phone
                ? ` · ${existingByEmail.phoneNumber || existingByEmail.phone}`
                : ""}
            </p>
            {onExistingCustomer && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onExistingCustomer(existingByEmail)}
              >
                Use this customer
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          disabled={!isValid || Boolean(existingByEmail)}
          onClick={() =>
            onSubmit({
              name: name.trim(),
              phone: phoneValueToString(phoneValue),
              email: email.trim(),
            })
          }
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
