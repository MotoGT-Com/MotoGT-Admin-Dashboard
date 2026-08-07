/**
 * Mock data for the In-Store Purchases section (frontend-only pass).
 * No backend calls yet — this file is the seed for local component state.
 * Replace with real service calls once the in-store API exists.
 */

export type Channel = "online" | "whatsapp" | "in_store";
export type AccountStatus = "active" | "unclaimed" | "invited";
export type PaymentMethod = "cash" | "card" | "other";

export interface MockVehicle {
  make: string;
  model: string;
  year: string;
}

export interface MockCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  memberSince: string; // ISO date
  status: AccountStatus;
  channels: Channel[];
  totalOrders: number;
  vehicles: MockVehicle[];
}

export interface MockOrderRecord {
  id: string;
  orderNumber: string;
  customerId: string;
  channel: Channel;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string; // ISO date
  paymentMethod: string;
  /** Present only on orders recorded via the New Sale flow this session. */
  items?: CartLine[];
  subtotal?: number;
  discount?: number;
  /** Customer display snapshot (used when the customer is an API user, not a mock record). */
  customerName?: string;
  customerPhone?: string;
}

/** A make/model/year-range a product is compatible with. */
export interface VehicleFitment {
  make: string;
  model: string;
  years: string[];
}

export interface MockProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  /** Absent = universal fit (matches any vehicle filter). */
  fitment?: VehicleFitment[];
}

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export const mockCustomers: MockCustomer[] = [
  {
    id: "cust-1",
    name: "Ahmad Alkurdi",
    phone: "+962791234567",
    email: "ahmad.alkurdi@example.com",
    memberSince: "2023-02-14",
    status: "active",
    channels: ["online", "in_store"],
    totalOrders: 7,
    vehicles: [{ make: "BMW", model: "430i", year: "2022" }],
  },
  {
    id: "cust-2",
    name: "Jamal Amir",
    phone: "+962787654321",
    email: "jamal.amir@example.com",
    memberSince: "2023-08-02",
    status: "active",
    channels: ["whatsapp", "online"],
    totalOrders: 4,
    vehicles: [{ make: "Audi", model: "A4", year: "2021" }],
  },
  {
    id: "cust-3",
    name: "Lina Haddad",
    phone: "+962799112233",
    memberSince: "2025-11-20",
    status: "unclaimed",
    channels: ["in_store"],
    totalOrders: 1,
    vehicles: [],
  },
  {
    id: "cust-4",
    name: "Yousef Nasser",
    phone: "+962781122334",
    email: "yousef.nasser@example.com",
    memberSince: "2025-12-05",
    status: "invited",
    channels: ["in_store"],
    totalOrders: 1,
    vehicles: [{ make: "Kia", model: "Sportage", year: "2020" }],
  },
  {
    id: "cust-5",
    name: "Sara Odeh",
    phone: "+962776655443",
    email: "sara.odeh@example.com",
    memberSince: "2022-06-30",
    status: "active",
    channels: ["online", "whatsapp", "in_store"],
    totalOrders: 12,
    vehicles: [
      { make: "Mercedes-Benz", model: "C-Class", year: "2023" },
      { make: "Porsche", model: "911 Turbo", year: "2023" },
    ],
  },
  {
    id: "cust-6",
    name: "Omar Tal",
    phone: "0795544332",
    email: "omar.tal@example.com",
    memberSince: "2024-01-11",
    status: "active",
    channels: ["whatsapp"],
    totalOrders: 3,
    vehicles: [],
  },
  {
    id: "cust-7",
    name: "Dana Qasem",
    phone: "0788877665",
    memberSince: "2026-01-18",
    status: "unclaimed",
    channels: ["in_store"],
    totalOrders: 1,
    vehicles: [{ make: "Toyota", model: "Corolla", year: "2019" }],
  },
  {
    id: "cust-8",
    name: "Khaled Barakat",
    phone: "0790011223",
    email: "khaled.barakat@example.com",
    memberSince: "2025-10-09",
    status: "invited",
    channels: ["in_store", "online"],
    totalOrders: 2,
    vehicles: [{ make: "Hyundai", model: "Tucson", year: "2021" }],
  },
  {
    id: "cust-9",
    name: "Rania Fakhoury",
    phone: "0777788990",
    email: "rania.fakhoury@example.com",
    memberSince: "2023-05-10",
    status: "active",
    channels: ["online"],
    totalOrders: 5,
    vehicles: [],
  },
  {
    id: "cust-10",
    name: "Bilal Hourani",
    phone: "0788899001",
    email: "bilal.hourani@example.com",
    memberSince: "2024-09-22",
    status: "active",
    channels: ["in_store", "whatsapp"],
    totalOrders: 2,
    vehicles: [{ make: "Nissan", model: "Patrol", year: "2018" }],
  },
  {
    id: "cust-11",
    name: "Noor Zureiqat",
    phone: "0799900112",
    memberSince: "2026-01-25",
    status: "unclaimed",
    channels: ["in_store"],
    totalOrders: 1,
    vehicles: [],
  },
  {
    id: "cust-12",
    name: "Firas Kanaan",
    phone: "0781234098",
    email: "firas.kanaan@example.com",
    memberSince: "2025-11-02",
    status: "invited",
    channels: ["in_store"],
    totalOrders: 1,
    vehicles: [{ make: "Ford", model: "Ranger", year: "2020" }],
  },
  {
    id: "cust-13",
    name: "Hala Mansour",
    phone: "0790098765",
    email: "hala.mansour@example.com",
    memberSince: "2022-12-01",
    status: "active",
    channels: ["online", "whatsapp"],
    totalOrders: 6,
    vehicles: [{ make: "Kia", model: "Cerato", year: "2022" }],
  },
  {
    id: "cust-14",
    name: "Tariq Saleh",
    phone: "0776543210",
    memberSince: "2026-01-30",
    status: "unclaimed",
    channels: ["in_store"],
    totalOrders: 1,
    vehicles: [],
  },
  {
    id: "cust-15",
    name: "Maya Qutub",
    phone: "0785671234",
    email: "maya.qutub@example.com",
    memberSince: "2021-08-19",
    status: "active",
    channels: ["in_store", "online", "whatsapp"],
    totalOrders: 9,
    vehicles: [
      { make: "Jeep", model: "Wrangler", year: "2023" },
      { make: "Honda", model: "CR-V", year: "2020" },
    ],
  },
];

