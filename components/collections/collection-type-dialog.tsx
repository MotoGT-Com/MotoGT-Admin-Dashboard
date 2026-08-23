"use client";

import { Library, ListOrdered, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CollectionType } from "@/lib/domain/collections";

interface CollectionTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: CollectionType) => void;
}

const OPTIONS: Array<{
  type: CollectionType;
  title: string;
  description: string;
  icon: typeof Library;
}> = [
  {
    type: "manual",
    title: "Manual",
    description: "Pick and reorder specific products yourself.",
    icon: ListOrdered,
  },
  {
    type: "automated",
    title: "Automated",
    description: "Include products that match conditions you define.",
    icon: Sparkles,
  },
];

export function CollectionTypeDialog({
  open,
  onOpenChange,
  onSelect,
}: CollectionTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create collection</DialogTitle>
          <DialogDescription>
            Choose how products should be added. You can change this later, but
            existing products or conditions will be cleared.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => {
                  onSelect(option.type);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-border p-4 text-left transition",
                  "hover:border-primary/40 hover:bg-accent/40",
                )}
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{option.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
