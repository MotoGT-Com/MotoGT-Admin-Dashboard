import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  /** 1-indexed */
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center" role="list" aria-label="Sale progress">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isLast = stepNumber === steps.length;

        return (
          <div
            key={label}
            role="listitem"
            className={cn("flex items-center", !isLast && "flex-1")}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 transition-colors",
                  isComplete
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "border-2 border-primary text-primary"
                      : "border border-border text-muted-foreground"
                )}
              >
                {isComplete ? <Check size={14} /> : stepNumber}
              </div>
              <span
                className={cn(
                  "text-sm font-medium whitespace-nowrap",
                  isActive || isComplete
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Step {stepNumber} · {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-px mx-3 flex-1 min-w-6 transition-colors",
                  isComplete ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
