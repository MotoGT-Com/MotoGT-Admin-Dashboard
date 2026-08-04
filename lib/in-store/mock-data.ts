/**
 * Mock data for the In-Store section (UI-only pass).
 * Everything here is fake and lives client-side; a backend pass will replace it.
 */

export type Channel = "online" | "whatsapp" | "in_store";
export type CustomerStatus = "active" | "unclaimed" | "invited";
export type InStorePaymentMethod = "cash" | "card" | "other";

export interface MockCustomer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  status: CustomerStatus;
  channels: Channel[];
  customerSince: string; // ISO date
  totalOrders: number;
}

export interface MockOrderHistoryRow {
  id: string;
  orderNumber: string;
  channel: Channel;
  totalAmount: number;
  currency: string;
  paymentMethodLabel: string;
  status: string;
  createdAt: string;
}

export interface MockInStoreOrderItem {
  id: string;
  name: string;
  itemCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  mainImage: string | null;
}

export interface MockInStoreOrder {
  id: string; // prefixed "ins-" so pages can detect mock in-store orders
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderType: "user" | "guest";
  totalAmount: number;
  currency: string;
  paymentMethodType: InStorePaymentMethod;
  paymentMethodLabel: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  items: MockInStoreOrderItem[];
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  online: "Online",
  whatsapp: "WhatsApp",
  in_store: "In-Store",
};

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: "Active",
  unclaimed: "Unclaimed",
  invited: "Invited",
};

export const MOCK_IN_STORE_ORDER_ID_PREFIX = "ins-";

