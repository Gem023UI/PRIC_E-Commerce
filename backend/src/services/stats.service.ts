import { Product } from "../database/models/product.model";
import { Inquiry } from "../database/models/inquiry.model";
import { Order, PAYMENT_METHODS } from "../database/models/order.model";
import { PageView } from "../database/models/pageView.model";
import { User } from "../database/models/user.model";
import {
  MONGO_TZ,
  bucketFormat,
  buildBuckets,
  describeRange,
  type DateRange,
  type Granularity,
} from "../utils/dateRange";

const asFilter = (o: object) => o as never;

export const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** % change, or null when there is nothing to compare against. */
export const pctChange = (cur: number, prev: number) =>
  prev === 0 ? null : round1(((cur - prev) / prev) * 100);

export const metric = (value: number, previous: number) => ({
  value,
  previous,
  change: pctChange(value, previous),
});

export const bucketExpr = (date: unknown, g: Granularity) => ({
  $dateToString: { format: bucketFormat(g), date, timezone: MONGO_TZ },
});

/* ------------------------------ shared filters ------------------------------ */

/** Completed orders recognized in the window (completedAt, or the order date when it's missing). */
export const recognizedWithin = (start: Date, end: Date) => ({
  status: "completed",
  $or: [
    { completedAt: { $gte: start, $lt: end } },
    { completedAt: null, createdAt: { $gte: start, $lt: end } },
  ],
});
const RECOGNIZED_AT = { $ifNull: ["$completedAt", "$createdAt"] };

const placedWithin = (start: Date, end: Date) => ({ createdAt: { $gte: start, $lt: end } });

const PENDING_ORDERS = {
  $or: [
    { status: { $in: ["to_confirm", "to_ship"] } },
    { status: { $ne: "cancelled" }, paymentStatus: "pending_verification" },
  ],
};
const PENDING_INQUIRIES = { status: { $in: ["new", "contacted"] } };
const CUSTOMERS = { role: "customer", status: { $ne: "deactivated" } };

/* ---------------------------------- sales ---------------------------------- */

type SalesTotals = {
  gross: number;
  discounts: number;
  refunds: number;
  transactions: number;
  units: number;
};

async function salesTotals(start: Date, end: Date): Promise<SalesTotals> {
  const [row] = await Order.aggregate<SalesTotals>([
    { $match: recognizedWithin(start, end) },
    {
      $group: {
        _id: null,
        gross: { $sum: "$subtotal" },
        discounts: { $sum: { $ifNull: ["$discountTotal", 0] } },
        refunds: { $sum: { $ifNull: ["$refundedAmount", 0] } },
        transactions: { $sum: 1 },
        units: { $sum: "$itemCount" },
      },
    },
  ]);
  return row ?? { gross: 0, discounts: 0, refunds: 0, transactions: 0, units: 0 };
}

const netOf = (s: SalesTotals) => round2(s.gross - s.discounts - s.refunds);

/* ---------------------------------- visits ---------------------------------- */

async function uniqueVisitors(start: Date, end: Date) {
  const [row] = await PageView.aggregate<{ n: number }>([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: "$visitorId" } },
    { $count: "n" },
  ]);
  return row?.n ?? 0;
}

