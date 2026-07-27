"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TrimsFilterBarProps = {
  brands: string[];
  models: string[];
  trimOptions: string[];
  make: string;
  model: string;
  year: string;
  trimFilter: string;
  productSearch: string;
  disabled?: boolean;
  onMakeChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onTrimFilterChange: (value: string) => void;
  onProductSearchChange: (value: string) => void;
  onClearFilters: () => void;
};

export function TrimsFilterBar({
  brands,
  models,
  trimOptions,
  make,
  model,
  year,
  trimFilter,
  productSearch,
  disabled,
  onMakeChange,
  onModelChange,
  onYearChange,
  onTrimFilterChange,
  onProductSearchChange,
  onClearFilters,
}: TrimsFilterBarProps) {
  const hasFilters =
    make !== "any" ||
    model !== "any" ||
    year !== "any" ||
    trimFilter !== "any" ||
    productSearch.trim().length > 0;

  return (
    <div className="sticky top-0 z-10 -mx-1 px-1 py-3 bg-background/95 backdrop-blur border-b border-border mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="space-y-1.5">
          <Label>Make</Label>
          <Select value={make} onValueChange={onMakeChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Any make" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any make</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Model</Label>
          <Select
            value={model}
            onValueChange={onModelChange}
            disabled={disabled || make === "any"}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={make !== "any" ? "Any model" : "Select make first"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any model</SelectItem>
              {models.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Year</Label>
          <Select value={year} onValueChange={onYearChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Any year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any year</SelectItem>
              {Array.from({ length: 35 }, (_, i) => 2030 - i).map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Trim</Label>
          <Select
            value={trimFilter}
            onValueChange={onTrimFilterChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any trim" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any trim</SelectItem>
              {trimOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <Label>Product search</Label>
          <Input
            placeholder="Name or item code"
            value={productSearch}
            onChange={(e) => onProductSearchChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      {hasFilters ? (
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            disabled={disabled}
          >
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
