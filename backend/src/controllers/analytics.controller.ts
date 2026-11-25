import type { Request, RequestHandler } from "express";

import { env } from "../config/env";
import { PageView } from "../database/models/pageView.model";
import { User } from "../database/models/user.model";
import { SESSION_COOKIE, verifySession } from "../services/token.service";
import { randomToken } from "../utils/crypto";

const VISITOR_COOKIE = "pric_vid";
const VISITOR_TTL_MS = 180 * 24 * 60 * 60 * 1000;
const VISITOR_RE = /^[A-Za-z0-9_-]{16,64}$/;

const BOT_RE =
  /bot|crawl|spider|slurp|bing|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|node-fetch|axios|postman/i;

// Only public pages are counted.
const EXCLUDED_PREFIXES = ["/admin", "/rider", "/api", "/_next", "/set-password"];
const isExcluded = (p: string) =>
  EXCLUDED_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));

function classifyDevice(ua: string): "desktop" | "mobile" | "tablet" {
  if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

/** Logged-in staff browsing the site shouldn't inflate visitor numbers. */
async function isStaff(req: Request): Promise<boolean> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string") return false;
  const session = await verifySession(token);
  if (!session) return false;
  const user = await User.findById(session.userId).select("role");
  return user?.role === "admin" || user?.role === "rider";
}

export const trackVisit: RequestHandler = async (req, res) => {
  const { path } = req.body as { path: string };
  const ua = req.get("user-agent") ?? "";

  if (!ua || BOT_RE.test(ua) || isExcluded(path) || (await isStaff(req))) {
    res.status(204).end();
    return;
  }

  const existing = req.cookies?.[VISITOR_COOKIE];
  const visitorId =
    typeof existing === "string" && VISITOR_RE.test(existing) ? existing : randomToken(16);
  res.cookie(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    maxAge: VISITOR_TTL_MS,
  });

  // Ignore a repeat of the same page within 2 seconds (e.g. React strict-mode double effects).
  const duplicate = await PageView.exists({
    visitorId,
    path,
    createdAt: { $gt: new Date(Date.now() - 2000) },
  });
  if (!duplicate) await PageView.create({ visitorId, path, device: classifyDevice(ua) });

  res.status(204).end();
};