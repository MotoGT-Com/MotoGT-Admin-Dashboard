"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export type MultiSelectOption = { value: string; label: string };

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  disabled,
  allLabel = "All",
}: {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  allLabel?: string;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const summary =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label || selected[0]
        : `${selected.length} selected`;

  return (
    <div className="flex-1 min-w-[180px] space-y-2">
      <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between font-normal"
            disabled={disabled || options.length === 0}
          >
            <span className="truncate">{summary}</span>
            <ChevronDown size={16} className="opacity-60 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-72 overflow-y-auto p-2">
          <button
            type="button"
            className="w-full text-left text-xs text-muted-foreground px-2 py-1.5 hover:bg-accent rounded mb-1"
            onClick={() => onChange([])}
          >
            Clear ({allLabel})
          </button>
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(opt.value)}
                />
                <span className="truncate">{opt.label}</span>
              </label>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
