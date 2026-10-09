import type { Request, Response } from "express";
import bcrypt from "bcryptjs";

import { env } from "../src/config/env";
import { User } from "../database/models/user.model";
import {
  buildAuthorization,
  fetchProfile,
  isConfigured,
  isProvider,
  readTransaction,
  resolveUser,
} from "../services/oauth.service";
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
  RegisterBody,
} from "../validators/auth.validator";
import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

const OAUTH_TX_COOKIE = "pric_oauth_tx";
const oauthCookie = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax" as const,
  path: "/api/auth",
};

// Compared against when the email is unknown, so timing doesn't reveal it.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

const toLogin = (res: Response, query: string) =>
  res.redirect(`${env.FRONTEND_URL}/login?${query}`);

function publicUser(u: {
  _id: unknown;
  firstName: string;
  lastName?: string | null;
  email: string;
  image?: string | null;
}) {
  return {
    id: String(u._id),
    firstName: u.firstName,
    lastName: u.lastName ?? "",
    name: `${u.firstName} ${u.lastName ?? ""}`.trim(),
    email: u.email,
    image: u.image ?? null,
  };
}

/* -------------------------------- register -------------------------------- */

export async function register(req: Request, res: Response) {
  const { firstName, lastName, mobile, email, password } =
    req.body as RegisterBody;

  const existing = await User.findOne({ email }).select("+passwordHash");
  if (existing && (existing.emailVerified || !existing.passwordHash)) {
    throw new HttpError(409, "Email already in use", "email_exists", {
      email: existing.passwordHash
        ? "An account with this email already exists"
        : "This email is already linked to a Google or Facebook sign-in",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    // Unverified earlier attempt: let the user retry with new details.
    existing.set({
      firstName,
      lastName,
      mobile,
      passwordHash,
      termsAcceptedAt: new Date(),
    });
    await existing.save();
  } else {
    try {
      await User.create({
        firstName,
        lastName,
        mobile,
        email,
        passwordHash,
        termsAcceptedAt: new Date(),
      });
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        throw new HttpError(409, "Email already in use", "email_exists", {
          email: "An account with this email already exists",
        });
      }
      throw err;
    }
  }

  try {
    await issueVerification(email, firstName);
  } catch (err) {
    logger.error({ err }, "verification email failed");
    throw new HttpError(502, "Email delivery failed", "email_failed", {
      form: "We couldn't send the verification email. Please try again.",
    });
  }

  res.status(201).json({ ok: true });
}

/* ---------------------------------- login --------------------------------- */

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginBody;

  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.passwordHash || !ok) {
    throw new HttpError(401, "Invalid email or password", "invalid_credentials");
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
  if (!user) {
    clearSessionCookie(res);
    throw new HttpError(401, "Not authenticated");
  }
  res.json({ user: publicUser(user) });
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

/* ---------------------------------- OAuth --------------------------------- */

export async function oauthStart(req: Request, res: Response) {
  const provider = req.params.provider;
  if (!isProvider(provider)) throw new HttpError(404, "Not found");
  if (!isConfigured(provider)) return toLogin(res, "error=OAuthNotConfigured");

  const { url, txToken } = buildAuthorization(provider);
  res.cookie(OAUTH_TX_COOKIE, txToken, { ...oauthCookie, maxAge: 10 * 60 * 1000 });
  res.redirect(url);
}

export async function oauthCallback(req: Request, res: Response) {
  const provider = req.params.provider;
  if (!isProvider(provider)) throw new HttpError(404, "Not found");

  const { code, state, error } = req.query;
  const tx = req.cookies?.[OAUTH_TX_COOKIE];
  res.clearCookie(OAUTH_TX_COOKIE, oauthCookie);

  if (error || typeof code !== "string" || typeof state !== "string") {
    return toLogin(res, "error=OAuthCallback");
  }

  try {
    const verifier = readTransaction(tx, provider, state);
    const profile = await fetchProfile(provider, code, verifier);
    const user = await resolveUser(profile);
    await createSession(res, user._id, req.get("user-agent"));
    res.redirect(`${env.FRONTEND_URL}/`);
  } catch (err) {
    logger.warn({ err, provider }, "oauth callback failed");
    const code =
      err instanceof HttpError && err.code === "oauth_email_in_use"
        ? "OAuthAccountNotLinked"
        : err instanceof HttpError && err.code === "oauth_no_email"
          ? "OAuthNoEmail"
          : "OAuthCallback";
    toLogin(res, `error=${code}`);
  }
}