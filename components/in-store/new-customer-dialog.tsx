"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MockCustomer } from "@/lib/in-store/mock-data";

export interface NewCustomerValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

function validate(values: NewCustomerValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.firstName.trim()) errors.firstName = "First name is required";
  if (!values.lastName.trim()) errors.lastName = "Last name is required";
  if (!values.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!/^\+?[0-9\s\-()]{7,16}$/.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number";
  }
  if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  return errors;
}

function buildMockCustomer(values: NewCustomerValues): MockCustomer {
  return {
    id: `cust-new-${Date.now()}`,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: values.phone.trim(),
    email: values.email.trim() || null,
    status: "unclaimed",
    channels: ["in_store"],
    customerSince: new Date().toISOString(),
    totalOrders: 0,
  };
}

/**
 * Inline new-customer form. Used directly by the New Sale flow (Step 1
 * no-match state) and wrapped in a Dialog by NewCustomerDialog below,
 * so both surfaces share fields + validation.
 */
export function NewCustomerForm({
  initialPhone = "",
  submitLabel = "Add customer",
  onSubmit,
  onCancel,
}: {
  initialPhone?: string;
  submitLabel?: string;
  onSubmit: (customer: MockCustomer) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<NewCustomerValues>({
    firstName: "",
    lastName: "",
    phone: initialPhone,
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (field: keyof NewCustomerValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(buildMockCustomer(values));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nc-first-name">First name</Label>
          <Input
            id="nc-first-name"
            value={values.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            placeholder="e.g. Omar"
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nc-last-name">Last name</Label>
          <Input
            id="nc-last-name"
            value={values.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            placeholder="e.g. Haddad"
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="nc-phone">Phone number</Label>
        <Input
          id="nc-phone"
          type="tel"
          value={values.phone}
          onChange={(e) => setField("phone", e.target.value)}
          placeholder="+9627XXXXXXXX"
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="nc-email">
          Email <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="nc-email"
          type="email"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          placeholder="name@example.com"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

/**
 * Shared "New customer" modal — centered Dialog + overlay, matching the
 * Add Product modal pattern. Used by the Customers list and reusable anywhere.
 */
export function NewCustomerDialog({
  open,
  onOpenChange,
  initialPhone = "",
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhone?: string;
  onCreated: (customer: MockCustomer) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
          <DialogDescription>
            Add a walk-in customer. They can claim their account later.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <NewCustomerForm
            initialPhone={initialPhone}
            onSubmit={(customer) => {
              onCreated(customer);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
