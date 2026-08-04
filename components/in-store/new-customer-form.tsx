"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface NewCustomerFormValues {
  name: string;
  phone: string;
  email: string;
}

interface NewCustomerFormProps {
  initialPhone?: string;
  onSubmit: (values: NewCustomerFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function NewCustomerForm({
  initialPhone = "",
  onSubmit,
  onCancel,
  submitLabel = "Save customer",
}: NewCustomerFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState("");

  const isValid = name.trim().length > 0 && phone.trim().length > 0;

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
          <Input
            id="new-customer-phone"
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
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
      </div>
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          disabled={!isValid}
          onClick={() =>
            onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim() })
          }
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
