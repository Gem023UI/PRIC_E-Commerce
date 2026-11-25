/* Types, labels and formatters shared by the admin dashboard pages. */

export const RANGE_KEYS = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "thisMonth",
  "lastMonth",
  "thisYear",
] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export const DEFAULT_RANGE: RangeKey = "last7";

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 days",
  last30: "Last 30 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  thisYear: "This year",
};

/** What each range is compared against (mirrors the backend's like-for-like windows). */
export const COMPARE_LABELS: Record<RangeKey, string> = {
  today: "vs. yesterday (same hours)",
  yesterday: "vs. the day before",
  last7: "vs. the previous 7 days",
  last30: "vs. the previous 30 days",
  thisMonth: "vs. last month (same days)",
  lastMonth: "vs. the month before",
  thisYear: "vs. last year (same period)",
};

export const isRangeKey = (v: unknown): v is RangeKey =>
  typeof v === "string" && (RANGE_KEYS as readonly string[]).includes(v);

export const parseRange = (v: string | null | undefined): RangeKey =>
  isRangeKey(v) ? v : DEFAULT_RANGE;

/* ---------------------------------- types ---------------------------------- */

export type Metric = { value: number; previous: number; change: number | null };

export type RangeInfo = {
  key: RangeKey;
  label: string;
  granularity: "hour" | "day" | "month";
  start: string;
  end: string;
  comparedTo: { start: string; end: string };
};

export type VisitsPoint = {
  key: string;
  label: string;
  future: boolean;
  pageViews: number;
  uniqueVisitors: number;
};

export type Visits = {
  pageViews: Metric;
  uniqueVisitors: Metric;
  pagesPerVisitor: number;
  series: VisitsPoint[];
  topPages: { path: string; views: number }[];
  devices: { device: string; views: number }[];
};

export type Overview = {
  range: RangeInfo;
  kpis: {
    revenue: Metric;
    orders: Metric;
    customers: { total: number; newInPeriod: number };
    products: { total: number; newInPeriod: number };
    pendingOrders: { current: number; receivedInPeriod: number };
    pendingInquiries: { current: number; receivedInPeriod: number };
  };
  visits: Visits;
};

/* -------------------------------- formatters -------------------------------- */

const pesoFmt = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const intFmt = new Intl.NumberFormat("en-PH");

export const formatPeso = (n: number) => pesoFmt.format(n);
export const formatInt = (n: number) => intFmt.format(n);
export const formatPercent = (n: number) => `${Math.abs(n).toFixed(1).replace(/\.0$/, "")}%`;

const dayFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** "Nov 17, 2026 – Nov 23, 2026" (clipped to now for ranges still in progress). */
export function formatRangeSpan(range: RangeInfo, now = new Date()): string {
  const start = new Date(range.start);
  const lastMs = Math.min(new Date(range.end).getTime() - 1, now.getTime());
  const a = dayFmt.format(start);
  const b = dayFmt.format(new Date(lastMs));
  return a === b ? a : `${a} – ${b}`;
}

const compactFmt = new Intl.NumberFormat("en-PH", { notation: "compact", maximumFractionDigits: 1 });
export const formatCompact = (n: number) => compactFmt.format(n);

/* ------------------------------ business performance ------------------------------ */

export type ProductStat = {
  productId: number;
  name: string;
  units: number;
  revenue: number;
  image?: string;
};

export type Business = {
  range: RangeInfo;
  metrics: {
    grossSales: Metric;
    netSales: Metric;
    averageOrderValue: Metric;
    transactions: Metric;
    unitsSold: Metric;
    discounts: Metric;
    refunds: Metric;
    outstandingPayments: {
      amount: number;
      orders: number;
      awaitingVerification: number;
      placedInPeriod: { amount: number; orders: number };
    };
    salesGrowth: { value: number | null; current: number; previous: number };
    bestSeller: ProductStat | null;
    highestRevenueProduct: ProductStat | null;
  };
  series: {
    key: string;
    label: string;
    future: boolean;
    grossSales: number;
    netSales: number;
    orders: number;
    units: number;
  }[];
  topProducts: (ProductStat & { share: number })[];
  paymentMix: { method: "cod" | "gcash" | "paymaya" | "bank"; orders: number; amount: number }[];
};