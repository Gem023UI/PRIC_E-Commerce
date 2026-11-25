import type { Types } from "mongoose";

import {
  ORDER_STATUSES,
  Order,
  PAYMENT_STATUSES,
  type OrderRecord,
  type OrderStatus,
  type PaymentStatus,
} from "../database/models/order.model";
import { User } from "../database/models/user.model";
import { buildBuckets, describeRange, type DateRange } from "../utils/dateRange";
import { ADMIN_TRANSITIONS } from "./orderWorkflow.service";
import { bucketExpr, metric, round2 } from "./stats.service";

const round1 = (n: number) => Math.round(n * 10) / 10;
const PAGE_SIZE = 20;
const MS_PER_HOUR = 3_600_000;

const placed = (s: Date, e: Date) => ({ createdAt: { $gte: s, $lt: e } });

/* ----------------------------------- stats ----------------------------------- */

type StatusCount = { _id: OrderStatus; n: number };

const zeroByStatus = () =>
  Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;

function tally(rows: StatusCount[]) {
  const byStatus = zeroByStatus();
  let total = 0;
  for (const r of rows) {
    byStatus[r._id] = r.n;
    total += r.n;
  }
  return { byStatus, total };
}

export async function getOrderStats(range: DateRange) {
  const { start, end, prevStart, prevEnd, granularity } = range;

  const countByStatus = (s: Date, e: Date) =>
    Order.aggregate<StatusCount>([
      { $match: placed(s, e) },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]);

  const fulfilment = (s: Date, e: Date) =>
    Order.aggregate<{ avgMs: number; n: number }>([
      { $match: { status: "completed", completedAt: { $gte: s, $lt: e } } },
      {
        $group: {
          _id: null,
          avgMs: { $avg: { $subtract: ["$completedAt", "$createdAt"] } },
          n: { $sum: 1 },
        },
      },
    ]);

  const bucketed = (match: Record<string, unknown>, date: unknown) =>
    Order.aggregate<{ _id: string; n: number }>([
      { $match: match },
      { $group: { _id: bucketExpr(date, granularity), n: { $sum: 1 } } },
    ]);

  const inRange = (field: string, status: string) => ({
    status,
    $or: [
      { [field]: { $gte: start, $lt: end } },
      { [field]: null, createdAt: { $gte: start, $lt: end } },
    ],
  });

  const [
    curRows,
    prevRows,
    fulCur,
    fulPrev,
    payRows,
    placedSeries,
    doneSeries,
    cancelSeries,
    toConfirm,
    paymentsToVerify,
    toShipUnassigned,
    toShip,
    onDelivery,
  ] = await Promise.all([
    countByStatus(start, end),
    countByStatus(prevStart, prevEnd),
    fulfilment(start, end),
    fulfilment(prevStart, prevEnd),
    Order.aggregate<{ _id: PaymentStatus; n: number; amount: number }>([
      { $match: { ...placed(start, end), status: { $ne: "cancelled" } } },
      { $group: { _id: "$paymentStatus", n: { $sum: 1 }, amount: { $sum: "$total" } } },
    ]),
    bucketed(placed(start, end), "$createdAt"),
    bucketed(inRange("completedAt", "completed"), { $ifNull: ["$completedAt", "$createdAt"] }),
    bucketed(inRange("cancelledAt", "cancelled"), { $ifNull: ["$cancelledAt", "$createdAt"] }),
    Order.countDocuments({ status: "to_confirm" }),
    Order.countDocuments({ status: { $ne: "cancelled" }, paymentStatus: "pending_verification" }),
    Order.countDocuments({ status: "to_ship", rider: null }),
    Order.countDocuments({ status: "to_ship" }),
    Order.countDocuments({ status: "on_delivery" }),
  ]);

  const cur = tally(curRows);
  const prev = tally(prevRows);
  const rateOf = (t: ReturnType<typeof tally>) =>
    t.total ? round1((t.byStatus.cancelled / t.total) * 100) : 0;

  const payments = Object.fromEntries(
    PAYMENT_STATUSES.map((p) => {
      const row = payRows.find((r) => r._id === p);
      return [p, { orders: row?.n ?? 0, amount: round2(row?.amount ?? 0) }];
    }),
  ) as Record<PaymentStatus, { orders: number; amount: number }>;

  const byKey = (rows: { _id: string; n: number }[]) => new Map(rows.map((r) => [r._id, r.n]));
  const placedBy = byKey(placedSeries);
  const doneBy = byKey(doneSeries);
  const cancelBy = byKey(cancelSeries);

  return {
    range: describeRange(range),
    placed: metric(cur.total, prev.total),
    byStatus: cur.byStatus,
    cancellation: {
      rate: rateOf(cur),
      previous: rateOf(prev),
      cancelled: cur.byStatus.cancelled,
    },
    fulfilment: {
      avgHours: fulCur[0] ? round1(fulCur[0].avgMs / MS_PER_HOUR) : null,
      previousHours: fulPrev[0] ? round1(fulPrev[0].avgMs / MS_PER_HOUR) : null,
      completed: fulCur[0]?.n ?? 0,
    },
    payments,
    live: { toConfirm, paymentsToVerify, toShipUnassigned, toShip, onDelivery },
    series: buildBuckets(range).map((b) => ({
      key: b.key,
      label: b.label,
      future: b.future,
      placed: placedBy.get(b.key) ?? 0,
      completed: doneBy.get(b.key) ?? 0,
      cancelled: cancelBy.get(b.key) ?? 0,
    })),
  };
}