/** Curated for the New Sale product picker's empty-search state. */
export const mockFeaturedProductIds = ["prod-1", "prod-3", "prod-6", "prod-9"];

export const mockOrders: MockOrderRecord[] = [
  { id: "ord-1", orderNumber: "JO-2025-000012", customerId: "cust-1", channel: "online", total: 84.5, currency: "JOD", itemCount: 3, createdAt: "2025-09-04T10:15:00Z", paymentMethod: "Credit Card" },
  { id: "ord-2", orderNumber: "IS-2025-000041", customerId: "cust-1", channel: "in_store", total: 32.0, currency: "JOD", itemCount: 2, createdAt: "2025-12-11T14:32:00Z", paymentMethod: "Cash" },
  { id: "ord-3", orderNumber: "WA-2025-000019", customerId: "cust-2", channel: "whatsapp", total: 56.75, currency: "JOD", itemCount: 2, createdAt: "2025-10-22T09:05:00Z", paymentMethod: "Cash On Delivery" },
  { id: "ord-4", orderNumber: "JO-2025-000031", customerId: "cust-2", channel: "online", total: 129.0, currency: "JOD", itemCount: 5, createdAt: "2025-11-30T18:40:00Z", paymentMethod: "Credit Card" },
  { id: "ord-5", orderNumber: "IS-2025-000058", customerId: "cust-3", channel: "in_store", total: 18.25, currency: "JOD", itemCount: 1, createdAt: "2025-11-20T12:00:00Z", paymentMethod: "Cash" },
  { id: "ord-6", orderNumber: "IS-2025-000063", customerId: "cust-4", channel: "in_store", total: 45.0, currency: "JOD", itemCount: 2, createdAt: "2025-12-05T11:20:00Z", paymentMethod: "Card" },
  { id: "ord-7", orderNumber: "JO-2025-000002", customerId: "cust-5", channel: "online", total: 210.0, currency: "JOD", itemCount: 6, createdAt: "2022-07-14T08:30:00Z", paymentMethod: "Credit Card" },
  { id: "ord-8", orderNumber: "WA-2025-000004", customerId: "cust-5", channel: "whatsapp", total: 63.4, currency: "JOD", itemCount: 2, createdAt: "2023-03-02T16:10:00Z", paymentMethod: "Cash On Delivery" },
  { id: "ord-9", orderNumber: "IS-2025-000010", customerId: "cust-5", channel: "in_store", total: 27.9, currency: "JOD", itemCount: 1, createdAt: "2024-05-19T13:45:00Z", paymentMethod: "Cash" },
  { id: "ord-10", orderNumber: "IS-2025-000071", customerId: "cust-5", channel: "in_store", total: 91.0, currency: "JOD", itemCount: 4, createdAt: "2026-01-15T15:05:00Z", paymentMethod: "Card" },
  { id: "ord-11", orderNumber: "WA-2025-000027", customerId: "cust-6", channel: "whatsapp", total: 39.5, currency: "JOD", itemCount: 1, createdAt: "2024-08-08T10:00:00Z", paymentMethod: "Cash On Delivery" },
  { id: "ord-12", orderNumber: "IS-2025-000079", customerId: "cust-7", channel: "in_store", total: 22.0, currency: "JOD", itemCount: 1, createdAt: "2026-01-18T09:50:00Z", paymentMethod: "Cash" },
  { id: "ord-13", orderNumber: "IS-2025-000033", customerId: "cust-8", channel: "in_store", total: 60.0, currency: "JOD", itemCount: 2, createdAt: "2025-10-09T17:25:00Z", paymentMethod: "Card" },
  { id: "ord-14", orderNumber: "JO-2025-000046", customerId: "cust-8", channel: "online", total: 48.3, currency: "JOD", itemCount: 2, createdAt: "2025-12-28T19:15:00Z", paymentMethod: "Credit Card" },
];

