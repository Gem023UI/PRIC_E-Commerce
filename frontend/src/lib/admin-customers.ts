import type { Metric, RangeInfo } from "@/lib/admin-stats";
import type { OrderStatus, PaymentStatus } from "@/lib/orders";

export type AccountState = "active" | "invited" | "deactivated";

export type CustomerRow = {
  email: string;
  name: string;
  phone: string;
  type: "account" | "guest";
  userId: string | null;
  accountState: AccountState | null;
  registeredAt: string | null;
  orders: number;
  cancelled: number;
  spent: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
};

export type CustomerStats = {
  range: RangeInfo;
  customers: {
    total: number;
    newAccounts: Metric;
    buyers: Metric;
    newBuyers: number;
    returningBuyers: number;
    repeatRate: { value: number; repeaters: number; buyers: number };
    ordersPerBuyer: number;
    spendPerCustomer: number;
    accountStates: { active: number; invited: number; deactivated: number };
    buyerTypes: { accounts: number; guests: number };
  };
  series: { key: string; label: string; future: boolean; registrations: number; buyers: number }[];
  topCustomers: { email: string; name: string; type: "account" | "guest"; orders: number; spent: number }[];
};

export type CustomerListResponse = {
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  counts: { all: number; accounts: number; guests: number };
  customers: CustomerRow[];
};

export type CustomerDetail = {
  customer: CustomerRow;
  orders: {
    id: string;
    trackingCode: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    itemCount: number;
    total: number;
    createdAt: string;
  }[];
  inquiries: {
    service: string;
    serviceLabel: string;
    status: string;
    message: string;
    createdAt: string;
  }[];
};

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");