"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Product } from "@/lib/services/product.service";
import {
  COMPLETENESS_LABELS,
  getCompletenessGaps,
  type CompletenessKey,
} from "@/lib/products/catalog-helpers";

const DOT_COLORS: Record<CompletenessKey, string> = {
  no_image: "bg-rose-500",
  no_fitment: "bg-amber-500",
  missing_ar: "bg-violet-500",
  no_category: "bg-sky-500",
};

export function CompletenessDots({ product }: { product: Product }) {
  const gaps = getCompletenessGaps(product);
  if (gaps.length === 0) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </TooltipTrigger>
          <TooltipContent>Catalog complete</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1" aria-label="Completeness gaps">
            {gaps.map((key) => (
              <span
                key={key}
                className={`h-2.5 w-2.5 rounded-full ${DOT_COLORS[key]}`}
              />
            ))}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium mb-1">Missing</p>
          <ul className="space-y-0.5 text-xs">
            {gaps.map((key) => (
              <li key={key}>• {COMPLETENESS_LABELS[key]}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function CompletenessQuickFilters({
  active,
  onChange,
}: {
  active: CompletenessKey[];
  onChange: (next: CompletenessKey[]) => void;
}) {
  const keys = Object.keys(COMPLETENESS_LABELS) as CompletenessKey[];
  const toggle = (key: CompletenessKey) => {
    if (active.includes(key)) onChange(active.filter((k) => k !== key));
    else onChange([...active, key]);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs text-muted-foreground mr-1">Gaps:</span>
      {keys.map((key) => {
        const on = active.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
              on
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:bg-accent/40"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${DOT_COLORS[key]}`} />
            {COMPLETENESS_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}
