/**
 * Mock orders for the Orders page UI pass.
 * Channel is the primary operational lens. Guest is online-only.
 */

export type OrderChannel = "online" | "in_store" | "whatsapp";
export type OrderKind = "user" | "guest";
export type StoreKey = "jordan" | "uae";
export type AccountStatus = "active" | "unclaimed" | "invited";

export interface MockOrderLineItem {
  sku: string;
  name: string;
  quantity: number;
}

export interface MockListOrder {
  id: string;
  orderNumber: string;
  orderType: OrderKind;
  /** Present for user orders (incl. walk-in unclaimed accounts). */
  accountStatus: AccountStatus | null;
  channel: OrderChannel;
  store: StoreKey;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  totalAmount: number;
  currency: "JOD";
  paymentMethodType: string | null;
  paymentMethodLabel: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  itemCount: number;
  lineItems: MockOrderLineItem[];
  discountCode: string | null;
  discountAmount: number;
  staffMember: string | null;
}

const CITIES = ["Amman", "Irbid", "Zarqa", "Aqaba", "Madaba"] as const;
const STAFF = ["Amr Halawani", "Ziad Mahfouz", "Sara Odeh", "Omar Khalil"];

const PRODUCTS: MockOrderLineItem[] = [
  { sku: "633001", name: "Headlight Trim Kit", quantity: 1 },
  { sku: "BRK-PAD-001", name: "Ceramic Brake Pads", quantity: 1 },
  { sku: "OIL-FLT-003", name: "Oil Filter", quantity: 2 },
  { sku: "WIP-BLD-007", name: "Wiper Blades", quantity: 1 },
  { sku: "HLB-LED-009", name: "LED Fog Lights", quantity: 1 },
  { sku: "CAR-MAT-012", name: "Floor Mat Set", quantity: 1 },
  { sku: "SPK-PLG-006", name: "Spark Plug Set", quantity: 1 },
  { sku: "AIR-FLT-004", name: "Air Filter", quantity: 1 },
];

function daysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

function phone(n: number): string {
  const national = `7${String(n).padStart(8, "0").slice(-8)}`;
  return `+962${national}`;
}

function lines(...indexes: number[]): MockOrderLineItem[] {
  return indexes.map((i) => {
    const base = PRODUCTS[i % PRODUCTS.length];
    return { ...base, quantity: base.quantity + (i % 2) };
  });
}

/**
 * Seed list rules:
 * - Guest only on channel: online
 * - in_store / whatsapp walk-ins are User + unclaimed/invited (never Guest)
 */
