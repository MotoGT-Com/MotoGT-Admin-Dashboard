import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  /** full = centered viewport/region gate; inline = table/content area */
  variant?: "full" | "inline" | "compact";
  className?: string;
};

/**
 * Shared loading indicator for lists, details, and auth gates.
 */
export function LoadingState({
  label = "Loading…",
  variant = "inline",
  className,
}: LoadingStateProps) {
  if (variant === "full") {
    return (
      <div
        className={cn(
          "min-h-[400px] flex flex-col items-center justify-center gap-3 text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">{label}</p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 text-sm text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}
