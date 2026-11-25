import { Order, type OrderStatus } from "../database/models/order.model";

export type OrderDoc = InstanceType<typeof Order>;
export type Actor = { kind: "admin" | "rider"; name: string };

/**
 * What an administrator may do from each status. Riders move orders along on their own
 * screens: to_ship -> on_delivery (start delivery) and on_delivery -> completed (QR scan).
 */
export const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  to_confirm: ["to_ship", "cancelled"],
  to_ship: ["cancelled"],
  on_delivery: ["to_ship", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  to_confirm: "to confirm",
  to_ship: "to ship",
  on_delivery: "on delivery",
  completed: "completed",
  cancelled: "cancelled",
};

/** The single place that changes an order's status, so timestamps and history stay consistent. */
export function applyStatus(order: OrderDoc, next: OrderStatus, actor: Actor, note = "") {
  const prev = order.status as OrderStatus;
  const now = new Date();

  order.set("status", next);

  if (next === "on_delivery") order.set("deliveryStartedAt", now);
  if (next === "to_ship" && prev === "on_delivery") order.set("deliveryStartedAt", null);

  if (next === "completed") {
    order.set("completedAt", now);
    // Cash on delivery is collected by the rider at the door.
    if (order.paymentMethod === "cod") order.set("paymentStatus", "paid");
  }

  if (next === "cancelled") {
    order.set("cancelledAt", now);
    order.set("cancelReason", note);
  }

  order.statusHistory.push({ status: next, at: now, by: actor.name, note });
}