export const MOCK_LIST_ORDERS: MockListOrder[] = [
  {
    id: "mock-ord-001",
    orderNumber: "JO-2026-000110",
    orderType: "user",
    accountStatus: "active",
    channel: "online",
    store: "jordan",
    customerName: "Ahmad Alkurdi",
    customerEmail: "ahmad.alkurdi@example.com",
    customerPhone: phone(95922571),
    city: "Amman",
    totalAmount: 2.81,
    currency: "JOD",
    paymentMethodType: "credit_card",
    paymentMethodLabel: "Credit Card",
    paymentStatus: "captured",
    status: "delivered",
    createdAt: daysAgo(2, 9),
    itemCount: 1,
    lineItems: lines(7),
    discountCode: null,
    discountAmount: 0,
    staffMember: null,
  },
  {
    id: "mock-ord-002",
    orderNumber: "JO-2026-000109",
    orderType: "user",
    accountStatus: "unclaimed",
    channel: "whatsapp",
    store: "jordan",
    customerName: "Omar Saleh",
    customerEmail: "omar.saleh@example.com",
    customerPhone: phone(98811223),
    city: "Irbid",
    totalAmount: 84.5,
    currency: "JOD",
    paymentMethodType: "cliq",
    paymentMethodLabel: "Cliq",
    paymentStatus: "pending",
    status: "processing",
    createdAt: daysAgo(1, 14),
    itemCount: 2,
    lineItems: lines(0, 4),
    discountCode: "SUMMER10",
    discountAmount: 8.5,
    staffMember: null,
  },
  {
    id: "mock-ord-003",
    orderNumber: "JO-2026-000108",
    orderType: "user",
    accountStatus: "active",
    channel: "in_store",
    store: "jordan",
    customerName: "Jamal Amir",
    customerEmail: "jamal.amir@example.com",
    customerPhone: phone(87654321),
    city: "Amman",
    totalAmount: 156.0,
    currency: "JOD",
    paymentMethodType: "cod",
    paymentMethodLabel: "Cash On Delivery",
    paymentStatus: "pending",
    status: "confirmed",
    createdAt: daysAgo(0, 11),
    itemCount: 3,
    lineItems: lines(1, 2, 5),
    discountCode: null,
    discountAmount: 0,
    staffMember: STAFF[0],
  },
  {
    id: "mock-ord-004",
    orderNumber: "JO-2026-000107",
    orderType: "user",
    accountStatus: "active",
    channel: "online",
    store: "jordan",
    customerName: "Sara Odeh",
    customerEmail: "sara.odeh@example.com",
    customerPhone: phone(76655443),
    city: "Zarqa",
    totalAmount: 42.25,
    currency: "JOD",
    paymentMethodType: "credit_card",
    paymentMethodLabel: "Credit Card",
    paymentStatus: "captured",
    status: "shipped",
    createdAt: daysAgo(3, 16),
    itemCount: 1,
    lineItems: lines(3),
    discountCode: "WELCOME5",
    discountAmount: 5,
    staffMember: null,
  },
  {
    id: "mock-ord-005",
    orderNumber: "JO-2026-000106",
    orderType: "user",
    accountStatus: "unclaimed",
    channel: "in_store",
    store: "jordan",
    customerName: "Lina Walkin",
    customerEmail: "lina.walkin@example.com",
    customerPhone: phone(99112233),
    city: "Amman",
    totalAmount: 67.0,
    currency: "JOD",
    paymentMethodType: "cod",
    paymentMethodLabel: "Cash On Delivery",
    paymentStatus: "pending",
    status: "pending",
    createdAt: daysAgo(0, 8),
    itemCount: 2,
    lineItems: lines(2, 7),
    discountCode: null,
    discountAmount: 0,
    staffMember: STAFF[1],
  },
  {
    id: "mock-ord-006",
    orderNumber: "JO-2026-000105",
    orderType: "user",
    accountStatus: "active",
    channel: "whatsapp",
    store: "jordan",
    customerName: "Yousef Nasser",
    customerEmail: "yousef.nasser@example.com",
    customerPhone: phone(81122334),
    city: "Madaba",
    totalAmount: 210.0,
    currency: "JOD",
    paymentMethodType: "cliq",
    paymentMethodLabel: "Cliq",
    paymentStatus: "captured",
    status: "processing",
    createdAt: daysAgo(5, 12),
    itemCount: 4,
    lineItems: lines(0, 1, 4, 6),
    discountCode: "VIP15",
    discountAmount: 31.5,
    staffMember: null,
  },
  {
    id: "mock-ord-007",
    orderNumber: "JO-2026-000104",
    orderType: "guest",
    accountStatus: null,
    channel: "online",
    store: "uae",
    customerName: "Guest",
    customerEmail: "guest.rami@example.com",
    customerPhone: phone(95566778),
    city: "Amman",
    totalAmount: 95.75,
    currency: "JOD",
    paymentMethodType: "credit_card",
    paymentMethodLabel: "Credit Card",
    paymentStatus: "captured",
    status: "delivered",
    createdAt: daysAgo(8, 10),
    itemCount: 2,
    lineItems: lines(5, 3),
    discountCode: null,
    discountAmount: 0,
    staffMember: null,
  },
  {
    id: "mock-ord-008",
    orderNumber: "JO-2026-000103",
    orderType: "user",
    accountStatus: "invited",
    channel: "whatsapp",
    store: "jordan",
    customerName: "Nour Habib",
    customerEmail: "nour.habib@example.com",
    customerPhone: phone(93344556),
    city: "Aqaba",
    totalAmount: 38.0,
    currency: "JOD",
    paymentMethodType: "cod",
    paymentMethodLabel: "Cash On Delivery",
    paymentStatus: "pending",
    status: "pending",
    createdAt: daysAgo(12, 15),
    itemCount: 1,
    lineItems: lines(6),
    discountCode: null,
    discountAmount: 0,
    staffMember: null,
  },
  {
    id: "mock-ord-009",
    orderNumber: "JO-2026-000102",
    orderType: "user",
    accountStatus: "active",
    channel: "in_store",
    store: "jordan",
    customerName: "Lina Haddad",
    customerEmail: "lina.haddad@example.com",
    customerPhone: phone(94455667),
    city: "Irbid",
    totalAmount: 128.4,
    currency: "JOD",
    paymentMethodType: "card_on_delivery",
    paymentMethodLabel: "Card On Delivery",
    paymentStatus: "pending",
    status: "processing",
    createdAt: daysAgo(16, 9),
    itemCount: 3,
    lineItems: lines(1, 3, 7),
    discountCode: "STORE20",
    discountAmount: 20,
    staffMember: STAFF[2],
  },
  {
    id: "mock-ord-010",
    orderNumber: "JO-2026-000101",
    orderType: "user",
    accountStatus: "active",
    channel: "online",
    store: "jordan",
    customerName: "Omar Khalil",
    customerEmail: "omar.khalil@example.com",
    customerPhone: phone(92233445),
    city: "Zarqa",
    totalAmount: 54.0,
    currency: "JOD",
    paymentMethodType: "credit_card",
    paymentMethodLabel: "Credit Card",
    paymentStatus: "failed",
    status: "cancelled",
    createdAt: daysAgo(4, 18),
    itemCount: 1,
    lineItems: lines(2),
    discountCode: null,
    discountAmount: 0,
    staffMember: null,
  },
  {
    id: "mock-ord-011",
    orderNumber: "JO-2026-000100",
    orderType: "user",
    accountStatus: "unclaimed",
    channel: "in_store",
    store: "jordan",
    customerName: "Tariq Mansour",
    customerEmail: "tariq.mansour@example.com",
    customerPhone: phone(97788990),
    city: "Amman",
    totalAmount: 19.9,
    currency: "JOD",
    paymentMethodType: "cod",
    paymentMethodLabel: "Cash On Delivery",
    paymentStatus: "captured",
    status: "delivered",
    createdAt: daysAgo(1, 17),
    itemCount: 1,
    lineItems: lines(4),
    discountCode: null,
    discountAmount: 0,
    staffMember: STAFF[3],
  },
  {
    id: "mock-ord-012",
    orderNumber: "JO-2026-000099",
    orderType: "user",
    accountStatus: "active",
    channel: "whatsapp",
    store: "uae",
    customerName: "Hana Freij",
    customerEmail: "hana.freij@example.com",
    customerPhone: phone(96677889),
    city: "Amman",
    totalAmount: 302.0,
    currency: "JOD",
    paymentMethodType: "cliq",
    paymentMethodLabel: "Cliq",
    paymentStatus: "captured",
    status: "confirmed",
    createdAt: daysAgo(0, 19),
    itemCount: 5,
    lineItems: lines(0, 1, 2, 4, 5),
    discountCode: "FLASH25",
    discountAmount: 75.5,
    staffMember: null,
  },
  {
    id: "mock-ord-013",
    orderNumber: "JO-2026-000098",
    orderType: "guest",
    accountStatus: null,
    channel: "online",
    store: "jordan",
    customerName: "Guest",
    customerEmail: "checkout.guest@example.com",
    customerPhone: phone(91234567),
    city: "Amman",
    totalAmount: 61.0,
    currency: "JOD",
    paymentMethodType: "cod",
    paymentMethodLabel: "Cash On Delivery",
    paymentStatus: "pending",
    status: "pending",
    createdAt: daysAgo(0, 20),
    itemCount: 2,
    lineItems: lines(3, 7),
    discountCode: null,
    discountAmount: 0,
    staffMember: null,
  },
];

export const MOCK_ORDER_CITIES = [...CITIES];

export function channelLabel(channel: OrderChannel): string {
  switch (channel) {
    case "in_store":
      return "In-Store";
    case "whatsapp":
      return "WhatsApp";
    default:
      return "Online";
  }
}

export function storeLabel(store: StoreKey): string {
  return store === "uae" ? "UAE" : "Jordan";
}

export const TERMINAL_STATUSES = new Set([
  "delivered",
  "cancelled",
  "refunded",
]);

export function daysOpen(createdAt: string, status: string): number | null {
  if (TERMINAL_STATUSES.has(status)) return null;
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}
