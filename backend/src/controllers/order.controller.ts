import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { MAX_LINE_QUANTITY, SHIPPING_FEE } from "../config/catalog";import { env } from "../config/env";
import { GuestOtp } from "../database/models/guestOtp.model";
import {
  ORDER_STATUS_PRIORITY,
  Order,
  type OrderRecord,
  type OrderStatus,
} from "../database/models/order.model";
import {
  GUEST_COOKIE,
  GUEST_TTL_S,
  guestCookieOptions,
  readVerifiedSession,
} from "../middlewares/guestAuth.middleware";
import { sendOrderConfirmation, sendOrderOtpEmail } from "../services/orderMail.service";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";
import { generateTrackingCode, trackingUrl } from "../utils/trackingCode";
import type { CreateOrderInput } from "../validators/order.validator";
import { Product } from "../database/models/product.model";
import { recordOrderMovements, releaseStock, reserveStock } from "../services/products.service";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

const hashCode = (email: string, code: string) =>
  createHmac("sha256", env.JWT_SECRET).update(`guest-otp:${email}:${code}`).digest("hex");

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ---------------- Email verification ---------------- */

export const sendOtp: RequestHandler = async (req, res) => {
  const { email } = req.body as { email: string };

  const recent = await GuestOtp.exists({
    email,
    createdAt: { $gt: new Date(Date.now() - RESEND_MS) },
  });
  if (recent) {
    res.status(429).json({ message: "Please wait a moment before requesting another code." });
    return;
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await GuestOtp.deleteMany({ email });
  const doc = await GuestOtp.create({
    email,
    codeHash: hashCode(email, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  try {
    await sendOrderOtpEmail(email, code);
  } catch (err) {
    logger.error({ err }, "Failed to send order OTP email");
    await GuestOtp.deleteOne({ _id: doc._id });
    res.status(502).json({ message: "We couldn't send the verification code. Please try again." });
    return;
  }

  res.json({ message: "Verification code sent." });
};

export const verifyOtp: RequestHandler = async (req, res) => {
  const { email, code } = req.body as { email: string; code: string };

  // Atomic attempt counter: concurrent guesses can't exceed MAX_ATTEMPTS.
  const doc = await GuestOtp.findOneAndUpdate(
    { email, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true },
  );
  if (!doc) {
    res
      .status(400)
      .json({ message: "This code has expired or is no longer valid. Request a new one." });
    return;
  }

  if (!safeEqual(doc.codeHash, hashCode(email, code))) {
    const left = MAX_ATTEMPTS - doc.attempts;
    res.status(400).json({
      message:
        left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
          : "Too many incorrect attempts. Request a new code.",
    });
    return;
  }

  await GuestOtp.deleteMany({ email });

  const token = jwt.sign({ purpose: "guest-email", email }, env.JWT_SECRET, {
    expiresIn: GUEST_TTL_S,
  });
  res.cookie(GUEST_COOKIE, token, { ...guestCookieOptions, maxAge: GUEST_TTL_S * 1000 });
  res.json({ email });
};

/** Which email (if any) this browser has already verified: a login session or a guest cookie. */
export const getSession: RequestHandler = async (req, res) => {
  const verified = await readVerifiedSession(req);
  res.json({ email: verified?.email ?? null, source: verified?.source ?? null });
};

export const clearSession: RequestHandler = (_req, res) => {
  res.clearCookie(GUEST_COOKIE, guestCookieOptions);
  res.json({ ok: true });
};

/* ---------------- Orders ---------------- */

function toPublic(o: OrderRecord) {
  return {
    id: String(o._id),
    trackingCode: o.trackingCode,
    trackingUrl: trackingUrl(o.trackingCode),
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    fullName: o.fullName,
    email: o.email,
    phone: o.phone,
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
      image: i.image ?? "",
      quantity: i.quantity,
    })),
    itemCount: o.itemCount,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    total: o.total,
    notes: o.notes,
    createdAt: o.createdAt,
  };
}

async function insertWithUniqueCode(data: Record<string, unknown>) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await Order.create({ ...data, trackingCode: generateTrackingCode() });
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err; // only retry code collisions
    }
  }
  throw new HttpError(500, "Could not generate a tracking code. Please try again.");
}

export const createOrder: RequestHandler = async (req, res) => {
  const body = req.body as CreateOrderInput;

  // The email on the order must be the one this browser verified.
  if (res.locals.guestEmail !== body.email) {
    res
      .status(401)
      .json({ message: "Verify your email before placing the order.", code: "GUEST_UNVERIFIED" });
    return;
  }

  // Merge duplicate lines, then price everything from the live product catalog.
  const lines = new Map<number, number>();
  for (const it of body.items) {
    lines.set(
      it.productId,
      Math.min((lines.get(it.productId) ?? 0) + it.quantity, MAX_LINE_QUANTITY),
    );
  }

  const found = (await Product.find({
    productId: { $in: [...lines.keys()] },
    deletedAt: null,
    published: true,
  })
    .select("productId name price image")
    .lean()) as unknown as { productId: number; name: string; price: number; image: string }[];
  const byId = new Map(found.map((p) => [p.productId, p]));

  const items: { productId: number; name: string; price: number; image: string; quantity: number }[] = [];
  for (const [productId, quantity] of lines) {
    const product = byId.get(productId);
    if (!product) {
      res.status(400).json({
        message: "One or more items are no longer available.",
        errors: { items: "One or more items are no longer available." },
      });
      return;
    }
    items.push({
      productId,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
    });
  }

  // Reserve stock first so two shoppers can't both buy the last unit.
  const reservation = await reserveStock(items);
  if (!reservation.ok) {
    res.status(409).json({
      message: reservation.message,
      code: "insufficient_stock",
      errors: { items: reservation.message },
    });
    return;
  }

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
  const total = round2(subtotal + SHIPPING_FEE);

  let doc: Awaited<ReturnType<typeof insertWithUniqueCode>>;
  try {
    doc = await insertWithUniqueCode({
      email: body.email,
      fullName: body.fullName,
      phone: body.phone,
      address: {
        ...body.address,
        postalCode: body.address.postalCode ?? "",
        landmark: body.address.landmark ?? "",
      },
      items,
      itemCount,
      subtotal,
      shippingFee: SHIPPING_FEE,
      total,
      paymentMethod: body.paymentMethod,
      notes: body.notes ?? "",
      stockDeducted: true,
    });
  } catch (err) {
    await releaseStock(reservation.reserved); // never keep stock for an order that wasn't saved
    throw err;
  }
  const order = doc.toObject() as unknown as OrderRecord;

  try {
    await recordOrderMovements(reservation.reserved, order);
  } catch (err) {
    logger.error({ err, orderId: String(order._id) }, "Failed to record stock movements");
  }

  // The order is already saved; a mail failure must not lose it.
  try {
    await sendOrderConfirmation(order);
    await Order.updateOne({ _id: order._id }, { confirmationEmailedAt: new Date() });
  } catch (err) {
    logger.error({ err, orderId: String(order._id) }, "Failed to send order confirmation email");
  }

  res.status(201).json({ order: toPublic(order) });
};

export const listOrders: RequestHandler = async (_req, res) => {
  const email = res.locals.guestEmail as string;
  const docs = (await Order.find({ email })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()) as unknown as OrderRecord[];

  const orders = docs
    .sort(
      (a, b) =>
        ORDER_STATUS_PRIORITY[a.status as OrderStatus] -
          ORDER_STATUS_PRIORITY[b.status as OrderStatus] ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    )
    .map(toPublic);

  res.json({ orders });
};