import type { CustomerStatus } from "@/lib/in-store/mock-data";
import { CUSTOMER_STATUS_LABELS } from "@/lib/in-store/mock-data";

/**
 * Customer status pill (Active / Unclaimed / Invited).
 * Light + dark friendly tones.
 */
const STATUS_CLASSES: Record<CustomerStatus, string> = {
  active:
    "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  unclaimed:
    "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  invited:
    "bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {CUSTOMER_STATUS_LABELS[status]}
    </span>
  );
}