/* ------------------------------------ list ----------------------------------- */

export type OrderListQuery = {
  search: string;
  status: "all" | "active" | OrderStatus;
  payment: "all" | PaymentStatus;
  rider: string; // "all" | "unassigned" | a rider id
  sort: "newest" | "oldest" | "total";
  page: number;
};

type PopulatedRider = { _id: Types.ObjectId; firstName: string; lastName?: string | null } | null;
type OrderLean = Omit<OrderRecord, "rider"> & { rider: PopulatedRider };

const riderOf = (r: PopulatedRider) =>
  r ? { id: String(r._id), name: `${r.firstName} ${r.lastName ?? ""}`.trim() } : null;

const toRow = (o: OrderLean) => ({
  id: String(o._id),
  trackingCode: o.trackingCode,
  status: o.status,
  paymentStatus: o.paymentStatus,
  paymentMethod: o.paymentMethod,
  fullName: o.fullName,
  email: o.email,
  phone: o.phone,
  city: o.address.city,
  itemCount: o.itemCount,
  total: o.total,
  createdAt: o.createdAt.toISOString(),
  rider: riderOf(o.rider),
});

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  total: { total: -1, createdAt: -1 },
} as const;

export async function listOrders(q: OrderListQuery) {
  const filter: Record<string, unknown> = {};

  if (q.status === "active") filter.status = { $in: ["to_confirm", "to_ship", "on_delivery"] };
  else if (q.status !== "all") filter.status = q.status;

  if (q.payment !== "all") filter.paymentStatus = q.payment;

  if (q.rider === "unassigned") filter.rider = null;
  else if (q.rider !== "all") filter.rider = q.rider;

  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), "i");
    const phoneRx = new RegExp(escapeRegex(q.search.replace(/[\s()-]/g, "").replace(/^\+?63/, "0")), "i");
    filter.$or = [{ trackingCode: rx }, { fullName: rx }, { email: rx }, { phone: phoneRx }];
  }

  const [total, countRows] = await Promise.all([
    Order.countDocuments(filter),
    Order.aggregate<StatusCount>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(q.page, pages);

  const rows = (await Order.find(filter)
    .sort(SORTS[q.sort])
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate({ path: "rider", select: "firstName lastName" })
    .lean()) as unknown as OrderLean[];

  const { byStatus, total: all } = tally(countRows);

  return {
    total,
    page,
    pages,
    pageSize: PAGE_SIZE,
    counts: {
      all,
      active: byStatus.to_confirm + byStatus.to_ship + byStatus.on_delivery,
      ...byStatus,
    },
    orders: rows.map(toRow),
  };
}

/* ----------------------------------- detail ---------------------------------- */

export async function getOrderDetail(id: string) {
  const o = (await Order.findById(id)
    .populate({ path: "rider", select: "firstName lastName" })
    .lean()) as unknown as OrderLean | null;
  if (!o) return null;

  const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

  return {
    ...toRow(o),
    address: {
      street: o.address.street,
      barangay: o.address.barangay,
      city: o.address.city,
      province: o.address.province,
      postalCode: o.address.postalCode,
      landmark: o.address.landmark,
      lat: o.address.lat,
      lng: o.address.lng,
    },
    items: o.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    discountTotal: o.discountTotal ?? 0,
    refundedAmount: o.refundedAmount ?? 0,
    notes: o.notes,
    cancelReason: o.cancelReason ?? "",
    riderAssignedAt: iso(o.riderAssignedAt),
    deliveryStartedAt: iso(o.deliveryStartedAt),
    completedAt: iso(o.completedAt),
    cancelledAt: iso(o.cancelledAt),
    history: (o.statusHistory ?? []).map((h) => ({
      status: h.status,
      at: h.at.toISOString(),
      by: h.by,
      note: h.note,
    })),
    allowed: ADMIN_TRANSITIONS[o.status as OrderStatus] ?? [],
  };
}

/* ----------------------------------- riders ---------------------------------- */

type RiderUser = {
  _id: Types.ObjectId;
  firstName: string;
  lastName?: string | null;
  email: string;
  mobile?: string | null;
  status?: string | null;
  passwordHash?: string | null;
};

export async function listRiders() {
  const [ridersRaw, loadRows] = await Promise.all([
    User.find({ role: "rider" })
      .select("+passwordHash firstName lastName email mobile status")
      .sort({ firstName: 1 })
      .lean(),
    Order.aggregate<{ _id: Types.ObjectId; toShip: number; onDelivery: number; completed: number }>([
      { $match: { rider: { $ne: null } } },
      {
        $group: {
          _id: "$rider",
          toShip: { $sum: { $cond: [{ $eq: ["$status", "to_ship"] }, 1, 0] } },
          onDelivery: { $sum: { $cond: [{ $eq: ["$status", "on_delivery"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const load = new Map(loadRows.map((r) => [String(r._id), r]));

  return (ridersRaw as unknown as RiderUser[]).map((r) => {
    const l = load.get(String(r._id));
    return {
      id: String(r._id),
      name: `${r.firstName} ${r.lastName ?? ""}`.trim(),
      email: r.email,
      phone: r.mobile ?? "",
      accountState:
        r.status === "deactivated" ? "deactivated" : r.passwordHash ? "active" : "invited",
      toShip: l?.toShip ?? 0,
      onDelivery: l?.onDelivery ?? 0,
      completed: l?.completed ?? 0,
    };
  });
}