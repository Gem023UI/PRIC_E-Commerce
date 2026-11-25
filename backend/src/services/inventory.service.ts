import { Order } from "../database/models/order.model";
import { Product, type ProductRecord } from "../database/models/product.model";
import { StockMovement } from "../database/models/stockMovement.model";
import { buildBuckets, describeRange, type DateRange } from "../utils/dateRange";
import { HttpError } from "../utils/httpError";
import { stockStatus } from "./products.service";
import { bucketExpr, metric, round2 } from "./stats.service";

const DAY = 86_400_000;

const adminShape = (p: ProductRecord, sold30: number) => ({
  id: p.productId,
  name: p.name,
  description: p.description,
  image: p.image,
  price: p.price,
  stock: p.stock,
  lowStockThreshold: p.lowStockThreshold,
  published: p.published,
  status: stockStatus(p.stock, p.lowStockThreshold),
  sold30,
  // Days of stock left at the last 30 days' pace (null when nothing has sold).
  daysLeft: sold30 > 0 && p.stock > 0 ? Math.round(p.stock / (sold30 / 30)) : null,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

export type AdminProduct = ReturnType<typeof adminShape>;

const soldByProduct = (start: Date, end: Date, productId?: number) =>
  Order.aggregate<{ _id: number; units: number }>([
    { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: start, $lt: end } } },
    { $unwind: "$items" },
    ...(productId ? [{ $match: { "items.productId": productId } }] : []),
    { $group: { _id: "$items.productId", units: { $sum: "$items.quantity" } } },
  ]);

const last30 = () => {
  const now = new Date();
  return [new Date(now.getTime() - 30 * DAY), now] as const;
};

export async function listAdminProducts() {
  const [rows, sold] = await Promise.all([
    Product.find({ deletedAt: null }).sort({ productId: 1 }).lean(),
    soldByProduct(...last30()),
  ]);
  const soldMap = new Map(sold.map((s) => [s._id, s.units]));
  return (rows as unknown as ProductRecord[]).map((p) => adminShape(p, soldMap.get(p.productId) ?? 0));
}

export async function getProductDetail(productId: number) {
  const [row, sold, movements] = await Promise.all([
    Product.findOne({ productId, deletedAt: null }).lean(),
    soldByProduct(...last30(), productId),
    StockMovement.find({ productId }).sort({ createdAt: -1 }).limit(15).lean(),
  ]);
  if (!row) return null;

  return {
    product: adminShape(row as unknown as ProductRecord, sold[0]?.units ?? 0),
    movements: (
      movements as unknown as {
        delta: number;
        balance: number;
        reason: string;
        note: string;
        by: string;
        createdAt: Date;
      }[]
    ).map((m) => ({
      delta: m.delta,
      balance: m.balance,
      reason: m.reason,
      note: m.note,
      by: m.by,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function adjustStock(
  productId: number,
  mode: "add" | "remove" | "set",
  quantity: number,
  note: string,
  by: string,
) {
  const notFound = () => new HttpError(404, "Product not found");
  let before: number;
  let after: number;

  if (mode === "add") {
    const p = await Product.findOneAndUpdate(
      { productId, deletedAt: null },
      { $inc: { stock: quantity } },
      { new: true },
    ).select("stock");
    if (!p) throw notFound();
    after = p.stock;
    before = after - quantity;
  } else if (mode === "remove") {
    const p = await Product.findOneAndUpdate(
      { productId, deletedAt: null, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true },
    ).select("stock");
    if (!p) {
      const current = await Product.findOne({ productId, deletedAt: null }).select("stock");
      if (!current) throw notFound();
      const msg = `Only ${current.stock} in stock, so you can't remove ${quantity}.`;
      throw new HttpError(400, msg, "insufficient_stock", { quantity: msg });
    }
    after = p.stock;
    before = after + quantity;
  } else {
    const prev = await Product.findOneAndUpdate(
      { productId, deletedAt: null },
      { $set: { stock: quantity } },
      { new: false },
    ).select("stock");
    if (!prev) throw notFound();
    before = prev.stock;
    after = quantity;
  }

  if (after !== before) {
    await StockMovement.create({ productId, delta: after - before, balance: after, reason: "manual", note, by });
  }
}

/* ----------------------------------- stats ----------------------------------- */

export async function getInventoryStats(range: DateRange) {
  const { start, end, prevStart, prevEnd, granularity } = range;
  const [since, now] = last30();

  const [productsRaw, sold30Rows, soldCur, soldPrev, seriesRows] = await Promise.all([
    Product.find({ deletedAt: null }).lean(),
    soldByProduct(since, now),
    soldByProduct(start, end),
    soldByProduct(prevStart, prevEnd),
    Order.aggregate<{ _id: string; units: number }>([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: bucketExpr("$createdAt", granularity), units: { $sum: "$itemCount" } } },
    ]),
  ]);

  const sold30 = new Map(sold30Rows.map((r) => [r._id, r.units]));
  const cur = new Map(soldCur.map((r) => [r._id, r.units]));
  const prev = new Map(soldPrev.map((r) => [r._id, r.units]));
  const sum = (m: Map<number, number>) => [...m.values()].reduce((s, n) => s + n, 0);

  const rows = (productsRaw as unknown as ProductRecord[]).map((p) =>
    adminShape(p, sold30.get(p.productId) ?? 0),
  );
  const visible = rows.filter((r) => r.published);

  const pct = (c: number, p: number) => (p === 0 ? null : Math.round(((c - p) / p) * 1000) / 10);

  const byKey = new Map(seriesRows.map((r) => [r._id, r.units]));

  return {
    range: describeRange(range),
    summary: {
      products: rows.length,
      published: visible.length,
      hidden: rows.length - visible.length,
      units: rows.reduce((s, r) => s + r.stock, 0),
      value: round2(rows.reduce((s, r) => s + r.stock * r.price, 0)),
      low: visible.filter((r) => r.status === "low").length,
      out: visible.filter((r) => r.status === "out").length,
    },
    unitsOrdered: metric(sum(cur), sum(prev)),
    noSales: visible.filter((r) => !cur.get(r.id)).length,
    demand: rows
      .map((r) => ({
        id: r.id,
        name: r.name,
        image: r.image,
        stock: r.stock,
        units: cur.get(r.id) ?? 0,
        previous: prev.get(r.id) ?? 0,
        change: pct(cur.get(r.id) ?? 0, prev.get(r.id) ?? 0),
      }))
      .filter((d) => d.units > 0)
      .sort((a, b) => b.units - a.units)
      .slice(0, 8),
    attention: visible
      .filter((r) => r.status !== "ok")
      .sort((a, b) => (a.status === b.status ? a.stock - b.stock : a.status === "out" ? -1 : 1))
      .slice(0, 8)
      .map((r) => ({
        id: r.id,
        name: r.name,
        image: r.image,
        stock: r.stock,
        lowStockThreshold: r.lowStockThreshold,
        status: r.status,
        daysLeft: r.daysLeft,
      })),
    series: buildBuckets(range).map((b) => ({
      key: b.key,
      label: b.label,
      future: b.future,
      units: byKey.get(b.key) ?? 0,
    })),
  };
}