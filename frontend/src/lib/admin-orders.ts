import type { Metric, RangeInfo } from "@/lib/admin-stats";
import type {
  OrderAddress,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/orders";

export type AdminOrderRow = {
  id: string;
  trackingCode: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  itemCount: number;
  total: number;
  createdAt: string;
  rider: { id: string; name: string } | null;
};

export type AdminOrderDetail = AdminOrderRow & {
  address: OrderAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  refundedAmount: number;
  notes: string;
  cancelReason: string;
  riderAssignedAt: string | null;
  deliveryStartedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  history: { status: OrderStatus; at: string; by: string; note: string }[];
  /** Status changes an administrator may make from here. */
  allowed: OrderStatus[];
};

export type OrderListResponse = {
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  counts: { all: number; active: number } & Record<OrderStatus, number>;
  orders: AdminOrderRow[];
};

export type OrderStats = {
  range: RangeInfo;
  placed: Metric;
  byStatus: Record<OrderStatus, number>;
  cancellation: { rate: number; previous: number; cancelled: number };
  fulfilment: { avgHours: number | null; previousHours: number | null; completed: number };
  payments: Record<PaymentStatus, { orders: number; amount: number }>;
  live: {
    toConfirm: number;
    paymentsToVerify: number;
    toShipUnassigned: number;
    toShip: number;
    onDelivery: number;
  };
  series: {
    key: string;
    label: string;
    future: boolean;
    placed: number;
    completed: number;
    cancelled: number;
  }[];
};

export type RiderRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountState: "active" | "invited" | "deactivated";
  toShip: number;
  onDelivery: number;
  completed: number;
};

export type OrderFilters = {
  search: string;
  status: string;
  payment: string;
  rider: string;
  sort: string;
  page: number;
};

export const DEFAULT_FILTERS: OrderFilters = {
  search: "",
  status: "all",
  payment: "all",
  rider: "all",
  sort: "newest",
  page: 1,
};

export function formatDuration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${hours.toFixed(1).replace(/\.0$/, "")} hrs`;
  return `${(hours / 24).toFixed(1).replace(/\.0$/, "")} days`;
}

const dateTimeFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatDateTime = (iso: string | null) => (iso ? dateTimeFmt.format(new Date(iso)) : "—");