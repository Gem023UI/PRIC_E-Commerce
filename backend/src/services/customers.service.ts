import type { Types } from "mongoose";

import {
  INQUIRY_SERVICE_LABELS,
  Inquiry,
  type InquiryService,
} from "../database/models/inquiry.model";
import { Order, type OrderRecord } from "../database/models/order.model";
import { User } from "../database/models/user.model";
import { buildBuckets, describeRange, type DateRange } from "../utils/dateRange";
import { bucketExpr, metric, recognizedWithin, round2 } from "./stats.service";

const round1 = (n: number) => Math.round(n * 10) / 10;
const PAGE_SIZE = 20;

/* ---------------------------- the customer "book" ---------------------------- */
/*
 * A customer is an email: either a registered account (role "customer") or a guest who only
 * ever ordered. Staff (admin / rider) are excluded. The book is merged in application code,
 * which is fine at cooperative scale (thousands of customers).
 */

export type AccountState = "active" | "invited" | "deactivated";

export type BookEntry = {
  email: string;
  name: string;
  phone: string;
  type: "account" | "guest";
  userId: string | null;
  accountState: AccountState | null;
  registeredAt: Date | null;
  /** Non-cancelled orders. */
  orders: number;
  cancelled: number;
  /** Completed orders, net of discounts and refunds (shipping excluded). */
  spent: number;
  firstOrderAt: Date | null;
  lastOrderAt: Date | null;
};

type OrderGroup = {
  _id: string;
  orders: number;
  cancelled: number;
  spent: number;
  firstOrderAt: Date | null;
  lastOrderAt: Date | null;
  fullName: string;
  phone: string;
};

type UserRow = {
  _id: Types.ObjectId;
  firstName: string;
  lastName?: string | null;
  email: string;
  mobile?: string | null;
  status?: string | null;
  role?: string | null;
  passwordHash?: string | null;
  createdAt: Date;
};

const NET_OF_ORDER = {
  $subtract: [
    { $subtract: ["$subtotal", { $ifNull: ["$discountTotal", 0] }] },
    { $ifNull: ["$refundedAmount", 0] },
  ],
};
const NOT_CANCELLED = { $ne: ["$status", "cancelled"] };

async function groupOrders(match: Record<string, unknown> = {}) {
  return Order.aggregate<OrderGroup>([
    { $match: match },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: "$email",
        orders: { $sum: { $cond: [NOT_CANCELLED, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        spent: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, NET_OF_ORDER, 0] } },
        firstOrderAt: { $min: { $cond: [NOT_CANCELLED, "$createdAt", null] } },
        lastOrderAt: { $max: { $cond: [NOT_CANCELLED, "$createdAt", null] } },
        fullName: { $last: "$fullName" },
        phone: { $last: "$phone" },
      },
    },
  ]);
}

const accountStateOf = (u: UserRow): AccountState =>
  u.status === "deactivated" ? "deactivated" : u.passwordHash ? "active" : "invited";

export async function loadCustomerBook(): Promise<BookEntry[]> {
  const [groups, usersRaw, staffRaw] = await Promise.all([
    groupOrders(),
    User.find({ role: "customer" })
      .select("+passwordHash firstName lastName email mobile status createdAt")
      .lean(),
    User.find({ role: { $in: ["admin", "rider"] } })
      .select("email")
      .lean(),
  ]);
  const users = usersRaw as unknown as UserRow[];
  const staffEmails = new Set((staffRaw as unknown as { email: string }[]).map((s) => s.email));

  const byEmail = new Map<string, BookEntry>();

  for (const u of users) {
    byEmail.set(u.email, {
      email: u.email,
      name: `${u.firstName} ${u.lastName ?? ""}`.trim(),
      phone: u.mobile ?? "",
      type: "account",
      userId: String(u._id),
      accountState: accountStateOf(u),
      registeredAt: u.createdAt,
      orders: 0,
      cancelled: 0,
      spent: 0,
      firstOrderAt: null,
      lastOrderAt: null,
    });
  }

  for (const g of groups) {
    if (staffEmails.has(g._id)) continue;
    const stats = {
      orders: g.orders,
      cancelled: g.cancelled,
      spent: round2(g.spent),
      firstOrderAt: g.firstOrderAt,
      lastOrderAt: g.lastOrderAt,
    };
    const existing = byEmail.get(g._id);
    if (existing) {
      Object.assign(existing, stats);
      if (!existing.phone) existing.phone = g.phone;
    } else {
      byEmail.set(g._id, {
        email: g._id,
        name: g.fullName,
        phone: g.phone,
        type: "guest",
        userId: null,
        accountState: null,
        registeredAt: null,
        ...stats,
      });
    }
  }

  return [...byEmail.values()];
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);

