"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

export type TrimsCatalogPanelProps = {
  catalogTrims: string[];
  assignmentTrimNames: Set<string>;
  loading?: boolean;
};

export function TrimsCatalogPanel({
  catalogTrims,
  assignmentTrimNames,
  loading,
}: TrimsCatalogPanelProps) {
  const [open, setOpen] = useState(false);

  if (loading && catalogTrims.length === 0) {
    return null;
  }

  const catalogOnly = catalogTrims.filter((t) => !assignmentTrimNames.has(t));
  const onProducts = catalogTrims.filter((t) => assignmentTrimNames.has(t));

  return (
    <div className="mt-6 border rounded-lg">
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between px-4 py-3 h-auto"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-medium text-sm">Trim names in catalog (reference)</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </Button>
      {open ? (
        <div className="px-4 pb-4 space-y-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            From the vehicle catalog API for this make/model. Compare with product
            assignments to spot naming mismatches.
          </p>
          {catalogTrims.length === 0 ? (
            <p className="text-sm text-muted-foreground">No catalog trim names returned.</p>
          ) : (
            <>
              {onProducts.length > 0 ? (
                <div>
                  <p className="text-xs font-medium mb-2">On products</p>
                  <div className="flex flex-wrap gap-2">
                    {onProducts.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {catalogOnly.length > 0 ? (
                <div>
                  <p className="text-xs font-medium mb-2">Catalog only</p>
                  <div className="flex flex-wrap gap-2">
                    {catalogOnly.map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
