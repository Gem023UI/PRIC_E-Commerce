import type { Metric, RangeInfo } from "@/lib/admin-stats";

export type StockStatus = "ok" | "low" | "out";

export type AdminProduct = {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  published: boolean;
  status: StockStatus;
  /** Units ordered in the last 30 days. */
  sold30: number;
  /** Days of stock left at the last 30 days' pace (null when nothing has sold). */
  daysLeft: number | null;
  createdAt: string;
  updatedAt: string;
};

export type StockMovement = {
  delta: number;
  balance: number;
  reason: "initial" | "order" | "order_cancelled" | "manual";
  note: string;
  by: string;
  createdAt: string;
};

export type ProductDetail = { product: AdminProduct; movements: StockMovement[] };

export type InventoryStats = {
  range: RangeInfo;
  summary: {
    products: number;
    published: number;
    hidden: number;
    units: number;
    value: number;
    low: number;
    out: number;
  };
  unitsOrdered: Metric;
  noSales: number;
  demand: {
    id: number;
    name: string;
    image: string;
    stock: number;
    units: number;
    previous: number;
    change: number | null;
  }[];
  attention: {
    id: number;
    name: string;
    image: string;
    stock: number;
    lowStockThreshold: number;
    status: StockStatus;
    daysLeft: number | null;
  }[];
  series: { key: string; label: string; future: boolean; units: number }[];
};

export type StockFilter = "all" | "ok" | "low" | "out" | "hidden";

export const REASON_LABELS: Record<StockMovement["reason"], string> = {
  initial: "Starting stock",
  order: "Customer order",
  order_cancelled: "Order cancelled",
  manual: "Manual adjustment",
};