export function isMockInStoreOrderId(id: string | null | undefined): boolean {
  return !!id && id.startsWith(MOCK_IN_STORE_ORDER_ID_PREFIX);
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export const mockCustomers: MockCustomer[] = [
  {
    id: "cust-001",
    firstName: "Omar",
    lastName: "Haddad",
    phone: "+962791234567",
    email: "omar.haddad@example.com",
    status: "active",
    channels: ["online", "in_store"],
    customerSince: "2024-03-14T10:00:00.000Z",
    totalOrders: 7,
  },
  {
    id: "cust-002",
    firstName: "Lina",
    lastName: "Khoury",
    phone: "+962795551234",
    email: "lina.khoury@example.com",
    status: "active",
    channels: ["online", "whatsapp", "in_store"],
    customerSince: "2023-11-02T10:00:00.000Z",
    totalOrders: 12,
  },
  {
    id: "cust-003",
    firstName: "Yousef",
    lastName: "Nassar",
    phone: "+962777889900",
    email: null,
    status: "unclaimed",
    channels: ["in_store"],
    customerSince: "2026-06-21T10:00:00.000Z",
    totalOrders: 2,
  },
  {
    id: "cust-004",
    firstName: "Rania",
    lastName: "Saleh",
    phone: "+962790112233",
    email: "rania.saleh@example.com",
    status: "invited",
    channels: ["whatsapp", "in_store"],
    customerSince: "2026-05-09T10:00:00.000Z",
    totalOrders: 3,
  },
  {
    id: "cust-005",
    firstName: "Khaled",
    lastName: "Mansour",
    phone: "+962798765432",
    email: "khaled.m@example.com",
    status: "active",
    channels: ["online"],
    customerSince: "2024-08-30T10:00:00.000Z",
    totalOrders: 5,
  },
  {
    id: "cust-006",
    firstName: "Dana",
    lastName: "Aburub",
    phone: "+962779001122",
    email: null,
    status: "unclaimed",
    channels: ["in_store"],
    customerSince: "2026-07-28T10:00:00.000Z",
    totalOrders: 1,
  },
  {
    id: "cust-007",
    firstName: "Samir",
    lastName: "Qasem",
    phone: "+962796667788",
    email: "samir.qasem@example.com",
    status: "active",
    channels: ["online", "whatsapp"],
    customerSince: "2025-01-17T10:00:00.000Z",
    totalOrders: 9,
  },
  {
    id: "cust-008",
    firstName: "Hala",
    lastName: "Zaid",
    phone: "+962781234876",
    email: "hala.zaid@example.com",
    status: "invited",
    channels: ["in_store"],
    customerSince: "2026-07-03T10:00:00.000Z",
    totalOrders: 1,
  },
];

export function findMockCustomerByPhone(phone: string): MockCustomer | null {
  const normalized = phone.replace(/[\s\-()]/g, "");
  return (
    mockCustomers.find((c) => {
      const cPhone = c.phone.replace(/[\s\-()]/g, "");
      return (
        cPhone === normalized ||
        cPhone.endsWith(normalized) ||
        normalized.endsWith(cPhone)
      );
    }) ?? null
  );
}

export function findMockCustomerById(id: string): MockCustomer | null {
  return mockCustomers.find((c) => c.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// In-store orders (appear on the Orders page merged with API data)
// ---------------------------------------------------------------------------

export const mockInStoreOrders: MockInStoreOrder[] = [
  {
    id: "ins-0001",
    orderNumber: "INS-2026-0148",
    customerId: "cust-001",
    customerName: "Omar Haddad",
    customerEmail: "omar.haddad@example.com",
    customerPhone: "+962791234567",
    orderType: "user",
    totalAmount: 84.5,
    currency: "JOD",
    paymentMethodType: "card",
    paymentMethodLabel: "Card",
    paymentStatus: "captured",
    status: "delivered",
    createdAt: "2026-08-01T14:22:00.000Z",
    items: [
      {
        id: "ins-0001-1",
        name: "BMW 3 Series Mirror Cover",
        itemCode: "600042",
        quantity: 1,
        unitPrice: 49.99,
        totalPrice: 49.99,
        mainImage: null,
      },
      {
        id: "ins-0001-2",
        name: "Universal Floor Mat Set",
        itemCode: "610233",
        quantity: 1,
        unitPrice: 34.51,
        totalPrice: 34.51,
        mainImage: null,
      },
    ],
  },
  {
    id: "ins-0002",
    orderNumber: "INS-2026-0149",
    customerId: "cust-003",
    customerName: "Yousef Nassar",
    customerEmail: "—",
    customerPhone: "+962777889900",
    orderType: "user",
    totalAmount: 25.0,
    currency: "JOD",
    paymentMethodType: "cash",
    paymentMethodLabel: "Cash",
    paymentStatus: "captured",
    status: "delivered",
    createdAt: "2026-08-02T11:05:00.000Z",
    items: [
      {
        id: "ins-0002-1",
        name: "Steering Wheel Trim - Carbon",
        itemCode: "605511",
        quantity: 1,
        unitPrice: 25.0,
        totalPrice: 25.0,
        mainImage: null,
      },
    ],
  },
  {
    id: "ins-0003",
    orderNumber: "INS-2026-0150",
    customerId: "cust-006",
    customerName: "Dana Aburub",
    customerEmail: "—",
    customerPhone: "+962779001122",
    orderType: "user",
    totalAmount: 129.99,
    currency: "JOD",
    paymentMethodType: "card",
    paymentMethodLabel: "Card",
    paymentStatus: "captured",
    status: "delivered",
    createdAt: "2026-08-03T16:40:00.000Z",
    items: [
      {
        id: "ins-0003-1",
        name: "Mercedes GLC Rear Diffuser",
        itemCode: "620077",
        quantity: 1,
        unitPrice: 129.99,
        totalPrice: 129.99,
        mainImage: null,
      },
    ],
  },
  {
    id: "ins-0004",
    orderNumber: "INS-2026-0151",
    customerId: "cust-002",
    customerName: "Lina Khoury",
    customerEmail: "lina.khoury@example.com",
    customerPhone: "+962795551234",
    orderType: "user",
    totalAmount: 42.75,
    currency: "JOD",
    paymentMethodType: "cash",
    paymentMethodLabel: "Cash",
    paymentStatus: "captured",
    status: "delivered",
    createdAt: "2026-08-03T18:12:00.000Z",
    items: [
      {
        id: "ins-0004-1",
        name: "LED Interior Light Kit",
        itemCode: "633001",
        quantity: 3,
        unitPrice: 14.25,
        totalPrice: 42.75,
        mainImage: null,
      },
    ],
  },
];

export function findMockInStoreOrderById(id: string): MockInStoreOrder | null {
  return mockInStoreOrders.find((o) => o.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Per-customer combined order history (online / whatsapp / in-store)
// ---------------------------------------------------------------------------

export const mockCustomerOrderHistory: Record<string, MockOrderHistoryRow[]> = {
  "cust-001": [
    { id: "ins-0001", orderNumber: "INS-2026-0148", channel: "in_store", totalAmount: 84.5, currency: "JOD", paymentMethodLabel: "Card", status: "delivered", createdAt: "2026-08-01T14:22:00.000Z" },
    { id: "onl-1101", orderNumber: "ORD-2026-3321", channel: "online", totalAmount: 65.0, currency: "JOD", paymentMethodLabel: "Credit Card", status: "delivered", createdAt: "2026-06-11T09:30:00.000Z" },
    { id: "onl-1032", orderNumber: "ORD-2026-2984", channel: "online", totalAmount: 120.0, currency: "JOD", paymentMethodLabel: "Cash On Delivery", status: "delivered", createdAt: "2026-04-02T13:00:00.000Z" },
  ],
  "cust-002": [
    { id: "ins-0004", orderNumber: "INS-2026-0151", channel: "in_store", totalAmount: 42.75, currency: "JOD", paymentMethodLabel: "Cash", status: "delivered", createdAt: "2026-08-03T18:12:00.000Z" },
    { id: "wa-0301", orderNumber: "WA-2026-0722", channel: "whatsapp", totalAmount: 89.9, currency: "JOD", paymentMethodLabel: "Cliq", status: "delivered", createdAt: "2026-07-19T15:45:00.000Z" },
    { id: "onl-0980", orderNumber: "ORD-2026-2711", channel: "online", totalAmount: 54.25, currency: "JOD", paymentMethodLabel: "Credit Card", status: "shipped", createdAt: "2026-07-30T10:20:00.000Z" },
  ],
  "cust-003": [
    { id: "ins-0002", orderNumber: "INS-2026-0149", channel: "in_store", totalAmount: 25.0, currency: "JOD", paymentMethodLabel: "Cash", status: "delivered", createdAt: "2026-08-02T11:05:00.000Z" },
    { id: "ins-0000", orderNumber: "INS-2026-0110", channel: "in_store", totalAmount: 60.0, currency: "JOD", paymentMethodLabel: "Cash", status: "delivered", createdAt: "2026-06-21T12:00:00.000Z" },
  ],
  "cust-004": [
    { id: "wa-0290", orderNumber: "WA-2026-0698", channel: "whatsapp", totalAmount: 47.5, currency: "JOD", paymentMethodLabel: "Cliq", status: "delivered", createdAt: "2026-07-07T14:00:00.000Z" },
    { id: "ins-0005", orderNumber: "INS-2026-0122", channel: "in_store", totalAmount: 33.0, currency: "JOD", paymentMethodLabel: "Card", status: "delivered", createdAt: "2026-05-09T17:10:00.000Z" },
  ],
  "cust-005": [
    { id: "onl-0870", orderNumber: "ORD-2026-2255", channel: "online", totalAmount: 210.0, currency: "JOD", paymentMethodLabel: "Credit Card", status: "delivered", createdAt: "2026-05-28T08:30:00.000Z" },
  ],
  "cust-006": [
    { id: "ins-0003", orderNumber: "INS-2026-0150", channel: "in_store", totalAmount: 129.99, currency: "JOD", paymentMethodLabel: "Card", status: "delivered", createdAt: "2026-08-03T16:40:00.000Z" },
  ],
  "cust-007": [
    { id: "onl-0755", orderNumber: "ORD-2026-1980", channel: "online", totalAmount: 75.5, currency: "JOD", paymentMethodLabel: "Credit Card", status: "delivered", createdAt: "2026-03-15T11:00:00.000Z" },
    { id: "wa-0244", orderNumber: "WA-2026-0561", channel: "whatsapp", totalAmount: 38.0, currency: "JOD", paymentMethodLabel: "Cliq", status: "delivered", createdAt: "2026-04-22T16:30:00.000Z" },
  ],
  "cust-008": [
    { id: "ins-0006", orderNumber: "INS-2026-0130", channel: "in_store", totalAmount: 19.99, currency: "JOD", paymentMethodLabel: "Cash", status: "delivered", createdAt: "2026-07-03T13:25:00.000Z" },
  ],
};

// ---------------------------------------------------------------------------
// "Frequently sold" fallback list for the New Sale product picker empty state
// ---------------------------------------------------------------------------

export interface MockFrequentProduct {
  id: string;
  name: string;
  itemCode: string;
  price: number;
  mainImage: string | null;
}

export const mockFrequentlySold: MockFrequentProduct[] = [
  { id: "freq-1", name: "Universal Floor Mat Set", itemCode: "610233", price: 34.51, mainImage: null },
  { id: "freq-2", name: "LED Interior Light Kit", itemCode: "633001", price: 14.25, mainImage: null },
  { id: "freq-3", name: "Steering Wheel Trim - Carbon", itemCode: "605511", price: 25.0, mainImage: null },
  { id: "freq-4", name: "BMW 3 Series Mirror Cover", itemCode: "600042", price: 49.99, mainImage: null },
  { id: "freq-5", name: "Phone Holder - Dashboard Mount", itemCode: "641210", price: 9.99, mainImage: null },
];
