import { randomInt } from "node:crypto";

import { connectDatabase, disconnectDatabase } from "../database/connection";
import { INQUIRY_SERVICES, Inquiry } from "../database/models/inquiry.model";
import { Order, PAYMENT_METHODS, type OrderStatus } from "../database/models/order.model";
import { PageView } from "../database/models/pageView.model";
import { generateTrackingCode } from "../utils/trackingCode";

const DEMO_EMAIL = /@demo\.pric\.test$/;
const DAY = 86_400_000;
const DAYS = 75;

const pick = <T>(a: readonly T[]): T => a[randomInt(a.length)] as T;

function statusFor(ageDays: number): OrderStatus {
  const r = randomInt(100);
  if (ageDays >= 5) return r < 86 ? "completed" : "cancelled";
  if (ageDays >= 2) return r < 40 ? "completed" : r < 65 ? "on_delivery" : r < 90 ? "to_ship" : "cancelled";
  return r < 55 ? "to_confirm" : r < 90 ? "to_ship" : "on_delivery";
}

async function clear() {
  const orders = await Order.deleteMany({ email: DEMO_EMAIL });
  const views = await PageView.deleteMany({ visitorId: /^demo-/ });
  const inquiries = await Inquiry.deleteMany({ email: DEMO_EMAIL });
  console.log(
    `Removed ${orders.deletedCount} orders, ${views.deletedCount} page views, ${inquiries.deletedCount} inquiries.`,
  );
}

async function seed() {
  const now = Date.now();

  let orderCount = 0;
  for (let d = DAYS; d >= 0; d--) {
    for (let i = 0, n = randomInt(0, 6); i < n; i++) {
      const createdAt = new Date(now - d * DAY + randomInt(0, DAY));
      if (createdAt.getTime() > now) continue;

      const lines = new Map<number, { productId: number; name: string; price: number; quantity: number }>();
      for (let k = 0, m = randomInt(1, 4); k < m; k++) {
        const p = pick(products);
        const prev = lines.get(p.id);
        lines.set(p.id, {
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: (prev?.quantity ?? 0) + randomInt(1, 5),
        });
      }
      const items = [...lines.values()];
      const itemCount = items.reduce((s, x) => s + x.quantity, 0);
      const subtotal = items.reduce((s, x) => s + x.price * x.quantity, 0);

      const status = statusFor(d);
      const paymentMethod = pick(PAYMENT_METHODS);
      const stamp = (days: number) => new Date(Math.min(createdAt.getTime() + days * DAY, now - 3_600_000));

      await Order.create({
        trackingCode: generateTrackingCode(createdAt),
        email: `buyer${randomInt(1, 40)}${DEMO_EMAIL.source.replace(/\\/g, "").replace("$", "")}`,
        fullName: `Demo Buyer ${randomInt(1, 40)}`,
        phone: "09171234567",
        address: {
          street: "123 Sample Street",
          barangay: "Sample",
          city: "Quezon City",
          province: "Metro Manila",
          postalCode: "1100",
          landmark: "",
          lat: 14.676,
          lng: 121.0437,
        },
        items,
        itemCount,
        subtotal,
        shippingFee: SHIPPING_FEE,
        total: subtotal + SHIPPING_FEE,
        paymentMethod,
        paymentStatus:
          status === "completed"
            ? "paid"
            : status === "cancelled" || paymentMethod === "cod"
              ? "unpaid"
              : pick(["pending_verification", "paid"] as const),
        status,
        notes: "[demo]",
        createdAt,
        completedAt: status === "completed" ? stamp(randomInt(1, 4)) : null,
        cancelledAt: status === "cancelled" ? stamp(1) : null,
      });
      orderCount++;
    }
  }

  const paths = ["/", "/", "/", "/products", "/products", "/events", "/services", "/about", "/contacts", "/membership"];
  const devices = ["mobile", "mobile", "desktop", "desktop", "tablet"] as const;
  const views = [];
  for (let d = DAYS; d >= 0; d--) {
    for (let i = 0, n = randomInt(15, 90); i < n; i++) {
      const createdAt = new Date(now - d * DAY + randomInt(0, DAY));
      if (createdAt.getTime() > now) continue;
      views.push({
        visitorId: `demo-${randomInt(1, 120)}`,
        path: pick(paths),
        device: pick(devices),
        createdAt,
      });
    }
  }
  await PageView.insertMany(views);

  const statuses = ["new", "new", "contacted", "contacted", "closed", "closed", "new", "contacted"] as const;
  for (const [i, status] of statuses.entries()) {
    await Inquiry.create({
      service: pick(INQUIRY_SERVICES),
      fullName: `Demo Inquirer ${i + 1}`,
      email: `inquirer${i + 1}@demo.pric.test`,
      phone: "09171234567",
      message: "Demo inquiry for the admin dashboard.",
      emailVerifiedAt: new Date(),
      status,
      createdAt: new Date(now - randomInt(0, 20) * DAY),
    });
  }

  console.log(`Seeded ${orderCount} orders, ${views.length} page views, ${statuses.length} inquiries.`);
}

async function main() {
  await connectDatabase();
  if (process.argv.includes("--clear")) await clear();
  else await seed();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());