export async function getVisits(range: DateRange) {
  const { start, end, prevStart, prevEnd, granularity } = range;
  const match = { createdAt: { $gte: start, $lt: end } };

  const [views, visitors, prevViews, prevVisitors, seriesRows, topPages, devices] =
    await Promise.all([
      PageView.countDocuments(match),
      uniqueVisitors(start, end),
      PageView.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd } }),
      uniqueVisitors(prevStart, prevEnd),
      PageView.aggregate<{ _id: string; pageViews: number; uniqueVisitors: number }>([
        { $match: match },
        {
          $group: {
            _id: { b: bucketExpr("$createdAt", granularity), v: "$visitorId" },
            views: { $sum: 1 },
          },
        },
        {
          $group: { _id: "$_id.b", pageViews: { $sum: "$views" }, uniqueVisitors: { $sum: 1 } },
        },
      ]),
      PageView.aggregate<{ _id: string; views: number }>([
        { $match: match },
        { $group: { _id: "$path", views: { $sum: 1 } } },
        { $sort: { views: -1, _id: 1 } },
        { $limit: 5 },
      ]),
      PageView.aggregate<{ _id: string; views: number }>([
        { $match: match },
        { $group: { _id: "$device", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
      ]),
    ]);

  const byKey = new Map(seriesRows.map((r) => [r._id, r]));
  const series = buildBuckets(range).map((b) => ({
    key: b.key,
    label: b.label,
    future: b.future,
    pageViews: byKey.get(b.key)?.pageViews ?? 0,
    uniqueVisitors: byKey.get(b.key)?.uniqueVisitors ?? 0,
  }));

  return {
    pageViews: metric(views, prevViews),
    uniqueVisitors: metric(visitors, prevVisitors),
    pagesPerVisitor: visitors ? round2(views / visitors) : 0,
    series,
    topPages: topPages.map((p) => ({ path: p._id, views: p.views })),
    devices: devices.map((d) => ({ device: d._id, views: d.views })),
  };
}

/* --------------------------------- overview --------------------------------- */

export async function getOverview(range: DateRange) {
  const { start, end, prevStart, prevEnd } = range;

  const [
    cur,
    prev,
    ordersCur,
    ordersPrev,
    customers,
    customersNew,
    pendingNow,
    pendingIn,
    inquiriesNow,
    inquiriesIn,
    productsLive,
    productsNew,
    visits,
  ] = await Promise.all([
    salesTotals(start, end),
    salesTotals(prevStart, prevEnd),
    Order.countDocuments(placedWithin(start, end)),
    Order.countDocuments(placedWithin(prevStart, prevEnd)),
    User.countDocuments(asFilter(CUSTOMERS)),
    User.countDocuments(asFilter({ ...CUSTOMERS, ...placedWithin(start, end) })),
    Order.countDocuments(asFilter(PENDING_ORDERS)),
    Order.countDocuments(asFilter({ $and: [PENDING_ORDERS, placedWithin(start, end)] })),
    Inquiry.countDocuments(asFilter(PENDING_INQUIRIES)),
    Inquiry.countDocuments(asFilter({ ...PENDING_INQUIRIES, ...placedWithin(start, end) })),
    Product.countDocuments({ deletedAt: null, published: true }),
    Product.countDocuments({ deletedAt: null, published: true, ...placedWithin(start, end) }),
    getVisits(range),
  ]);

  return {
    range: describeRange(range),
    kpis: {
      revenue: metric(netOf(cur), netOf(prev)),
      orders: metric(ordersCur, ordersPrev),
      customers: { total: customers, newInPeriod: customersNew },
      products: { total: productsLive, newInPeriod: productsNew },
      pendingOrders: { current: pendingNow, receivedInPeriod: pendingIn },
      pendingInquiries: { current: inquiriesNow, receivedInPeriod: inquiriesIn },
    },
    visits,
  };
}

/* ------------------------------ business performance ------------------------------ */

type ProductRow = { _id: number; name: string; image?: string; units: number; revenue: number };

async function productTotals(start: Date, end: Date) {
  const rows = await Order.aggregate<ProductRow>([
    { $match: recognizedWithin(start, end) },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        name: { $first: "$items.name" },
        image: { $first: "$items.image" },
        units: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
  ]);
  return rows.map((r) => ({
    productId: r._id,
    name: r.name,
    image: r.image ?? "",
    units: r.units,
    revenue: round2(r.revenue),
  }));
}

