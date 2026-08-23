"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DEFAULT_DIAL,
  DIAL_COUNTRIES,
  composePhone,
  digitsOnly,
  splitPhone,
} from "@/lib/phone";

export interface PhoneValue {
  dial: string;
  national: string;
}

interface PhoneInputProps {
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  id?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  onEnter?: () => void;
}

export function PhoneInput({
  value,
  onChange,
  id,
  autoFocus,
  disabled,
  className,
  inputClassName,
  placeholder = "7XXXXXXXX",
  onEnter,
}: PhoneInputProps) {
  const selected = useMemo(
    () =>
      DIAL_COUNTRIES.find((c) => c.dial === value.dial) ?? DIAL_COUNTRIES[0],
    [value.dial],
  );

  return (
    <div
      className={cn(
        "flex h-9 w-full items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-xs",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <Select
        value={value.dial || DEFAULT_DIAL}
        disabled={disabled}
        onValueChange={(dial) => onChange({ ...value, dial })}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            "h-full min-w-[6.75rem] shrink-0 rounded-none border-0 border-r border-input bg-muted/40 px-2.5 shadow-none",
            "focus-visible:ring-0 dark:bg-muted/30",
          )}
          aria-label="Country calling code"
        >
          <SelectValue>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <span className="text-base leading-none" aria-hidden>
                {selected.flag}
              </span>
              <span className="font-medium">{selected.dial}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" className="min-w-[16rem]">
          {DIAL_COUNTRIES.map((country) => (
            <SelectItem key={country.iso} value={country.dial}>
              <span className="inline-flex items-center gap-2">
                <span className="text-base leading-none" aria-hidden>
                  {country.flag}
                </span>
                <span className="min-w-[3.25rem] tabular-nums font-medium">
                  {country.dial}
                </span>
                <span className="text-muted-foreground">{country.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        autoFocus={autoFocus}
        disabled={disabled}
        placeholder={placeholder}
        value={value.national}
        onChange={(e) =>
          onChange({
            ...value,
            national: digitsOnly(e.target.value),
          })
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") onEnter?.();
        }}
        className={cn(
          "h-full flex-1 rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0",
          inputClassName,
        )}
        aria-label="Phone number"
      />
    </div>
  );
}

export function phoneValueFromString(
  fullPhone: string,
  fallbackDial: string = DEFAULT_DIAL,
): PhoneValue {
  return splitPhone(fullPhone, fallbackDial);
}

export function phoneValueToString(value: PhoneValue): string {
  return composePhone(value.dial, value.national);
}

export { isPhoneReady } from "@/lib/phone";
