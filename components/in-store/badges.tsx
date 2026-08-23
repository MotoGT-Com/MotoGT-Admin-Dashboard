import { Badge } from "@/components/ui/badge";
import type { AccountStatus, OrderChannel } from "@/lib/domain/channels";

const statusConfig: Record<AccountStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className:
      "bg-green-500/15 text-green-600 border-green-500/30 dark:text-green-400",
  },
  unclaimed: {
    label: "Unclaimed",
    className:
      "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
  },
  invited: {
    label: "Invited",
    className:
      "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
  },
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const config = statusConfig[status] ?? statusConfig.unclaimed;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

const channelConfig: Record<OrderChannel, { label: string; className: string }> = {
  online: {
    label: "Online",
    className:
      "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
  },
  whatsapp: {
    label: "WhatsApp",
    className:
      "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  },
  in_store: {
    label: "In-Store",
    className: "bg-primary/15 text-primary border-primary/30",
  },
};

export function ChannelBadge({ channel }: { channel: OrderChannel | string }) {
  const config =
    channelConfig[channel as OrderChannel] ?? channelConfig.online;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function ChannelBadgeList({
  channels,
}: {
  channels: Array<OrderChannel | string>;
}) {
  if (!channels || channels.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {channels.map((channel) => (
        <ChannelBadge key={channel} channel={channel} />
      ))}
    </div>
  );
}