const years = (from: number, to: number): string[] =>
  Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

export const mockProducts: MockProduct[] = [
  { id: "prod-1", sku: "BRK-PAD-001", name: "Ceramic Brake Pads (Front)", category: "Brakes", price: 24.5, currency: "JOD", stock: 42, fitment: [
    { make: "BMW", model: "430i", years: years(2020, 2023) },
    { make: "Audi", model: "A4", years: years(2019, 2022) },
  ] },
  { id: "prod-2", sku: "BRK-ROT-002", name: "Brake Rotor Disc", category: "Brakes", price: 38.0, currency: "JOD", stock: 18, fitment: [
    { make: "BMW", model: "430i", years: years(2020, 2023) },
    { make: "Mercedes-Benz", model: "C-Class", years: years(2021, 2024) },
  ] },
  { id: "prod-3", sku: "OIL-FLT-003", name: "Oil Filter", category: "Filters", price: 6.75, currency: "JOD", stock: 120, fitment: [
    { make: "Toyota", model: "Corolla", years: years(2017, 2022) },
    { make: "Honda", model: "CR-V", years: years(2018, 2021) },
    { make: "Kia", model: "Sportage", years: years(2019, 2022) },
  ] },
  { id: "prod-4", sku: "AIR-FLT-004", name: "Air Filter", category: "Filters", price: 9.25, currency: "JOD", stock: 75, fitment: [
    { make: "Toyota", model: "Corolla", years: years(2017, 2022) },
    { make: "Hyundai", model: "Tucson", years: years(2019, 2022) },
  ] },
  { id: "prod-5", sku: "CAB-FLT-005", name: "Cabin Air Filter", category: "Filters", price: 8.0, currency: "JOD", stock: 60 },
  { id: "prod-6", sku: "SPK-PLG-006", name: "Spark Plug (Set of 4)", category: "Engine", price: 14.5, currency: "JOD", stock: 33, fitment: [
    { make: "Toyota", model: "Corolla", years: years(2016, 2021) },
    { make: "Kia", model: "Cerato", years: years(2020, 2023) },
  ] },
  { id: "prod-7", sku: "WIP-BLD-007", name: "Wiper Blades (Pair)", category: "Exterior", price: 11.0, currency: "JOD", stock: 54 },
  { id: "prod-8", sku: "BAT-CAR-008", name: "Car Battery 60Ah", category: "Electrical", price: 65.0, currency: "JOD", stock: 12 },
  { id: "prod-9", sku: "HLB-LED-009", name: "LED Headlight Bulb", category: "Electrical", price: 19.9, currency: "JOD", stock: 40 },
  { id: "prod-10", sku: "TIM-BLT-010", name: "Timing Belt Kit", category: "Engine", price: 52.0, currency: "JOD", stock: 9, fitment: [
    { make: "Kia", model: "Sportage", years: years(2018, 2021) },
    { make: "Hyundai", model: "Tucson", years: years(2018, 2021) },
  ] },
  { id: "prod-11", sku: "SHK-ABS-011", name: "Shock Absorber (Front)", category: "Suspension", price: 47.5, currency: "JOD", stock: 16, fitment: [
    { make: "Nissan", model: "Patrol", years: years(2016, 2019) },
    { make: "Jeep", model: "Wrangler", years: years(2020, 2023) },
  ] },
  { id: "prod-12", sku: "RAD-COO-012", name: "Radiator Coolant 5L", category: "Fluids", price: 13.25, currency: "JOD", stock: 88 },
];

