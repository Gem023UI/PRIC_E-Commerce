import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import type { Types } from "mongoose";

import { env } from "../src/config/env";
import { Session } from "../src/database/models/session.model";
import { randomToken } from "../src/utils/crypto";

export const SESSION_COOKIE = env.isProd
  ? "__Host-pric_session"
  : "pric_session";

const TTL_MS = env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
const ISSUER = "pric-api";
const AUDIENCE = "pric-web";

const cookieBase: CookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax",
  path: "/",
};

/** Creates a server-side session record plus a signed JWT in an httpOnly cookie. */
export async function createSession(
  res: Response,
  userId: Types.ObjectId | string,
  userAgent?: string,
) {
  const jti = randomToken(24);
  await Session.create({
    jti,
    userId,
    userAgent: userAgent?.slice(0, 200),
    expiresAt: new Date(Date.now() + TTL_MS),
  });

  const token = jwt.sign({ sub: String(userId), jti }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: Math.floor(TTL_MS / 1000),
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  res.cookie(SESSION_COOKIE, token, { ...cookieBase, maxAge: TTL_MS });
}

/** Valid only if the JWT checks out AND its session record still exists. */
export async function verifySession(token: string) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload === "string" || !payload.sub || !payload.jti) return null;

    const session = await Session.exists({
      jti: payload.jti,
      expiresAt: { $gt: new Date() },
    });
    return session
      ? { userId: String(payload.sub), jti: String(payload.jti) }
      : null;
  } catch {
    return null;
  }
}

export async function revokeSession(jti: string) {
  await Session.deleteOne({ jti });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieBase);
}