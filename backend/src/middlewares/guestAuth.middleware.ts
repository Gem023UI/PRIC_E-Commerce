import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { User } from "../database/models/user.model";
import { SESSION_COOKIE, verifySession } from "../services/token.service";

export const GUEST_COOKIE = "pric_guest";
export const GUEST_TTL_S = 30 * 24 * 60 * 60;

export const guestCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.isProd,
  path: "/",
};

export type VerifiedSession = { email: string; source: "account" | "guest" };

/** Returns the email proven by the guest cookie, or null. */
export function readGuestEmail(req: Request): string | null {
  const token = req.cookies?.[GUEST_COOKIE];
  if (typeof token !== "string" || !token) return null;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "string") return null;
    if (decoded.purpose !== "guest-email" || typeof decoded.email !== "string") return null;
    return decoded.email;
  } catch {
    return null;
  }
}

/**
 * The email this request has proven: a logged-in account (its email is already verified)
 * wins over a guest-OTP cookie.
 */
export async function readVerifiedSession(req: Request): Promise<VerifiedSession | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  const session = typeof token === "string" ? await verifySession(token) : null;
  if (session) {
    const user = await User.findById(session.userId).select("email status emailVerified");
    if (user && user.status !== "deactivated" && user.emailVerified) {
      return { email: user.email, source: "account" };
    }
  }

  const guest = readGuestEmail(req);
  return guest ? { email: guest, source: "guest" } : null;
}

export const requireGuest: RequestHandler = async (req, res, next) => {
  const verified = await readVerifiedSession(req);
  if (!verified) {
    res
      .status(401)
      .json({ message: "Please verify your email to continue.", code: "GUEST_UNVERIFIED" });
    return;
  }
  res.locals.guestEmail = verified.email;
  next();
};