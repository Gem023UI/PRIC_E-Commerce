import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";

export const GUEST_COOKIE = "pric_guest";
export const GUEST_TTL_S = 30 * 24 * 60 * 60;

export const guestCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.isProd,
  path: "/",
};

/** Returns the verified guest email from the cookie, or null. */
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

export const requireGuest: RequestHandler = (req, res, next) => {
  const email = readGuestEmail(req);
  if (!email) {
    res
      .status(401)
      .json({ message: "Please verify your email to continue.", code: "GUEST_UNVERIFIED" });
    return;
  }
  res.locals.guestEmail = email;
  next();
};