async function outstanding(filter: Record<string, unknown>) {
  const [row] = await Order.aggregate<{ amount: number; orders: number; verifying: number }>([
    {
      $match: {
        status: { $ne: "cancelled" },
        paymentStatus: { $in: ["unpaid", "pending_verification"] },
        ...filter,
      },
    },
    {
      $group: {
        _id: null,
        amount: { $sum: "$total" },
        orders: { $sum: 1 },
        verifying: { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending_verification"] }, 1, 0] } },
      },
    },
  ]);
  return {
    amount: round2(row?.amount ?? 0),
    orders: row?.orders ?? 0,
    awaitingVerification: row?.verifying ?? 0,
  };
}

export async function getBusiness(range: DateRange) {
  const { start, end, prevStart, prevEnd, granularity } = range;

  const [cur, prev, products, outstandingNow, outstandingIn, seriesRows, paymentRows] =
    await Promise.all([
      salesTotals(start, end),
      salesTotals(prevStart, prevEnd),
      productTotals(start, end),
      outstanding({}),
      outstanding(placedWithin(start, end)),
      Order.aggregate<{
        _id: string;
        gross: number;
        discounts: number;
        refunds: number;
        orders: number;
        units: number;
      }>([
        { $match: recognizedWithin(start, end) },
        {
          $group: {
            _id: bucketExpr(RECOGNIZED_AT, granularity),
            gross: { $sum: "$subtotal" },
            discounts: { $sum: { $ifNull: ["$discountTotal", 0] } },
            refunds: { $sum: { $ifNull: ["$refundedAmount", 0] } },
            orders: { $sum: 1 },
            units: { $sum: "$itemCount" },
          },
        },
      ]),
      Order.aggregate<{ _id: string; orders: number; amount: number }>([
        { $match: recognizedWithin(start, end) },
        { $group: { _id: "$paymentMethod", orders: { $sum: 1 }, amount: { $sum: "$subtotal" } } },
      ]),
    ]);

  const net = netOf(cur);
  const prevNet = netOf(prev);
  const aov = (s: SalesTotals) => (s.transactions ? round2(netOf(s) / s.transactions) : 0);

  const byRevenue = [...products].sort((a, b) => b.revenue - a.revenue || b.units - a.units);
  const byUnits = [...products].sort((a, b) => b.units - a.units || b.revenue - a.revenue);

  const byKey = new Map(seriesRows.map((r) => [r._id, r]));
  const series = buildBuckets(range).map((b) => {
    const r = byKey.get(b.key);
    return {
      key: b.key,
      label: b.label,
      future: b.future,
      grossSales: round2(r?.gross ?? 0),
      netSales: round2((r?.gross ?? 0) - (r?.discounts ?? 0) - (r?.refunds ?? 0)),
      orders: r?.orders ?? 0,
      units: r?.units ?? 0,
    };
  });

  const payments = new Map(paymentRows.map((r) => [r._id, r]));

  return {
    range: describeRange(range),
    metrics: {
      grossSales: metric(round2(cur.gross), round2(prev.gross)),
      netSales: metric(net, prevNet),
      averageOrderValue: metric(aov(cur), aov(prev)),
      transactions: metric(cur.transactions, prev.transactions),
      unitsSold: metric(cur.units, prev.units),
      discounts: metric(round2(cur.discounts), round2(prev.discounts)),
      refunds: metric(round2(cur.refunds), round2(prev.refunds)),
      outstandingPayments: {
        ...outstandingNow,
        placedInPeriod: { amount: outstandingIn.amount, orders: outstandingIn.orders },
      },
      salesGrowth: { value: pctChange(net, prevNet), current: net, previous: prevNet },
      bestSeller: byUnits[0] ?? null,
      highestRevenueProduct: byRevenue[0] ?? null,
    },
    series,
    topProducts: byRevenue.slice(0, 5).map((p) => ({
      ...p,
      share: cur.gross ? round1((p.revenue / cur.gross) * 100) : 0,
    })),
    paymentMix: PAYMENT_METHODS.map((m) => ({
      method: m,
      orders: payments.get(m)?.orders ?? 0,
      amount: round2(payments.get(m)?.amount ?? 0),
    })),
  };
}