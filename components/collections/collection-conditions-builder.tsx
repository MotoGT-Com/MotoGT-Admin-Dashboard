"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
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
import {
  CONDITION_FIELD_LABELS,
  operatorsForField,
  type CollectionCondition,
  type CollectionConditionField,
  type CollectionConditionOperator,
} from "@/lib/domain/collections";
import type { CollectionConditionOptions } from "@/lib/collections/catalog-preview";

const OPERATOR_LABELS: Record<CollectionConditionOperator, string> = {
  is: "is",
  is_not: "is not",
  equals: "equals",
  greater_than: "is greater than",
  less_than: "is less than",
};

interface CollectionConditionsBuilderProps {
  conditions: CollectionCondition[];
  options: CollectionConditionOptions | null;
  loadingOptions?: boolean;
  onChange: (next: CollectionCondition[]) => void;
}

function newCondition(): CollectionCondition {
  return {
    id: `cond_${Math.random().toString(36).slice(2, 9)}`,
    field: "category",
    operator: "is",
    value: "",
    valueLabel: "",
  };
}

function SearchableOptionSelect({
  options,
  value,
  onChange,
  emptyLabel = "No options from catalog",
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string, label: string) => void;
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  return (
    <Select
      value={value || undefined}
      onValueChange={(v) => {
        const label = options.find((o) => o.value === v)?.label ?? v;
        onChange(v, label);
        setQuery("");
      }}
    >
      <SelectTrigger className="h-9">
        <SelectValue
          placeholder={
            options.length === 0 ? emptyLabel : "Search or select…"
          }
        />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <div className="sticky top-0 z-10 bg-popover border-b border-border p-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Filter ${options.length} options…`}
              className="h-8 pl-8"
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No matches for “{query}”.
          </p>
        ) : (
          filtered.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="line-clamp-2 text-left">{opt.label}</span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export function CollectionConditionsBuilder({
  conditions,
  options,
  loadingOptions,
  onChange,
}: CollectionConditionsBuilderProps) {
  const update = (id: string, patch: Partial<CollectionCondition>) => {
    const updated = conditions.map((c) => {
      if (c.id !== id) return c;
      const next = { ...c, ...patch };
      if (patch.field && patch.field !== c.field) {
        const ops = operatorsForField(patch.field);
        next.operator = ops[0];
        next.value = patch.field === "is_active" ? "true" : "";
        next.valueLabel = patch.field === "is_active" ? "Active" : "";
      }
      return next;
    });

    const makeIs = updated.find(
      (c) => c.field === "car_make" && c.operator === "is" && c.value,
    );
    const next = updated.map((c) => {
      if (c.field !== "car_model" || !c.value) return c;
      if (!makeIs) return c;
      const allowed =
        options?.carModelsByMake?.[makeIs.value]?.some(
          (o) => o.value === c.value,
        ) ?? true;
      if (allowed) return c;
      return { ...c, value: "", valueLabel: "" };
    });
    onChange(next);
  };

  const selectOptions = (
    field: CollectionConditionField,
    allConditions: CollectionCondition[],
  ): { value: string; label: string }[] | null => {
    if (!options) return null;
    if (field === "category") return options.categories;
    if (field === "product_type") return options.productTypes;
    if (field === "car_make") return options.carMakes;
    if (field === "car_model") {
      const makeCondition = allConditions.find(
        (c) => c.field === "car_make" && c.operator === "is" && c.value,
      );
      if (
        makeCondition?.value &&
        options.carModelsByMake?.[makeCondition.value]
      ) {
        return options.carModelsByMake[makeCondition.value];
      }
      return options.carModels ?? [];
    }
    if (field === "car_year") return options.carYears ?? [];
    if (field === "is_active") return options.activeStatuses;
    return null;
  };

  const categoryCount = options?.categories.length ?? 0;
  const typeCount = options?.productTypes.length ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Conditions</p>
          <p className="text-xs text-muted-foreground">
            Products must match all conditions (AND).
            {options
              ? ` Catalog: ${typeCount} types · ${categoryCount} categories/subs.`
              : " Uses live catalog filters."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => onChange([...conditions, newCondition()])}
        >
          <Plus size={14} />
          Add condition
        </Button>
      </div>

      {loadingOptions ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Loading full catalog options…
        </p>
      ) : null}

      {conditions.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border px-3 py-6 text-center">
          No conditions yet. Add one to preview matching products.
        </p>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition, index) => {
            const ops = operatorsForField(condition.field);
            const selects = selectOptions(condition.field, conditions);
            return (
              <div
                key={condition.id}
                className="rounded-lg border border-border p-3 space-y-2 bg-card"
              >
                {index > 0 ? (
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    And
                  </p>
                ) : null}
                <div className="grid gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Field</Label>
                    <Select
                      value={condition.field}
                      onValueChange={(v) =>
                        update(condition.id, {
                          field: v as CollectionConditionField,
                        })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(
                            CONDITION_FIELD_LABELS,
                          ) as CollectionConditionField[]
                        ).map((field) => (
                          <SelectItem key={field} value={field}>
                            {CONDITION_FIELD_LABELS[field]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(v) =>
                        update(condition.id, {
                          operator: v as CollectionConditionOperator,
                        })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ops.map((op) => (
                          <SelectItem key={op} value={op}>
                            {OPERATOR_LABELS[op]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Value</Label>
                    {selects ? (
                      <SearchableOptionSelect
                        options={selects}
                        value={condition.value}
                        onChange={(value, valueLabel) =>
                          update(condition.id, { value, valueLabel })
                        }
                      />
                    ) : (
                      <Input
                        className="h-9"
                        type="number"
                        value={condition.value}
                        onChange={(e) =>
                          update(condition.id, {
                            value: e.target.value,
                            valueLabel: e.target.value,
                          })
                        }
                        placeholder={
                          condition.field === "price"
                            ? "e.g. 30"
                            : "e.g. 0 (in stock: greater than 0)"
                        }
                      />
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive gap-1"
                    onClick={() =>
                      onChange(conditions.filter((c) => c.id !== condition.id))
                    }
                  >
                    <Trash2 size={14} />
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
