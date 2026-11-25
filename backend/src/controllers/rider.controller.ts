import type { Request, RequestHandler } from "express";
import { isValidObjectId } from "mongoose";

import { Order, type OrderRecord, type OrderStatus } from "../database/models/order.model";
import { User } from "../database/models/user.model";
import { applyStatus } from "../services/orderWorkflow.service";
import { safeEqual } from "../utils/crypto";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

/*
 * Riders only ever see their own assigned orders, and never the full tracking code:
 * the customer's QR code (or the code they read out) is the proof of delivery.
 */

const ACTIVE: OrderStatus[] = ["to_ship", "on_delivery"];

const row = (o: OrderRecord) => ({
  id: String(o._id),
  ref: `#${String(o._id).slice(-6).toUpperCase()}`,
  status: o.status,
  fullName: o.fullName,
  phone: o.phone,
  itemCount: o.itemCount,
  total: o.total,
  paymentMethod: o.paymentMethod,
  paymentStatus: o.paymentStatus,
  // Cash the rider must collect at the door.
  collectAmount: o.paymentMethod === "cod" && o.paymentStatus !== "paid" ? o.total : 0,
  area: `${o.address.barangay}, ${o.address.city}`,
  assignedAt: o.riderAssignedAt ? o.riderAssignedAt.toISOString() : null,
  completedAt: o.completedAt ? o.completedAt.toISOString() : null,
});

const detail = (o: OrderRecord) => ({
  ...row(o),
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
  notes: o.notes,
});

async function findOwnOrder(req: Request, rawId: unknown) {
  const id = String(rawId ?? "");
  if (!isValidObjectId(id)) throw new HttpError(404, "Order not found");
  const order = await Order.findOne({ _id: id, rider: req.auth!.userId });
  if (!order) throw new HttpError(404, "Order not found");
  return order;
}

async function riderName(req: Request) {
  const u = await User.findById(req.auth!.userId).select("firstName lastName");
  return u ? `${u.firstName} ${u.lastName ?? ""}`.trim() : "Rider";
}

const asRecord = (o: unknown) => o as OrderRecord;

export const listMyOrders: RequestHandler = async (req, res) => {
  const riderId = req.auth!.userId;

  const [activeDocs, recentDocs] = await Promise.all([
    Order.find({ rider: riderId, status: { $in: ACTIVE } }).lean(),
    Order.find({ rider: riderId, status: "completed" }).sort({ completedAt: -1 }).limit(5).lean(),
  ]);

  // Out for delivery first, then oldest assignment first.
  const active = (activeDocs as unknown as OrderRecord[]).sort((a, b) => {
    const rank = (o: OrderRecord) => (o.status === "on_delivery" ? 0 : 1);
    return (
      rank(a) - rank(b) ||
      (a.riderAssignedAt?.getTime() ?? 0) - (b.riderAssignedAt?.getTime() ?? 0)
    );
  });

  res.json({
    active: active.map(row),
    recent: (recentDocs as unknown as OrderRecord[]).map(row),
  });
};

export const getMyOrder: RequestHandler = async (req, res) => {
  const order = await findOwnOrder(req, req.params.id);
  res.json({ order: detail(asRecord(order.toObject())) });
};

export const startDelivery: RequestHandler = async (req, res) => {
  const order = await findOwnOrder(req, req.params.id);

  if (order.status !== "to_ship") {
    throw new HttpError(
      409,
      order.status === "on_delivery"
        ? "This delivery has already started."
        : "This order isn't ready for delivery.",
      "invalid_state",
    );
  }

  applyStatus(order, "on_delivery", { kind: "rider", name: await riderName(req) }, "Package checked; delivery started");
  await order.save();
  res.json({ order: detail(asRecord(order.toObject())) });
};

// PRIC-YYYYMMDD-XXXXXX, using the same alphabet as the code generator (no 0/O/1/I).
const CODE_RE = /PRIC-\d{8}-[A-HJ-NP-Z2-9]{6}/i;

/** Accepts the tracking URL encoded in the QR code, or the bare tracking code. */
function extractCode(raw: string): string | null {
  const text = decodeURIComponent(raw.trim().slice(0, 400).replace(/%(?![0-9a-f]{2})/gi, "%25"));
  const match = text.match(CODE_RE);
  return match ? match[0].toUpperCase() : null;
}

export const scanOrder: RequestHandler = async (req, res) => {
  const { code } = req.body as { code: string };
  const order = await findOwnOrder(req, req.params.id);

  const scanned = extractCode(code);
  if (!scanned) {
    throw new HttpError(
      422,
      "That isn't a PRIC order QR code. Ask the customer to show the QR code from their order.",
      "not_pric_code",
    );
  }
  if (order.status === "completed") {
    throw new HttpError(409, "This order has already been delivered.", "already_completed");
  }
  if (order.status === "cancelled") {
    throw new HttpError(409, "This order was cancelled and can't be delivered.", "cancelled");
  }
  if (order.status !== "on_delivery") {
    throw new HttpError(409, "Start the delivery first, then scan the QR code.", "not_started");
  }
  if (!safeEqual(scanned, order.trackingCode)) {
    logger.warn({ orderId: String(order._id), riderId: req.auth!.userId }, "Rider scanned a QR for a different order");
    throw new HttpError(
      409,
      "This QR code belongs to a different order. Scan the QR code for this delivery.",
      "wrong_order",
    );
  }

  applyStatus(order, "completed", { kind: "rider", name: await riderName(req) }, "Delivered; QR code scanned");
  await order.save();

  res.json({
    ok: true,
    message:
      order.paymentMethod === "cod"
        ? "Delivery confirmed. Cash on delivery marked as paid."
        : "Delivery confirmed.",
    order: detail(asRecord(order.toObject())),
  });
};