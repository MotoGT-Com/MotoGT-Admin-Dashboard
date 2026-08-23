"use client";

import { Info } from "lucide-react";

export function CollectionsPreviewBanner() {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">
          Collections use mock data
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Collection settings (name, type, rules, and saved product IDs) are
          stored in this browser only. Products shown in a collection come from
          your real catalog.
        </p>
      </div>
    </div>
  );
}
