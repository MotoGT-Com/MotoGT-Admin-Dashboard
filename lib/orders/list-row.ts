/**
 * Map admin order list API rows into the Orders table view model.
 */
import type { Order } from '@/lib/services/order.service';
import type { AccountStatus, OrderChannel, OrderKind } from '@/lib/domain/channels';
import { channelLabel } from '@/lib/domain/channels';
import { displayCustomerEmail } from '@/lib/customers/email';
import { parseAmount } from '@/lib/dashboard-utils';

export interface ListOrderRow {
  id: string;
  orderNumber: string;
  orderType: OrderKind;
  accountStatus: AccountStatus | null;
  channel: OrderChannel;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  totalAmount: number;
  currency: string;
  paymentMethodType: string | null;
  paymentMethodLabel: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  itemCount: number;
  lineItems: Array<{ sku: string; name: string; quantity: number }>;
  discountCode: string | null;
  discountAmount: number;
  staffMember: string | null;
  isGuest: boolean;
}

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: 'Credit Card',
  cod: 'Cash On Delivery',
  cliq: 'Cliq',
  card_on_delivery: 'Card On Delivery',
  cash: 'Cash',
  card: 'Card',
  other: 'Other',
};

function paymentLabel(type: string | null | undefined): string {
  if (!type) return '—';
  return PAYMENT_LABELS[type] || type;
}

export function mapOrderToListRow(order: Order): ListOrderRow {
  const channel = (order.channel ||
    order.orderType ||
    'online') as OrderChannel;
  const isGuest =
    !order.userId ||
    order.orderType === 'guest' ||
    (channel === 'online' && !order.customer?.id && !order.userId);

  const first = order.customer?.firstName || '';
  const last = order.customer?.lastName || '';
  const customerName =
    [first, last].filter(Boolean).join(' ') ||
    displayCustomerEmail(order.customer?.email) ||
    (isGuest ? 'Guest' : 'Customer');

  const lineItems = (order.lineItems || []).map((line, index) => ({
    sku: line.sku || line.productId || `item-${index}`,
    name: line.name || 'Item',
    quantity: line.quantity || 0,
  }));

  const itemCount =
    order.itemCount ??
    lineItems.reduce((sum, line) => sum + line.quantity, 0);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderType: isGuest ? 'guest' : 'user',
    accountStatus: (order.accountStatus ??
      order.customer?.accountStatus ??
      null) as AccountStatus | null,
    channel,
    customerName,
    customerEmail: displayCustomerEmail(order.customer?.email) || '',
    customerPhone: order.customer?.phone || '',
    city: order.city || '—',
    totalAmount: parseAmount(order.totalAmount),
    currency: order.currency || 'JOD',
    paymentMethodType: order.paymentMethod?.type ?? null,
    paymentMethodLabel: paymentLabel(order.paymentMethod?.type),
    paymentStatus: order.payment?.status || (order.isPaid ? 'captured' : 'pending'),
    status: order.status,
    createdAt: order.createdAt,
    itemCount,
    lineItems,
    discountCode: order.discountCode ?? null,
    discountAmount: parseAmount(order.discountAmount),
    staffMember: order.staffMember ?? null,
    isGuest,
  };
}

export { channelLabel };
