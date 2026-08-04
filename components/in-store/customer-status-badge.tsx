import type { CustomerStatus } from "@/lib/in-store/mock-data";
import { CUSTOMER_STATUS_LABELS } from "@/lib/in-store/mock-data";

/**
 * Customer status pill (Active / Unclaimed / Invited),
 * matching the status pill pattern on the Orders page.
 */
const STATUS_CLASSES: Record<CustomerStatus, string> = {
  active: "bg-green-900/30 text-green-300",
  unclaimed: "bg-yellow-900/30 text-yellow-300",
  invited: "bg-sky-900/30 text-sky-300",
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
