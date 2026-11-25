import type { Request, RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { Session } from "../database/models/session.model";
import { User } from "../database/models/user.model";
import {
  getCustomerDetail,
  getCustomerStats,
  listCustomers,
} from "../services/customers.service";
import { sendInvite } from "../services/invite.service";
import { RANGE_KEYS, resolveRange } from "../utils/dateRange";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";
import type { CreateAccountBody, SetStatusBody } from "../validators/admin.validator";

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
  type: z.enum(["all", "account", "guest"]).default("all"),
  buying: z.enum(["all", "ordered", "repeat", "never"]).default("all"),
  sort: z.enum(["recent", "spent", "orders", "name", "newest"]).default("recent"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

const detailQuery = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
});

export const customerStats: RequestHandler = async (req: Request, res) => {
  const { range } = parseQuery(rangeQuery, req.query);
  res.json(await getCustomerStats(resolveRange(range)));
};

export const customerList: RequestHandler = async (req, res) => {
  res.json(await listCustomers(parseQuery(listQuery, req.query)));
};

export const customerDetail: RequestHandler = async (req, res) => {
  const { email } = parseQuery(detailQuery, req.query);
  const detail = await getCustomerDetail(email);
  if (!detail) throw new HttpError(404, "Customer not found");
  res.json(detail);
};

/* ------------------------------ account management ------------------------------ */

/** Customer and rider accounts only; admins are managed from the command line. */
async function findManagedUser(rawId: unknown) {
  const id = String(rawId ?? "");
  if (!isValidObjectId(id)) throw new HttpError(404, "Account not found");
  const user = await User.findById(id).select("+passwordHash");
  if (!user || (user.role !== "customer" && user.role !== "rider")) {
    throw new HttpError(404, "Account not found");
  }
  return user;
}

const emailTaken = () =>
  new HttpError(409, "Email already in use", "email_exists", {
    email: "An account with this email already exists",
  });

export const createAccount: RequestHandler = async (req, res) => {
  const body = req.body as CreateAccountBody;

  if (await User.exists({ email: body.email })) throw emailTaken();

  let user;
  try {
    user = await User.create({
      firstName: body.firstName,
      lastName: body.lastName ?? "",
      email: body.email,
      role: body.role,
      status: "verified",
      emailVerified: new Date(), // the emailed link proves ownership before a password can be set
      ...(body.mobile ? { mobile: body.mobile } : {}),
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) throw emailTaken();
    throw err;
  }

  let inviteEmailSent = true;
  try {
    await sendInvite({ email: user.email, firstName: user.firstName, role: body.role });
  } catch (err) {
    inviteEmailSent = false;
    logger.error({ err, userId: String(user._id) }, "Failed to send account invitation");
  }

  res.status(201).json({ id: String(user._id), role: body.role, inviteEmailSent });
};

export const resendInvite: RequestHandler = async (req, res) => {
  const user = await findManagedUser(req.params.id);

  if (user.status === "deactivated") {
    throw new HttpError(400, "Reactivate this account before sending an invitation.");
  }
  if (user.passwordHash) {
    throw new HttpError(400, "This account is already active. No invitation is needed.");
  }

  try {
    await sendInvite({
      email: user.email,
      firstName: user.firstName,
      role: user.role ?? "customer",
    });
  } catch (err) {
    logger.error({ err, userId: String(user._id) }, "Failed to resend account invitation");
    throw new HttpError(502, "We couldn't send the invitation email. Please try again.", "email_failed");
  }

  res.json({ ok: true });
};

export const setStatus: RequestHandler = async (req, res) => {
  const { status } = req.body as SetStatusBody;
  const user = await findManagedUser(req.params.id);

  if (status === "deactivated") {
    user.status = "deactivated";
    await user.save();
    await Session.deleteMany({ userId: user._id }); // sign them out everywhere
  } else {
    user.status = user.emailVerified ? "verified" : "pending";
    await user.save();
  }

  res.json({
    ok: true,
    accountState:
      user.status === "deactivated" ? "deactivated" : user.passwordHash ? "active" : "invited",
  });
};