const toRow = (c: BookEntry) => ({
  email: c.email,
  name: c.name,
  phone: c.phone,
  type: c.type,
  userId: c.userId,
  accountState: c.accountState,
  registeredAt: iso(c.registeredAt),
  orders: c.orders,
  cancelled: c.cancelled,
  spent: c.spent,
  firstOrderAt: iso(c.firstOrderAt),
  lastOrderAt: iso(c.lastOrderAt),
});

/* ----------------------------------- stats ----------------------------------- */

export async function getCustomerStats(range: DateRange) {
  const { start, end, prevStart, prevEnd, granularity } = range;

  const book = await loadCustomerBook();
  const byEmail = new Map(book.map((c) => [c.email, c]));
  const accounts = book.filter((c) => c.type === "account");
  const within = (d: Date | null, a: Date, b: Date) => !!d && d >= a && d < b;

  const [buyersCurRaw, buyersPrevRaw, topRows, regRows, buyerRows] = await Promise.all([
    Order.distinct("email", {
      status: { $ne: "cancelled" },
      createdAt: { $gte: start, $lt: end },
    }),
    Order.distinct("email", {
      status: { $ne: "cancelled" },
      createdAt: { $gte: prevStart, $lt: prevEnd },
    }),
    Order.aggregate<{ _id: string; orders: number; spent: number }>([
      { $match: recognizedWithin(start, end) },
      { $group: { _id: "$email", orders: { $sum: 1 }, spent: { $sum: NET_OF_ORDER } } },
      { $sort: { spent: -1, orders: -1 } },
      { $limit: 12 },
    ]),
    User.aggregate<{ _id: string; n: number }>([
      { $match: { role: "customer", createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: bucketExpr("$createdAt", granularity), n: { $sum: 1 } } },
    ]),
    Order.aggregate<{ _id: string; n: number }>([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: { b: bucketExpr("$createdAt", granularity), e: "$email" } } },
      { $group: { _id: "$_id.b", n: { $sum: 1 } } },
    ]),
  ]);

  const buyersCur = (buyersCurRaw as string[]).filter((e) => byEmail.has(e));
  const buyersPrev = (buyersPrevRaw as string[]).filter((e) => byEmail.has(e));
  const newBuyers = buyersCur.filter((e) => within(byEmail.get(e)?.firstOrderAt ?? null, start, end)).length;

  const buyersAll = book.filter((c) => c.orders >= 1);
  const repeaters = buyersAll.filter((c) => c.orders >= 2).length;
  const spenders = book.filter((c) => c.spent > 0);

  const regByKey = new Map(regRows.map((r) => [r._id, r.n]));
  const buyByKey = new Map(buyerRows.map((r) => [r._id, r.n]));

  return {
    range: describeRange(range),
    customers: {
      total: accounts.filter((a) => a.accountState !== "deactivated").length,
      newAccounts: metric(
        accounts.filter((a) => within(a.registeredAt, start, end)).length,
        accounts.filter((a) => within(a.registeredAt, prevStart, prevEnd)).length,
      ),
      buyers: metric(buyersCur.length, buyersPrev.length),
      newBuyers,
      returningBuyers: buyersCur.length - newBuyers,
      repeatRate: {
        value: buyersAll.length ? round1((repeaters / buyersAll.length) * 100) : 0,
        repeaters,
        buyers: buyersAll.length,
      },
      ordersPerBuyer: buyersAll.length
        ? round2(buyersAll.reduce((s, c) => s + c.orders, 0) / buyersAll.length)
        : 0,
      spendPerCustomer: spenders.length
        ? round2(spenders.reduce((s, c) => s + c.spent, 0) / spenders.length)
        : 0,
      accountStates: {
        active: accounts.filter((a) => a.accountState === "active").length,
        invited: accounts.filter((a) => a.accountState === "invited").length,
        deactivated: accounts.filter((a) => a.accountState === "deactivated").length,
      },
      buyerTypes: {
        accounts: buyersAll.filter((c) => c.type === "account").length,
        guests: buyersAll.filter((c) => c.type === "guest").length,
      },
    },
    series: buildBuckets(range).map((b) => ({
      key: b.key,
      label: b.label,
      future: b.future,
      registrations: regByKey.get(b.key) ?? 0,
      buyers: buyByKey.get(b.key) ?? 0,
    })),
    topCustomers: topRows
      .filter((r) => byEmail.has(r._id))
      .slice(0, 5)
      .map((r) => {
        const c = byEmail.get(r._id)!;
        return {
          email: c.email,
          name: c.name || c.email,
          type: c.type,
          orders: r.orders,
          spent: round2(r.spent),
        };
      }),
  };
}

