import { Order, type OrderRecord } from "../database/models/order.model";
import { Product, type ProductRecord } from "../database/models/product.model";
import { StockMovement } from "../database/models/stockMovement.model";
import type { OrderDoc } from "./orderWorkFlow.service";

export type StockStatus = "ok" | "low" | "out";

export const stockStatus = (stock: number, threshold: number): StockStatus =>
  stock <= 0 ? "out" : stock <= threshold ? "low" : "ok";

/** What the public site sees: only visible, non-deleted products. */
export async function listPublicProducts() {
  const rows = (await Product.find({ deletedAt: null, published: true })
    .sort({ productId: 1 })
    .lean()) as unknown as ProductRecord[];

  return rows.map((p) => ({
    id: p.productId,
    name: p.name,
    description: p.description,
    image: p.image,
    price: p.price,
    stock: p.stock,
    lowStock: stockStatus(p.stock, p.lowStockThreshold) === "low",
  }));
}

/* ---------------------------------- reserving ---------------------------------- */

export type StockLine = { productId: number; name: string; quantity: number };
export type Reservation = { productId: number; quantity: number; balance: number };

/**
 * Takes stock for every line, one atomic update each (only succeeds while enough is left).
 * If any line fails, everything taken so far is put back.
 */
export async function reserveStock(
  lines: StockLine[],
): Promise<{ ok: true; reserved: Reservation[] } | { ok: false; message: string }> {
  const reserved: Reservation[] = [];

  for (const l of lines) {
    const updated = await Product.findOneAndUpdate(
      { productId: l.productId, deletedAt: null, published: true, stock: { $gte: l.quantity } },
      { $inc: { stock: -l.quantity } },
      { new: true },
    ).select("stock");

    if (!updated) {
      await releaseStock(reserved);
      const current = await Product.findOne({
        productId: l.productId,
        deletedAt: null,
        published: true,
      }).select("stock");
      const left = current?.stock ?? 0;
      return {
        ok: false,
        message: !current
          ? `${l.name} is no longer available.`
          : left <= 0
            ? `${l.name} is out of stock.`
            : `${l.name} only has ${left} left in stock.`,
      };
    }
    reserved.push({ productId: l.productId, quantity: l.quantity, balance: updated.stock });
  }

  return { ok: true, reserved };
}

export async function releaseStock(reserved: Reservation[]) {
  await Promise.all(
    reserved.map((r) => Product.updateOne({ productId: r.productId }, { $inc: { stock: r.quantity } })),
  );
}

export async function recordOrderMovements(reserved: Reservation[], order: OrderRecord) {
  if (reserved.length === 0) return;
  await StockMovement.insertMany(
    reserved.map((r) => ({
      productId: r.productId,
      delta: -r.quantity,
      balance: r.balance,
      reason: "order" as const,
      note: order.trackingCode,
      by: "Customer order",
      orderId: order._id,
    })),
  );
}

/** Puts a cancelled order's stock back, once, and only if the order actually took stock. */
export async function restoreOrderStock(order: OrderDoc, by: string) {
  if (!order.stockDeducted) return;

  // Claim the restore atomically so a double click can't return stock twice.
  const claimed = await Order.updateOne(
    { _id: order._id, stockRestored: { $ne: true } },
    { $set: { stockRestored: true } },
  );
  if (claimed.modifiedCount !== 1) return;

  const movements = [];
  for (const i of order.items) {
    const p = await Product.findOneAndUpdate(
      { productId: i.productId },
      { $inc: { stock: i.quantity } },
      { new: true },
    ).select("stock");
    if (p) {
      movements.push({
        productId: i.productId,
        delta: i.quantity,
        balance: p.stock,
        reason: "order_cancelled" as const,
        note: order.trackingCode,
        by,
        orderId: order._id,
      });
    }
  }
  if (movements.length > 0) await StockMovement.insertMany(movements);
}