import type { Request, RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import {
  ORDER_STATUSES,
  Order,
  PAYMENT_STATUSES,
  type OrderStatus,
} from "../database/models/order.model";
import { User } from "../database/models/user.model";
import {
  ADMIN_TRANSITIONS,
  STATUS_LABEL,
  applyStatus,
} from "../services/orderWorkFlow.service";
import { getOrderDetail, getOrderStats, listOrders, listRiders } from "../services/orders.service";
import { RANGE_KEYS, resolveRange } from "../utils/dateRange";
import { HttpError } from "../utils/httpError";
import type {
  AssignRiderBody,
  UpdateOrderStatusBody,
  UpdatePaymentBody,
} from "../validators/admin.validator";

function parseQuery<S extends z.ZodType>(schema: S, query: unknown): z.output<S> {
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "query");
      if (!errors[key]) errors[key] = issue.message;
    }
    throw new HttpError(400, "Invalid request", "invalid_query", errors);
  }
  return parsed.data;
}

const rangeQuery = z.object({ range: z.enum(RANGE_KEYS).default("last7") });

const listQuery = z.object({
  search: z.string().trim().max(80).default(""),
  status: z.enum(["all", "active", ...ORDER_STATUSES]).default("all"),
  payment: z.enum(["all", ...PAYMENT_STATUSES]).default("all"),
  rider: z
    .string()
    .max(40)
    .default("all")
    .refine((v) => v === "all" || v === "unassigned" || isValidObjectId(v), "Invalid rider"),
  sort: z.enum(["newest", "oldest", "total"]).default("newest"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

async function findOrder(rawId: unknown) {
  const id = String(rawId ?? "");
  if (!isValidObjectId(id)) throw new HttpError(404, "Order not found");
  const order = await Order.findById(id);
  if (!order) throw new HttpError(404, "Order not found");
  return order;
}

async function adminName(req: Request) {
  const u = await User.findById(req.auth!.userId).select("firstName lastName");
  return u ? `${u.firstName} ${u.lastName ?? ""}`.trim() : "Admin";
}

async function respondWithOrder(res: Parameters<RequestHandler>[1], id: unknown) {
  const order = await getOrderDetail(String(id));
  if (!order) throw new HttpError(404, "Order not found");
  res.json({ order });
}

export const orderStats: RequestHandler = async (req, res) => {
  const { range } = parseQuery(rangeQuery, req.query);
  res.json(await getOrderStats(resolveRange(range)));
};

export const orderList: RequestHandler = async (req, res) => {
  res.json(await listOrders(parseQuery(listQuery, req.query)));
};

export const orderDetail: RequestHandler = async (req, res) => {
  const id = String(req.params.id ?? "");
  if (!isValidObjectId(id)) throw new HttpError(404, "Order not found");
  await respondWithOrder(res, id);
};

export const updateStatus: RequestHandler = async (req, res) => {
  const { status, note } = req.body as UpdateOrderStatusBody;
  const order = await findOrder(req.params.id);
  const from = order.status as OrderStatus;

  if (!ADMIN_TRANSITIONS[from].includes(status)) {
    throw new HttpError(
      400,
      `An order that is ${STATUS_LABEL[from]} can't be changed to ${STATUS_LABEL[status]}.`,
      "invalid_transition",
    );
  }
  if (status === "cancelled" && (note ?? "").length < 3) {
    throw new HttpError(400, "Please give a reason for cancelling.", "reason_required", {
      note: "Please give a reason for cancelling.",
    });
  }

  applyStatus(order, status, { kind: "admin", name: await adminName(req) }, note ?? "");
  await order.save();
  await respondWithOrder(res, order._id);
};

export const updatePayment: RequestHandler = async (req, res) => {
  const { paymentStatus } = req.body as UpdatePaymentBody;
  const order = await findOrder(req.params.id);

  if (order.status === "cancelled") {
    throw new HttpError(400, "Payment can't be changed on a cancelled order.", "invalid_state");
  }

  order.set("paymentStatus", paymentStatus);
  await order.save();
  await respondWithOrder(res, order._id);
};

export const assignRider: RequestHandler = async (req, res) => {
  const { riderId } = req.body as AssignRiderBody;
  const order = await findOrder(req.params.id);

  if (order.status !== "to_ship") {
    throw new HttpError(
      400,
      "A rider can only be assigned to orders that are ready to ship.",
      "invalid_state",
    );
  }

  if (riderId === null) {
    order.set("rider", null);
    order.set("riderAssignedAt", null);
  } else {
    const invalid = () =>
      new HttpError(400, "Choose an available rider.", "invalid_rider", {
        riderId: "Choose an available rider.",
      });
    if (!isValidObjectId(riderId)) throw invalid();

    const rider = await User.findById(riderId).select("+passwordHash role status");
    if (!rider || rider.role !== "rider" || rider.status === "deactivated") throw invalid();
    if (!rider.passwordHash) {
      throw new HttpError(400, "That rider hasn't activated their account yet.", "rider_inactive");
    }

    order.set("rider", rider._id);
    order.set("riderAssignedAt", new Date());
  }

  await order.save();
  await respondWithOrder(res, order._id);
};

export const riderList: RequestHandler = async (_req, res) => {
  res.json({ riders: await listRiders() });
};