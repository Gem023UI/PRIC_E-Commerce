import type { Request, Response } from "express";
import bcrypt from "bcryptjs";

import { env } from "../config/env";
import { User } from "../database/models/user.model";
import { consumeSetup } from "../services/invite.service";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  revokeSession,
  verifySession,
} from "../services/token.service";
import {
  consumeVerification,
  issueVerification,
} from "../services/verification.service";
import type {
  EmailBody,
  LoginBody,
  SetPasswordBody,
} from "../validators/auth.validator";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

// Compared against when the email is unknown, so timing doesn't reveal it.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

const toLogin = (res: Response, query: string) =>
  res.redirect(`${env.FRONTEND_URL}/login?${query}`);

function publicUser(u: {
  _id: unknown;
  firstName: string;
  lastName?: string | null;
  email: string;
  mobile?: string | null;
  image?: string | null;
  role?: string | null;
}) {
  return {
    id: String(u._id),
    firstName: u.firstName,
    lastName: u.lastName ?? "",
    name: `${u.firstName} ${u.lastName ?? ""}`.trim(),
    email: u.email,
    mobile: u.mobile ?? "",
    image: u.image ?? null,
    role: u.role ?? "customer",
  };
}

/* ---------------------------------- login --------------------------------- */

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginBody;

  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !ok) {
    throw new HttpError(401, "Invalid email or password", "invalid_credentials");
  }
  if (user.status === "deactivated") {
    throw new HttpError(
      403,
      "Your account has been deactivated",
      "account_deactivated",
    );
  }
  if (!user.emailVerified) {
    throw new HttpError(
      403,
      "Please verify your email first",
      "email_not_verified",
    );
  }

  await createSession(res, user._id, req.get("user-agent"));
  res.json({ user: publicUser(user) });
}

/* ------------------------------ session / me ------------------------------ */

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[SESSION_COOKIE];
  const session = typeof token === "string" ? await verifySession(token) : null;
  if (session) await revokeSession(session.jti);
  clearSessionCookie(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.auth!.userId);
  if (!user || user.status === "deactivated") {
    clearSessionCookie(res);
    throw new HttpError(401, "Not authenticated");
  }
  res.json({ user: publicUser(user) });
}

/* ------------------------ invite: set your password ----------------------- */

export async function setPassword(req: Request, res: Response) {
  const { email, token, password } = req.body as SetPasswordBody;

  const result = await consumeSetup(email, token, password);
  if (result === "ok") {
    res.json({ ok: true });
    return;
  }

  throw new HttpError(
    400,
    result === "expired"
      ? "This link has expired. Ask a PRIC administrator to send a new invitation."
      : "This link is invalid or has already been used.",
    `setup_${result}`,
  );
}

/* ----------------------------- email verification ----------------------------- */

export async function verifyEmail(req: Request, res: Response) {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const email =
    typeof req.query.email === "string"
      ? req.query.email.trim().toLowerCase()
      : "";

  if (!token || !email) return toLogin(res, "verified=0&reason=invalid");

  const result = await consumeVerification(email, token);
  if (result === "ok") return toLogin(res, "verified=1");
  toLogin(res, `verified=0&reason=${result}`);
}

export async function resendVerification(req: Request, res: Response) {
  const { email } = req.body as EmailBody;

  const user = await User.findOne({
    email,
    passwordHash: { $exists: true },
    emailVerified: null,
    status: { $ne: "deactivated" },
  });

  if (user) {
    try {
      await issueVerification(email, user.firstName);
    } catch (err) {
      logger.error({ err }, "resend verification failed");
      throw new HttpError(502, "Email delivery failed", "email_failed");
    }
  }

  // Same answer whether or not the account exists.
  res.json({ ok: true });
}