export function findCustomerByPhone(phone: string): MockCustomer | undefined {
  const normalized = phone.replace(/\s+/g, "");
  return mockCustomers.find((c) => c.phone.replace(/\s+/g, "") === normalized);
}

export function getOrdersForCustomer(customerId: string): MockOrderRecord[] {
  return mockOrders
    .filter((o) => o.customerId === customerId)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getCustomerChannels(customerId: string): Channel[] {
  const channels = new Set(
    getOrdersForCustomer(customerId).map((o) => o.channel)
  );
  return Array.from(channels);
}

export function generateInStoreOrderNumber(): string {
  return generateChannelOrderNumber("in_store");
}

export function generateChannelOrderNumber(
  channel: "in_store" | "whatsapp"
): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const prefix = channel === "whatsapp" ? "WA" : "IS";
  return `${prefix}-${new Date().getFullYear()}-${rand}`;
}

export function findMockOrderById(id: string): MockOrderRecord | undefined {
  return mockOrders.find((o) => o.id === id);
}

export interface CompletedSaleInput {
  orderNumber: string;
  /**
   * Existing customer id (mock id or real API user id), or null when the
   * sale created a brand-new customer.
   */
  customerId: string | null;
  newCustomer?: { name: string; phone: string; email: string };
  /** Display snapshot for API-backed customers not present in mockCustomers. */
  customerSnapshot?: { name: string; phone: string };
  items: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  /** Defaults to in_store for backward compatibility. */
  channel?: "in_store" | "whatsapp";
  /** Optional WhatsApp conversation note (UI-only until backend). */
  notes?: string;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  other: "Other",
};

/**
 * Records a completed channel order into the in-memory mock stores so the
 * rest of the mock UI (order detail, customer profile) stays consistent.
 *
 * Session-only: a hard reload resets it. No backend calls yet.
 */
export function recordChannelOrder(input: CompletedSaleInput): {
  order: MockOrderRecord;
  customerId: string;
} {
  const channel = input.channel ?? "in_store";
  let customerId = input.customerId;

  if (!customerId) {
    const newCustomer: MockCustomer = {
      id: `cust-ins-${Math.floor(1000 + Math.random() * 9000)}`,
      name: input.newCustomer?.name ?? "Walk-in customer",
      phone: input.newCustomer?.phone ?? "",
      email: input.newCustomer?.email || undefined,
      memberSince: new Date().toISOString(),
      status: "unclaimed",
      channels: [channel],
      totalOrders: 1,
      vehicles: [],
    };
    mockCustomers.push(newCustomer);
    customerId = newCustomer.id;
  } else {
    const existing = mockCustomers.find((c) => c.id === customerId);
    if (existing) {
      existing.totalOrders += 1;
      if (!existing.channels.includes(channel)) {
        existing.channels.push(channel);
      }
    }
  }

  const order: MockOrderRecord = {
    id: `ins-${Math.floor(10000 + Math.random() * 90000)}`,
    orderNumber: input.orderNumber,
    customerId,
    channel,
    total: input.total,
    currency: "JOD",
    itemCount: input.items.reduce((sum, line) => sum + line.quantity, 0),
    createdAt: new Date().toISOString(),
    paymentMethod: paymentMethodLabels[input.paymentMethod],
    items: input.items,
    subtotal: input.subtotal,
    discount: input.discount,
    customerName: input.customerSnapshot?.name ?? input.newCustomer?.name,
    customerPhone: input.customerSnapshot?.phone ?? input.newCustomer?.phone,
  };
  mockOrders.push(order);

  return { order, customerId };
}

/** @deprecated Prefer recordChannelOrder — kept for existing call sites. */
export function recordInStoreOrder(input: CompletedSaleInput): {
  order: MockOrderRecord;
  customerId: string;
} {
  return recordChannelOrder({ ...input, channel: input.channel ?? "in_store" });
}
