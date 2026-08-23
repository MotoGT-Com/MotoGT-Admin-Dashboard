export type OrderChannel = 'online' | 'in_store' | 'whatsapp';
export type AccountStatus = 'active' | 'unclaimed' | 'invited';
export type OrderKind = 'user' | 'guest';
export type ChannelPaymentMethod = 'cash' | 'card' | 'cliq' | 'other';

export const CHANNEL_LABELS: Record<OrderChannel, string> = {
  online: 'Online',
  whatsapp: 'WhatsApp',
  in_store: 'In-Store',
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: 'Active',
  unclaimed: 'Unclaimed',
  invited: 'Invited',
};

export function channelLabel(channel: OrderChannel | string): string {
  return CHANNEL_LABELS[channel as OrderChannel] ?? channel;
}