/* ------------------------------------ list ----------------------------------- */

export type ListQuery = {
  search: string;
  type: "all" | "account" | "guest";
  buying: "all" | "ordered" | "repeat" | "never";
  sort: "recent" | "spent" | "orders" | "name" | "newest";
  page: number;
};

/** Phone numbers compare by their last digits so 09171234567 matches +639171234567. */
const phoneKey = (s: string) => {
  const d = s.replace(/\D/g, "");
  return d.startsWith("63") ? d.slice(2) : d.startsWith("0") ? d.slice(1) : d;
};

const time = (d: Date | null) => (d ? d.getTime() : -Infinity);
const joinedAt = (c: BookEntry) => c.registeredAt ?? c.firstOrderAt;

const SORTERS: Record<ListQuery["sort"], (a: BookEntry, b: BookEntry) => number> = {
  recent: (a, b) => time(b.lastOrderAt) - time(a.lastOrderAt) || time(joinedAt(b)) - time(joinedAt(a)),
  spent: (a, b) => b.spent - a.spent || b.orders - a.orders,
  orders: (a, b) => b.orders - a.orders || b.spent - a.spent,
  newest: (a, b) => time(joinedAt(b)) - time(joinedAt(a)),
  name: (a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email),
};

export async function listCustomers(q: ListQuery) {
  const book = await loadCustomerBook();

  const needle = q.search.toLowerCase();
  const needleDigits = phoneKey(needle);

  const filtered = book.filter((c) => {
    if (q.type !== "all" && c.type !== q.type) return false;
    if (q.buying === "ordered" && c.orders < 1) return false;
    if (q.buying === "repeat" && c.orders < 2) return false;
    if (q.buying === "never" && c.orders > 0) return false;
    if (!needle) return true;
    return (
      c.name.toLowerCase().includes(needle) ||
      c.email.includes(needle) ||
      (needleDigits.length >= 3 && phoneKey(c.phone).includes(needleDigits))
    );
  });

  filtered.sort(SORTERS[q.sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(q.page, pages);

  return {
    total: filtered.length,
    page,
    pages,
    pageSize: PAGE_SIZE,
    counts: {
      all: book.length,
      accounts: book.filter((c) => c.type === "account").length,
      guests: book.filter((c) => c.type === "guest").length,
    },
    customers: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toRow),
  };
}

/* ----------------------------------- detail ---------------------------------- */

type InquiryRow = { service: InquiryService; message: string; status: string; createdAt: Date };

export async function getCustomerDetail(email: string) {
  const [userRaw, groups, ordersRaw, inquiriesRaw] = await Promise.all([
    User.findOne({ email })
      .select("+passwordHash firstName lastName email mobile status role createdAt")
      .lean(),
    groupOrders({ email }),
    Order.find({ email }).sort({ createdAt: -1 }).limit(25).lean(),
    Inquiry.find({ email }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const user = userRaw as unknown as UserRow | null;
  if (user && user.role !== "customer") return null; // staff are not customers

  const group = groups[0];
  if (!user && !group) return null;

  const orders = ordersRaw as unknown as OrderRecord[];
  const inquiries = inquiriesRaw as unknown as InquiryRow[];

  const customer: BookEntry = {
    email,
    name: user ? `${user.firstName} ${user.lastName ?? ""}`.trim() : (group?.fullName ?? email),
    phone: user?.mobile || group?.phone || "",
    type: user ? "account" : "guest",
    userId: user ? String(user._id) : null,
    accountState: user ? accountStateOf(user) : null,
    registeredAt: user?.createdAt ?? null,
    orders: group?.orders ?? 0,
    cancelled: group?.cancelled ?? 0,
    spent: round2(group?.spent ?? 0),
    firstOrderAt: group?.firstOrderAt ?? null,
    lastOrderAt: group?.lastOrderAt ?? null,
  };

  return {
    customer: toRow(customer),
    orders: orders.map((o) => ({
      id: String(o._id),
      trackingCode: o.trackingCode,
      status: o.status,
      paymentStatus: o.paymentStatus,
      itemCount: o.itemCount,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
    })),
    inquiries: inquiries.map((i) => ({
      service: i.service,
      serviceLabel: INQUIRY_SERVICE_LABELS[i.service] ?? i.service,
      status: i.status,
      message: i.message.length > 160 ? `${i.message.slice(0, 160)}…` : i.message,
      createdAt: i.createdAt.toISOString(),
    })),
  };
}