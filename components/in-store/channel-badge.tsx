import type { Channel } from "@/lib/in-store/mock-data";
import { CHANNEL_LABELS } from "@/lib/in-store/mock-data";

/**
 * Channel pill (Online / WhatsApp / In-Store).
 * Follows the same pill pattern as OrderTypeBadge on the Orders page,
 * with colors deliberately distinct from the blue/violet order-type pills.
 */
const CHANNEL_CLASSES: Record<Channel, string> = {
  online: "bg-teal-900/30 text-teal-200",
  whatsapp: "bg-emerald-900/30 text-emerald-200",
  in_store: "bg-amber-900/30 text-amber-200",
};

export function ChannelBadge({ channel }: { channel: Channel }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${CHANNEL_CLASSES[channel]}`}
    >
      {CHANNEL_LABELS[channel]}
    </span>
  );
}

export function ChannelBadgeList({ channels }: { channels: Channel[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {channels.map((channel) => (
        <ChannelBadge key={channel} channel={channel} />
      ))}
    </div>
  );
}
