import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Explicit step semantics for the New Sale flow:
 *
 * - "upcoming":  prerequisites not satisfied yet; step is locked/dimmed.
 * - "active":    this is the step the cashier should act on now.
 * - "met":       the step's *requirement* is satisfied but the step is still
 *                editable (e.g. the cart has ≥1 item but staff can keep adding
 *                products). Rendered as a softer check so it reads as
 *                "requirement met", not "finished".
 * - "complete":  the step is done and the flow has moved past it
 *                (e.g. customer resolved, or payment method chosen).
 */
export type StepState = "upcoming" | "active" | "met" | "complete";

interface StepIndicatorProps {
  steps: string[];
  /**
   * 1-indexed. Legacy mode: steps before currentStep render "complete", the
   * currentStep renders "active". Ignored when stepStates is provided.
   */
  currentStep?: number;
  /** Explicit per-step states; takes precedence over currentStep. */
  stepStates?: StepState[];
}

export function StepIndicator({
  steps,
  currentStep,
  stepStates,
}: StepIndicatorProps) {
  const resolveState = (stepNumber: number): StepState => {
    if (stepStates) return stepStates[stepNumber - 1] ?? "upcoming";
    const current = currentStep ?? 1;
    if (stepNumber < current) return "complete";
    if (stepNumber === current) return "active";
    return "upcoming";
  };

  return (
    <div className="flex items-center" role="list" aria-label="Sale progress">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const state = resolveState(stepNumber);
        const isLast = stepNumber === steps.length;
        const showCheck = state === "complete" || state === "met";

        return (
          <div
            key={label}
            role="listitem"
            className={cn("flex items-center", !isLast && "flex-1")}
          >
            <div className="flex items-center gap-2">
              <div
                title={
                  state === "met"
                    ? "Requirement met — you can still make changes"
                    : undefined
                }
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 transition-colors",
                  state === "complete"
                    ? "bg-primary text-primary-foreground"
                    : state === "met"
                      ? "bg-primary/15 text-primary border border-primary/40"
                      : state === "active"
                        ? "border-2 border-primary text-primary"
                        : "border border-border text-muted-foreground"
                )}
              >
                {showCheck ? <Check size={14} /> : stepNumber}
              </div>
              <span
                className={cn(
                  "text-sm font-medium whitespace-nowrap",
                  state === "upcoming"
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
              >
                Step {stepNumber} · {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-px mx-3 flex-1 min-w-6 transition-colors",
                  showCheck ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
