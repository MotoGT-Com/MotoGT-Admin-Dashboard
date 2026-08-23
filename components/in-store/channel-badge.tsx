import type { Channel } from "@/lib/in-store/mock-data";
import { CHANNEL_LABELS } from "@/lib/in-store/mock-data";

/**
 * Channel pill (Online / WhatsApp / In-Store).
 * Light + dark friendly tones, distinct from order-type blues/violets.
 */
const CHANNEL_CLASSES: Record<Channel, string> = {
  online: "bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  whatsapp:
    "bg-teal-500/15 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  in_store:
    "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
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
